import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import earthSurfaceVert from '../shaders/earth-surface.vert?raw';
import earthSurfaceFrag from '../shaders/earth-surface.frag?raw';

// Slow axial rotation: one full rotation every ~24 simulated seconds at 1x
const EARTH_ROTATION_SPEED = (2 * Math.PI) / 24;

// Clouds rotate slightly slower than the surface
const CLOUD_ROTATION_SPEED = EARTH_ROTATION_SPEED * 0.85;

// Matches directional light position in App.tsx
const SUN_DIRECTION = new THREE.Vector3(5, 3, 5).normalize();

export default function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  const [dayMap, nightMap, specularMap, cloudsMap] = useTexture([
    '/textures/earth_day.jpg',
    '/textures/earth_night.jpg',
    '/textures/earth_specular.jpg',
    '/textures/earth_clouds.jpg',
  ]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: earthSurfaceVert,
        fragmentShader: earthSurfaceFrag,
        uniforms: {
          dayTexture: { value: dayMap },
          nightTexture: { value: nightMap },
          specularMap: { value: specularMap },
          sunDirection: { value: SUN_DIRECTION },
        },
      }),
    [dayMap, nightMap, specularMap]
  );

  const cloudsMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        alphaMap: cloudsMap,
        transparent: true,
        depthWrite: false,
        color: 0xffffff,
        roughness: 1,
        metalness: 0,
      }),
    [cloudsMap]
  );

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += EARTH_ROTATION_SPEED * delta;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += CLOUD_ROTATION_SPEED * delta;
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <primitive object={material} attach="material" />
      </mesh>
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.005, 64, 64]} />
        <primitive object={cloudsMaterial} attach="material" />
      </mesh>
    </>
  );
}
