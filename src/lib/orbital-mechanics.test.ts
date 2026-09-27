import { describe, expect, it } from 'vitest';
import orbitalElementsData from '../data/orbital-elements.json';
import {
  keplerianToCartesian,
  meanMotion,
  solveKepler,
  type KeplerianElements,
} from './orbital-mechanics';
import { secondsSinceJ2000 } from './simClock';

const elements = new Map(
  (orbitalElementsData as (KeplerianElements & { name: string })[]).map(el => [el.name, el])
);
const earth = elements.get('Earth')!;

/** Heliocentric ecliptic longitude (degrees, 0–360) of a scene-space position. */
function eclipticLongitudeDeg([x, , z]: [number, number, number]): number {
  // Scene space: ecliptic X → x, ecliptic Y → -z, ecliptic Z (north) → y
  const deg = (Math.atan2(-z, x) * 180) / Math.PI;
  return (deg + 360) % 360;
}

function angleDiffDeg(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180);
}

describe('solveKepler', () => {
  it.each([0, 0.0167, 0.2056, 0.5, 0.9])('satisfies M = E - e·sin(E) for e = %s', e => {
    for (const M of [-3, -1, 0, 0.5, 2, 3.1]) {
      const E = solveKepler(M, e);
      const residual = E - e * Math.sin(E) - M;
      // Compare modulo 2π because the solver normalises M
      const wrapped = Math.atan2(Math.sin(residual), Math.cos(residual));
      expect(Math.abs(wrapped)).toBeLessThan(1e-9);
    }
  });
});

describe('keplerianToCartesian', () => {
  it('keeps a circular orbit at constant radius', () => {
    const circular: KeplerianElements = { a: 2, e: 0, i: 0.3, omega: 1, w: 0.5, M0: 0, n: 1 };
    for (const t of [0, 1, 2.5, 4]) {
      const [x, y, z] = keplerianToCartesian(circular, t);
      expect(Math.hypot(x, y, z)).toBeCloseTo(2, 10);
    }
  });

  it('keeps zero-inclination orbits in the ecliptic (y = 0) plane', () => {
    const flat: KeplerianElements = { a: 1, e: 0.1, i: 0, omega: 0.4, w: 1.2, M0: 0, n: 1 };
    expect(keplerianToCartesian(flat, 0.7)[1]).toBeCloseTo(0, 12);
  });

  it('returns to the same point after one orbital period', () => {
    const period = (2 * Math.PI) / earth.n;
    const start = keplerianToCartesian(earth, 1234);
    const later = keplerianToCartesian(earth, 1234 + period);
    start.forEach((v, idx) => expect(later[idx]).toBeCloseTo(v, 8));
  });

  it('keeps Earth between perihelion and aphelion distances', () => {
    for (let day = 0; day < 365; day += 30) {
      const r = Math.hypot(...keplerianToCartesian(earth, day * 86400));
      expect(r).toBeGreaterThan(0.983 - 1e-3);
      expect(r).toBeLessThan(1.017 + 1e-3);
    }
  });

  it('places Earth correctly at the 2024 equinox and solstice', () => {
    // At the March equinox the Sun is at geocentric longitude 0°, so Earth is at 180°;
    // at the June solstice the Sun is at 90°, so Earth is at 270°.
    const equinox = keplerianToCartesian(earth, secondsSinceJ2000(Date.UTC(2024, 2, 20, 3, 6)));
    const solstice = keplerianToCartesian(earth, secondsSinceJ2000(Date.UTC(2024, 5, 20, 20, 51)));
    expect(angleDiffDeg(eclipticLongitudeDeg(equinox), 180)).toBeLessThan(1);
    expect(angleDiffDeg(eclipticLongitudeDeg(solstice), 270)).toBeLessThan(1);
  });

  it('moves planets counter-clockwise when viewed from above (+y)', () => {
    for (const name of ['Mercury', 'Earth', 'Mars', 'Jupiter']) {
      const el = elements.get(name)!;
      const [x1, , z1] = keplerianToCartesian(el, 0);
      const [x2, , z2] = keplerianToCartesian(el, 86400 * 5);
      // Viewed from +y, counter-clockwise motion has a positive cross product in (x, -z)
      const cross = x1 * -z2 - -z1 * x2;
      expect(cross, name).toBeGreaterThan(0);
    }
  });
});

describe('meanMotion', () => {
  it("matches Earth's tabulated mean motion", () => {
    expect(meanMotion(1)).toBeCloseTo(earth.n, 9);
  });

  it('follows Kepler’s third law', () => {
    expect(meanMotion(4) / meanMotion(1)).toBeCloseTo(1 / 8, 10);
  });
});
