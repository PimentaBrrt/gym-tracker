import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionsApi } from "@/lib/api";
import type { Exercise } from "@/types";

export function useUserSessions(userId: string | null) {
  return useQuery({
    queryKey: ["sessions", userId],
    enabled: !!userId,
    queryFn: () => sessionsApi.listByUser(userId!),
  });
}

export function useCompleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { workoutId: string; userId: string; exercises: Exercise[] }) =>
      sessionsApi.complete(v.workoutId, v.userId, v.exercises),
    onSuccess: (_data, v) => {
      qc.invalidateQueries({ queryKey: ["sessions", v.userId] });
      qc.invalidateQueries({ queryKey: ["workouts", v.userId] });
      qc.invalidateQueries({ queryKey: ["history", v.userId] });
    },
  });
}
