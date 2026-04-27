import { useCallback, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const TRANSITION_SPEED = 4.5;
const POSITION_EPSILON = 0.02;
const TARGET_EPSILON = 0.02;

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
  const targetPosition = useRef(camera.position.clone());
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  const transitionTo = useCallback(({ position, target }: CameraTarget) => {
    targetPosition.current.fromArray(position);
    targetLookAt.current.fromArray(target);
    isTransitioning.current = true;
  }, []);

  useFrame((_, delta) => {
    if (!isTransitioning.current) return;

    const alpha = 1 - Math.exp(-TRANSITION_SPEED * delta);
    camera.position.lerp(targetPosition.current, alpha);
    lookAtTarget.current.lerp(targetLookAt.current, alpha);
    camera.lookAt(lookAtTarget.current);

    if (
      camera.position.distanceTo(targetPosition.current) < POSITION_EPSILON &&
      lookAtTarget.current.distanceTo(targetLookAt.current) < TARGET_EPSILON
    ) {
      camera.position.copy(targetPosition.current);
      lookAtTarget.current.copy(targetLookAt.current);
      camera.lookAt(lookAtTarget.current);
      isTransitioning.current = false;
    }
  });

  return { transitionTo, lookAtTarget, isTransitioning };
}
