import { create } from 'zustand';

export type CameraMode = 'solarSystem' | 'planet';

interface AppStore {
  timeMultiplier: number;
  isPaused: boolean;
  setTimeMultiplier: (multiplier: number) => void;
  setIsPaused: (paused: boolean) => void;
  togglePause: () => void;

  cameraMode: CameraMode;
  selectedBody: string | null;
  setCameraMode: (mode: CameraMode) => void;
  setSelectedBody: (body: string | null) => void;
  enterPlanetView: (body: string) => void;
  exitToSolarSystem: () => void;
}

export const useAppStore = create<AppStore>(set => ({
  timeMultiplier: 1,
  isPaused: false,
  setTimeMultiplier: (multiplier: number) => set({ timeMultiplier: multiplier }),
  setIsPaused: (paused: boolean) => set({ isPaused: paused }),
  togglePause: () => set(state => ({ isPaused: !state.isPaused })),

  cameraMode: 'solarSystem',
  selectedBody: null,
  setCameraMode: (mode: CameraMode) => set({ cameraMode: mode }),
  setSelectedBody: (body: string | null) => set({ selectedBody: body }),
  enterPlanetView: (body: string) => set({ cameraMode: 'planet', selectedBody: body }),
  exitToSolarSystem: () => set({ cameraMode: 'solarSystem', selectedBody: null }),
}));
