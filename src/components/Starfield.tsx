import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../store/appStore';

const STAR_COUNT = 8000;
const SPHERE_RADIUS = 500;

function seededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

// Build geometry once at module init — no re-render side effects
function buildStarGeometry(): THREE.BufferGeometry {
  const positions = new Float32Array(STAR_COUNT * 3);
  const random = seededRandom(42);

  for (let i = 0; i < STAR_COUNT; i++) {
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const r = SPHERE_RADIUS * (0.9 + random() * 0.1);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
}

const starGeometry = buildStarGeometry();

const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.8,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.85,
  depthWrite: false,
});

export default function Starfield() {
  const pointsRef = useRef<THREE.Points>(null);

  // Very slow drift rotation for subtle parallax feel
  useFrame(({ camera }, delta) => {
    const { isPaused } = useAppStore.getState();
    if (!pointsRef.current) return;
    // Stars are effectively infinitely far: they ride along with the camera so
    // true-scale flights across tens of thousands of units never leave them behind
    pointsRef.current.position.copy(camera.position);
    if (!isPaused) pointsRef.current.rotation.y += delta * 0.002;
  });

  return <points ref={pointsRef} geometry={starGeometry} material={starMaterial} />;
}
