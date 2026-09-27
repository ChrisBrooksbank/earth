/**
 * Orbital mechanics utilities.
 *
 * Solves Kepler's equation via Newton-Raphson and converts 6 Keplerian
 * elements into a 3-D Cartesian position (in AU).
 */

export interface KeplerianElements {
  /** Semi-major axis in AU */
  a: number;
  /** Eccentricity (0 = circular) */
  e: number;
  /** Inclination in radians */
  i: number;
  /** Longitude of ascending node (Ω) in radians */
  omega: number;
  /** Argument of perihelion (ω) in radians */
  w: number;
  /** Mean anomaly at epoch (M0) in radians */
  M0: number;
  /** Mean motion in radians per second */
  n: number;
}

/**
 * Solve Kepler's equation  M = E - e·sin(E)  for eccentric anomaly E
 * using Newton-Raphson iteration.
 *
 * @param M  Mean anomaly (radians)
 * @param e  Eccentricity
 * @returns  Eccentric anomaly E (radians)
 */
export function solveKepler(M: number, e: number): number {
  // Normalise M to [-π, π]
  const TWO_PI = 2 * Math.PI;
  let Mn = M % TWO_PI;
  if (Mn > Math.PI) Mn -= TWO_PI;
  if (Mn < -Math.PI) Mn += TWO_PI;

  // Initial guess
  let E = e > 0.8 ? Math.PI : Mn;

  for (let iter = 0; iter < 50; iter++) {
    const dE = (Mn - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-10) break;
  }

  return E;
}

/**
 * Rotate a point from an orbit's perifocal frame (x toward perihelion, in the
 * orbital plane) into scene space, via the heliocentric ecliptic frame.
 *
 * Ecliptic (X, Y, Z) maps to scene (X, Z, -Y): the ecliptic becomes the XZ
 * plane and ecliptic north becomes +y. Negating Y keeps the frame
 * right-handed, so orbits run counter-clockwise when viewed from above,
 * as they do seen from the north ecliptic pole.
 */
export function perifocalToScene(
  xOrb: number,
  yOrb: number,
  { i, omega, w }: Pick<KeplerianElements, 'i' | 'omega' | 'w'>
): [number, number, number] {
  // Standard rotation: Rz(Ω) · Rx(i) · Rz(ω)
  const cosO = Math.cos(omega);
  const sinO = Math.sin(omega);
  const cosW = Math.cos(w);
  const sinW = Math.sin(w);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);

  const X = (cosO * cosW - sinO * sinW * cosI) * xOrb + (-cosO * sinW - sinO * cosW * cosI) * yOrb;
  const Y = (sinO * cosW + cosO * sinW * cosI) * xOrb + (-sinO * sinW + cosO * cosW * cosI) * yOrb;
  const Z = sinI * sinW * xOrb + sinI * cosW * yOrb;

  return [X, Z, -Y];
}

/**
 * Compute 3-D heliocentric Cartesian position (AU) from Keplerian elements
 * at time t (seconds since epoch).
 *
 * Coordinates are in scene space (see perifocalToScene): the ecliptic is the
 * XZ plane and ecliptic north is +y.
 */
export function keplerianToCartesian(
  elements: KeplerianElements,
  t: number
): [number, number, number] {
  const { a, e, M0, n } = elements;

  // Mean anomaly at time t
  const M = M0 + n * t;

  // Eccentric anomaly
  const E = solveKepler(M, e);

  // True anomaly ν
  const sinE = Math.sin(E);
  const cosE = Math.cos(E);
  const nu = Math.atan2(Math.sqrt(1 - e * e) * sinE, cosE - e);

  // Distance from focus
  const r = a * (1 - e * cosE);

  // Position in orbital plane (perifocal frame)
  const xOrb = r * Math.cos(nu);
  const yOrb = r * Math.sin(nu);

  return perifocalToScene(xOrb, yOrb, elements);
}

/**
 * Compute mean motion n = 2π / T where T is the orbital period.
 * T in seconds from semi-major axis a in AU via Kepler's third law:
 *   T = 365.25 * a^1.5  days  (for solar system bodies)
 */
export function meanMotion(semiMajorAxisAU: number): number {
  const periodDays = 365.25 * Math.pow(semiMajorAxisAU, 1.5);
  return (2 * Math.PI) / (periodDays * 86400);
}
