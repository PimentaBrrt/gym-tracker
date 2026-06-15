import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { templatesApi } from "@/lib/api";

export function useTemplates(userId: string | null) {
  return useQuery({
    queryKey: ["templates", userId],
    enabled: !!userId,
    queryFn: () => templatesApi.listByUser(userId!),
  });
}

export function useFavoriteWorkout(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workoutId: string) => templatesApi.addFromWorkout(userId, workoutId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates", userId] }),
  });
}

export function useRemoveTemplate(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => templatesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates", userId] }),
  });
}

// Instancia o template como um treino real na conta de targetUserId.
export function useInstantiateTemplate(targetUserId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => templatesApi.instantiate(targetUserId, templateId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workouts", targetUserId] }),
  });
}
