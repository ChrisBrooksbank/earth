/**
 * Earth's orientation and the Sun's direction at a given date.
 *
 * Scene conventions (shared with orbital-mechanics.ts):
 * - Ecliptic (X, Y, Z) maps to scene (X, Z, -Y): the ecliptic is the XZ
 *   plane and ecliptic north is +y.
 * - Earth's own frame is laid out the same way in equatorial coordinates:
 *   the north pole is local +y and the prime meridian at the equator is
 *   local +x before spin (see lonLatToXYZ).
 *
 * The Earth group's rotation is Euler (tilt, spin, 0) in XYZ order: spin
 * about the pole first, then tilt the pole away from ecliptic north.
 */
import * as THREE from 'three';
import orbitalElementsData from '../data/orbital-elements.json';
import { keplerianToCartesian, type KeplerianElements } from './orbital-mechanics';
import { J2000_MS, secondsSinceJ2000, simClock } from './simClock';
import { xyzToLonLat } from './geo-utils';

/** Obliquity of the ecliptic (J2000), radians. */
export const OBLIQUITY = 23.4392911 * (Math.PI / 180);

/**
 * Tilt about the scene x-axis. Earth's north pole points toward ecliptic
 * longitude 90°, i.e. scene (0, cos ε, -sin ε), so the rotation is -ε.
 */
const EARTH_TILT_X = -OBLIQUITY;

const earthElements = (orbitalElementsData as (KeplerianElements & { name: string })[]).find(
  el => el.name === 'Earth'
)!;

/**
 * Earth Rotation Angle (radians, 0–2π): the angle of the prime meridian
 * east of the vernal equinox. Close to Greenwich sidereal time (within
 * about a minute of arc), which is ample for rendering.
 */
export function earthRotationAngle(ms: number = simClock.ms): number {
  const days = (ms - J2000_MS) / 86_400_000;
  const turns = 0.779057273264 + 1.0027378119113546 * days;
  return (turns - Math.floor(turns)) * 2 * Math.PI;
}

/** Unit vector from Earth toward the Sun, in scene coordinates. */
export function sunDirection(
  ms: number = simClock.ms,
  target = new THREE.Vector3()
): THREE.Vector3 {
  const [x, y, z] = keplerianToCartesian(earthElements, secondsSinceJ2000(ms));
  return target.set(-x, -y, -z).normalize();
}

const _euler = new THREE.Euler();
const _quat = new THREE.Quaternion();
const _vec = new THREE.Vector3();

/** Set an object's rotation to Earth's orientation at the given time. */
export function applyEarthOrientation(object: THREE.Object3D, ms: number = simClock.ms): void {
  object.rotation.set(EARTH_TILT_X, earthRotationAngle(ms), 0, 'XYZ');
}

/** Longitude and latitude (degrees) where the Sun is directly overhead. */
export function subsolarPoint(ms: number = simClock.ms): { lon: number; lat: number } {
  _euler.set(EARTH_TILT_X, earthRotationAngle(ms), 0, 'XYZ');
  _quat.setFromEuler(_euler).invert();
  sunDirection(ms, _vec).applyQuaternion(_quat);
  const [lon, lat] = xyzToLonLat(_vec.x, _vec.y, _vec.z);
  return { lon, lat };
}

const _sun = new THREE.Vector3();
const _towardMinusX = new THREE.Vector3(-1, 0, 0);
const _sunFrame = new THREE.Quaternion();

/**
 * Earth's real orientation re-expressed in a frame where sunlight arrives
 * from -x, as in the Earth-Moon-Sun teaching view. Keeps the true season
 * (which pole leans sunward) and time of day (which side is lit).
 */
export function earthQuaternionSunFromMinusX(
  ms: number = simClock.ms,
  target = new THREE.Quaternion()
): THREE.Quaternion {
  _euler.set(EARTH_TILT_X, earthRotationAngle(ms), 0, 'XYZ');
  // Both vectors lie in the ecliptic (XZ) plane, so this is a turn about +y
  _sunFrame.setFromUnitVectors(sunDirection(ms, _sun), _towardMinusX);
  return target.setFromEuler(_euler).premultiply(_sunFrame);
}

/**
 * A camera position looking at Earth's day side, offset so the day/night
 * boundary is in view: 40° around from the Sun and 20° above the ecliptic.
 */
export function earthDayViewPosition(
  distance: number,
  ms: number = simClock.ms
): [number, number, number] {
  const dir = sunDirection(ms, _sun)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), (40 * Math.PI) / 180)
    .setY(Math.tan((20 * Math.PI) / 180))
    .normalize()
    .multiplyScalar(distance);
  return [dir.x, dir.y, dir.z];
}
