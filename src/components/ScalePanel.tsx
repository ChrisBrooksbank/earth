import { useState } from 'react';
import { PLANETS } from '../data/planets';
import { HALLEY } from '../data/comet';
import { useAppStore } from '../store/appStore';
import { GLASS_PANEL_STYLE } from '../styles/glass';
import { isMobile } from '../lib/isMobile';
import { simClock } from '../lib/simClock';
import { formatLightTime } from '../lib/lightTime';
import { heliocentricAU, sunDistanceAU } from '../lib/bodyPositions';
import { useSimTime } from '../hooks/useSimTime';
import { solarSystemOverview } from './CameraController';

type Layout = 'museum' | 'true' | 'lineup';

const LAYOUTS: { id: Layout; label: string }[] = [
  { id: 'museum', label: 'Museum' },
  { id: 'true', label: 'True scale' },
  { id: 'lineup', label: 'Size lineup' },
];

const NOTES: Record<Layout, string> = {
  museum:
    'Not to scale. Orbit shapes and positions are real, but distances are log-compressed and sizes shrunk toward Earth’s so every body stays visible.',
  true: 'True scale. The Sun is 109 Earths wide and Earth is 23,500 Earth-radii from it, so planets shrink to dots (each glows so you can still find it). Zoom in to meet them.',
  lineup:
    'Planets at true relative size, but not true distance. Jupiter is 11 Earths wide; the Sun, 109, is too big to fit.',
};

const BUTTON: React.CSSProperties = {
  flex: 1,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.1)',
  color: '#fff',
  borderRadius: '4px',
  padding: '6px 4px',
  fontSize: '12px',
  fontFamily: 'inherit',
  cursor: 'pointer',
};

/** Bodies light can be sent to: the planets, plus the comet. */
const DESTINATIONS = [...PLANETS.filter(p => !p.parent).map(p => p.name), HALLEY.name];

/** Switches between the museum, true-scale and size-lineup layouts, and shows light travel times. */
export default function ScalePanel() {
  const cameraMode = useAppStore(s => s.cameraMode);
  const scaleTarget = useAppStore(s => s.scaleTarget);
  const lineup = useAppStore(s => s.lineup);
  const pulse = useAppStore(s => s.lightPulse);
  const [destination, setDestination] = useState('Earth');
  const simMs = useSimTime();

  if (cameraMode !== 'solarSystem') return null;

  const layout: Layout = lineup ? 'lineup' : scaleTarget > 0.5 ? 'true' : 'museum';
  const distanceAU = sunDistanceAU(destination, simMs) ?? 0;

  function chooseLayout(next: Layout) {
    const state = useAppStore.getState();
    state.setLightPulse(null);
    if (next === 'lineup') state.setLineup(true);
    else state.setScaleTarget(next === 'true' ? 1 : 0);
    state.setFlyTarget(solarSystemOverview(next));
  }

  function sendLight() {
    const position = heliocentricAU(destination);
    if (!position) return;
    const distance = Math.hypot(...position);
    const state = useAppStore.getState();
    state.setLightPulse({
      startMs: simClock.ms,
      direction: [position[0] / distance, position[1] / distance, position[2] / distance],
      distanceAU: distance,
      targetName: destination,
    });
    // The pulse moves with the simulation clock
    state.setTimeDirection(1);
    state.setIsPaused(false);
  }

  return (
    <div
      data-tour-ui
      role="region"
      aria-label="Scale"
      style={{
        ...GLASS_PANEL_STYLE,
        position: 'absolute',
        right: '24px',
        bottom: isMobile ? '96px' : '24px',
        width: isMobile ? 'calc(100vw - 48px)' : '300px',
        maxHeight: isMobile ? '38vh' : 'calc(100vh - 120px)',
        overflowY: 'auto',
        padding: '14px',
        fontSize: '12px',
        lineHeight: 1.5,
        color: 'rgba(255,255,255,0.75)',
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
        Scale
      </div>
      <div role="group" aria-label="Layout" style={{ display: 'flex', gap: '6px' }}>
        {LAYOUTS.map(({ id, label }) => (
          <button
            key={id}
            aria-pressed={layout === id}
            onClick={() => chooseLayout(id)}
            style={{
              ...BUTTON,
              background: layout === id ? 'rgba(100,170,255,0.4)' : BUTTON.background,
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {layout !== 'lineup' && (
        <label style={{ display: 'block', marginTop: '10px' }}>
          <span style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Squeezed</span>
            <span>True</span>
          </span>
          <input
            type="range"
            aria-label="Blend between museum and true scale"
            min={0}
            max={1}
            step={0.01}
            value={scaleTarget}
            onChange={e => useAppStore.getState().setScaleTarget(Number(e.target.value))}
            onPointerUp={() => useAppStore.getState().setFlyTarget(solarSystemOverview())}
            onKeyUp={() => useAppStore.getState().setFlyTarget(solarSystemOverview())}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </label>
      )}
      <div style={{ marginTop: '8px' }}>{NOTES[layout]}</div>

      {layout !== 'lineup' && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <div style={{ color: '#fff', fontWeight: 600, marginBottom: '6px' }}>Speed of light</div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <select
              aria-label="Send light to"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '4px',
                padding: '5px',
                fontSize: '12px',
                colorScheme: 'dark',
              }}
            >
              {DESTINATIONS.map(name => (
                <option key={name} value={name}>
                  {name === HALLEY.name ? 'Halley’s Comet' : name}
                </option>
              ))}
            </select>
            <button style={{ ...BUTTON, flex: 'none', padding: '6px 10px' }} onClick={sendLight}>
              Send light
            </button>
          </div>
          <div style={{ marginTop: '6px' }}>
            Light takes{' '}
            <strong style={{ color: '#ffe9a0' }} data-testid="light-time">
              {formatLightTime(distanceAU)}
            </strong>{' '}
            to travel from the Sun to {destination === HALLEY.name ? 'Halley’s Comet' : destination}{' '}
            right now ({distanceAU.toFixed(2)} AU).
          </div>
          {pulse && (
            <div style={{ marginTop: '4px', opacity: 0.8 }}>
              The pulse moves at the true speed of light in simulated time. Set the speed to “Real
              time” to watch the real trip.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
