import { useEffect, useState } from 'react';
import { simClock } from '../lib/simClock';

/** The simulated time in ms, refreshed a few times per second for HUD display. */
export function useSimTime(intervalMs = 250): number {
  const [ms, setMs] = useState(() => simClock.ms);
  useEffect(() => {
    const id = window.setInterval(() => setMs(simClock.ms), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return ms;
}
