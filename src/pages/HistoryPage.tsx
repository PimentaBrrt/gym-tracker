import { useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { useUserSessions } from "@/hooks/useSessions";
import { useUserHistory } from "@/hooks/useHistory";
import { useWorkouts } from "@/hooks/useWorkouts";
import Header from "@/components/Header";
import { IconHistory } from "@/components/Icons";

export default function HistoryPage() {
  const userId = useAuthStore((s) => s.currentUserId)!;
  const { data: sessions } = useUserSessions(userId);
  const { data: history } = useUserHistory(userId);
  const { data: workouts } = useWorkouts(userId);

  const workoutName = useMemo(
    () => new Map((workouts ?? []).map((w) => [w.id, w.name])),
    [workouts]
  );

  // Cargas agrupadas por sessão (para detalhar cada treino realizado).
  const bySession = useMemo(() => {
    const map = new Map<string, { name: string; weight: number }[]>();
    for (const h of history ?? []) {
      const arr = map.get(h.workout_session_id) ?? [];
      arr.push({ name: h.exercise_name, weight: Number(h.weight) });
      map.set(h.workout_session_id, arr);
    }
    return map;
  }, [history]);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="page">
      <Header title="Histórico" subtitle="Treinos realizados" />

      {!sessions?.length ? (
        <div className="empty">
          <div className="empty__icon"><IconHistory /></div>
          <p>Nenhum treino concluído ainda.</p>
        </div>
      ) : (
        <>
          <p className="muted" style={{ marginBottom: 14, fontSize: 14 }}>
            {sessions.length} {sessions.length === 1 ? "treino realizado" : "treinos realizados"}
          </p>
          <div className="list">
            {sessions.map((s) => {
              const items = bySession.get(s.id) ?? [];
              return (
                <div key={s.id} className="history-row">
                  <div style={{ minWidth: 0 }}>
                    <div className="history-row__date">{workoutName.get(s.workout_id) ?? "Treino"}</div>
                    <div className="history-row__sub numeric">
                      {fmtDate(s.completed_at)} · {fmtTime(s.completed_at)} · {items.length} exercícios
                    </div>
                    {items.length > 0 && (
                      <div className="history-row__sub" style={{ marginTop: 4 }}>
                        {items.map((i) => `${i.name} ${i.weight}kg`).join(" · ")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
