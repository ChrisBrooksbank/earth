import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { isMobile } from '../lib/isMobile';
import { secondsSinceJ2000 } from '../lib/simClock';

interface PlanetProps {
  /** Geometry radius. The scene scales the whole body, so this is normally 1. */
  radius: number;
  texture: string;
  axialTilt?: number;
  rotationSpeed?: number;
  position?: [number, number, number];
}

export default function Planet({
  radius,
  texture,
  axialTilt = 0,
  rotationSpeed = 0,
  position = [0, 0, 0],
}: PlanetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const colorMap = useTexture(texture);

  // Spin follows the simulation clock so it respects time speed and pause
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = (rotationSpeed * secondsSinceJ2000()) % (2 * Math.PI);
    }
  });

  const segments = isMobile ? 32 : 64;

  return (
    <group ref={groupRef} position={position} rotation={[axialTilt, 0, 0]}>
      <mesh>
        <sphereGeometry args={[radius, segments, segments]} />
        <meshStandardMaterial map={colorMap} />
      </mesh>
    </group>
  );
}
