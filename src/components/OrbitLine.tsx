import { useMemo, useEffect } from 'react';
import * as THREE from 'three';

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
  /** K scaling constant – must match SolarSystem.tsx */
  K?: number;
  /** AU stretch – must match SolarSystem.tsx */
  stretch?: number;
  /** Line opacity */
  opacity?: number;
}

const POINT_COUNT = 360;

function buildOrbitLine(
  a: number,
  e: number,
  i: number,
  omega: number,
  w: number,
  K: number,
  stretch: number,
  color: string,
  opacity: number
): THREE.Line {
  const cosO = Math.cos(omega);
  const sinO = Math.sin(omega);
  const cosW = Math.cos(w);
  const sinW = Math.sin(w);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);

  const vertices: number[] = [];

  // Sample 360 true anomaly values to trace the full ellipse
  for (let j = 0; j <= POINT_COUNT; j++) {
    const nu = (j / POINT_COUNT) * 2 * Math.PI;

    // Distance from focus at this true anomaly
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));

    // Position in orbital plane (perifocal frame)
    const xOrb = r * Math.cos(nu);
    const yOrb = r * Math.sin(nu);

    // Rotate to heliocentric ecliptic frame (same rotation as orbital-mechanics.ts)
    const x =
      (cosO * cosW - sinO * sinW * cosI) * xOrb + (-cosO * sinW - sinO * cosW * cosI) * yOrb;
    const y = sinI * sinW * xOrb + sinI * cosW * yOrb;
    const z =
      (sinO * cosW + cosO * sinW * cosI) * xOrb + (-sinO * sinW + cosO * cosW * cosI) * yOrb;

    // Map real distance r (AU) → display distance via log scale, then rescale vector
    const displayR = K * Math.log10(1 + r * stretch);
    const scale = r > 1e-10 ? displayR / r : 0;

    vertices.push(x * scale, y * scale, z * scale);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));

  const mat = new THREE.LineDashedMaterial({
    color,
    dashSize: 0.3,
    gapSize: 0.15,
    transparent: true,
    opacity,
    depthWrite: false,
  });

  const line = new THREE.Line(geo, mat);
  // Required for LineDashedMaterial to render dashes
  line.computeLineDistances();
  return line;
}

export default function OrbitLine({
  semiMajorAxisAU,
  eccentricity,
  inclination,
  ascendingNode,
  argPerihelion,
  color,
  K = 15,
  stretch = 3,
  opacity = 0.4,
}: OrbitLineProps) {
  const lineObj = useMemo(
    () =>
      buildOrbitLine(
        semiMajorAxisAU,
        eccentricity,
        inclination,
        ascendingNode,
        argPerihelion,
        K,
        stretch,
        color,
        opacity
      ),
    [
      semiMajorAxisAU,
      eccentricity,
      inclination,
      ascendingNode,
      argPerihelion,
      K,
      stretch,
      color,
      opacity,
    ]
  );

  useEffect(() => {
    return () => {
      lineObj.geometry.dispose();
      (lineObj.material as THREE.Material).dispose();
    };
  }, [lineObj]);

  return <primitive object={lineObj} />;
}
