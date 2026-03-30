import { create } from 'zustand';
import type * as THREE from 'three';

export type CameraMode = 'solarSystem' | 'planet';

export interface FlyTarget {
  position: THREE.Vector3Tuple;
  lookAt: THREE.Vector3Tuple;
}

interface AppStore {
  timeMultiplier: number;
  isPaused: boolean;
  setTimeMultiplier: (multiplier: number) => void;
  setIsPaused: (paused: boolean) => void;
  togglePause: () => void;

  cameraMode: CameraMode;
  selectedBody: string | null;
  flyTarget: FlyTarget | null;
  setCameraMode: (mode: CameraMode) => void;
  setSelectedBody: (body: string | null) => void;
  setFlyTarget: (target: FlyTarget | null) => void;
  enterPlanetView: (body: string) => void;
  exitToSolarSystem: () => void;

  /** Body name requested to fly to from UI (e.g. BodySelector). Cleared by SolarSystem after processing. */
  pendingFlyToBody: string | null;
  setPendingFlyToBody: (body: string | null) => void;
}

export const useAppStore = create<AppStore>(set => ({
  timeMultiplier: 1,
  isPaused: false,
  setTimeMultiplier: (multiplier: number) => set({ timeMultiplier: multiplier }),
  setIsPaused: (paused: boolean) => set({ isPaused: paused }),
  togglePause: () => set(state => ({ isPaused: !state.isPaused })),

  cameraMode: 'solarSystem',
  selectedBody: null,
  flyTarget: null,
  setCameraMode: (mode: CameraMode) => set({ cameraMode: mode }),
  setSelectedBody: (body: string | null) => set({ selectedBody: body }),
  setFlyTarget: (target: FlyTarget | null) => set({ flyTarget: target }),
  enterPlanetView: (body: string) => set({ cameraMode: 'planet', selectedBody: body }),
  exitToSolarSystem: () => set({ cameraMode: 'solarSystem', selectedBody: null }),

  pendingFlyToBody: null,
  setPendingFlyToBody: (body: string | null) => set({ pendingFlyToBody: body }),
}));
