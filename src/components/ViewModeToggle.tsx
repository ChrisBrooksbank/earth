import type React from 'react';
import { useAppStore } from '../store/appStore';
import { GLASS_PANEL_STYLE } from '../styles/glass';

export default function ViewModeToggle() {
  const cameraMode = useAppStore(s => s.cameraMode);
  const exitToSolarSystem = useAppStore(s => s.exitToSolarSystem);
  const setPendingFlyToBody = useAppStore(s => s.setPendingFlyToBody);
  const selectedBody = useAppStore(s => s.selectedBody);

  function handleSolarSystem() {
    exitToSolarSystem();
  }

  function handlePlanet() {
    if (selectedBody) {
      setPendingFlyToBody(selectedBody);
    }
  }

  const btnBase: React.CSSProperties = {
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'inherit',
    padding: '6px 14px',
    borderRadius: '4px',
    transition: 'background 0.15s, color 0.15s',
  };

  const activeBtn: React.CSSProperties = {
    ...btnBase,
    background: 'rgba(255,255,255,0.25)',
    color: '#fff',
  };

  const inactiveBtn: React.CSSProperties = {
    ...btnBase,
    background: 'transparent',
    color: 'rgba(255,255,255,0.55)',
  };

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
      <button
        style={cameraMode === 'solarSystem' ? activeBtn : inactiveBtn}
        onClick={handleSolarSystem}
      >
        Solar System
      </button>
      <button
        style={cameraMode === 'planet' ? activeBtn : inactiveBtn}
        onClick={handlePlanet}
        disabled={cameraMode === 'planet' || selectedBody == null}
      >
        Planet View
      </button>
    </div>
  );
}
