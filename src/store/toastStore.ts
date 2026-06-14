import { create } from "zustand";

interface ToastState {
  message: string | null;
  show: (m: string) => void;
}
let timer: number | undefined;
export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (m) => {
    set({ message: m });
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => set({ message: null }), 2200);
  },
}));
