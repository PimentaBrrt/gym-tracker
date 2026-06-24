import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useUser } from "@/hooks/useUsers";
import { useWorkouts } from "@/hooks/useWorkouts";
import { useUserSessions } from "@/hooks/useSessions";
import { useUserHistory } from "@/hooks/useHistory";
import Avatar from "@/components/Avatar";
import {
  IconDumbbell, IconFlame, IconTrophy, IconChart, IconChevron, IconShield,
} from "@/components/Icons";
import {
  sessionsThisMonth, totalTrainedMinutes, biggestProgress, streak, nextWorkout,
} from "@/lib/stats";

export default function DashboardPage() {
  const nav = useNavigate();
  const { currentUserId, adminElevated, clearUser } = useAuthStore();
  const user = useUser(currentUserId);
  const { data: workouts } = useWorkouts(currentUserId);
  const { data: sessions } = useUserSessions(currentUserId);
  const { data: history } = useUserHistory(currentUserId);

  const next = workouts ? nextWorkout(workouts) : null;
  const monthCount = sessions ? sessionsThisMonth(sessions) : 0;
  const minutes = sessions ? totalTrainedMinutes(sessions) : 0;
  const progress = history ? biggestProgress(history) : null;
  const days = sessions ? streak(sessions) : 0;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="page">
      <div className="spread" style={{ marginBottom: 22 }}>
        <div className="row" style={{ gap: 12 }}>
          <Avatar name={user?.name ?? "?"} hue={user?.avatar_hue} size={48} />
          <div>
            <div className="eyebrow">{greet}{adminElevated ? " · modo admin" : ""}</div>
            <h1 style={{ fontSize: 22 }}>{user?.name ?? "Atleta"}</h1>
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {adminElevated && (
            <button className="btn btn--ghost btn--icon btn--sm" onClick={() => nav("/app/admin")} aria-label="Administração">
              <IconShield width={18} height={18} />
            </button>
          )}
          <button className="btn btn--ghost btn--sm" onClick={() => { clearUser(); nav("/profiles", { replace: true }); }}>
            Trocar
          </button>
        </div>
      </div>

      <div className="hero-card" onClick={() => next && nav(`/app/workouts/${next.id}`)} style={{ cursor: next ? "pointer" : "default", marginBottom: 16 }}>
        <div className="eyebrow">Próximo treino</div>
        {next ? (
          <div className="spread" style={{ marginTop: 8 }}>
            <div>
              <h2 style={{ fontSize: 24 }}>{next.name}</h2>
              <p className="text-2 numeric" style={{ fontSize: 14, marginTop: 4 }}>
                {next.exerciseCount} exercícios · {next.lastCompletedAt ? `último ${new Date(next.lastCompletedAt).toLocaleDateString("pt-BR")}` : "nunca feito"}
              </p>
            </div>
            <span style={{ color: "var(--blue-2)" }}><IconChevron width={28} height={28} /></span>
          </div>
        ) : (
          <p className="text-2" style={{ marginTop: 8 }}>
            Nenhum treino ainda. <button className="btn btn--primary btn--sm" style={{ marginLeft: 8 }} onClick={() => nav("/app/workouts")}>Criar treino</button>
          </p>
        )}
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__icon"><IconDumbbell width={20} height={20} /></div>
          <div className="stat-card__value numeric">{monthCount}</div>
          <div className="stat-card__label">Treinos no mês</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon"><IconFlame width={20} height={20} /></div>
          <div className="stat-card__value numeric">{days}</div>
          <div className="stat-card__label">Dias seguidos</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon"><IconTrophy width={20} height={20} /></div>
          <div className="stat-card__value" style={{ fontSize: progress ? 18 : 26 }}>
            {progress ? `+${progress.delta}kg` : "—"}
          </div>
          <div className="stat-card__label">{progress ? progress.name : "Maior evolução"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon"><IconChart width={20} height={20} /></div>
          <div className="stat-card__value numeric">{Math.floor(minutes / 60)}h{minutes % 60}</div>
          <div className="stat-card__label">Tempo treinado</div>
        </div>
      </div>

      <div className="section-title"><h2>Seus treinos</h2>
        <button className="btn btn--ghost btn--sm" onClick={() => nav("/app/workouts")}>Ver todos</button>
      </div>
      <div className="list">
        {workouts?.slice(0, 3).map((w) => (
          <div key={w.id} className="workout-item" onClick={() => nav(`/app/workouts/${w.id}`)} style={{ cursor: "pointer" }}>
            <div className="workout-item__body">
              <div className="workout-item__name">{w.name}</div>
              <div className="workout-item__meta numeric">{w.exerciseCount} exercícios · {w.sessionCount} execuções</div>
            </div>
            <span className="workout-item__chev"><IconChevron /></span>
          </div>
        ))}
        {!workouts?.length && <p className="muted">Crie seu primeiro treino na aba Treinos.</p>}
      </div>
    </div>
  );
}
