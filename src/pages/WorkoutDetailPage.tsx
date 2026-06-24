import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useWorkout } from "@/hooks/useWorkouts";
import { useExercises, useCreateExercise, useUpdateExercise, useDeleteExercise } from "@/hooks/useExercises";
import { useCompleteWorkout } from "@/hooks/useSessions";
import { useUserHistory } from "@/hooks/useHistory";
import { useLibrary, useAddToLibrary } from "@/hooks/useLibrary";
import { useFavoriteWorkout } from "@/hooks/useTemplates";
import { useSessionStore } from "@/store/sessionStore";
import { useToast } from "@/store/toastStore";
import { exWeights, maxWeight, formatWeights, avgWeight } from "@/lib/exercise";
import Header from "@/components/Header";
import Modal from "@/components/Modal";
import Confirm from "@/components/Confirm";
import ExerciseCard from "@/components/ExerciseCard";
import { IconPlus, IconReset, IconCheck, IconStar, IconTrophy } from "@/components/Icons";
import type { Exercise, LibraryExercise } from "@/types";

// Os campos numericos sao guardados como STRING para permitir vazio enquanto
// digita (sem forcar 0/1) e sem zero grudado. Sao normalizados so no submit.
interface FormState {
  name: string; sets: string; reps: string; weights: string[];
  sameWeight: boolean; rest_time: string; notes: string;
}
const newForm = (): FormState => ({ name: "", sets: "3", reps: "10", weights: [], sameWeight: true, rest_time: "90", notes: "" });

const onlyDigits = (v: string) => v.replace(/[^0-9]/g, "");
const onlyDecimal = (v: string) => v.replace(/[^0-9.,]/g, "").replace(",", ".").replace(/(\..*)\./g, "$1");
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

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
  const favWorkout = useFavoriteWorkout(userId);
  const toast = useToast((s) => s.show);

  const { counts, startedAt, incr, resetExercise, reset } = useSessionStore();
  const countMap = counts[id!] ?? {};
  const total = exercises?.length ?? 0;
  const done = exercises?.filter((e) => (countMap[e.id] ?? 0) >= (e.sets || 1)).length ?? 0;
  const allDone = total > 0 && done === total;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [deleting, setDeleting] = useState<Exercise | null>(null);
  const [form, setForm] = useState<FormState>(newForm());
  const [showPicker, setShowPicker] = useState(false);

  // Quantas series para renderizar os campos de carga (fallback 1 enquanto vazio).
  const setsCount = clamp(parseInt(form.sets, 10) || 1, 1, 12);

  const setWeightAt = (i: number, raw: string) =>
    setForm((f) => {
      const nw = [...f.weights];
      while (nw.length <= i) nw.push("");
      nw[i] = onlyDecimal(raw);
      return { ...f, weights: nw };
    });
  const toggleSame = () => setForm((f) => ({ ...f, sameWeight: !f.sameWeight }));

  // ---- Sugestao de progressao: 3+ execucoes seguidas com a mesma carga ----
  const suggestions = useMemo(() => {
    if (!exercises || !history) return [];
    const out: { exercise: Exercise; weight: number }[] = [];
    for (const ex of exercises) {
      const past = history.filter((h) => h.exercise_id === ex.id);
      if (past.length < 3) continue;
      const last3 = past.slice(-3).map((h) => Number(h.weight));
      if (last3.every((w) => w === last3[0]) && last3[0] === avgWeight(exWeights(ex))) {
        out.push({ exercise: ex, weight: last3[0] });
      }
    }
    return out;
  }, [exercises, history]);

  const buildPayload = () => {
    const sets = clamp(parseInt(form.sets, 10) || 1, 1, 12);
    const reps = Math.max(1, parseInt(form.reps, 10) || 1);
    const rest = Math.max(5, parseInt(form.rest_time, 10) || 90);
    const weights = form.sameWeight
      ? Array(sets).fill(parseFloat(form.weights[0]) || 0)
      : Array.from({ length: sets }, (_, i) => parseFloat(form.weights[i]) || 0);
    return {
      name: form.name.trim(),
      sets, reps, weights,
      current_weight: maxWeight(weights),
      rest_time: rest,
      notes: form.notes.trim() || null,
    };
  };

  const openCreate = () => { setForm(newForm()); setEditing(null); setShowForm(true); };
  const openEdit = (ex: Exercise) => {
    const w = exWeights(ex);
    setEditing(ex);
    setForm({
      name: ex.name,
      sets: String(ex.sets || w.length || 1),
      reps: String(ex.reps || 10),
      weights: w.map(String),
      sameWeight: w.every((x) => x === w[0]),
      rest_time: String(ex.rest_time),
      notes: ex.notes ?? "",
    });
  };
  const applyFavorite = (l: LibraryExercise) => {
    const w = (Array.isArray(l.default_weights) && l.default_weights.length)
      ? l.default_weights.map(Number)
      : Array(l.default_sets || 3).fill(Number(l.default_weight) || 0);
    setForm({
      name: l.name,
      sets: String(l.default_sets || w.length || 1),
      reps: String(l.default_reps || 10),
      weights: w.map(String),
      sameWeight: w.every((x) => x === w[0]),
      rest_time: String(l.default_rest),
      notes: l.default_notes ?? "",
    });
    setShowPicker(false);
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await createEx.mutateAsync({ ...buildPayload(), position: total });
    setShowForm(false);
  };
  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !form.name.trim()) return;
    await updateEx.mutateAsync({ id: editing.id, patch: buildPayload() });
    setEditing(null); toast("Exercício atualizado");
  };

  const finish = async () => {
    if (!exercises?.length) return;
    const start = startedAt[id!];
    const durationSeconds = start ? Math.round((Date.now() - start) / 1000) : 0;
    await complete.mutateAsync({ workoutId: id!, userId, exercises, durationSeconds });
    reset(id!);
    toast("Treino concluído! Execução registrada.");
    if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
  };

  const bump = async (ex: Exercise) => {
    const w = exWeights(ex).map((x) => x + 2.5);
    await updateEx.mutateAsync({ id: ex.id, patch: { weights: w, current_weight: maxWeight(w) } });
    toast(`${ex.name}: +2,5kg em todas as séries`);
  };

  const favorite = async (ex: Exercise) => {
    const w = exWeights(ex);
    await addToLibrary.mutateAsync({
      name: ex.name, default_weight: maxWeight(w), default_sets: ex.sets,
      default_reps: ex.reps, default_weights: w, default_notes: ex.notes, default_rest: ex.rest_time,
    });
    toast("Salvo nos favoritos");
  };

  return (
    <div className="page">
      <Header
        title={workout?.name ?? "Treino"}
        subtitle="Dia de treino"
        back
        right={
          <>
            <button className="btn btn--ghost btn--icon btn--sm" aria-label="Favoritar treino"
              onClick={async () => { await favWorkout.mutateAsync(id!); toast("Treino salvo nos favoritos"); }}>
              <IconStar width={17} height={17} />
            </button>
            <button className="btn btn--ghost btn--sm" onClick={() => { reset(id!); toast("Treino reiniciado"); }}><IconReset width={16} height={16} /> Reset</button>
          </>
        }
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
              Você fez {s.exercise.name} com {s.weight}kg por 3 execuções seguidas. Aumentar a carga?
            </p>
            <button className="btn btn--primary btn--sm" style={{ marginTop: 8 }} onClick={() => bump(s.exercise)}>
              +2,5kg em todas as séries
            </button>
          </div>
        </div>
      ))}

      <div className="list">
        {exercises?.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            count={countMap[ex.id] ?? 0}
            onIncr={() => incr(id!, ex.id)}
            onResetCount={() => resetExercise(id!, ex.id)}
            onEdit={() => openEdit(ex)}
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
              <button type="button" className="btn btn--ghost btn--block" onClick={() => setShowPicker(true)}>
                <IconStar width={16} height={16} /> Selecionar da Biblioteca
              </button>
            </div>
          )}

          <div className="field"><label>Nome</label>
            <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Supino Reto" />
          </div>

          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}><label>Séries</label>
              <input
                type="text" inputMode="numeric" value={form.sets} placeholder="3"
                onChange={(e) => setForm({ ...form, sets: onlyDigits(e.target.value) })}
                onBlur={() => setForm((f) => ({ ...f, sets: String(clamp(parseInt(f.sets, 10) || 1, 1, 12)) }))}
              />
            </div>
            <div className="field" style={{ flex: 1 }}><label>Repetições</label>
              <input
                type="text" inputMode="numeric" value={form.reps} placeholder="10"
                onChange={(e) => setForm({ ...form, reps: onlyDigits(e.target.value) })}
                onBlur={() => setForm((f) => ({ ...f, reps: String(Math.max(1, parseInt(f.reps, 10) || 1)) }))}
              />
            </div>
          </div>

          <div className="field">
            <div className="spread" style={{ marginBottom: 8 }}>
              <label style={{ margin: 0 }}>Carga por série (kg)</label>
              <button type="button" className={"chip" + (form.sameWeight ? " is-active" : "")} onClick={toggleSame}>
                {form.sameWeight ? "Mesma carga" : "Cargas diferentes"}
              </button>
            </div>
            {form.sameWeight ? (
              <input
                type="text" inputMode="decimal" value={form.weights[0] ?? ""} placeholder="0"
                onChange={(e) => setWeightAt(0, e.target.value)}
              />
            ) : (
              <div className="weights-grid">
                {Array.from({ length: setsCount }).map((_, i) => (
                  <div className="weight-set" key={i}>
                    <span className="weight-set__label">Série {i + 1}</span>
                    <input
                      type="text" inputMode="decimal" value={form.weights[i] ?? ""} placeholder="0"
                      onChange={(e) => setWeightAt(i, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="field"><label>Descanso (s)</label>
            <input
              type="text" inputMode="numeric" value={form.rest_time} placeholder="90"
              onChange={(e) => setForm({ ...form, rest_time: onlyDigits(e.target.value) })}
              onBlur={() => setForm((f) => ({ ...f, rest_time: String(Math.max(5, parseInt(f.rest_time, 10) || 90)) }))}
            />
          </div>
          <div className="field"><label>Observações (opcional)</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ex.: pegada fechada" />
          </div>
          <button className="btn btn--primary btn--block" disabled={createEx.isPending || updateEx.isPending}>
            {editing ? "Salvar" : "Adicionar"}
          </button>
        </form>
      </Modal>

      {/* Picker: selecionar da biblioteca */}
      <Modal open={showPicker} title="Selecionar da Biblioteca" onClose={() => setShowPicker(false)}>
        {!library?.length ? (
          <div className="empty"><p>Nenhum favorito ainda.</p></div>
        ) : (
          <div className="list">
            {library.map((l) => (
              <button type="button" key={l.id} className="picker-row" onClick={() => applyFavorite(l)}>
                <span className="picker-row__star"><IconStar width={16} height={16} /></span>
                <span className="picker-row__body">
                  <span className="picker-row__name">{l.name}</span>
                  <span className="picker-row__meta numeric">
                    {l.default_sets} × {l.default_reps} · {formatWeights(l.default_weights?.length ? l.default_weights.map(Number) : [Number(l.default_weight)])} · descanso {l.default_rest}s
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
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
