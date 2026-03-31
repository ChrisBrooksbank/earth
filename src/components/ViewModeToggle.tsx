import type React from 'react';
import { useAppStore } from '../store/appStore';
import { GLASS_PANEL_STYLE } from '../styles/glass';
import { SOLAR_SYSTEM_OVERVIEW, PLANET_VIEW_POSITION } from './CameraController';

export default function ViewModeToggle() {
  const cameraMode = useAppStore(s => s.cameraMode);
  const exitToSolarSystem = useAppStore(s => s.exitToSolarSystem);
  const enterPlanetView = useAppStore(s => s.enterPlanetView);
  const setFlyTarget = useAppStore(s => s.setFlyTarget);

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
      position: PLANET_VIEW_POSITION,
      lookAt: [0, 0, 0],
    });
  }

  return (
    <div
      style={{
        ...GLASS_PANEL_STYLE,
        position: 'absolute',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px',
        userSelect: 'none',
      }}
    >
      {cameraMode === 'planet' ? (
        <button style={btnStyle} onClick={handleExplore}>
          Explore Solar System
        </button>
      ) : (
        <button style={btnStyle} onClick={handleReturn}>
          Return to Earth
        </button>
      )}
    </div>
  );
}
