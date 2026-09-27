import type * as THREE from 'three';
import { PLANETS } from '../data/planets';
import { displayRadius } from './scale';

/**
 * Scene objects for each body rendered in the solar system, keyed by name.
 * Lets the camera follow a body as it orbits. Entries are removed on unmount.
 */
export const bodyObjects = new Map<string, THREE.Object3D>();

/** Display radius (scene units) of a body in the solar system scene. */
export function bodyDisplayRadius(name: string): number | null {
  const planet = PLANETS.find(p => p.name === name);
  return planet ? displayRadius(planet.radiusKm) : null;
}
