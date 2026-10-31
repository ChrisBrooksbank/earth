/**
 * Where the Moon's orbit crosses the ecliptic, and when eclipses can happen.
 *
 * The Moon's orbit is tilted about 5.1° to Earth's, so at most new and full
 * Moons it passes above or below the Sun-Earth line. Eclipses need a new or
 * full Moon close to one of the two crossing points (nodes), which creep
 * westward and complete a circuit every 18.6 years.
 */
import { J2000_MS, REFERENCE_NEW_MOON_MS, SYNODIC_MONTH_DAYS } from './simClock';

const DEG = Math.PI / 180;
const DAY_MS = 86_400_000;

/** Tilt of the Moon's orbit to the ecliptic. */
export const MOON_ORBIT_TILT = 5.145 * DEG;

/** Mean ecliptic longitude of the Sun in degrees, from the mean-element formula. */
function sunLongitudeDeg(ms: number): number {
  return 280.46 + 0.9856474 * ((ms - J2000_MS) / DAY_MS);
}

/** Ecliptic longitude of the Moon's ascending node in degrees. */
function nodeLongitudeDeg(ms: number): number {
  return 125.045 - 0.0529539 * ((ms - J2000_MS) / DAY_MS);
}

/**
 * Angle in the teaching view's Sun-fixed frame (where sunlight arrives from -x
 * and angles grow like the Moon's) to the Moon's ascending node, in radians.
 */
export function moonNodeFrameAngle(ms: number): number {
  return (nodeLongitudeDeg(ms) - sunLongitudeDeg(ms) + 180) * DEG;
}

/**
 * How far the Sun is from the nearest node, in degrees (-90 to 90). Small values
 * mean "eclipse season": a new or full Moon then lines up with the Sun and Earth.
 */
export function sunNodeOffsetDeg(ms: number): number {
  const diff = nodeLongitudeDeg(ms) - sunLongitudeDeg(ms);
  return ((((diff + 90) % 180) + 180) % 180) - 90;
}

export interface EclipseEvent {
  kind: 'solar' | 'lunar';
  ms: number;
}

/** Largest Sun-node offset at which a (partial or better) eclipse can occur. */
const SOLAR_LIMIT_DEG = 15.4;
const LUNAR_LIMIT_DEG = 12.2;

const HALF_SYNODIC_MS = (SYNODIC_MONTH_DAYS * DAY_MS) / 2;

/**
 * The first eclipse after the given time, found from the mean new and full
 * Moons, optionally only of one kind. Dates are good to within a day or two, enough to land in eclipse
 * season, not a published eclipse table.
 */
export function nextEclipse(afterMs: number, only?: EclipseEvent['kind']): EclipseEvent {
  let k = Math.ceil((afterMs - REFERENCE_NEW_MOON_MS) / HALF_SYNODIC_MS);
  for (let guard = 0; guard < 400; guard++, k++) {
    const ms = REFERENCE_NEW_MOON_MS + k * HALF_SYNODIC_MS;
    const solar = ((k % 2) + 2) % 2 === 0;
    if (only && only !== (solar ? 'solar' : 'lunar')) continue;
    const limit = solar ? SOLAR_LIMIT_DEG : LUNAR_LIMIT_DEG;
    if (Math.abs(sunNodeOffsetDeg(ms)) < limit) return { kind: solar ? 'solar' : 'lunar', ms };
  }
  throw new Error('No eclipse found');
}
