import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useCameraTransition } from '../hooks/useCameraTransition';
import { useAppStore } from '../store/appStore';
import { bodyDisplayRadius, bodyObjects } from '../lib/sceneBodies';

/** Camera distance from Earth's centre when viewing the globe. */
export const EARTH_VIEW_DISTANCE = 2.8;

export const SOLAR_SYSTEM_OVERVIEW = {
  position: [0, 30, 80] as [number, number, number],
  lookAt: [0, 0, 0] as [number, number, number],
};

export const EARTH_MOON_SUN_VIEW = {
  position: [0, 6, 12] as [number, number, number],
  lookAt: [0, 0, 0] as [number, number, number],
};

const _bodyPos = new THREE.Vector3();
const _offset = new THREE.Vector3();

/** Name of the solar-system body the camera should track, if any. */
function followedBody(cameraMode: string, selectedBody: string | null): string | null {
  // Earth's detailed globe sits still at the origin; other bodies orbit the Sun
  return cameraMode === 'planet' && selectedBody && selectedBody !== 'Earth' ? selectedBody : null;
}

export default function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { transitionTo, shiftTransition, lookAtTarget, isTransitioning } = useCameraTransition();
  const flyTarget = useAppStore(s => s.flyTarget);
  const prevFlyTarget = useRef<typeof flyTarget>(null);
  const { cameraMode, selectedBody, exitToSolarSystem, setFlyTarget } = useAppStore();
  const lastReportedDistance = useRef(2.8);
  const follow = useRef({ name: null as string | null, last: new THREE.Vector3() });

  // Escape key: return to solar system overview
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Leave Escape to form fields (e.g. closing the date picker or search)
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select')) return;
      if (e.key === 'Escape' && cameraMode !== 'solarSystem') {
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

  useFrame(({ camera }) => {
    // Follow the selected body along its orbit by translating camera and target together.
    // Mounted after <SolarSystem /> so body positions are already updated this frame.
    const state = useAppStore.getState();
    const name = followedBody(state.cameraMode, state.selectedBody);
    const object = name ? bodyObjects.get(name) : undefined;
    if (!name || !object) {
      follow.current.name = null;
    } else {
      object.getWorldPosition(_bodyPos);
      if (follow.current.name !== name) {
        follow.current.name = name;
        follow.current.last.copy(_bodyPos);
      } else {
        _offset.subVectors(_bodyPos, follow.current.last);
        follow.current.last.copy(_bodyPos);
        if (_offset.lengthSq() > 0) {
          camera.position.add(_offset);
          controlsRef.current?.target.add(_offset);
          if (isTransitioning.current) shiftTransition(_offset);
        }
      }
    }

    // Track camera distance, throttled to avoid excessive state updates
    const dist = camera.position.length();
    if (Math.abs(dist - lastReportedDistance.current) > 0.1) {
      lastReportedDistance.current = dist;
      useAppStore.getState().setCameraDistance(dist);
    }
  });

  const isPlanetMode = cameraMode === 'planet';
  const isTeachingMode = cameraMode === 'earthMoonSun';
  const followRadius = bodyDisplayRadius(followedBody(cameraMode, selectedBody) ?? '');

  // Zoom limits scale with the body being viewed so large planets aren't clipped
  const [minDistance, maxDistance] = followRadius
    ? [followRadius * 1.3, followRadius * 20]
    : isPlanetMode
      ? [1.15, 8]
      : isTeachingMode
        ? [8, 42]
        : [5, 500];

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      zoomSpeed={0.8}
      minDistance={minDistance}
      maxDistance={maxDistance}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI - 0.1}
    />
  );
}
