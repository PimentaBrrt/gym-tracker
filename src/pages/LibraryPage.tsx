import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useUsers } from "@/hooks/useUsers";
import { useLibrary, useRemoveFromLibrary, useAddToLibrary } from "@/hooks/useLibrary";
import { useToast } from "@/store/toastStore";
import { formatWeights } from "@/lib/exercise";
import Header from "@/components/Header";
import Confirm from "@/components/Confirm";
import { IconStar, IconTrash, IconPlus } from "@/components/Icons";
import type { LibraryExercise } from "@/types";

export default function LibraryPage() {
  const currentUserId = useAuthStore((s) => s.currentUserId)!;
  const { data: users } = useUsers();
  const others = (users ?? []).filter((u) => !u.is_admin);

  const [selectedUserId, setSelectedUserId] = useState<string>(currentUserId);
  // Garante uma selecao valida (ex.: se o atual for admin, cai no primeiro perfil).
  useEffect(() => {
    if (others.length && !others.some((u) => u.id === selectedUserId)) {
      setSelectedUserId(others[0].id);
    }
  }, [users]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: library, isLoading } = useLibrary(selectedUserId);
  const removeFav = useRemoveFromLibrary(selectedUserId);
  const addMine = useAddToLibrary(currentUserId);
  const toast = useToast((s) => s.show);
  const [deleting, setDeleting] = useState<LibraryExercise | null>(null);

  const isOwn = selectedUserId === currentUserId;

  const weightsOf = (l: LibraryExercise) =>
    l.default_weights?.length ? l.default_weights.map(Number) : [Number(l.default_weight)];

  const copyToMine = async (l: LibraryExercise) => {
    await addMine.mutateAsync({
      name: l.name,
      default_weight: l.default_weight,
      default_sets: l.default_sets,
      default_reps: l.default_reps,
      default_weights: weightsOf(l),
      default_notes: l.default_notes,
      default_rest: l.default_rest,
    });
    toast("Adicionado à sua biblioteca");
  };

  return (
    <div className="page">
      <Header title="Biblioteca" subtitle="Exercícios favoritos" back />

      <div className="field">
        <label>Biblioteca de</label>
        <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
          {others.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}{u.id === currentUserId ? " (você)" : ""}
            </option>
          ))}
        </select>
      </div>

      <p className="muted" style={{ margin: "12px 0 16px", fontSize: 14 }}>
        {isOwn
          ? "Seus favoritos. Use o botão de estrela na tela do exercício para favoritar."
          : `Favoritos de ${others.find((u) => u.id === selectedUserId)?.name ?? ""}. Toque em + para copiar para a sua biblioteca.`}
      </p>

      {isLoading ? (
        <p className="muted">Carregando...</p>
      ) : !library?.length ? (
        <div className="empty">
          <div className="empty__icon"><IconStar /></div>
          <p>Nenhum exercício favorito {isOwn ? "ainda" : "neste perfil"}.</p>
        </div>
      ) : (
        <div className="list">
          {library.map((l) => (
            <div key={l.id} className="lib-row">
              <span className="lib-row__star"><IconStar width={18} height={18} /></span>
              <div className="lib-row__body">
                <div className="lib-row__name">{l.name}</div>
                <div className="lib-row__meta numeric">
                  {l.default_sets} × {l.default_reps} · {formatWeights(weightsOf(l))} · descanso {l.default_rest}s
                </div>
                {l.default_notes && <div className="lib-row__notes">{l.default_notes}</div>}
              </div>
              {isOwn ? (
                <button className="btn btn--icon btn--danger btn--sm" onClick={() => setDeleting(l)} aria-label="Remover">
                  <IconTrash width={17} height={17} />
                </button>
              ) : (
                <button className="btn btn--icon btn--primary btn--sm" onClick={() => copyToMine(l)} aria-label="Adicionar à minha biblioteca" disabled={addMine.isPending}>
                  <IconPlus width={18} height={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Confirm
        open={!!deleting}
        title="Remover favorito"
        message={`Remover "${deleting?.name}" da biblioteca? Isso não afeta os treinos onde ele já foi usado.`}
        confirmLabel="Remover"
        onConfirm={async () => { if (deleting) { await removeFav.mutateAsync(deleting.id); toast("Favorito removido"); } }}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
