import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";

export function useUsers() {
  return useQuery({ queryKey: ["users"], queryFn: usersApi.list });
}

export function useUser(id: string | null) {
  const { data } = useUsers();
  return data?.find((u) => u.id === id) ?? null;
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { name: string; avatar_hue: number }) => usersApi.create(v.name, v.avatar_hue),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; name?: string; avatar_hue?: number }) =>
      usersApi.update(v.id, { name: v.name, avatar_hue: v.avatar_hue }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
