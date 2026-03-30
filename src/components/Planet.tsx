import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface PlanetProps {
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
  const meshRef = useRef<THREE.Mesh>(null);
  const colorMap = useTexture(texture);

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed * delta;
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={[axialTilt, 0, 0]}>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshStandardMaterial map={colorMap} />
    </mesh>
  );
}
