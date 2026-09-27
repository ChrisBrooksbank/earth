/**
 * Shared simulation clock.
 *
 * All animated bodies derive their state from this single date so that Earth's
 * spin, planetary orbits and Moon phases stay consistent with each other.
 * `timeMultiplier` in the store is "simulated seconds per real second".
 *
 * The clock is a plain mutable object (not React state) because it changes
 * every frame; it is advanced by <SimulationClock /> inside the Canvas.
 */

/** J2000.0 epoch (2000-01-01 12:00 TT ≈ UTC), the epoch of orbital-elements.json. */
export const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);

/** Fixed start date for e2e runs so screenshots are deterministic. */
const E2E_START_MS = Date.UTC(2024, 2, 20, 12, 0, 0);

const isE2E =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('e2e');

export const simClock = { ms: isE2E ? E2E_START_MS : Date.now() };

/** Mean synodic month (new Moon to new Moon) in days. */
const SYNODIC_MONTH_DAYS = 29.530588853;

/** Reference new Moon: 2000-01-06 18:14 UTC. */
const REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

/** Seconds elapsed since the J2000 epoch at the given simulated time. */
export function secondsSinceJ2000(ms: number = simClock.ms): number {
  return (ms - J2000_MS) / 1000;
}

/** Mean Moon phase in [0, 1): 0 = new, 0.5 = full. */
export function moonPhase(ms: number = simClock.ms): number {
  const cycles = (ms - REFERENCE_NEW_MOON_MS) / (SYNODIC_MONTH_DAYS * 86400 * 1000);
  return cycles - Math.floor(cycles);
}

/** Advance the clock by a real-time delta (seconds) scaled by the multiplier. */
export function advanceSimClock(realDeltaS: number, multiplier: number): void {
  simClock.ms += realDeltaS * multiplier * 1000;
}

/** Human-readable simulation rate, e.g. "Real time", "1 hr/s", "2.5 days/s". */
export function formatRate(multiplier: number): string {
  if (multiplier <= 1) return 'Real time';
  const units: [number, string, string][] = [
    [365.25 * 86400, 'yr', 'yr'],
    [86400, 'day', 'days'],
    [3600, 'hr', 'hr'],
    [60, 'min', 'min'],
    [1, 's', 's'],
  ];
  for (const [size, singular, plural] of units) {
    if (multiplier >= size) {
      const value = multiplier / size;
      const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
      return `${rounded} ${rounded === 1 ? singular : plural}/s`;
    }
  }
  return `${multiplier}×`;
}
