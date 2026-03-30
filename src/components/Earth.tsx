import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Slow axial rotation: one full rotation every ~24 simulated seconds at 1x
const EARTH_ROTATION_SPEED = (2 * Math.PI) / 24;

export default function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);

  const [dayMap, bumpMap, specularMap] = useTexture([
    '/textures/earth_day.jpg',
    '/textures/earth_bump.jpg',
    '/textures/earth_specular.jpg',
  ]);

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += EARTH_ROTATION_SPEED * delta;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhongMaterial
        map={dayMap}
        bumpMap={bumpMap}
        bumpScale={0.05}
        specularMap={specularMap}
        specular={new THREE.Color(0x333333)}
        shininess={15}
      />
    </mesh>
  );
}
