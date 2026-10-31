import { useProgress } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { GLASS_PANEL_STYLE } from '../styles/glass';
import { isMobile } from '../lib/isMobile';
import { parseShareParams } from '../lib/shareLink';
import { TOUR_STEPS } from './tourSteps';

const params = new URLSearchParams(window.location.search);
/** Tests and shared links open at a fixed view, so the tour must not take over. */
const AUTO_START = !params.has('e2e') && !parseShareParams(window.location.search);

/** Time after loading finishes before the attract mode starts, so the first frames can settle. */
const START_DELAY_MS = 800;
/** Start anyway if loading is somehow still going after this long. */
const START_FALLBACK_MS = 9000;
/** How long the app must be left alone before the tour starts again. */
const IDLE_RESTART_MS = 90_000;

const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock']);

const TOUR_BUTTON: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.25)',
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
  borderRadius: '4px',
  padding: '6px 12px',
  fontSize: '12px',
  fontFamily: 'inherit',
  cursor: 'pointer',
};

/**
 * Runs the guided tour: steps through TOUR_STEPS on a timer, shows a caption,
 * stops the moment the visitor touches anything, and starts again (as an attract
 * mode) on load and after the app has been left alone for a while.
 */
export default function TourController() {
  const active = useAppStore(s => s.tourActive);
  const step = useAppStore(s => s.tourStep);
  // Captions can describe the live scene, so each is worked out as its stop begins
  const caption = useMemo(() => (active ? (TOUR_STEPS[step]?.text() ?? '') : ''), [active, step]);
  const lastInput = useRef(0);

  useEffect(() => {
    lastInput.current = Date.now();
  }, []);

  // Start once the scene has loaded, unless the visitor got there first
  const { active: loading, progress } = useProgress();
  const started = useRef(false);
  const interacted = useRef(false);
  const loaded = !loading && progress >= 100;
  useEffect(() => {
    if (!AUTO_START) return;
    const begin = () => {
      if (started.current || interacted.current) return;
      started.current = true;
      useAppStore.getState().startTour(0);
    };
    const id = window.setTimeout(begin, loaded ? START_DELAY_MS : START_FALLBACK_MS);
    return () => window.clearTimeout(id);
  }, [loaded]);

  // Any use of the app by a person ends the tour and resets the idle timer
  useEffect(() => {
    function onInput(e: Event) {
      lastInput.current = Date.now();
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('[data-tour-ui]')) return;
      if (e instanceof KeyboardEvent && MODIFIER_KEYS.has(e.key)) return;
      interacted.current = true;
      if (useAppStore.getState().tourActive) useAppStore.getState().stopTour();
    }
    const events = ['pointerdown', 'wheel', 'keydown', 'touchstart'] as const;
    for (const name of events) window.addEventListener(name, onInput, { capture: true });
    const onMove = () => {
      lastInput.current = Date.now();
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      for (const name of events) window.removeEventListener(name, onInput, { capture: true });
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  // Come back to the tour when nobody has used the app for a while
  useEffect(() => {
    if (!AUTO_START) return;
    const id = window.setInterval(() => {
      const state = useAppStore.getState();
      const typing = document.activeElement?.matches('input, textarea, select');
      if (
        !state.tourActive &&
        !typing &&
        document.visibilityState === 'visible' &&
        Date.now() - lastInput.current > IDLE_RESTART_MS
      ) {
        state.startTour(0);
      }
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  // Play the current step, then move on to the next (looping back to the start)
  useEffect(() => {
    if (!active) return;
    const current = TOUR_STEPS[step];
    if (!current) return;
    current.enter();
    useAppStore.getState().setAutoOrbit(current.orbit);
    const id = window.setTimeout(() => {
      useAppStore.getState().setTourStep((step + 1) % TOUR_STEPS.length);
    }, current.seconds * 1000);
    return () => window.clearTimeout(id);
  }, [active, step]);

  if (!active) return null;
  const current = TOUR_STEPS[step];
  if (!current) return null;

  function go(delta: number) {
    const next = (step + delta + TOUR_STEPS.length) % TOUR_STEPS.length;
    useAppStore.getState().setTourStep(next);
  }

  return (
    <div
      data-tour-ui
      role="region"
      aria-label="Guided tour"
      style={{
        ...GLASS_PANEL_STYLE,
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        // Clear of the time controls along the bottom
        bottom: isMobile ? '150px' : '96px',
        width: isMobile ? 'calc(100vw - 32px)' : 'min(560px, calc(100vw - 720px))',
        minWidth: isMobile ? undefined : '380px',
        padding: '14px 18px 12px',
        lineHeight: 1.5,
        overflow: 'hidden',
        zIndex: 5,
      }}
    >
      <div
        style={{
          fontSize: '11px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        Tour · {step + 1} of {TOUR_STEPS.length}
      </div>
      <div style={{ fontSize: '17px', fontWeight: 600, margin: '2px 0 4px' }}>{current.title}</div>
      <div
        aria-live="polite"
        style={{ fontSize: '13px', color: 'rgba(255,255,255,0.82)', minHeight: '3em' }}
      >
        {caption}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
        <button style={TOUR_BUTTON} onClick={() => go(-1)} aria-label="Previous stop">
          ◀
        </button>
        <button style={TOUR_BUTTON} onClick={() => go(1)} aria-label="Next stop">
          ▶
        </button>
        <span style={{ flex: 1 }} />
        <button
          style={{ ...TOUR_BUTTON, background: 'rgba(100,170,255,0.35)' }}
          onClick={() => useAppStore.getState().stopTour()}
        >
          Take control
        </button>
      </div>
      {/* Progress through this stop; restarting the animation per step */}
      <div
        key={step}
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          height: '2px',
          background: 'rgba(120,180,255,0.9)',
          animation: `tour-progress ${current.seconds}s linear forwards`,
        }}
      />
    </div>
  );
}
