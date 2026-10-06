import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from './appStore';

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('appStore', () => {
  it('starts on the Earth globe at one simulated hour per second', () => {
    const state = useAppStore.getState();
    expect(state.cameraMode).toBe('planet');
    expect(state.selectedBody).toBe('Earth');
    expect(state.timeMultiplier).toBe(3600);
    expect(state.isPaused).toBe(false);
  });

  it('starts the teaching view at a valid Moon phase', () => {
    const phase = useAppStore.getState().earthMoonSunPhase;
    expect(phase).toBeGreaterThanOrEqual(0);
    expect(phase).toBeLessThan(1);
  });

  it('sets the time direction explicitly', () => {
    const { toggleTimeDirection, setTimeDirection } = useAppStore.getState();
    toggleTimeDirection();
    expect(useAppStore.getState().timeDirection).toBe(-1);
    setTimeDirection(1);
    expect(useAppStore.getState().timeDirection).toBe(1);
  });

  it('switches between views', () => {
    const { enterPlanetView, exitToSolarSystem, enterEarthMoonSunView } = useAppStore.getState();

    enterPlanetView('Mars');
    expect(useAppStore.getState()).toMatchObject({ cameraMode: 'planet', selectedBody: 'Mars' });

    exitToSolarSystem();
    expect(useAppStore.getState()).toMatchObject({ cameraMode: 'solarSystem', selectedBody: null });

    enterEarthMoonSunView();
    expect(useAppStore.getState()).toMatchObject({
      cameraMode: 'earthMoonSun',
      selectedBody: null,
    });
  });

  it('toggles pause', () => {
    const { togglePause } = useAppStore.getState();
    togglePause();
    expect(useAppStore.getState().isPaused).toBe(true);
    togglePause();
    expect(useAppStore.getState().isPaused).toBe(false);
  });

  it('records a pending fly-to request until cleared', () => {
    const { setPendingFlyToBody } = useAppStore.getState();
    setPendingFlyToBody('Jupiter');
    expect(useAppStore.getState().pendingFlyToBody).toBe('Jupiter');
    setPendingFlyToBody(null);
    expect(useAppStore.getState().pendingFlyToBody).toBeNull();
  });
});
