import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workoutsApi, exercisesApi, sessionsApi } from "@/lib/api";
import type { WorkoutWithMeta } from "@/types";
import { exWeights } from "@/lib/exercise";

export function useWorkouts(userId: string | null) {
  return useQuery({
    queryKey: ["workouts", userId],
    enabled: !!userId,
    queryFn: async (): Promise<WorkoutWithMeta[]> => {
      const workouts = await workoutsApi.listByUser(userId!);
      return Promise.all(
        workouts.map(async (w) => {
          const [exercises, sessions] = await Promise.all([
            exercisesApi.listByWorkout(w.id),
            sessionsApi.listByWorkout(w.id),
          ]);
          return {
            ...w,
            exerciseCount: exercises.length,
            sessionCount: sessions.length,
            lastCompletedAt: sessions[0]?.completed_at ?? null,
          };
        })
      );
    },
  });
}

export function useWorkout(id: string | undefined) {
  return useQuery({
    queryKey: ["workout", id],
    enabled: !!id,
    queryFn: () => workoutsApi.get(id!),
  });
}

export function useCreateWorkout(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => workoutsApi.create(userId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workouts", userId] }),
  });
}

export function useRenameWorkout(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; name: string }) => workoutsApi.rename(v.id, v.name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workouts", userId] }),
  });
}

export function useDeleteWorkout(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workoutsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workouts", userId] }),
  });
}

// Duplicar treino (com seus exercicios).
export function useDuplicateWorkout(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (workoutId: string) => {
      const original = await workoutsApi.get(workoutId);
      const exercises = await exercisesApi.listByWorkout(workoutId);
      const copy = await workoutsApi.create(userId, `${original.name} (copia)`);
      for (const e of exercises) {
        await exercisesApi.create(copy.id, {
          name: e.name,
          current_weight: e.current_weight,
          sets: e.sets,
          reps: e.reps,
          weights: exWeights(e),
          rest_time: e.rest_time,
          notes: e.notes,
          position: e.position,
        });
      }
      return copy;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workouts", userId] }),
  });
}
