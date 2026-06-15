import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useUsers } from "@/hooks/useUsers";
import { useLibrary, useRemoveFromLibrary, useAddToLibrary } from "@/hooks/useLibrary";
import { useTemplates, useRemoveTemplate, useInstantiateTemplate } from "@/hooks/useTemplates";
import { useToast } from "@/store/toastStore";
import { formatWeights } from "@/lib/exercise";
import Header from "@/components/Header";
import Confirm from "@/components/Confirm";
import { IconStar, IconTrash, IconPlus, IconDumbbell } from "@/components/Icons";
import type { LibraryExercise, WorkoutTemplate } from "@/types";

type Tab = "ex" | "tpl";

export default function LibraryPage() {
  const currentUserId = useAuthStore((s) => s.currentUserId)!;
  const { data: users } = useUsers();
  const others = (users ?? []).filter((u) => !u.is_admin);

  const [tab, setTab] = useState<Tab>("ex");
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUserId);
  useEffect(() => {
    if (others.length && !others.some((u) => u.id === selectedUserId)) setSelectedUserId(others[0].id);
  }, [users]); // eslint-disable-line react-hooks/exhaustive-deps

  const isOwn = selectedUserId === currentUserId;
  const selectedName = others.find((u) => u.id === selectedUserId)?.name ?? "";
  const toast = useToast((s) => s.show);

  // Exercicios
  const { data: library, isLoading: loadingEx } = useLibrary(selectedUserId);
  const removeFav = useRemoveFromLibrary(selectedUserId);
  const addMine = useAddToLibrary(currentUserId);
  const [deletingEx, setDeletingEx] = useState<LibraryExercise | null>(null);

  // Treinos
  const { data: templates, isLoading: loadingTpl } = useTemplates(selectedUserId);
  const removeTpl = useRemoveTemplate(selectedUserId);
  const instantiate = useInstantiateTemplate(currentUserId);
  const [deletingTpl, setDeletingTpl] = useState<WorkoutTemplate | null>(null);

  const weightsOf = (l: LibraryExercise) =>
    l.default_weights?.length ? l.default_weights.map(Number) : [Number(l.default_weight)];

  const copyExercise = async (l: LibraryExercise) => {
    await addMine.mutateAsync({
      name: l.name, default_weight: l.default_weight, default_sets: l.default_sets,
      default_reps: l.default_reps, default_weights: weightsOf(l),
      default_notes: l.default_notes, default_rest: l.default_rest,
    });
    toast("Adicionado à sua biblioteca");
  };

  const copyTemplate = async (t: WorkoutTemplate) => {
    await instantiate.mutateAsync(t.id);
    toast("Treino adicionado aos seus treinos");
  };

  return (
    <div className="page">
      <Header title="Biblioteca" subtitle="Favoritos" back />

      <div className="field">
        <label>Biblioteca de</label>
        <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
          {others.map((u) => (
            <option key={u.id} value={u.id}>{u.name}{u.id === currentUserId ? " (você)" : ""}</option>
          ))}
        </select>
      </div>

      <div className="row" style={{ gap: 8, margin: "14px 0 16px" }}>
        <button className={"chip" + (tab === "ex" ? " is-active" : "")} onClick={() => setTab("ex")}>Exercícios</button>
        <button className={"chip" + (tab === "tpl" ? " is-active" : "")} onClick={() => setTab("tpl")}>Treinos</button>
      </div>

      {tab === "ex" ? (
        <>
          <p className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
            {isOwn ? "Seus exercícios favoritos. Favorite pelo botão de estrela na tela do exercício."
                   : `Exercícios favoritos de ${selectedName}. Toque em + para copiar para você.`}
          </p>
          {loadingEx ? <p className="muted">Carregando...</p>
            : !library?.length ? (
              <div className="empty"><div className="empty__icon"><IconStar /></div><p>Nenhum exercício favorito {isOwn ? "ainda" : "neste perfil"}.</p></div>
            ) : (
              <div className="list">
                {library.map((l) => (
                  <div key={l.id} className="lib-row">
                    <span className="lib-row__star"><IconStar width={18} height={18} /></span>
                    <div className="lib-row__body">
                      <div className="lib-row__name">{l.name}</div>
                      <div className="lib-row__meta numeric">{l.default_sets} × {l.default_reps} · {formatWeights(weightsOf(l))} · descanso {l.default_rest}s</div>
                      {l.default_notes && <div className="lib-row__notes">{l.default_notes}</div>}
                    </div>
                    {isOwn ? (
                      <button className="btn btn--icon btn--danger btn--sm" onClick={() => setDeletingEx(l)} aria-label="Remover"><IconTrash width={17} height={17} /></button>
                    ) : (
                      <button className="btn btn--icon btn--primary btn--sm" onClick={() => copyExercise(l)} aria-label="Adicionar à minha biblioteca" disabled={addMine.isPending}><IconPlus width={18} height={18} /></button>
                    )}
                  </div>
                ))}
              </div>
            )}
        </>
      ) : (
        <>
          <p className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
            {isOwn ? "Seus treinos favoritos. Favorite um treino pelo botão de estrela na tela do treino."
                   : `Treinos de ${selectedName}. Toque em + para adicionar uma cópia aos seus treinos.`}
          </p>
          {loadingTpl ? <p className="muted">Carregando...</p>
            : !templates?.length ? (
              <div className="empty"><div className="empty__icon"><IconDumbbell /></div><p>Nenhum treino favorito {isOwn ? "ainda" : "neste perfil"}.</p></div>
            ) : (
              <div className="list">
                {templates.map((t) => (
                  <div key={t.id} className="lib-row">
                    <span className="lib-row__star" style={{ color: "var(--blue-2)" }}><IconDumbbell width={18} height={18} /></span>
                    <div className="lib-row__body">
                      <div className="lib-row__name">{t.name}</div>
                      <div className="lib-row__meta numeric">{(t.exercises?.length ?? 0)} exercícios</div>
                    </div>
                    {isOwn ? (
                      <button className="btn btn--icon btn--danger btn--sm" onClick={() => setDeletingTpl(t)} aria-label="Remover"><IconTrash width={17} height={17} /></button>
                    ) : (
                      <button className="btn btn--icon btn--primary btn--sm" onClick={() => copyTemplate(t)} aria-label="Adicionar aos meus treinos" disabled={instantiate.isPending}><IconPlus width={18} height={18} /></button>
                    )}
                  </div>
                ))}
              </div>
            )}
        </>
      )}

      <Confirm
        open={!!deletingEx}
        title="Remover favorito"
        message={`Remover "${deletingEx?.name}" da biblioteca?`}
        confirmLabel="Remover"
        onConfirm={async () => { if (deletingEx) { await removeFav.mutateAsync(deletingEx.id); toast("Favorito removido"); } }}
        onClose={() => setDeletingEx(null)}
      />
      <Confirm
        open={!!deletingTpl}
        title="Remover treino favorito"
        message={`Remover o treino "${deletingTpl?.name}" dos favoritos? Isso não afeta o treino original.`}
        confirmLabel="Remover"
        onConfirm={async () => { if (deletingTpl) { await removeTpl.mutateAsync(deletingTpl.id); toast("Treino removido dos favoritos"); } }}
        onClose={() => setDeletingTpl(null)}
      />
    </div>
  );
}
