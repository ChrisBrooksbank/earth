import { create } from 'zustand';

interface AppStore {
  timeMultiplier: number;
  isPaused: boolean;
  setTimeMultiplier: (multiplier: number) => void;
  setIsPaused: (paused: boolean) => void;
  togglePause: () => void;
}

export const useAppStore = create<AppStore>(set => ({
  timeMultiplier: 1,
  isPaused: false,
  setTimeMultiplier: (multiplier: number) => set({ timeMultiplier: multiplier }),
  setIsPaused: (paused: boolean) => set({ isPaused: paused }),
  togglePause: () => set(state => ({ isPaused: !state.isPaused })),
}));
