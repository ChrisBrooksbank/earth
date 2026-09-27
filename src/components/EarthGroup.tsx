import { Suspense, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import Earth from './Earth';
import CountryBorders from './CountryBorders';
import WaterFeatures from './WaterFeatures';
import CountryLabels from './CountryLabels';
import PinMarker from './PinMarker';
import IssMarker from './IssMarker';
import { applyEarthOrientation } from '../lib/earthOrientation';

export default function EarthGroup({
  onHoverCountry,
}: {
  onHoverCountry?: (name: string | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Real axial tilt and spin for the simulated date, so the lit hemisphere matches
  // reality. Runs before default-priority frame callbacks so children such as
  // CountryLabels see this frame's orientation, even at high time speeds.
  useFrame(() => {
    if (groupRef.current) applyEarthOrientation(groupRef.current);
  }, -1);

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
      <PinMarker />
      <IssMarker />
    </group>
  );
}
