import type { ExerciseHistory, WorkoutSession, WorkoutWithMeta } from "@/types";

const dayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);

export function sessionsThisMonth(sessions: WorkoutSession[]): number {
  const now = new Date();
  return sessions.filter((s) => {
    const d = new Date(s.completed_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
}

export function totalVolume(history: ExerciseHistory[]): number {
  return history.reduce((sum, h) => sum + Number(h.weight), 0);
}

// Tempo real treinado: soma das duracoes das execucoes (em minutos).
export function totalTrainedMinutes(sessions: WorkoutSession[]): number {
  return Math.round(sessions.reduce((sum, x) => sum + (x.duration_seconds || 0), 0) / 60);
}

export function biggestProgress(history: ExerciseHistory[]): { name: string; delta: number } | null {
  const byEx = new Map<string, ExerciseHistory[]>();
  for (const h of history) {
    const arr = byEx.get(h.exercise_id) ?? [];
    arr.push(h);
    byEx.set(h.exercise_id, arr);
  }
  let best: { name: string; delta: number } | null = null;
  for (const arr of byEx.values()) {
    if (arr.length < 2) continue;
    const sorted = [...arr].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    const delta = Number(sorted[sorted.length - 1].weight) - Number(sorted[0].weight);
    if (delta > 0 && (!best || delta > best.delta)) best = { name: sorted[0].exercise_name, delta };
  }
  return best;
}

export function mostExecuted(history: ExerciseHistory[]): { name: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const h of history) counts.set(h.exercise_name, (counts.get(h.exercise_name) ?? 0) + 1);
  let best: { name: string; count: number } | null = null;
  for (const [name, count] of counts) if (!best || count > best.count) best = { name, count };
  return best;
}

// Sequencia de dias consecutivos treinando (terminando hoje ou ontem).
export function streak(sessions: WorkoutSession[]): number {
  if (!sessions.length) return 0;
  const days = new Set(sessions.map((s) => dayKey(s.completed_at)));
  let count = 0;
  const cursor = new Date();
  // permite contar a partir de hoje ou ontem
  if (!days.has(dayKey(cursor.toISOString()))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor.toISOString()))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function nextWorkout(workouts: WorkoutWithMeta[]): WorkoutWithMeta | null {
  if (!workouts.length) return null;
  return [...workouts].sort((a, b) => {
    if (!a.lastCompletedAt) return -1;
    if (!b.lastCompletedAt) return 1;
    return +new Date(a.lastCompletedAt) - +new Date(b.lastCompletedAt);
  })[0];
}
