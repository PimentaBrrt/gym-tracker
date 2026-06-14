import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useWorkout } from "@/hooks/useWorkouts";
import { useExercises, useCreateExercise, useUpdateExercise, useDeleteExercise } from "@/hooks/useExercises";
import { useCompleteWorkout } from "@/hooks/useSessions";
import { useUserHistory } from "@/hooks/useHistory";
import { useLibrary, useAddToLibrary } from "@/hooks/useLibrary";
import { useSessionStore } from "@/store/sessionStore";
import { useToast } from "@/store/toastStore";
import Header from "@/components/Header";
import Modal from "@/components/Modal";
import Confirm from "@/components/Confirm";
import ExerciseCard from "@/components/ExerciseCard";
import { IconPlus, IconReset, IconCheck, IconStar, IconTrophy } from "@/components/Icons";
import type { Exercise } from "@/types";

const empty = { name: "", current_weight: 0, rest_time: 90, notes: "" };

export default function WorkoutDetailPage() {
  const { id } = useParams();
  const userId = useAuthStore((s) => s.currentUserId)!;
  const { data: workout } = useWorkout(id);
  const { data: exercises } = useExercises(id);
  const createEx = useCreateExercise(id!);
  const updateEx = useUpdateExercise(id!);
  const deleteEx = useDeleteExercise(id!);
  const complete = useCompleteWorkout();
  const { data: history } = useUserHistory(userId);
  const { data: library } = useLibrary(userId);
  const addToLibrary = useAddToLibrary(userId);
  const toast = useToast((s) => s.show);

  const { completed, toggle, reset } = useSessionStore();
  const doneMap = completed[id!] ?? {};
  const total = exercises?.length ?? 0;
  const done = exercises?.filter((e) => doneMap[e.id]).length ?? 0;
  const allDone = total > 0 && done === total;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [deleting, setDeleting] = useState<Exercise | null>(null);
  const [form, setForm] = useState({ ...empty });

  // ---- Sugestão de progressão: 3+ execuções seguidas com a mesma carga ----
  const suggestions = useMemo(() => {
    if (!exercises || !history) return [];
    const out: { exercise: Exercise; weight: number; next: number }[] = [];
    for (const ex of exercises) {
      const past = history.filter((h) => h.exercise_id === ex.id);
      if (past.length < 3) continue;
      const last3 = past.slice(-3).map((h) => Number(h.weight));
      if (last3.every((w) => w === last3[0]) && last3[0] === Number(ex.current_weight)) {
        out.push({ exercise: ex, weight: last3[0], next: last3[0] + 2.5 });
      }
    }
    return out;
  }, [exercises, history]);

  const openCreate = () => { setForm({ ...empty }); setShowForm(true); };
  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await createEx.mutateAsync({
      name: form.name.trim(),
      current_weight: Number(form.current_weight) || 0,
      rest_time: Number(form.rest_time) || 90,
      notes: form.notes.trim() || null,
      position: total,
    });
    setShowForm(false);
  };
  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !form.name.trim()) return;
    await updateEx.mutateAsync({
      id: editing.id,
      patch: {
        name: form.name.trim(),
        current_weight: Number(form.current_weight) || 0,
        rest_time: Number(form.rest_time) || 90,
        notes: form.notes.trim() || null,
      },
    });
    setEditing(null); toast("Exercício atualizado");
  };

  const finish = async () => {
    if (!exercises?.length) return;
    await complete.mutateAsync({ workoutId: id!, userId, exercises });
    reset(id!);
    toast("Treino concluído! Execução registrada.");
    if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
  };

  const bump = async (ex: Exercise, next: number) => {
    await updateEx.mutateAsync({ id: ex.id, patch: { current_weight: next } });
    toast(`Carga de ${ex.name} → ${next}kg`);
  };

  const favorite = async (ex: Exercise) => {
    await addToLibrary.mutateAsync({ name: ex.name, default_weight: ex.current_weight, default_rest: ex.rest_time });
    toast("Adicionado aos favoritos");
  };

  return (
    <div className="page">
      <Header
        title={workout?.name ?? "Treino"}
        subtitle="Dia de treino"
        back
        right={<button className="btn btn--ghost btn--sm" onClick={() => { reset(id!); toast("Treino reiniciado"); }}><IconReset width={16} height={16} /> Reset</button>}
      />

      {total > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="spread" style={{ marginBottom: 10 }}>
            <span className="text-2" style={{ fontWeight: 600 }}>Progresso</span>
            <span className="numeric muted">{done}/{total}</span>
          </div>
          <div className="progress"><div className="progress__fill" style={{ width: `${pct}%` }} /></div>
        </div>
      )}

      {suggestions.map((s) => (
        <div className="suggestion" key={s.exercise.id} style={{ marginBottom: 12 }}>
          <span style={{ color: "var(--warning)", marginTop: 2 }}><IconTrophy /></span>
          <div style={{ flex: 1 }}>
            <strong>Progressão inteligente</strong>
            <p className="text-2" style={{ fontSize: 14 }}>
              Você fez {s.exercise.name} com {s.weight}kg por 3 execuções seguidas. Aumentar para {s.next}kg?
            </p>
            <button className="btn btn--primary btn--sm" style={{ marginTop: 8 }} onClick={() => bump(s.exercise, s.next)}>
              Aumentar para {s.next}kg
            </button>
          </div>
        </div>
      ))}

      <div className="list">
        {exercises?.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            done={!!doneMap[ex.id]}
            onToggle={() => toggle(id!, ex.id)}
            onEdit={() => { setEditing(ex); setForm({ name: ex.name, current_weight: ex.current_weight, rest_time: ex.rest_time, notes: ex.notes ?? "" }); }}
            onDelete={() => setDeleting(ex)}
            onFavorite={() => favorite(ex)}
          />
        ))}
      </div>

      {!exercises?.length && (
        <div className="empty"><p>Adicione exercícios a este treino.</p></div>
      )}

      <button className="btn btn--ghost btn--block" style={{ marginTop: 16 }} onClick={openCreate}>
        <IconPlus width={18} height={18} /> Adicionar exercício
      </button>

      {total > 0 && (
        <button className="btn btn--primary btn--block" style={{ marginTop: 12 }} disabled={!allDone || complete.isPending} onClick={finish}>
          <IconCheck width={18} height={18} /> {allDone ? "Finalizar treino" : `Conclua todos (${done}/${total})`}
        </button>
      )}

      {/* Form criar / editar */}
      <Modal open={showForm || !!editing} title={editing ? "Editar exercício" : "Novo exercício"} onClose={() => { setShowForm(false); setEditing(null); }}>
        <form onSubmit={editing ? submitEdit : submitCreate}>
          {!editing && library && library.length > 0 && (
            <div className="field">
              <label>Da biblioteca</label>
              <div className="row wrap">
                {library.map((l) => (
                  <button type="button" key={l.id} className="chip"
                    onClick={() => setForm({ name: l.name, current_weight: l.default_weight, rest_time: l.default_rest, notes: "" })}>
                    <IconStar width={13} height={13} /> {l.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="field"><label>Nome</label>
            <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Supino Reto" />
          </div>
          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}><label>Carga (kg)</label>
              <input type="number" inputMode="decimal" step="0.5" value={form.current_weight} onChange={(e) => setForm({ ...form, current_weight: Number(e.target.value) })} />
            </div>
            <div className="field" style={{ flex: 1 }}><label>Descanso (s)</label>
              <input type="number" inputMode="numeric" step="5" value={form.rest_time} onChange={(e) => setForm({ ...form, rest_time: Number(e.target.value) })} />
            </div>
          </div>
          <div className="field"><label>Observações (opcional)</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ex.: pegada fechada" />
          </div>
          <button className="btn btn--primary btn--block" disabled={createEx.isPending || updateEx.isPending}>
            {editing ? "Salvar" : "Adicionar"}
          </button>
        </form>
      </Modal>

      <Confirm
        open={!!deleting}
        title="Excluir exercício"
        message={`Excluir "${deleting?.name}"?`}
        onConfirm={async () => { if (deleting) { await deleteEx.mutateAsync(deleting.id); toast("Exercício excluído"); } }}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
