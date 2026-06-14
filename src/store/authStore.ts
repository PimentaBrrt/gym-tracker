import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  gateUnlocked: boolean;
  currentUserId: string | null;
  adminElevated: boolean;
  unlockGate: () => void;
  lockGate: () => void;
  selectUser: (id: string, elevated?: boolean) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      gateUnlocked: false,
      currentUserId: null,
      adminElevated: false,
      unlockGate: () => set({ gateUnlocked: true }),
      lockGate: () => set({ gateUnlocked: false, currentUserId: null, adminElevated: false }),
      selectUser: (id, elevated = false) => set({ currentUserId: id, adminElevated: elevated }),
      clearUser: () => set({ currentUserId: null, adminElevated: false }),
    }),
    { name: "gymtrack-auth" }
  )
);
