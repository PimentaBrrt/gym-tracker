import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/lib/api";

export function useSetting(key: string) {
  return useQuery({
    queryKey: ["setting", key],
    queryFn: () => settingsApi.get(key),
    staleTime: 0,
  });
}

export function useSetSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { key: string; value: string }) => settingsApi.set(v.key, v.value),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["setting", v.key] }),
  });
}
