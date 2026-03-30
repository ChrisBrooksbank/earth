import { useCallback, useRef } from 'react';
import { useSpring } from '@react-spring/three';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Spring config tuned for ~1.5s ease-out camera transitions.
 * tension: lower = slower settle; friction: higher = less bounce.
 */
const SPRING_CONFIG = { tension: 120, friction: 40 };

export interface CameraTarget {
  position: THREE.Vector3Tuple;
  target: THREE.Vector3Tuple;
}

/**
 * Spring-animate camera position + look-at target over ~1.5s with ease-out.
 *
 * Usage:
 *   const { transitionTo, lookAtTarget, isTransitioning } = useCameraTransition();
 *   transitionTo({ position: [10, 5, 10], target: [0, 0, 0] });
 *
 * `lookAtTarget` is a ref updated every frame with the animated look-at point.
 * Pass it to OrbitControls.target to keep controls in sync during transitions.
 */
export function useCameraTransition() {
  const { camera } = useThree();
  const lookAtTarget = useRef(new THREE.Vector3(0, 0, 0));
  const isTransitioning = useRef(false);

  const [springs, api] = useSpring(() => ({
    camPos: camera.position.toArray() as THREE.Vector3Tuple,
    camTarget: [0, 0, 0] as THREE.Vector3Tuple,
    config: SPRING_CONFIG,
  }));

  const transitionTo = useCallback(
    ({ position, target }: CameraTarget) => {
      isTransitioning.current = true;
      api.start({
        camPos: position,
        camTarget: target,
        onRest: () => {
          isTransitioning.current = false;
        },
      });
    },
    [api]
  );

  useFrame(() => {
    const pos = springs.camPos.get();
    const tgt = springs.camTarget.get();
    camera.position.set(pos[0], pos[1], pos[2]);
    lookAtTarget.current.set(tgt[0], tgt[1], tgt[2]);
  });

  return { transitionTo, lookAtTarget, isTransitioning };
}
