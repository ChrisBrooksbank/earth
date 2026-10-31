import type * as THREE from 'three';
import { currentBodyRadius, scaleState } from './solarScale';

/**
 * Scene objects for each body rendered in the solar system, keyed by name.
 * Lets the camera follow a body as it orbits. Entries are removed on unmount.
 */
export const bodyObjects = new Map<string, THREE.Object3D>();

/** Comet nucleus size is not shown to scale; this is how big its glow is, per layout. */
const HALLEY_MUSEUM_RADIUS = 0.35;
const HALLEY_TRUE_RADIUS = 0.01;

/** Current display radius (scene units) of a body, following the live scale blend. */
export function bodyDisplayRadius(name: string): number | null {
  if (name === 'Halley') {
    return HALLEY_MUSEUM_RADIUS + (HALLEY_TRUE_RADIUS - HALLEY_MUSEUM_RADIUS) * scaleState.t;
  }
  return currentBodyRadius(name);
}
