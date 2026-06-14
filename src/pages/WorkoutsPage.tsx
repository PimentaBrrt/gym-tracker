import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import {
  useWorkouts, useCreateWorkout, useRenameWorkout, useDeleteWorkout, useDuplicateWorkout,
} from "@/hooks/useWorkouts";
import { useToast } from "@/store/toastStore";
import Header from "@/components/Header";
import Modal from "@/components/Modal";
import Confirm from "@/components/Confirm";
import { IconPlus, IconChevron, IconEdit, IconTrash, IconCopy, IconDumbbell, IconStar } from "@/components/Icons";
import type { WorkoutWithMeta } from "@/types";

export default function WorkoutsPage() {
  const userId = useAuthStore((s) => s.currentUserId)!;
  const nav = useNavigate();
  const { data: workouts, isLoading } = useWorkouts(userId);
  const create = useCreateWorkout(userId);
  const rename = useRenameWorkout(userId);
  const remove = useDeleteWorkout(userId);
  const duplicate = useDuplicateWorkout(userId);
  const toast = useToast((s) => s.show);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<WorkoutWithMeta | null>(null);
  const [deleting, setDeleting] = useState<WorkoutWithMeta | null>(null);
  const [name, setName] = useState("");

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const w = await create.mutateAsync(name.trim());
    setShowCreate(false); setName("");
    nav(`/app/workouts/${w.id}`);
  };
  const submitRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !name.trim()) return;
    await rename.mutateAsync({ id: editing.id, name: name.trim() });
    setEditing(null); toast("Treino renomeado");
  };

  const lastLabel = (iso: string | null) =>
    iso ? `último: ${new Date(iso).toLocaleDateString("pt-BR")}` : "nunca executado";

  return (
    <div className="page">
      <Header
        title="Treinos"
        subtitle="Seus dias"
        right={
          <>
            <button className="btn btn--ghost btn--icon btn--sm" onClick={() => nav("/app/library")} aria-label="Biblioteca de favoritos"><IconStar width={18} height={18} /></button>
            <button className="btn btn--primary btn--sm" onClick={() => { setName(""); setShowCreate(true); }}><IconPlus width={18} height={18} /> Novo</button>
          </>
        }
      />

      {isLoading ? (
        <p className="muted">Carregando...</p>
      ) : !workouts?.length ? (
        <div className="empty">
          <div className="empty__icon"><IconDumbbell /></div>
          <p>Nenhum dia de treino ainda.</p>
          <button className="btn btn--primary" style={{ marginTop: 14 }} onClick={() => { setName(""); setShowCreate(true); }}>Criar primeiro treino</button>
        </div>
      ) : (
        <div className="list">
          {workouts.map((w) => (
            <div key={w.id} className="workout-item">
              <div className="workout-item__body" onClick={() => nav(`/app/workouts/${w.id}`)} style={{ cursor: "pointer" }}>
                <div className="workout-item__name">{w.name}</div>
                <div className="workout-item__meta numeric">
                  {w.exerciseCount} exercícios · {w.sessionCount} execuções · {lastLabel(w.lastCompletedAt)}
                </div>
              </div>
              <button className="btn btn--icon btn--ghost btn--sm" onClick={async () => { await duplicate.mutateAsync(w.id); toast("Treino duplicado"); }} aria-label="Duplicar"><IconCopy width={17} height={17} /></button>
              <button className="btn btn--icon btn--ghost btn--sm" onClick={() => { setEditing(w); setName(w.name); }} aria-label="Renomear"><IconEdit width={17} height={17} /></button>
              <button className="btn btn--icon btn--danger btn--sm" onClick={() => setDeleting(w)} aria-label="Excluir"><IconTrash width={17} height={17} /></button>
              <span className="workout-item__chev" onClick={() => nav(`/app/workouts/${w.id}`)}><IconChevron /></span>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} title="Novo dia de treino" onClose={() => setShowCreate(false)}>
        <form onSubmit={submitCreate}>
          <div className="field"><label>Nome</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Peito e Tríceps" />
          </div>
          <button className="btn btn--primary btn--block" disabled={create.isPending}>Criar</button>
        </form>
      </Modal>

      <Modal open={!!editing} title="Renomear treino" onClose={() => setEditing(null)}>
        <form onSubmit={submitRename}>
          <div className="field"><label>Nome</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <button className="btn btn--primary btn--block" disabled={rename.isPending}>Salvar</button>
        </form>
      </Modal>

      <Confirm
        open={!!deleting}
        title="Excluir treino"
        message={`Excluir "${deleting?.name}" e todos os seus exercícios e histórico?`}
        onConfirm={async () => { if (deleting) { await remove.mutateAsync(deleting.id); toast("Treino excluído"); } }}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
