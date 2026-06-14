import type { Workout, Exercise, WorkoutSession, ExerciseHistory } from "@/types";

export interface ExportBundle {
  exportedAt: string;
  user: { id: string; name: string };
  workouts: Workout[];
  exercises: Exercise[];
  sessions: WorkoutSession[];
  history: ExerciseHistory[];
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportJson(bundle: ExportBundle) {
  download(
    `gymtrack-${bundle.user.name}-${Date.now()}.json`,
    JSON.stringify(bundle, null, 2),
    "application/json"
  );
}

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportCsv(bundle: ExportBundle) {
  const header = ["data", "treino", "exercicio", "carga_kg"];
  const workoutName = new Map(bundle.workouts.map((w) => [w.id, w.name]));
  const sessionWorkout = new Map(bundle.sessions.map((s) => [s.id, s.workout_id]));
  const lines = [header.join(",")];
  for (const h of bundle.history) {
    const wId = sessionWorkout.get(h.workout_session_id);
    lines.push(
      [
        csvEscape(new Date(h.created_at).toLocaleDateString("pt-BR")),
        csvEscape(wId ? workoutName.get(wId) ?? "" : ""),
        csvEscape(h.exercise_name),
        csvEscape(h.weight),
      ].join(",")
    );
  }
  download(`gymtrack-${bundle.user.name}-${Date.now()}.csv`, lines.join("\n"), "text/csv");
}
