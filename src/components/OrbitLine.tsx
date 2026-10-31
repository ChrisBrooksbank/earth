import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { perifocalToScene } from '../lib/orbital-mechanics';
import { scaleState, smoothstep01 } from '../lib/solarScale';

interface OrbitLineProps {
  /** Semi-major axis in AU */
  semiMajorAxisAU: number;
  /** Eccentricity */
  eccentricity: number;
  /** Inclination in radians */
  inclination: number;
  /** Longitude of ascending node in radians */
  ascendingNode: number;
  /** Argument of perihelion in radians */
  argPerihelion: number;
  /** Display color (CSS color string or hex) */
  color: string;
  /**
   * Maps a distance from the orbit's focus (AU) to scene units for a blend
   * value (0 = museum, 1 = true scale). Must match how the body itself is placed.
   */
  distanceAt: (au: number, blend: number) => number;
  /** Line opacity (raise it to highlight an orbit) */
  opacity?: number;
  /** Fade the line out as the size lineup forms */
  fadeInLineup?: boolean;
}

const POINT_COUNT = 360;
const DASH = 0.3;
const GAP = 0.15;

interface OrbitGeometry {
  /** Unit direction of every vertex from the focus */
  directions: Float32Array;
  /** Distance of every vertex from the focus, in AU */
  distancesAU: Float32Array;
}

function sampleOrbit(a: number, e: number, i: number, omega: number, w: number): OrbitGeometry {
  const directions = new Float32Array((POINT_COUNT + 1) * 3);
  const distancesAU = new Float32Array(POINT_COUNT + 1);

  // Sample true anomaly values to trace the full ellipse
  for (let j = 0; j <= POINT_COUNT; j++) {
    const nu = (j / POINT_COUNT) * 2 * Math.PI;
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));
    const [x, y, z] = perifocalToScene(r * Math.cos(nu), r * Math.sin(nu), { i, omega, w });
    const len = Math.hypot(x, y, z) || 1;
    directions.set([x / len, y / len, z / len], j * 3);
    distancesAU[j] = r;
  }
  return { directions, distancesAU };
}

export default function OrbitLine({
  semiMajorAxisAU,
  eccentricity,
  inclination,
  ascendingNode,
  argPerihelion,
  color,
  distanceAt,
  opacity = 0.4,
  fadeInLineup = true,
}: OrbitLineProps) {
  const lastBlend = useRef(-1);

  const orbit = useMemo(
    () => sampleOrbit(semiMajorAxisAU, eccentricity, inclination, ascendingNode, argPerihelion),
    [semiMajorAxisAU, eccentricity, inclination, ascendingNode, argPerihelion]
  );

  const line = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array((POINT_COUNT + 1) * 3), 3)
    );
    const mat = new THREE.LineDashedMaterial({
      color,
      dashSize: DASH,
      gapSize: GAP,
      transparent: true,
      opacity,
      depthWrite: false,
    });
    lastBlend.current = -1;
    return new THREE.Line(geo, mat);
    // Opacity is updated separately so highlighting doesn't rebuild the geometry
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color]);

  // Re-place the vertices whenever the museum/true blend moves, and keep the
  // dashes proportionate to the orbit's size so they stay visible at any scale
  useFrame(() => {
    const blend = scaleState.t;
    const material = line.material as THREE.LineDashedMaterial;
    const lineupFade = fadeInLineup ? 1 - smoothstep01(scaleState.lineup) : 1;
    material.opacity = opacity * lineupFade;
    line.visible = lineupFade > 0.01;

    if (blend === lastBlend.current) return;
    lastBlend.current = blend;

    const position = line.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let j = 0; j <= POINT_COUNT; j++) {
      const d = distanceAt(orbit.distancesAU[j]!, blend);
      position.setXYZ(
        j,
        orbit.directions[j * 3]! * d,
        orbit.directions[j * 3 + 1]! * d,
        orbit.directions[j * 3 + 2]! * d
      );
    }
    position.needsUpdate = true;

    const sizeRatio = distanceAt(semiMajorAxisAU, blend) / distanceAt(semiMajorAxisAU, 0);
    material.dashSize = DASH * sizeRatio;
    material.gapSize = GAP * sizeRatio;
    line.computeLineDistances();
    line.geometry.computeBoundingSphere();
  });

  useEffect(() => {
    return () => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    };
  }, [line]);

  return <primitive object={line} frustumCulled={false} />;
}
