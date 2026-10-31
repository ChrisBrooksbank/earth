import { create } from 'zustand';
import type * as THREE from 'three';
import { moonPhase } from '../lib/simClock';

const isE2E = new URLSearchParams(window.location.search).has('e2e');

export type CameraMode = 'solarSystem' | 'planet' | 'earthMoonSun';

/** A pinned place on Earth, shown with sun times and country details. */
export interface LocationPin {
  lon: number;
  lat: number;
  /** Place name when chosen from search (e.g. a city); otherwise derived from the country */
  name?: string;
}

export interface FlyTarget {
  position: THREE.Vector3Tuple;
  lookAt: THREE.Vector3Tuple;
}

/** A pulse of light leaving the Sun toward a body, travelling at the true speed of light. */
export interface LightPulse {
  /** Simulated time (ms) when it left the Sun */
  startMs: number;
  /** Unit vector from the Sun toward the target, in scene coordinates */
  direction: [number, number, number];
  /** How far the pulse travels before it arrives, in AU */
  distanceAU: number;
  targetName: string;
}

interface AppStore {
  /** Simulated seconds per real second. */
  timeMultiplier: number;
  isPaused: boolean;
  /** 1 runs time forward, -1 runs it backward. */
  timeDirection: 1 | -1;
  toggleTimeDirection: () => void;
  setTimeDirection: (direction: 1 | -1) => void;
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

  /** Pinned place on the globe, or null. */
  pin: LocationPin | null;
  setPin: (pin: LocationPin | null) => void;

  /** Whether the live ISS position is shown on the globe. */
  showIss: boolean;
  setShowIss: (show: boolean) => void;

  /** 0–1 teaching-view Moon phase, where 0 is new and 0.5 is full. */
  earthMoonSunPhase: number;
  setEarthMoonSunPhase: (phase: number) => void;

  /** Target blend for the Solar System layout: 0 = museum (compressed), 1 = true scale. */
  scaleTarget: number;
  setScaleTarget: (target: number) => void;
  /** Whether the bodies are arranged in a row at true relative size. */
  lineup: boolean;
  setLineup: (on: boolean) => void;

  /** Whether the Earth-Moon-Sun view is drawn to true scale. */
  emsRealScale: boolean;
  setEmsRealScale: (on: boolean) => void;

  /** The light pulse currently crossing the solar system, if any. */
  lightPulse: LightPulse | null;
  setLightPulse: (pulse: LightPulse | null) => void;

  /** Guided tour (also the attract mode when the app is left alone). */
  tourActive: boolean;
  tourStep: number;
  startTour: (step?: number) => void;
  stopTour: () => void;
  setTourStep: (step: number) => void;
  /** Whether the camera should slowly orbit what it is looking at. */
  autoOrbit: boolean;
  setAutoOrbit: (on: boolean) => void;
}

export const useAppStore = create<AppStore>(set => ({
  // One simulated hour per second: Earth completes a rotation roughly every 24s.
  timeMultiplier: 3600,
  isPaused: isE2E,
  timeDirection: 1,
  toggleTimeDirection: () => set(state => ({ timeDirection: state.timeDirection === 1 ? -1 : 1 })),
  setTimeDirection: (direction: 1 | -1) => set({ timeDirection: direction }),
  setTimeMultiplier: (multiplier: number) => set({ timeMultiplier: multiplier }),
  setIsPaused: (paused: boolean) => set({ isPaused: paused }),
  togglePause: () => set(state => ({ isPaused: !state.isPaused })),

  cameraMode: 'planet',
  selectedBody: 'Earth',
  flyTarget: null,
  setCameraMode: (mode: CameraMode) => set({ cameraMode: mode }),
  setSelectedBody: (body: string | null) => set({ selectedBody: body }),
  setFlyTarget: (target: FlyTarget | null) => set({ flyTarget: target }),
  enterPlanetView: (body: string) =>
    set({ cameraMode: 'planet', selectedBody: body, lineup: false, lightPulse: null }),
  exitToSolarSystem: () => set({ cameraMode: 'solarSystem', selectedBody: null }),
  enterEarthMoonSunView: () =>
    set({ cameraMode: 'earthMoonSun', selectedBody: null, lineup: false, lightPulse: null }),

  pendingFlyToBody: null,
  setPendingFlyToBody: (body: string | null) => set({ pendingFlyToBody: body }),

  cameraDistance: 2.8,
  setCameraDistance: (d: number) => set({ cameraDistance: d }),

  selectedCountry: null,
  setSelectedCountry: (name: string | null) => set({ selectedCountry: name }),

  pin: null,
  setPin: (pin: LocationPin | null) => set({ pin }),

  showIss: false,
  setShowIss: (show: boolean) => set({ showIss: show }),

  earthMoonSunPhase: moonPhase(),
  setEarthMoonSunPhase: (phase: number) => set({ earthMoonSunPhase: phase }),

  scaleTarget: 0,
  setScaleTarget: (target: number) =>
    set({ scaleTarget: Math.min(1, Math.max(0, target)), lineup: false }),
  lineup: false,
  setLineup: (on: boolean) => set(on ? { lineup: true, scaleTarget: 0 } : { lineup: false }),

  emsRealScale: false,
  setEmsRealScale: (on: boolean) => set({ emsRealScale: on }),

  lightPulse: null,
  setLightPulse: (pulse: LightPulse | null) => set({ lightPulse: pulse }),

  tourActive: false,
  tourStep: 0,
  startTour: (step = 0) => set({ tourActive: true, tourStep: step }),
  stopTour: () => set({ tourActive: false, autoOrbit: false }),
  setTourStep: (step: number) => set({ tourStep: step }),
  autoOrbit: false,
  setAutoOrbit: (on: boolean) => set({ autoOrbit: on }),
}));
