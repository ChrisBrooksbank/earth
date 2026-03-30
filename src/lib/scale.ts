/**
 * Museum Model scaling utilities.
 *
 * Compresses the vast range of real solar-system sizes and distances into a
 * range that keeps every body visible on screen simultaneously.
 *
 * Radius formula:  displayRadius = BASE_RADIUS * (r / EARTH_RADIUS_KM) ^ 0.4
 * Distance formula: displayDist  = DIST_SCALE  * log10(1 + au * AU_STRETCH)
 */

/** Earth radius in km – reference point for radius scaling */
const EARTH_RADIUS_KM = 6371.0;

/** Display radius of Earth in Three.js world units */
const BASE_RADIUS = 1.0;

/** Overall distance scale factor (world units per log-unit) */
const DIST_SCALE = 20;

/** Stretches AU values before taking log so inner planets spread out more */
const AU_STRETCH = 5;

/** Jupiter's real radius in km (used for Sun cap) */
const JUPITER_RADIUS_KM = 69911.0;

/**
 * Convert a real body radius (km) to a display radius in world units.
 * Uses a power-law compression so small bodies remain visible next to giants.
 */
export function displayRadius(realRadiusKm: number): number {
  return BASE_RADIUS * Math.pow(realRadiusKm / EARTH_RADIUS_KM, 0.4);
}

/**
 * Convert a real distance in AU to a display distance in world units.
 * Uses log-scale so Neptune isn't 30× further than Earth on screen.
 */
export function displayDistance(realAU: number): number {
  return DIST_SCALE * Math.log10(1 + realAU * AU_STRETCH);
}

/**
 * Display radius of the Sun, capped at 3× the display size of Jupiter.
 * The Sun would otherwise dwarf all planets even after power-law compression.
 */
export const SUN_DISPLAY_RADIUS: number = Math.min(
  displayRadius(696000),
  3 * displayRadius(JUPITER_RADIUS_KM)
);
