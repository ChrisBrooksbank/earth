import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../store/appStore';
import { glowTexture } from '../lib/glowTexture';
import { AU_LIGHT_SECONDS } from '../lib/lightTime';
import { simClock } from '../lib/simClock';
import { blendedDistance, scaleState } from '../lib/solarScale';

/** How long the pulse glows at its destination before it is cleared (real seconds). */
const ARRIVAL_HOLD_S = 2.5;

/**
 * A pulse of light leaving the Sun at the true speed of light (in simulated
 * time), so slowing the clock to "Real time" shows how long the trip really takes.
 */
export default function LightPulse() {
  const pulse = useAppStore(s => s.lightPulse);
  const arrivedFor = useRef(0);
  const trailRef = useRef<THREE.Line>(null);
  const headRef = useRef<THREE.Points>(null);

  const headGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
    return geo;
  }, []);
  const headMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: '#fff2b0',
        size: 26,
        sizeAttenuation: false,
        map: glowTexture(),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  const trailGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    return geo;
  }, []);
  const trailMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#ffe9a0',
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  const trail = useMemo(
    () => new THREE.Line(trailGeometry, trailMaterial),
    [trailGeometry, trailMaterial]
  );

  useEffect(() => {
    arrivedFor.current = 0;
  }, [pulse]);

  useEffect(
    () => () => {
      headGeometry.dispose();
      headMaterial.dispose();
      trailGeometry.dispose();
      trailMaterial.dispose();
    },
    [headGeometry, headMaterial, trailGeometry, trailMaterial]
  );

  useFrame((_state, delta) => {
    if (!pulse) return;
    const elapsedS = Math.max(0, (simClock.ms - pulse.startMs) / 1000);
    const au = Math.min(pulse.distanceAU, elapsedS / AU_LIGHT_SECONDS);
    const d = blendedDistance(au, scaleState.t);
    const [dx, dy, dz] = pulse.direction;

    headGeometry.getAttribute('position').setXYZ(0, dx * d, dy * d, dz * d);
    headGeometry.getAttribute('position').needsUpdate = true;
    trailGeometry.getAttribute('position').setXYZ(1, dx * d, dy * d, dz * d);
    trailGeometry.getAttribute('position').needsUpdate = true;
    trailGeometry.computeBoundingSphere();

    const headMaterialNow = headRef.current?.material as THREE.PointsMaterial | undefined;
    if (!headMaterialNow) return;
    if (au >= pulse.distanceAU) {
      arrivedFor.current += delta;
      // Swell as it lands, then clear
      headMaterialNow.size = 26 + 30 * Math.min(1, arrivedFor.current / 0.4);
      if (arrivedFor.current > ARRIVAL_HOLD_S) useAppStore.getState().setLightPulse(null);
    } else {
      headMaterialNow.size = 26;
    }
  });

  if (!pulse) return null;

  return (
    <>
      <primitive object={trail} ref={trailRef} frustumCulled={false} />
      <points ref={headRef} geometry={headGeometry} material={headMaterial} frustumCulled={false} />
    </>
  );
}
