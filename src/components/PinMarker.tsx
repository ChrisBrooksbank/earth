import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { lonLatToXYZ } from '../lib/geo-utils';
import { useAppStore } from '../store/appStore';

const HEAD_RADIUS = 1.014;

/** Red map pin at the pinned location. Rendered inside the rotating Earth group. */
export default function PinMarker() {
  const pin = useAppStore(s => s.pin);
  const headRef = useRef<THREE.Mesh>(null);

  // Keep the head a similar size on screen as the camera zooms in and out
  useFrame(({ camera }) => {
    const heightAboveSurface = Math.max(camera.position.length() - 1, 0.05);
    headRef.current?.scale.setScalar(Math.min(heightAboveSurface * 0.6, 1.5));
  });

  const stem = useMemo(() => {
    if (!pin) return null;
    const base = new THREE.Vector3(...lonLatToXYZ(pin.lon, pin.lat, 1.0));
    const head = new THREE.Vector3(...lonLatToXYZ(pin.lon, pin.lat, HEAD_RADIUS));
    return new THREE.BufferGeometry().setFromPoints([base, head]);
  }, [pin]);

  // Free the previous stem's GPU buffers whenever the pin moves or is removed
  useEffect(() => () => stem?.dispose(), [stem]);

  if (!pin || !stem) return null;

  return (
    <group>
      <lineSegments geometry={stem}>
        <lineBasicMaterial color="#ff5a5a" />
      </lineSegments>
      <mesh ref={headRef} position={lonLatToXYZ(pin.lon, pin.lat, HEAD_RADIUS)}>
        <sphereGeometry args={[0.006, 16, 16]} />
        <meshBasicMaterial color="#ff5a5a" />
      </mesh>
    </group>
  );
}
