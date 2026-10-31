import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { glowTexture } from '../lib/glowTexture';
import { scaleState, smoothstep01 } from '../lib/solarScale';

/**
 * A small glowing dot that keeps a body findable once true scale shrinks it to
 * less than a pixel. Fades in with the true-scale blend and out with the lineup.
 */
export default function Beacon({ color, size = 9 }: { color: string; size?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
    return geo;
  }, []);
  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color,
        size,
        sizeAttenuation: false,
        map: glowTexture(),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [color, size]
  );

  useFrame(() => {
    const opacity =
      smoothstep01((scaleState.t - 0.15) / 0.5) * (1 - smoothstep01(scaleState.lineup));
    const points = pointsRef.current;
    if (!points) return;
    (points.material as THREE.PointsMaterial).opacity = opacity;
    points.visible = opacity > 0.01;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}
