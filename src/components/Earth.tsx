import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import earthSurfaceVert from '../shaders/earth-surface.vert?raw';
import earthSurfaceFrag from '../shaders/earth-surface.frag?raw';
import atmosphereFrag from '../shaders/atmosphere.frag?raw';
import cloudsVert from '../shaders/clouds.vert?raw';
import cloudsFrag from '../shaders/clouds.frag?raw';
import { isMobile } from '../lib/isMobile';
import { useAppStore } from '../store/appStore';

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
    normal: '/textures/earth_normal_256.jpg',
  },
  mid: {
    day: '/textures/earth_day_2k.jpg',
    night: '/textures/earth_night_2k.jpg',
    specular: '/textures/earth_specular_2k.jpg',
    clouds: '/textures/earth_clouds_2k.jpg',
    normal: '/textures/earth_normal_2k.jpg',
  },
  high: {
    day: '/textures/earth_day.jpg',
    night: '/textures/earth_night.jpg',
    specular: '/textures/earth_specular.jpg',
    clouds: '/textures/earth_clouds.jpg',
    normal: '/textures/earth_normal.jpg',
  },
} as const;

// Preload 256px textures immediately so they're cache-ready when used as fallback
useTexture.preload(TEXTURE_PATHS.low.day);
useTexture.preload(TEXTURE_PATHS.low.night);
useTexture.preload(TEXTURE_PATHS.low.specular);
useTexture.preload(TEXTURE_PATHS.low.clouds);
useTexture.preload(TEXTURE_PATHS.low.normal);

const SPHERE_SEGMENTS = isMobile ? 32 : 64;

// Atmosphere material (static, shared)
const atmosphereMaterial = new THREE.ShaderMaterial({
  vertexShader: earthSurfaceVert,
  fragmentShader: atmosphereFrag,
  uniforms: {
    sunDirection: { value: SUN_DIRECTION },
  },
  side: THREE.BackSide,
  transparent: true,
  depthWrite: false,
});

// Shared mutable time uniform for clouds (updated in useFrame, not tied to React state)
const cloudsTimeUniform = { value: 0 };

function createCloudsMaterial(cloudsMap: THREE.Texture): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: cloudsVert,
    fragmentShader: cloudsFrag,
    uniforms: {
      cloudMap: { value: cloudsMap },
      uTime: cloudsTimeUniform,
      sunDirection: { value: SUN_DIRECTION },
    },
    transparent: true,
    depthWrite: false,
  });
}

/** Animated cloud layer with UV-drift shader. */
function CloudLayer({ cloudsMap }: { cloudsMap: THREE.Texture }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const material = useMemo(() => createCloudsMaterial(cloudsMap), [cloudsMap]);

  // Parent group rotates at EARTH_ROTATION_SPEED; clouds need differential only
  const CLOUD_DIFFERENTIAL = CLOUD_ROTATION_SPEED - EARTH_ROTATION_SPEED;

  useFrame((_state, delta) => {
    const { timeMultiplier, isPaused } = useAppStore.getState();
    if (meshRef.current && !isPaused) {
      meshRef.current.rotation.y += CLOUD_DIFFERENTIAL * delta * timeMultiplier;
    }
    if (!isPaused) {
      cloudsTimeUniform.value += delta * timeMultiplier;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.005, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

interface EarthMeshProps {
  dayMap: THREE.Texture;
  nightMap: THREE.Texture;
  specularMap: THREE.Texture;
  normalMap: THREE.Texture;
  cloudsMap: THREE.Texture | null;
}

function EarthMesh({ dayMap, nightMap, specularMap, normalMap, cloudsMap }: EarthMeshProps) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: earthSurfaceVert,
        fragmentShader: earthSurfaceFrag,
        uniforms: {
          dayTexture: { value: dayMap },
          nightTexture: { value: nightMap },
          specularMap: { value: specularMap },
          normalMap: { value: normalMap },
          normalScale: { value: 0.4 },
          sunDirection: { value: SUN_DIRECTION },
        },
      }),
    [dayMap, nightMap, specularMap, normalMap]
  );

  return (
    <>
      <mesh>
        <sphereGeometry args={[1, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
        <primitive object={material} attach="material" />
      </mesh>
      {cloudsMap && <CloudLayer cloudsMap={cloudsMap} />}
      <mesh>
        <sphereGeometry args={[1.04, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
        <primitive object={atmosphereMaterial} attach="material" />
      </mesh>
    </>
  );
}

type TextureTuple4 = [THREE.Texture, THREE.Texture, THREE.Texture, THREE.Texture];
type TextureTuple5 = [THREE.Texture, THREE.Texture, THREE.Texture, THREE.Texture, THREE.Texture];

// ── Desktop path: 256px → 2K → 8K with clouds ────────────────────────────────

function EarthHigh() {
  const [dayMap, nightMap, specularMap, cloudsMap, normalMap] = useTexture([
    TEXTURE_PATHS.high.day,
    TEXTURE_PATHS.high.night,
    TEXTURE_PATHS.high.specular,
    TEXTURE_PATHS.high.clouds,
    TEXTURE_PATHS.high.normal,
  ]) as TextureTuple5;
  return (
    <EarthMesh
      dayMap={dayMap}
      nightMap={nightMap}
      specularMap={specularMap}
      normalMap={normalMap}
      cloudsMap={cloudsMap}
    />
  );
}

function EarthMid() {
  const [dayMap, nightMap, specularMap, cloudsMap, normalMap] = useTexture([
    TEXTURE_PATHS.mid.day,
    TEXTURE_PATHS.mid.night,
    TEXTURE_PATHS.mid.specular,
    TEXTURE_PATHS.mid.clouds,
    TEXTURE_PATHS.mid.normal,
  ]) as TextureTuple5;
  return (
    <Suspense
      fallback={
        <EarthMesh
          dayMap={dayMap}
          nightMap={nightMap}
          specularMap={specularMap}
          normalMap={normalMap}
          cloudsMap={cloudsMap}
        />
      }
    >
      <EarthHigh />
    </Suspense>
  );
}

function EarthLow() {
  const [dayMap, nightMap, specularMap, cloudsMap, normalMap] = useTexture([
    TEXTURE_PATHS.low.day,
    TEXTURE_PATHS.low.night,
    TEXTURE_PATHS.low.specular,
    TEXTURE_PATHS.low.clouds,
    TEXTURE_PATHS.low.normal,
  ]) as TextureTuple5;
  return (
    <Suspense
      fallback={
        <EarthMesh
          dayMap={dayMap}
          nightMap={nightMap}
          specularMap={specularMap}
          normalMap={normalMap}
          cloudsMap={cloudsMap}
        />
      }
    >
      <EarthMid />
    </Suspense>
  );
}

// ── Mobile path: 256px → 2K, no clouds ───────────────────────────────────────

function EarthMobileMid() {
  const [dayMap, nightMap, specularMap, normalMap] = useTexture([
    TEXTURE_PATHS.mid.day,
    TEXTURE_PATHS.mid.night,
    TEXTURE_PATHS.mid.specular,
    TEXTURE_PATHS.mid.normal,
  ]) as TextureTuple4;
  return (
    <EarthMesh
      dayMap={dayMap}
      nightMap={nightMap}
      specularMap={specularMap}
      normalMap={normalMap}
      cloudsMap={null}
    />
  );
}

function EarthMobileLow() {
  const [dayMap, nightMap, specularMap, normalMap] = useTexture([
    TEXTURE_PATHS.low.day,
    TEXTURE_PATHS.low.night,
    TEXTURE_PATHS.low.specular,
    TEXTURE_PATHS.low.normal,
  ]) as TextureTuple4;
  return (
    <Suspense
      fallback={
        <EarthMesh
          dayMap={dayMap}
          nightMap={nightMap}
          specularMap={specularMap}
          normalMap={normalMap}
          cloudsMap={null}
        />
      }
    >
      <EarthMobileMid />
    </Suspense>
  );
}

// Progressive Earth: mobile gets 256px → 2K (no clouds); desktop gets 256px → 2K → 8K
export default function Earth() {
  return <Suspense fallback={null}>{isMobile ? <EarthMobileLow /> : <EarthLow />}</Suspense>;
}
