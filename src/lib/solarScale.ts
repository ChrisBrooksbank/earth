/**
 * Scale maths for the Solar System view.
 *
 * Three layouts share the same scene objects and are blended between:
 * - Museum: log-compressed distances and shrunk radii, so everything stays visible
 * - True: real proportions between sizes and distances (1 AU = TRUE_UNITS_PER_AU)
 * - Lineup: bodies in a row at true relative size, to compare them side by side
 *
 * Positions keep their direction from the Sun in every layout; only the
 * distance and the radius change, so a blend is just a log-space interpolation.
 */
import { EARTH_RADIUS_KM, PLANETS } from '../data/planets';
import { displayRadius } from './scale';

/** Museum distance constants: displayDist = K * log10(1 + au * STRETCH) */
export const K = 15;
export const STRETCH = 3;

export const KM_PER_AU = 149_597_870.7;
/** Scene units per AU when drawn to true scale. */
export const TRUE_UNITS_PER_AU = 600;

const SUN_RADIUS_KM = 695_700;
/** Sun radius in the museum layout, a little larger than Jupiter's display radius. */
const SUN_MUSEUM_RADIUS = 2.9;

const MOON_RADIUS_KM = 1737.4;
/** Moon's distance from Earth in the museum layout, in scene units. */
const MOON_MUSEUM_OFFSET = displayRadius(MOON_RADIUS_KM) * 4;

/** Earth radius in the size lineup, in scene units. */
const LINEUP_EARTH_RADIUS = 1;
const LINEUP_GAP = 0.9;

/** Interpolate between two positive numbers in log space (a geometric blend). */
export function logMix(a: number, b: number, t: number): number {
  if (a <= 0 || b <= 0) return a + (b - a) * t;
  return Math.exp(Math.log(a) * (1 - t) + Math.log(b) * t);
}

/** Smoothly eases 0..1 (zero slope at both ends). */
export function smoothstep01(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

export function museumDistance(au: number): number {
  return K * Math.log10(1 + au * STRETCH);
}

function trueDistance(au: number): number {
  return au * TRUE_UNITS_PER_AU;
}

function trueRadius(km: number): number {
  return (km / KM_PER_AU) * TRUE_UNITS_PER_AU;
}

/** Heliocentric distance in scene units, blended from museum (t=0) to true (t=1). */
export function blendedDistance(au: number, t: number): number {
  if (au <= 0) return 0;
  return logMix(museumDistance(au), trueDistance(au), t);
}

/** Body radius in scene units, blended from museum (t=0) to true (t=1). */
export function blendedRadius(km: number, t: number): number {
  return logMix(displayRadius(km), trueRadius(km), t);
}

export function sunRadius(t: number): number {
  return logMix(SUN_MUSEUM_RADIUS, trueRadius(SUN_RADIUS_KM), t);
}

/**
 * The Moon's distance from Earth in scene units. `au` is its current geocentric
 * distance and `semiMajorAu` its mean, so the orbit's slight ellipse is kept.
 */
export function moonDistance(au: number, semiMajorAu: number, t: number): number {
  return logMix(MOON_MUSEUM_OFFSET * (au / semiMajorAu), trueDistance(au), t);
}

interface LineupSlot {
  /** Position along the row (x), centred on 0 */
  x: number;
  radius: number;
  /** Half the width the body takes up in the row, which is wider than its radius for ringed planets */
  extent: number;
}

/** Outer ring radius as a multiple of the planet's radius (matches the rings drawn in the scene). */
const RING_EXTENT = { saturn: 2.4, uranus: 2.0 };

function buildLineup(): Map<string, LineupSlot> {
  const radii = PLANETS.map(p => (p.radiusKm / EARTH_RADIUS_KM) * LINEUP_EARTH_RADIUS);
  const extents = PLANETS.map((p, i) => radii[i]! * (p.rings ? RING_EXTENT[p.rings] : 1));
  const total = extents.reduce((sum, e) => sum + 2 * e, 0) + LINEUP_GAP * (PLANETS.length - 1);
  const slots = new Map<string, LineupSlot>();
  let cursor = -total / 2;
  PLANETS.forEach((planet, i) => {
    const extent = extents[i]!;
    slots.set(planet.name, { x: cursor + extent, radius: radii[i]!, extent });
    cursor += 2 * extent + LINEUP_GAP;
  });
  return slots;
}

const LINEUP = buildLineup();

/** Where a body sits in the size lineup, or undefined for unknown names. */
export function lineupSlot(name: string): LineupSlot | undefined {
  return LINEUP.get(name);
}

/** Half the lineup's width, for framing the camera. */
export function lineupHalfWidth(): number {
  let max = 0;
  for (const slot of LINEUP.values()) max = Math.max(max, Math.abs(slot.x) + slot.extent);
  return max;
}

/**
 * Live blend state, advanced each frame by the scene. `t` runs from the museum
 * layout (0) to true scale (1); `lineup` from orbits (0) to the size lineup (1).
 * Plain mutable object because it changes every frame (like simClock).
 */
export const scaleState = { t: 0, lineup: 0 };

/** Move a value toward its target with exponential smoothing, snapping when close. */
export function chase(current: number, target: number, dt: number, rate: number): number {
  const next = current + (target - current) * (1 - Math.exp(-rate * dt));
  return Math.abs(next - target) < 0.0005 ? target : next;
}

/** Advance the blend state toward its targets. */
export function stepScaleState(dt: number, scaleTarget: number, lineup: boolean): void {
  scaleState.t = chase(scaleState.t, scaleTarget, dt, 2.2);
  scaleState.lineup = chase(scaleState.lineup, lineup ? 1 : 0, dt, 2.6);
}

/** Current radius (scene units) of a solar-system body, honouring the live blend. */
export function currentBodyRadius(name: string): number | null {
  const slot = LINEUP.get(name);
  const planet = PLANETS.find(p => p.name === name);
  if (!planet || !slot) return null;
  return logMix(
    blendedRadius(planet.radiusKm, scaleState.t),
    slot.radius,
    smoothstep01(scaleState.lineup)
  );
}
