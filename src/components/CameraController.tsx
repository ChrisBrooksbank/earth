import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useCameraTransition } from '../hooks/useCameraTransition';
import { useAppStore } from '../store/appStore';
import { bodyDisplayRadius, bodyObjects } from '../lib/sceneBodies';
import { lineupHalfWidth, logMix, scaleState } from '../lib/solarScale';

/** Camera distance from Earth's centre when viewing the globe. */
export const EARTH_VIEW_DISTANCE = 2.8;

type View = { position: [number, number, number]; lookAt: [number, number, number] };

const MUSEUM_OVERVIEW: View = { position: [0, 30, 80], lookAt: [0, 0, 0] };
/** Far enough out to take in Neptune's orbit (18,000 units) at true scale. */
const TRUE_OVERVIEW: View = { position: [0, 22000, 44000], lookAt: [0, 0, 0] };

/** Camera view that frames the whole size lineup for the current window shape. */
function lineupView(): View {
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  const halfVertical = Math.tan((45 / 2) * (Math.PI / 180));
  const distance = (lineupHalfWidth() * 1.12) / (halfVertical * Math.min(aspect, 2.2));
  return { position: [0, distance * 0.08, distance], lookAt: [0, 0, 0] };
}

/** Where to look at the solar system from, for a layout (defaults to the current one). */
export function solarSystemOverview(layout?: 'museum' | 'true' | 'lineup'): View {
  const state = useAppStore.getState();
  const which = layout ?? (state.lineup ? 'lineup' : state.scaleTarget > 0.5 ? 'true' : 'museum');
  if (which === 'lineup') return lineupView();
  return which === 'true' ? TRUE_OVERVIEW : MUSEUM_OVERVIEW;
}

export const EARTH_MOON_SUN_VIEW = {
  position: [0, 6, 12] as [number, number, number],
  lookAt: [0, 0, 0] as [number, number, number],
};

/** Wide enough to take in the Moon's whole orbit (54 units across) at true scale. */
export const EARTH_MOON_SUN_REAL_VIEW = {
  // Looks slightly right of Earth so the far side of the orbit clears the side panel
  position: [22, 50, 125] as [number, number, number],
  lookAt: [22, 0, 0] as [number, number, number],
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
  const { cameraMode, selectedBody, exitToSolarSystem, setFlyTarget, emsRealScale } = useAppStore();
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
        setFlyTarget(solarSystemOverview());
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
    const controls = controlsRef.current;
    const cam = camera as THREE.PerspectiveCamera;

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

    if (controls) {
      // Slowly circle whatever is in view, but never fight a camera flight
      controls.autoRotate = state.autoOrbit && !isTransitioning.current;
      controls.autoRotateSpeed = 0.7;

      // Zoom limits follow the live scale: a body's size changes as the layout blends
      const radius = name ? bodyDisplayRadius(name) : null;
      const t = scaleState.t;
      if (radius) {
        controls.minDistance = radius * 1.3;
        controls.maxDistance = radius * 20;
      } else if (state.cameraMode === 'solarSystem') {
        controls.minDistance = logMix(5, 2, t);
        controls.maxDistance = logMix(500, 150_000, t);
      }

      // Pull the near plane in with the view so a tiny true-scale planet is never
      // clipped, while keeping depth precision. The far plane covers true scale.
      const focus = cam.position.distanceTo(controls.target);
      const near = Math.min(200, Math.max(5e-4, focus * 0.01));
      if (Math.abs(near - cam.near) > cam.near * 0.05) {
        cam.near = near;
        cam.updateProjectionMatrix();
      }
    }
  });

  const isPlanetMode = cameraMode === 'planet';
  const isTeachingMode = cameraMode === 'earthMoonSun';
  const followRadius = bodyDisplayRadius(followedBody(cameraMode, selectedBody) ?? '');

  // Starting limits for each mode; the frame loop keeps the solar-system and
  // followed-body limits current as the scale blends
  const [minDistance, maxDistance] = followRadius
    ? [followRadius * 1.3, followRadius * 20]
    : isPlanetMode
      ? [1.15, 8]
      : isTeachingMode
        ? [8, emsRealScale ? 400 : 42]
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
