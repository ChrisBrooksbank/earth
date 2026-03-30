import { Suspense } from 'react';
import Planet from './Planet';
import Sun from './Sun';
import { PLANETS, EARTH_RADIUS_KM } from '../data/planets';

/**
 * Museum Model scaling (preview — Phase 5 will apply full scale.ts).
 * Radii: displayRadius = base * pow(realRadius / earthRadius, 0.4)
 * Distances: displayDist = K * log10(1 + au * STRETCH)
 */
const BASE_RADIUS = 1.0; // Earth = 1 scene unit (matches Earth.tsx)
const K = 15;
const STRETCH = 3;

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
          <Planet
            key={planet.name}
            radius={r}
            texture={planet.texture}
            axialTilt={planet.axialTilt}
            rotationSpeed={planet.rotationSpeed}
            position={[x, 0, 0]}
          />
        );
      })}
    </Suspense>
  );
}
