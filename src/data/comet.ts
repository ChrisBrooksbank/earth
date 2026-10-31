import type { KeplerianElements } from '../lib/orbital-mechanics';
import { meanMotion } from '../lib/orbital-mechanics';

const DEG = Math.PI / 180;
const A = 17.834;
/** Days from the 1986-02-09 perihelion to J2000 */
const DAYS_PERIHELION_TO_J2000 = 5073.5;

/**
 * Halley's Comet: a retrograde, highly eccentric orbit (e = 0.967) that swings
 * from inside Venus's orbit out beyond Neptune every 75 years.
 */
export const HALLEY = {
  name: 'Halley',
  color: '#9fd8ff',
  radiusKm: 5.5,
  elements: {
    a: A,
    e: 0.96714,
    i: 162.262 * DEG,
    omega: 58.42 * DEG,
    w: 111.33 * DEG,
    M0: 2 * Math.PI * (DAYS_PERIHELION_TO_J2000 / (365.25 * Math.pow(A, 1.5))),
    n: meanMotion(A),
  } satisfies KeplerianElements,
  mass: '2.2 × 10¹⁴ kg',
  orbitalPeriodDays: 365.25 * Math.pow(A, 1.5),
  funFacts: [
    'Visible from Earth every 75–76 years; its next visit is in 2061',
    'Its orbit runs backwards compared with the planets',
    'Its tail always points away from the Sun, even as the comet flies away from it',
  ],
};
