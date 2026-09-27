import * as THREE from 'three';
import { useAppStore } from '../store/appStore';
import { earthQuaternion } from './earthOrientation';
import { lonLatToXYZ } from './geo-utils';

/**
 * Pause and move the camera (not the Earth) to look straight down on a point.
 * Leaving Earth's orientation alone keeps its spin axis and the day/night
 * boundary correct. Uses the orientation for the current simulated time
 * directly, since the globe object only catches up on the next frame (e.g.
 * after a time jump).
 */
export function flyToLonLat(lon: number, lat: number, distance: number): void {
  const { setIsPaused, setFlyTarget } = useAppStore.getState();
  setIsPaused(true);
  const direction = new THREE.Vector3(...lonLatToXYZ(lon, lat, 1))
    .applyQuaternion(earthQuaternion())
    .normalize();
  setFlyTarget({ position: direction.multiplyScalar(distance).toArray(), lookAt: [0, 0, 0] });
}
