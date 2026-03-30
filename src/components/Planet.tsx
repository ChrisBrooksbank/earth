import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Detailed } from '@react-three/drei';
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
  const groupRef = useRef<THREE.Group>(null);
  const colorMap = useTexture(texture);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed * delta;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[axialTilt, 0, 0]}>
      <Detailed distances={[0, radius * 200, radius * 600]}>
        {/* High-poly: close range */}
        <mesh>
          <sphereGeometry args={[radius, 64, 64]} />
          <meshStandardMaterial map={colorMap} />
        </mesh>
        {/* Medium-poly: mid range */}
        <mesh>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial map={colorMap} />
        </mesh>
        {/* Low-poly: far range */}
        <mesh>
          <sphereGeometry args={[radius, 16, 16]} />
          <meshStandardMaterial map={colorMap} />
        </mesh>
      </Detailed>
    </group>
  );
}
