/**
 * Sun times for a place on Earth, derived from the subsolar point so they
 * agree exactly with the day/night shading on the globe.
 */
import { subsolarPoint } from './earthOrientation';

const HOUR_MS = 3_600_000;

/** The Sun's centre is 0.833° below the horizon at sunrise and sunset (refraction + disc). */
const SUNRISE_ALTITUDE = (-0.833 * Math.PI) / 180;

/** Wrap an angle in degrees to (-180, 180]. */
function wrap180(deg: number): number {
  const d = ((deg % 360) + 360) % 360;
  return d > 180 ? d - 360 : d;
}

/** Local apparent solar time in hours (0–24) at a longitude. */
export function localSolarTime(lon: number, ms: number): number {
  const hours = 12 + wrap180(lon - subsolarPoint(ms).lon) / 15;
  return ((hours % 24) + 24) % 24;
}

/** Time of the solar noon nearest to `ms` at a longitude (the Sun due south/north). */
export function solarNoon(lon: number, ms: number): number {
  let t = ms;
  // The subsolar point moves west ~15°/h; two refinements give sub-second accuracy
  for (let i = 0; i < 3; i++) {
    t += (wrap180(subsolarPoint(t).lon - lon) / 15) * HOUR_MS;
  }
  return t;
}

type SunTimes =
  | { kind: 'normal'; noon: number; sunrise: number; sunset: number }
  | { kind: 'polarDay' | 'polarNight'; noon: number };

/** Sunrise, solar noon and sunset around the solar noon nearest to `ms`. */
export function sunTimes(lon: number, lat: number, ms: number): SunTimes {
  const noon = solarNoon(lon, ms);
  const declination = (subsolarPoint(noon).lat * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  const cosH =
    (Math.sin(SUNRISE_ALTITUDE) - Math.sin(phi) * Math.sin(declination)) /
    (Math.cos(phi) * Math.cos(declination));
  if (cosH < -1) return { kind: 'polarDay', noon };
  if (cosH > 1) return { kind: 'polarNight', noon };
  const halfDayMs = ((Math.acos(cosH) * 180) / Math.PI / 15) * HOUR_MS;
  return { kind: 'normal', noon, sunrise: noon - halfDayMs, sunset: noon + halfDayMs };
}
