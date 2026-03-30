import { Suspense } from 'react';
import Planet from './Planet';
import Sun from './Sun';
import SaturnRings from './SaturnRings';
import OrbitLine from './OrbitLine';
import { PLANETS, EARTH_RADIUS_KM } from '../data/planets';
import orbitalElementsData from '../data/orbital-elements.json';

/**
 * Museum Model scaling (preview — Phase 5 will apply full scale.ts).
 * Radii: displayRadius = base * pow(realRadius / earthRadius, 0.4)
 * Distances: displayDist = K * log10(1 + au * STRETCH)
 */
const BASE_RADIUS = 1.0; // Earth = 1 scene unit (matches Earth.tsx)
const K = 15;
const STRETCH = 3;

interface OrbitalElementRecord {
  name: string;
  a: number;
  e: number;
  i: number;
  omega: number;
  w: number;
  M0: number;
  n: number;
}

const orbitalElements = orbitalElementsData as OrbitalElementRecord[];

function displayRadius(radiusKm: number): number {
  return BASE_RADIUS * Math.pow(radiusKm / EARTH_RADIUS_KM, 0.4);
}

function displayDist(semiMajorAxisAU: number): number {
  return K * Math.log10(1 + semiMajorAxisAU * STRETCH);
}

export default function SolarSystem() {
  const earthX = displayDist(1.0);

  return (
    <Suspense fallback={null}>
      <Sun position={[0, 0, 0]} />
      {PLANETS.filter(planet => !planet.parent).map(planet => {
        const elems = orbitalElements.find(el => el.name === planet.name);
        if (!elems) return null;
        return (
          <OrbitLine
            key={`orbit-${planet.name}`}
            semiMajorAxisAU={elems.a}
            eccentricity={elems.e}
            inclination={elems.i}
            ascendingNode={elems.omega}
            argPerihelion={elems.w}
            color={planet.orbitColor}
            K={K}
            stretch={STRETCH}
          />
        );
      })}
      {PLANETS.map(planet => {
        const r = displayRadius(planet.radiusKm);
        let x: number;

        if (planet.parent === 'Earth') {
          // Moon: offset slightly from Earth along X
          x = earthX + r * 4;
        } else {
          x = displayDist(planet.semiMajorAxisAU);
        }

        return (
          <group key={planet.name} position={[x, 0, 0]} rotation={[planet.axialTilt, 0, 0]}>
            <Planet
              radius={r}
              texture={planet.texture}
              axialTilt={0}
              rotationSpeed={planet.rotationSpeed}
              position={[0, 0, 0]}
            />
            {planet.hasRings && <SaturnRings innerRadius={r * 1.3} outerRadius={r * 2.4} />}
          </group>
        );
      })}
    </Suspense>
  );
}
