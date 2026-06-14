import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useAuthStore } from "@/store/authStore";
import { useUserSessions } from "@/hooks/useSessions";
import { useUserHistory } from "@/hooks/useHistory";
import { useWorkouts } from "@/hooks/useWorkouts";
import Header from "@/components/Header";
import { IconHistory } from "@/components/Icons";

type Range = "semana" | "mes";

export default function HistoryPage() {
  const userId = useAuthStore((s) => s.currentUserId)!;
  const { data: sessions } = useUserSessions(userId);
  const { data: history } = useUserHistory(userId);
  const { data: workouts } = useWorkouts(userId);
  const [range, setRange] = useState<Range>("semana");

  const workoutName = useMemo(
    () => new Map((workouts ?? []).map((w) => [w.id, w.name])),
    [workouts]
  );

  // Agrupa cargas por sessao
  const bySession = useMemo(() => {
    const map = new Map<string, { name: string; weight: number }[]>();
    for (const h of history ?? []) {
      const arr = map.get(h.workout_session_id) ?? [];
      arr.push({ name: h.exercise_name, weight: Number(h.weight) });
      map.set(h.workout_session_id, arr);
    }
    return map;
  }, [history]);

  // Volume por periodo (semana ISO ou mes)
  const chartData = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const h of history ?? []) {
      const d = new Date(h.created_at);
      let key: string;
      if (range === "mes") {
        key = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      } else {
        const onejan = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil((((+d - +onejan) / 86400000) + onejan.getDay() + 1) / 7);
        key = `S${week}`;
      }
      buckets.set(key, (buckets.get(key) ?? 0) + Number(h.weight));
    }
    return Array.from(buckets, ([label, volume]) => ({ label, volume })).slice(-10);
  }, [history, range]);

  return (
    <div className="page">
      <Header title="Historico" subtitle="Suas execucoes" />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="spread" style={{ marginBottom: 12 }}>
          <span className="text-2" style={{ fontWeight: 600 }}>Volume por periodo</span>
          <div className="row" style={{ gap: 6 }}>
            <button className={"chip" + (range === "semana" ? " is-active" : "")} onClick={() => setRange("semana")}>Semanal</button>
            <button className={"chip" + (range === "mes" ? " is-active" : "")} onClick={() => setRange("mes")}>Mensal</button>
          </div>
        </div>
        {chartData.length ? (
          <div style={{ width: "100%", height: 180 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="rgba(150,153,140,0.14)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#96998C", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#96998C", fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
                <Tooltip
                  contentStyle={{ background: "#0e2424", border: "1px solid rgba(150,153,140,0.28)", borderRadius: 12, color: "#E9EBE6" }}
                  formatter={(v: number) => [`${v} kg`, "Volume"]}
                />
                <Bar dataKey="volume" fill="#4169E1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="muted" style={{ fontSize: 14 }}>Sem dados ainda.</p>}
      </div>

      {!sessions?.length ? (
        <div className="empty">
          <div className="empty__icon"><IconHistory /></div>
          <p>Nenhum treino concluido ainda.</p>
        </div>
      ) : (
        <div className="list">
          {sessions.map((s) => {
            const items = bySession.get(s.id) ?? [];
            return (
              <div key={s.id} className="history-row">
                <div style={{ minWidth: 0 }}>
                  <div className="history-row__date">{workoutName.get(s.workout_id) ?? "Treino"}</div>
                  <div className="history-row__sub numeric">
                    {new Date(s.completed_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    {" · "}{items.length} exercicios
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
      )}
    </div>
  );
}
