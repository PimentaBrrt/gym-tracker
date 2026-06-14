import { useAuthStore } from "@/store/authStore";
import { useUser } from "@/hooks/useUsers";
import { useUserSessions } from "@/hooks/useSessions";
import { useUserHistory } from "@/hooks/useHistory";
import { useWorkouts } from "@/hooks/useWorkouts";
import { workoutsApi, exercisesApi, sessionsApi, historyApi } from "@/lib/api";
import Header from "@/components/Header";
import { useToast } from "@/store/toastStore";
import { exportJson, exportCsv, type ExportBundle } from "@/lib/export";
import { totalVolume, mostExecuted, streak } from "@/lib/stats";
import { IconDownload, IconTrophy, IconFlame, IconDumbbell, IconStar } from "@/components/Icons";

export default function StatsPage() {
  const userId = useAuthStore((s) => s.currentUserId)!;
  const user = useUser(userId);
  const { data: sessions } = useUserSessions(userId);
  const { data: history } = useUserHistory(userId);
  const { data: workouts } = useWorkouts(userId);
  const toast = useToast((s) => s.show);

  const completed = sessions?.length ?? 0;
  const volume = history ? totalVolume(history) : 0;
  const top = history ? mostExecuted(history) : null;
  const days = sessions ? streak(sessions) : 0;

  const buildBundle = async (): Promise<ExportBundle> => {
    const wk = await workoutsApi.listByUser(userId);
    const allEx = (await Promise.all(wk.map((w) => exercisesApi.listByWorkout(w.id)))).flat();
    const ss = await sessionsApi.listByUser(userId);
    const hist = await historyApi.listByUser(userId);
    return {
      exportedAt: new Date().toISOString(),
      user: { id: userId, name: user?.name ?? "user" },
      workouts: wk, exercises: allEx, sessions: ss, history: hist,
    };
  };

  const doExport = async (kind: "json" | "csv") => {
    const bundle = await buildBundle();
    if (kind === "json") exportJson(bundle); else exportCsv(bundle);
    toast(`Exportado ${kind.toUpperCase()}`);
  };

  return (
    <div className="page">
      <Header title="Estatísticas" subtitle="Seu progresso" />

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__icon"><IconDumbbell width={20} height={20} /></div>
          <div className="stat-card__value numeric">{completed}</div>
          <div className="stat-card__label">Treinos concluídos</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon"><IconTrophy width={20} height={20} /></div>
          <div className="stat-card__value numeric">{volume.toLocaleString("pt-BR")}<span style={{ fontSize: 14 }}>kg</span></div>
          <div className="stat-card__label">Volume total</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon"><IconFlame width={20} height={20} /></div>
          <div className="stat-card__value numeric">{days}</div>
          <div className="stat-card__label">Dias seguidos</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon"><IconStar width={20} height={20} /></div>
          <div className="stat-card__value" style={{ fontSize: top ? 17 : 26 }}>{top ? top.name : "—"}</div>
          <div className="stat-card__label">{top ? `mais executado (${top.count}x)` : "Mais executado"}</div>
        </div>
      </div>

      <div className="section-title"><h2>Resumo</h2></div>
      <div className="card">
        <div className="spread"><span className="text-2">Total de treinos cadastrados</span><span className="numeric" style={{ fontWeight: 700 }}>{workouts?.length ?? 0}</span></div>
        <hr className="divider" />
        <div className="spread"><span className="text-2">Execuções registradas</span><span className="numeric" style={{ fontWeight: 700 }}>{completed}</span></div>
        <hr className="divider" />
        <div className="spread"><span className="text-2">Séries/exercícios feitos</span><span className="numeric" style={{ fontWeight: 700 }}>{history?.length ?? 0}</span></div>
      </div>

      <div className="section-title"><h2>Backup e exportação</h2></div>
      <div className="row" style={{ gap: 12 }}>
        <button className="btn btn--ghost btn--block" onClick={() => doExport("json")}><IconDownload width={18} height={18} /> JSON</button>
        <button className="btn btn--ghost btn--block" onClick={() => doExport("csv")}><IconDownload width={18} height={18} /> CSV</button>
      </div>
    </div>
  );
}
