import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useCameraTransition } from '../hooks/useCameraTransition';
import { useAppStore } from '../store/appStore';

export const PLANET_VIEW_POSITION: [number, number, number] = [0, 0, 2.8];

export const SOLAR_SYSTEM_OVERVIEW = {
  position: [0, 30, 80] as [number, number, number],
  lookAt: [0, 0, 0] as [number, number, number],
};

export default function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { transitionTo, lookAtTarget, isTransitioning } = useCameraTransition();
  const flyTarget = useAppStore(s => s.flyTarget);
  const prevFlyTarget = useRef<typeof flyTarget>(null);
  const { cameraMode, exitToSolarSystem, setFlyTarget } = useAppStore();
  const lastReportedDistance = useRef(2.8);

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

    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }

    transitionTo({
      position: flyTarget.position,
      target: flyTarget.lookAt,
    });

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

  // Track camera distance, throttled to avoid excessive state updates
  useFrame(({ camera }) => {
    const dist = camera.position.length();
    if (Math.abs(dist - lastReportedDistance.current) > 0.1) {
      lastReportedDistance.current = dist;
      useAppStore.getState().setCameraDistance(dist);
    }
  });

  const isPlanetMode = cameraMode === 'planet';

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      zoomSpeed={0.8}
      minDistance={isPlanetMode ? 0.5 : 5}
      maxDistance={isPlanetMode ? 8 : 500}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI - 0.1}
    />
  );
}
