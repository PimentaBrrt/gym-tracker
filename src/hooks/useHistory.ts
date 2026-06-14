import { useQuery } from "@tanstack/react-query";
import { historyApi } from "@/lib/api";

export function useExerciseHistory(exerciseId: string | undefined) {
  return useQuery({
    queryKey: ["history-ex", exerciseId],
    enabled: !!exerciseId,
    queryFn: () => historyApi.listByExercise(exerciseId!),
  });
}

export function useUserHistory(userId: string | null) {
  return useQuery({
    queryKey: ["history", userId],
    enabled: !!userId,
    queryFn: () => historyApi.listByUser(userId!),
  });
}
