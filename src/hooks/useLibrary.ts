import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { libraryApi } from "@/lib/api";

export function useLibrary(userId: string | null) {
  return useQuery({
    queryKey: ["library", userId],
    enabled: !!userId,
    queryFn: () => libraryApi.listByUser(userId!),
  });
}

export function useAddToLibrary(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { name: string; default_weight: number; default_sets: number; default_reps: number; default_weights: number[]; default_notes?: string | null; default_rest: number }) =>
      libraryApi.add(userId, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["library", userId] }),
  });
}

export function useRemoveFromLibrary(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => libraryApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["library", userId] }),
  });
}
