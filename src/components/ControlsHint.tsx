import { useEffect, useState } from 'react';
import { GLASS_PANEL_STYLE } from '../styles/glass';

export default function ControlsHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        ...GLASS_PANEL_STYLE,
        position: 'absolute',
        bottom: '24px',
        left: '24px',
        padding: '10px 16px',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.7)',
        pointerEvents: 'none',
        opacity: visible ? 0.9 : 0,
        transition: 'opacity 1.5s ease-out',
        lineHeight: 1.6,
      }}
    >
      <div>Drag to rotate</div>
      <div>Scroll to zoom</div>
      <div>Search countries above</div>
    </div>
  );
}
