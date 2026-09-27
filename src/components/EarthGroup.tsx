import { Suspense, useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Earth from './Earth';
import CountryBorders from './CountryBorders';
import WaterFeatures from './WaterFeatures';
import CountryLabels from './CountryLabels';
import { applyEarthOrientation } from '../lib/earthOrientation';

/** Module-level ref so non-R3F components (e.g. SearchBar) can read current rotation. */
export const earthGroupRef: { current: THREE.Group | null } = { current: null };

export default function EarthGroup({
  onHoverCountry,
}: {
  onHoverCountry?: (name: string | null) => void;
}) {
  const groupRef = useRef<THREE.Group | null>(null);

  // Keep the module-level ref in sync, including clearing it on unmount
  const setGroupRef = useCallback((group: THREE.Group | null) => {
    groupRef.current = group;
    earthGroupRef.current = group;
  }, []);

  // Real axial tilt and spin for the simulated date, so the lit hemisphere matches
  // reality. Runs before default-priority frame callbacks so children such as
  // CountryLabels see this frame's orientation, even at high time speeds.
  useFrame(() => {
    if (groupRef.current) applyEarthOrientation(groupRef.current);
  }, -1);

  return (
    <group ref={setGroupRef}>
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
