import { create } from "zustand";
import { persist } from "zustand/middleware";

// Estado de conclusao dos exercicios DURANTE a sessao (persistido localmente).
type CompletedMap = Record<string, Record<string, boolean>>; // workoutId -> exerciseId -> done

interface SessionState {
  completed: CompletedMap;
  toggle: (workoutId: string, exerciseId: string) => void;
  set: (workoutId: string, exerciseId: string, done: boolean) => void;
  reset: (workoutId: string) => void;
  isDone: (workoutId: string, exerciseId: string) => boolean;
  doneCount: (workoutId: string) => number;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      completed: {},
      toggle: (w, e) =>
        set((s) => {
          const day = { ...(s.completed[w] ?? {}) };
          day[e] = !day[e];
          return { completed: { ...s.completed, [w]: day } };
        }),
      set: (w, e, done) =>
        set((s) => {
          const day = { ...(s.completed[w] ?? {}) };
          day[e] = done;
          return { completed: { ...s.completed, [w]: day } };
        }),
      reset: (w) =>
        set((s) => ({ completed: { ...s.completed, [w]: {} } })),
      isDone: (w, e) => Boolean(get().completed[w]?.[e]),
      doneCount: (w) =>
        Object.values(get().completed[w] ?? {}).filter(Boolean).length,
    }),
    { name: "gymtrack-session" }
  )
);
