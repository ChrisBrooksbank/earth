import { create } from 'zustand';
import type * as THREE from 'three';

const isE2E = new URLSearchParams(window.location.search).has('e2e');

export type CameraMode = 'solarSystem' | 'planet' | 'earthMoonSun';

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
  enterEarthMoonSunView: () => void;

  /** Body name requested to fly to from UI (e.g. BodySelector). Cleared by SolarSystem after processing. */
  pendingFlyToBody: string | null;
  setPendingFlyToBody: (body: string | null) => void;

  /** Current camera distance from origin, updated by CameraController. */
  cameraDistance: number;
  setCameraDistance: (d: number) => void;

  /** Country selected via search, highlighted on the globe. */
  selectedCountry: string | null;
  setSelectedCountry: (name: string | null) => void;

  /** 0–1 teaching-view Moon phase, where 0 is new and 0.5 is full. */
  earthMoonSunPhase: number;
  setEarthMoonSunPhase: (phase: number) => void;
}

export const useAppStore = create<AppStore>(set => ({
  timeMultiplier: 1,
  isPaused: isE2E,
  setTimeMultiplier: (multiplier: number) => set({ timeMultiplier: multiplier }),
  setIsPaused: (paused: boolean) => set({ isPaused: paused }),
  togglePause: () => set(state => ({ isPaused: !state.isPaused })),

  cameraMode: 'planet',
  selectedBody: 'Earth',
  flyTarget: null,
  setCameraMode: (mode: CameraMode) => set({ cameraMode: mode }),
  setSelectedBody: (body: string | null) => set({ selectedBody: body }),
  setFlyTarget: (target: FlyTarget | null) => set({ flyTarget: target }),
  enterPlanetView: (body: string) => set({ cameraMode: 'planet', selectedBody: body }),
  exitToSolarSystem: () => set({ cameraMode: 'solarSystem', selectedBody: null }),
  enterEarthMoonSunView: () => set({ cameraMode: 'earthMoonSun', selectedBody: null }),

  pendingFlyToBody: null,
  setPendingFlyToBody: (body: string | null) => set({ pendingFlyToBody: body }),

  cameraDistance: 2.8,
  setCameraDistance: (d: number) => set({ cameraDistance: d }),

  selectedCountry: null,
  setSelectedCountry: (name: string | null) => set({ selectedCountry: name }),

  earthMoonSunPhase: 0.14,
  setEarthMoonSunPhase: (phase: number) => set({ earthMoonSunPhase: phase }),
}));
