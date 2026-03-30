import { Suspense, useMemo, useRef } from 'react';
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

const TEXTURE_PATHS = {
  low: {
    day: '/textures/earth_day_256.jpg',
    night: '/textures/earth_night_256.jpg',
    specular: '/textures/earth_specular_256.jpg',
    clouds: '/textures/earth_clouds_256.jpg',
  },
  mid: {
    day: '/textures/earth_day_2k.jpg',
    night: '/textures/earth_night_2k.jpg',
    specular: '/textures/earth_specular_2k.jpg',
    clouds: '/textures/earth_clouds_2k.jpg',
  },
  high: {
    day: '/textures/earth_day.jpg',
    night: '/textures/earth_night.jpg',
    specular: '/textures/earth_specular.jpg',
    clouds: '/textures/earth_clouds.jpg',
  },
} as const;

// Preload 256px textures immediately so they're cache-ready when used as fallback
useTexture.preload(TEXTURE_PATHS.low.day);
useTexture.preload(TEXTURE_PATHS.low.night);
useTexture.preload(TEXTURE_PATHS.low.specular);
useTexture.preload(TEXTURE_PATHS.low.clouds);

interface EarthMeshProps {
  dayMap: THREE.Texture;
  nightMap: THREE.Texture;
  specularMap: THREE.Texture;
  cloudsMap: THREE.Texture;
}

function EarthMesh({ dayMap, nightMap, specularMap, cloudsMap }: EarthMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

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

type TextureTuple = [THREE.Texture, THREE.Texture, THREE.Texture, THREE.Texture];

// Loads 8K textures; renders when ready
function EarthHigh() {
  const [dayMap, nightMap, specularMap, cloudsMap] = useTexture([
    TEXTURE_PATHS.high.day,
    TEXTURE_PATHS.high.night,
    TEXTURE_PATHS.high.specular,
    TEXTURE_PATHS.high.clouds,
  ]) as TextureTuple;
  return (
    <EarthMesh
      dayMap={dayMap}
      nightMap={nightMap}
      specularMap={specularMap}
      cloudsMap={cloudsMap}
    />
  );
}

// Loads 2K textures; shows 2K while waiting for 8K
function EarthMid() {
  const [dayMap, nightMap, specularMap, cloudsMap] = useTexture([
    TEXTURE_PATHS.mid.day,
    TEXTURE_PATHS.mid.night,
    TEXTURE_PATHS.mid.specular,
    TEXTURE_PATHS.mid.clouds,
  ]) as TextureTuple;
  return (
    <Suspense
      fallback={
        <EarthMesh
          dayMap={dayMap}
          nightMap={nightMap}
          specularMap={specularMap}
          cloudsMap={cloudsMap}
        />
      }
    >
      <EarthHigh />
    </Suspense>
  );
}

// Loads 256px textures; shows 256px while waiting for 2K
function EarthLow() {
  const [dayMap, nightMap, specularMap, cloudsMap] = useTexture([
    TEXTURE_PATHS.low.day,
    TEXTURE_PATHS.low.night,
    TEXTURE_PATHS.low.specular,
    TEXTURE_PATHS.low.clouds,
  ]) as TextureTuple;
  return (
    <Suspense
      fallback={
        <EarthMesh
          dayMap={dayMap}
          nightMap={nightMap}
          specularMap={specularMap}
          cloudsMap={cloudsMap}
        />
      }
    >
      <EarthMid />
    </Suspense>
  );
}

// Progressive Earth: 256px placeholder → 2K → 8K via nested Suspense boundaries
export default function Earth() {
  return (
    <Suspense fallback={null}>
      <EarthLow />
    </Suspense>
  );
}
