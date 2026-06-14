import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import SetupGuard from "@/components/SetupGuard";
import Toast from "@/components/Toast";
import AppLayout from "@/components/AppLayout";
import GatePage from "@/pages/GatePage";
import ProfilesPage from "@/pages/ProfilesPage";
import DashboardPage from "@/pages/DashboardPage";
import WorkoutsPage from "@/pages/WorkoutsPage";
import WorkoutDetailPage from "@/pages/WorkoutDetailPage";
import HistoryPage from "@/pages/HistoryPage";
import StatsPage from "@/pages/StatsPage";

export default function App() {
  const { gateUnlocked, currentUserId } = useAuthStore();

  return (
    <SetupGuard>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={!gateUnlocked ? <GatePage /> : <Navigate to="/profiles" replace />} />
          <Route
            path="/profiles"
            element={!gateUnlocked ? <Navigate to="/" replace /> : <ProfilesPage />}
          />
          <Route
            path="/app"
            element={
              !gateUnlocked ? <Navigate to="/" replace />
                : !currentUserId ? <Navigate to="/profiles" replace />
                : <AppLayout />
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="workouts" element={<WorkoutsPage />} />
            <Route path="workouts/:id" element={<WorkoutDetailPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="stats" element={<StatsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toast />
      </div>
    </SetupGuard>
  );
}
