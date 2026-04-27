import { useProgress } from '@react-three/drei';
import { useEffect, useState } from 'react';

const MAX_VISIBLE_MS = 12000;
const isE2E = new URLSearchParams(window.location.search).has('e2e');

export default function LoadingScreen() {
  const { progress, active } = useProgress();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!active) return;

    const timeout = window.setTimeout(() => setTimedOut(true), MAX_VISIBLE_MS);
    return () => window.clearTimeout(timeout);
  }, [active]);

  if (isE2E || !active || timedOut) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        zIndex: 100,
        color: '#fff',
        fontFamily: 'sans-serif',
        gap: '16px',
      }}
    >
      <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em' }}>
        LOADING
      </div>
      <div
        style={{
          width: '240px',
          height: '4px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'rgba(100,180,255,0.9)',
            borderRadius: '2px',
            transition: 'width 0.2s ease',
          }}
        />
      </div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
        {Math.round(progress)}%
      </div>
    </div>
  );
}
