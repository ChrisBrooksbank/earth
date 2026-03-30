import { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useCameraTransition } from '../hooks/useCameraTransition';
import { useAppStore } from '../store/appStore';

/** Solar system overview camera position and look-at target. */
const SOLAR_SYSTEM_OVERVIEW = {
  position: [0, 30, 80] as [number, number, number],
  lookAt: [0, 0, 0] as [number, number, number],
};

/**
 * Manages camera transitions and OrbitControls.
 * Must be placed inside the R3F Canvas.
 *
 * - Watches flyTarget in the store; when set, springs the camera to that position.
 * - Disables OrbitControls during the transition to avoid fighting the spring.
 * - Re-enables OrbitControls once the transition settles.
 * - Listens for Escape key to return to Solar System overview.
 */
export default function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { transitionTo, lookAtTarget, isTransitioning } = useCameraTransition();
  const flyTarget = useAppStore(s => s.flyTarget);
  const prevFlyTarget = useRef<typeof flyTarget>(null);
  const { cameraMode, exitToSolarSystem, setFlyTarget } = useAppStore();

  // Escape key: return to solar system overview
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && cameraMode === 'planet') {
        exitToSolarSystem();
        setFlyTarget({
          position: SOLAR_SYSTEM_OVERVIEW.position,
          lookAt: SOLAR_SYSTEM_OVERVIEW.lookAt,
        });
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cameraMode, exitToSolarSystem, setFlyTarget]);

  useEffect(() => {
    if (!flyTarget || flyTarget === prevFlyTarget.current) return;
    prevFlyTarget.current = flyTarget;

    // Disable OrbitControls during transition so they don't fight the spring
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }

    transitionTo({
      position: flyTarget.position,
      target: flyTarget.lookAt,
    });

    // Poll until the spring settles, then re-enable OrbitControls
    const interval = setInterval(() => {
      if (!isTransitioning.current) {
        clearInterval(interval);
        if (controlsRef.current) {
          controlsRef.current.target.copy(lookAtTarget.current);
          controlsRef.current.enabled = true;
          controlsRef.current.update();
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [flyTarget, transitionTo, isTransitioning, lookAtTarget]);

  return <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.05} />;
}
