import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { exercisesApi } from "@/lib/api";
import type { Exercise } from "@/types";

export function useExercises(workoutId: string | undefined) {
  return useQuery({
    queryKey: ["exercises", workoutId],
    enabled: !!workoutId,
    queryFn: () => exercisesApi.listByWorkout(workoutId!),
  });
}

export function useCreateExercise(workoutId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; current_weight: number; rest_time: number; notes?: string | null; position?: number }) =>
      exercisesApi.create(workoutId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises", workoutId] }),
  });
}

export function useUpdateExercise(workoutId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: Partial<Exercise> }) => exercisesApi.update(v.id, v.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises", workoutId] }),
  });
}

export function useDeleteExercise(workoutId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => exercisesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises", workoutId] }),
  });
}
