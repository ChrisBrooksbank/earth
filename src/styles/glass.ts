import type React from 'react';

/** Shared glassmorphism panel style — dark, blurred, with subtle border. */
export const GLASS_PANEL_STYLE: React.CSSProperties = {
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  borderRadius: '8px',
  color: '#fff',
  fontFamily: 'sans-serif',
};
