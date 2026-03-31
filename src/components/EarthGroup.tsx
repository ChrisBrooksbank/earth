import { Suspense, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Earth from './Earth';
import CountryBorders from './CountryBorders';
import WaterFeatures from './WaterFeatures';
import CountryLabels from './CountryLabels';
import { useAppStore } from '../store/appStore';

const EARTH_ROTATION_SPEED = (2 * Math.PI) / 24;

/** Module-level ref so non-R3F components (e.g. SearchBar) can read current rotation. */
export const earthGroupRef: { current: THREE.Group | null } = { current: null };

export default function EarthGroup({
  onHoverCountry,
}: {
  onHoverCountry?: (name: string | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    const { timeMultiplier, isPaused } = useAppStore.getState();
    if (groupRef.current && !isPaused) {
      groupRef.current.rotation.y += EARTH_ROTATION_SPEED * delta * timeMultiplier;
    }
    // Keep module-level ref in sync
    earthGroupRef.current = groupRef.current;
  });

  return (
    <group ref={groupRef}>
      <Earth />
      <Suspense fallback={null}>
        <CountryBorders onHoverCountry={onHoverCountry} />
      </Suspense>
      <Suspense fallback={null}>
        <WaterFeatures />
      </Suspense>
      <CountryLabels />
    </group>
  );
}
