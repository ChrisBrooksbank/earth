/**
 * Orbital elements and heliocentric positions for the bodies in the scene,
 * shared by the scene, the light-time readout and the light pulse.
 */
import orbitalElementsData from '../data/orbital-elements.json';
import { HALLEY } from '../data/comet';
import { keplerianToCartesian, type KeplerianElements } from './orbital-mechanics';
import { secondsSinceJ2000, simClock } from './simClock';

type NamedElements = KeplerianElements & { name: string };

const elementsMap = new Map<string, KeplerianElements>(
  (orbitalElementsData as NamedElements[]).map(el => [el.name, el])
);
elementsMap.set(HALLEY.name, HALLEY.elements);

export function getElements(name: string): KeplerianElements | undefined {
  return elementsMap.get(name);
}

type Vec3 = [number, number, number];

/** Position of a body in AU, relative to the Sun (the Moon is relative to Earth). */
function orbitalPositionAU(name: string, ms: number = simClock.ms): Vec3 | null {
  const elements = elementsMap.get(name);
  return elements ? keplerianToCartesian(elements, secondsSinceJ2000(ms)) : null;
}

/** Position of a body in AU relative to the Sun, including the Moon's offset from Earth. */
export function heliocentricAU(name: string, ms: number = simClock.ms): Vec3 | null {
  const own = orbitalPositionAU(name, ms);
  if (!own) return null;
  if (name !== 'Moon') return own;
  const earth = orbitalPositionAU('Earth', ms)!;
  return [earth[0] + own[0], earth[1] + own[1], earth[2] + own[2]];
}

/** Distance of a body from the Sun in AU. */
export function sunDistanceAU(name: string, ms: number = simClock.ms): number | null {
  const p = heliocentricAU(name, ms);
  return p ? Math.hypot(p[0], p[1], p[2]) : null;
}
