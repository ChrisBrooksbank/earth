import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { EARTH_RADIUS_KM, PLANETS } from '../data/planets';
import { GLASS_PANEL_STYLE } from '../styles/glass';

const EARTH_VIEW_POSITION: [number, number, number] = [0, 0, 2.8];

function displayRadius(radiusKm: number): number {
  return Math.pow(radiusKm / EARTH_RADIUS_KM, 0.4);
}

function getPlanetColor(name: string): string {
  return PLANETS.find(p => p.name === name)?.orbitColor ?? '#ffffff';
}

export default function BodySelector() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedBody = useAppStore(s => s.selectedBody);
  const enterPlanetView = useAppStore(s => s.enterPlanetView);
  const setFlyTarget = useAppStore(s => s.setFlyTarget);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const currentLabel = selectedBody ?? 'Select body';

  function handleSelect(name: string) {
    setOpen(false);

    if (name === selectedBody) return;

    const body = PLANETS.find(planet => planet.name === name);
    if (!body) return;

    enterPlanetView(name);
    setFlyTarget({
      position: name === 'Earth' ? EARTH_VIEW_POSITION : [0, 0, displayRadius(body.radiusKm) * 6],
      lookAt: [0, 0, 0],
    });
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: '24px',
        left: '24px',
        zIndex: 10,
        userSelect: 'none',
      }}
    >
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          ...GLASS_PANEL_STYLE,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          border: GLASS_PANEL_STYLE.border,
          cursor: 'pointer',
          fontSize: '13px',
          fontFamily: 'inherit',
          minWidth: '140px',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: getPlanetColor(currentLabel),
              flexShrink: 0,
            }}
          />
          {currentLabel}
        </span>
        <span
          style={{
            fontSize: '10px',
            opacity: 0.6,
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
          }}
        >
          ▼
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            ...GLASS_PANEL_STYLE,
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            minWidth: '140px',
            padding: '4px 0',
            maxHeight: 'calc(100vh - 96px)',
            overflowY: 'auto',
          }}
        >
          {PLANETS.map(planet => {
            const isSelected = selectedBody === planet.name;
            return (
              <button
                key={planet.name}
                onClick={() => handleSelect(planet.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 16px',
                  background: isSelected ? 'rgba(255,255,255,0.15)' : 'transparent',
                  border: 'none',
                  color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: planet.orbitColor,
                    flexShrink: 0,
                  }}
                />
                {planet.name}
                {planet.parent && (
                  <span style={{ fontSize: '10px', opacity: 0.4, marginLeft: 'auto' }}>moon</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
