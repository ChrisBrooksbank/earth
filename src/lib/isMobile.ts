/**
 * Mobile device detection: narrow screens or touch-primary devices.
 * Computed once at module load — does not change during the session.
 */
export const isMobile: boolean =
  window.innerWidth < 768 || ('ontouchstart' in window && navigator.maxTouchPoints > 1);
