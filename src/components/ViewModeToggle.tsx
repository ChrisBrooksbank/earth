import type React from 'react';
import { useAppStore } from '../store/appStore';
import { GLASS_PANEL_STYLE } from '../styles/glass';
import {
  EARTH_MOON_SUN_VIEW,
  EARTH_VIEW_DISTANCE,
  SOLAR_SYSTEM_OVERVIEW,
} from './CameraController';
import { isMobile } from '../lib/isMobile';
import { simClock } from '../lib/simClock';
import ShareButton from './ShareButton';
import { earthDayViewPosition } from '../lib/earthOrientation';

export default function ViewModeToggle() {
  const cameraMode = useAppStore(s => s.cameraMode);
  const selectedBody = useAppStore(s => s.selectedBody);
  const exitToSolarSystem = useAppStore(s => s.exitToSolarSystem);
  const enterPlanetView = useAppStore(s => s.enterPlanetView);
  const enterEarthMoonSunView = useAppStore(s => s.enterEarthMoonSunView);
  const setFlyTarget = useAppStore(s => s.setFlyTarget);
  const showIss = useAppStore(s => s.showIss);

  const btnStyle: React.CSSProperties = {
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'inherit',
    padding: '8px 18px',
    borderRadius: '4px',
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    transition: 'background 0.15s',
  };

  function handleExplore() {
    exitToSolarSystem();
    setFlyTarget({
      position: SOLAR_SYSTEM_OVERVIEW.position,
      lookAt: SOLAR_SYSTEM_OVERVIEW.lookAt,
    });
  }

  function handleReturn() {
    enterPlanetView('Earth');
    setFlyTarget({
      position: earthDayViewPosition(EARTH_VIEW_DISTANCE),
      lookAt: [0, 0, 0],
    });
  }

  function handleToggleIss() {
    const state = useAppStore.getState();
    if (!showIss) {
      // The ISS feed is live, so jump to the present and run in real time
      simClock.ms = Date.now();
      state.setTimeMultiplier(1);
      state.setIsPaused(false);
    }
    state.setShowIss(!showIss);
  }

  function handleTeachingView() {
    enterEarthMoonSunView();
    setFlyTarget({
      position: EARTH_MOON_SUN_VIEW.position,
      lookAt: EARTH_MOON_SUN_VIEW.lookAt,
    });
  }

  const isEarthView = cameraMode === 'planet' && selectedBody === 'Earth';
  const isOtherPlanetView = cameraMode === 'planet' && selectedBody !== 'Earth';
  const isTeachingView = cameraMode === 'earthMoonSun';

  return (
    <nav
      aria-label="Views"
      style={{
        ...GLASS_PANEL_STYLE,
        position: 'absolute',
        top: '24px',
        left: isMobile ? 'auto' : '50%',
        right: isMobile ? '24px' : 'auto',
        transform: isMobile ? 'none' : 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: 'calc(100vw - 48px)',
        gap: '4px',
        padding: '4px',
        userSelect: 'none',
      }}
    >
      {isEarthView ? (
        <>
          <button style={btnStyle} onClick={handleExplore}>
            Explore Solar System
          </button>
          <button style={btnStyle} onClick={handleTeachingView}>
            Earth-Moon-Sun
          </button>
          <button
            style={{
              ...btnStyle,
              background: showIss ? 'rgba(255,213,74,0.35)' : btnStyle.background,
            }}
            onClick={handleToggleIss}
            aria-pressed={showIss}
            title="Show the International Space Station's live position (switches to real time)"
          >
            ISS
          </button>
        </>
      ) : isTeachingView ? (
        <>
          <button style={btnStyle} onClick={handleExplore}>
            Solar System
          </button>
          <button style={btnStyle} onClick={handleReturn}>
            Return to Earth
          </button>
        </>
      ) : isOtherPlanetView ? (
        <>
          <button style={btnStyle} onClick={handleExplore}>
            Solar System
          </button>
          <button style={btnStyle} onClick={handleReturn}>
            Return to Earth
          </button>
        </>
      ) : (
        <>
          <button style={btnStyle} onClick={handleTeachingView}>
            Earth-Moon-Sun
          </button>
          <button style={btnStyle} onClick={handleReturn}>
            Return to Earth
          </button>
        </>
      )}
      <ShareButton style={btnStyle} />
    </nav>
  );
}
