import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HALLEY } from '../data/comet';
import { keplerianToCartesian } from '../lib/orbital-mechanics';
import { secondsSinceJ2000 } from '../lib/simClock';
import { glowTexture } from '../lib/glowTexture';
import { bodyObjects } from '../lib/sceneBodies';
import PlanetLabel from './PlanetLabel';
import { useAppStore } from '../store/appStore';
import { blendedDistance, museumDistance, scaleState, smoothstep01 } from '../lib/solarScale';

const TAIL_PARTICLES = 900;
const X_AXIS = new THREE.Vector3(1, 0, 0);
const _dir = new THREE.Vector3();

/** Tail particles along +x from 0 to 1, fanning out and fading with distance. */
function buildTail(): THREE.BufferGeometry {
  const positions = new Float32Array(TAIL_PARTICLES * 3);
  const colors = new Float32Array(TAIL_PARTICLES * 3);
  let seed = 7;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  for (let i = 0; i < TAIL_PARTICLES; i++) {
    // Dense near the head, thinning and fanning out along the tail
    const u = Math.pow(random(), 1.8);
    const spread = 0.012 + u * 0.1;
    const gauss = () => (random() + random() + random() - 1.5) / 1.5;
    positions.set([u, gauss() * spread, gauss() * spread], i * 3);
    const fade = (1 - u) * (1 - u);
    colors.set([0.55 * fade + 0.1, 0.8 * fade + 0.1, fade + 0.1], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

/**
 * Halley's Comet: a glowing nucleus on its real orbit with a tail that always
 * points away from the Sun and grows as it nears it.
 */
export default function Comet() {
  const groupRef = useRef<THREE.Group>(null);
  const showLabel = useAppStore(s => s.cameraMode === 'solarSystem' && !s.lineup);
  const tailRef = useRef<THREE.Points>(null);
  const comaRef = useRef<THREE.Points>(null);

  const tailGeometry = useMemo(() => buildTail(), []);
  const tailMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 2.4,
        sizeAttenuation: false,
        map: glowTexture(),
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  const comaGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
    return geo;
  }, []);
  const comaMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: HALLEY.color,
        size: 14,
        sizeAttenuation: false,
        map: glowTexture(),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useEffect(() => {
    const group = groupRef.current;
    if (group) bodyObjects.set(HALLEY.name, group);
    return () => {
      bodyObjects.delete(HALLEY.name);
      tailGeometry.dispose();
      tailMaterial.dispose();
      comaGeometry.dispose();
      comaMaterial.dispose();
    };
  }, [tailGeometry, tailMaterial, comaGeometry, comaMaterial]);

  useFrame(() => {
    const group = groupRef.current;
    const tail = tailRef.current;
    const coma = comaRef.current;
    if (!group || !tail || !coma) return;

    const [x, y, z] = keplerianToCartesian(HALLEY.elements, secondsSinceJ2000());
    const r = Math.hypot(x, y, z);
    const t = scaleState.t;
    const d = blendedDistance(r, t);
    _dir.set(x / r, y / r, z / r);
    group.position.copy(_dir).multiplyScalar(d);

    // Activity builds as the comet approaches the Sun and dies away beyond ~4 AU
    const activity = smoothstep01((4 - r) / 3.4);
    // Keep the tail proportionate to the layout's distances
    const sizeRatio = d / museumDistance(r);
    const length = (0.6 + 9 * activity) * sizeRatio;

    tail.quaternion.setFromUnitVectors(X_AXIS, _dir);
    tail.scale.setScalar(length);
    (tail.material as THREE.PointsMaterial).opacity = 0.12 + 0.88 * activity;
    (coma.material as THREE.PointsMaterial).opacity = 0.35 + 0.65 * activity;

    // The lineup is for planets; the comet takes no part
    const lineupFade = 1 - smoothstep01(scaleState.lineup);
    group.visible = lineupFade > 0.01;
  });

  return (
    <group ref={groupRef}>
      <points ref={comaRef} geometry={comaGeometry} material={comaMaterial} frustumCulled={false} />
      <points ref={tailRef} geometry={tailGeometry} material={tailMaterial} frustumCulled={false} />
      {showLabel && <PlanetLabel name={HALLEY.name} offset={0} color={HALLEY.color} />}
    </group>
  );
}
