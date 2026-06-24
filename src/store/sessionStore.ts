import { create } from "zustand";
import { persist } from "zustand/middleware";

// Estado da sessao de treino (persistido localmente):
// - counts: quantas series ja foram feitas em cada exercicio
// - startedAt: instante em que a 1a serie de QUALQUER exercicio do treino comecou
type CountMap = Record<string, Record<string, number>>; // workoutId -> exerciseId -> series feitas
type StartMap = Record<string, number>;                  // workoutId -> timestamp (ms)

interface SessionState {
  counts: CountMap;
  startedAt: StartMap;
  incr: (workoutId: string, exerciseId: string) => void;
  resetExercise: (workoutId: string, exerciseId: string) => void;
  reset: (workoutId: string) => void;
  getCount: (workoutId: string, exerciseId: string) => number;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      counts: {},
      startedAt: {},
      incr: (w, e) =>
        set((s) => {
          const day = { ...(s.counts[w] ?? {}) };
          day[e] = (day[e] ?? 0) + 1;
          const startedAt = s.startedAt[w]
            ? s.startedAt
            : { ...s.startedAt, [w]: Date.now() }; // marca o inicio na 1a serie
          return { counts: { ...s.counts, [w]: day }, startedAt };
        }),
      resetExercise: (w, e) =>
        set((s) => {
          const day = { ...(s.counts[w] ?? {}) };
          day[e] = 0;
          return { counts: { ...s.counts, [w]: day } };
        }),
      reset: (w) =>
        set((s) => {
          const startedAt = { ...s.startedAt };
          delete startedAt[w];
          return { counts: { ...s.counts, [w]: {} }, startedAt };
        }),
      getCount: (w, e) => get().counts[w]?.[e] ?? 0,
    }),
    { name: "gymtrack-session" }
  )
);
