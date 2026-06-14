import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLibrary, useRemoveFromLibrary } from "@/hooks/useLibrary";
import { useToast } from "@/store/toastStore";
import Header from "@/components/Header";
import Confirm from "@/components/Confirm";
import { IconStar, IconTrash } from "@/components/Icons";
import { formatWeights } from "@/lib/exercise";
import type { LibraryExercise } from "@/types";

export default function LibraryPage() {
  const userId = useAuthStore((s) => s.currentUserId)!;
  const { data: library, isLoading } = useLibrary(userId);
  const remove = useRemoveFromLibrary(userId);
  const toast = useToast((s) => s.show);
  const [deleting, setDeleting] = useState<LibraryExercise | null>(null);

  return (
    <div className="page">
      <Header title="Biblioteca" subtitle="Exercícios favoritos" back />

      <p className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
        Exercícios favoritados ficam aqui para reutilizar ao montar um treino. Favorite
        um exercício pelo botão de estrela na tela do exercício.
      </p>

      {isLoading ? (
        <p className="muted">Carregando...</p>
      ) : !library?.length ? (
        <div className="empty">
          <div className="empty__icon"><IconStar /></div>
          <p>Nenhum exercício favorito ainda.</p>
        </div>
      ) : (
        <div className="list">
          {library.map((l) => (
            <div key={l.id} className="lib-row">
              <span className="lib-row__star"><IconStar width={18} height={18} /></span>
              <div className="lib-row__body">
                <div className="lib-row__name">{l.name}</div>
                <div className="lib-row__meta numeric">
                  {l.default_sets} × {l.default_reps} · {formatWeights((l.default_weights?.length ? l.default_weights.map(Number) : [Number(l.default_weight)]))} · descanso {l.default_rest}s
                </div>
              </div>
              <button className="btn btn--icon btn--danger btn--sm" onClick={() => setDeleting(l)} aria-label="Remover">
                <IconTrash width={17} height={17} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Confirm
        open={!!deleting}
        title="Remover favorito"
        message={`Remover "${deleting?.name}" da biblioteca? Isso não afeta os treinos onde ele já foi usado.`}
        confirmLabel="Remover"
        onConfirm={async () => { if (deleting) { await remove.mutateAsync(deleting.id); toast("Favorito removido"); } }}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
