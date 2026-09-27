/**
 * Museum Model radius scaling.
 *
 * Compresses the vast range of real body sizes so small bodies remain visible
 * next to giants: displayRadius = BASE_RADIUS * (r / EARTH_RADIUS_KM) ^ 0.4
 */
import { EARTH_RADIUS_KM } from '../data/planets';

/** Display radius of Earth in Three.js world units */
const BASE_RADIUS = 1.0;

/** Convert a real body radius (km) to a display radius in world units. */
export function displayRadius(realRadiusKm: number): number {
  return BASE_RADIUS * Math.pow(realRadiusKm / EARTH_RADIUS_KM, 0.4);
}
