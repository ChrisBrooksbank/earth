import { useRef, Suspense, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import Planet from './Planet';
import Sun from './Sun';
import SaturnRings from './SaturnRings';
import OrbitLine from './OrbitLine';
import { PLANETS, EARTH_RADIUS_KM } from '../data/planets';
import orbitalElementsData from '../data/orbital-elements.json';
import { keplerianToCartesian, type KeplerianElements } from '../lib/orbital-mechanics';
import { useAppStore } from '../store/appStore';
import type { PlanetData } from '../data/planets';

/**
 * Museum Model scaling (Phase 5).
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

const elementsMap = new Map<string, KeplerianElements>(
  orbitalElements.map(el => [el.name, el as KeplerianElements])
);

function displayRadius(radiusKm: number): number {
  return BASE_RADIUS * Math.pow(radiusKm / EARTH_RADIUS_KM, 0.4);
}

/**
 * Scale a heliocentric AU position to display units using log-scale distance
 * compression. Preserves direction, compresses magnitude.
 */
function scaleAUtoDisplay(pos: [number, number, number]): [number, number, number] {
  const [x, y, z] = pos;
  const r = Math.sqrt(x * x + y * y + z * z);
  if (r < 1e-10) return [0, 0, 0];
  const displayR = K * Math.log10(1 + r * STRETCH);
  const scale = displayR / r;
  return [x * scale, y * scale, z * scale];
}

const _worldPos = new THREE.Vector3();

export default function SolarSystem() {
  const simTimeRef = useRef(0);
  const planetRefs = useRef<(THREE.Group | null)[]>(PLANETS.map(() => null));
  const { enterPlanetView, setFlyTarget, setPendingFlyToBody } = useAppStore();

  const handlePlanetClick = useCallback(
    (event: ThreeEvent<MouseEvent>, planet: PlanetData, radius: number) => {
      event.stopPropagation();
      event.object.getWorldPosition(_worldPos);
      // Position camera radially outward from the sun, at 6× the display radius away
      const outward = _worldPos
        .clone()
        .normalize()
        .multiplyScalar(radius * 6);
      const camPos = _worldPos.clone().add(outward);
      setFlyTarget({
        position: camPos.toArray() as [number, number, number],
        lookAt: _worldPos.toArray() as [number, number, number],
      });
      enterPlanetView(planet.name);
    },
    [enterPlanetView, setFlyTarget]
  );

  // Earth index used to resolve Moon position (Moon must come after Earth in PLANETS)
  const earthIndex = PLANETS.findIndex(p => p.name === 'Earth');

  useFrame((_, delta) => {
    const { timeMultiplier, isPaused, pendingFlyToBody } = useAppStore.getState();

    // Handle fly-to requests from BodySelector
    if (pendingFlyToBody) {
      const planetIdx = PLANETS.findIndex(p => p.name === pendingFlyToBody);
      const planetData = planetIdx >= 0 ? PLANETS[planetIdx] : null;
      const ref = planetIdx >= 0 ? planetRefs.current[planetIdx] : null;
      if (ref && planetData) {
        ref.getWorldPosition(_worldPos);
        const r = displayRadius(planetData.radiusKm);
        const outward = _worldPos
          .clone()
          .normalize()
          .multiplyScalar(r * 6);
        const camPos = _worldPos.clone().add(outward);
        setFlyTarget({
          position: camPos.toArray() as [number, number, number],
          lookAt: _worldPos.toArray() as [number, number, number],
        });
        enterPlanetView(pendingFlyToBody);
        setPendingFlyToBody(null);
      }
    }

    if (!isPaused) {
      simTimeRef.current += delta * timeMultiplier;
    }
    const t = simTimeRef.current;

    // Compute Earth's display position first so Moon can reference it
    let earthDisplayPos: [number, number, number] = [0, 0, 0];

    if (earthIndex >= 0) {
      const earthElems = elementsMap.get('Earth');
      if (earthElems) {
        earthDisplayPos = scaleAUtoDisplay(keplerianToCartesian(earthElems, t));
      }
    }

    PLANETS.forEach((planet, idx) => {
      const elems = elementsMap.get(planet.name);
      const ref = planetRefs.current[idx];
      if (!elems || !ref) return;

      let pos: [number, number, number];

      if (planet.parent === 'Earth') {
        // Moon: use Keplerian direction but scale to a visible orbit radius
        const moonAUPos = keplerianToCartesian(elems, t);
        const moonR = Math.sqrt(
          moonAUPos[0] * moonAUPos[0] + moonAUPos[1] * moonAUPos[1] + moonAUPos[2] * moonAUPos[2]
        );
        const moonVisualRadius = displayRadius(planet.radiusKm) * 4;
        if (moonR > 1e-10) {
          pos = [
            earthDisplayPos[0] + (moonAUPos[0] / moonR) * moonVisualRadius,
            earthDisplayPos[1] + (moonAUPos[1] / moonR) * moonVisualRadius,
            earthDisplayPos[2] + (moonAUPos[2] / moonR) * moonVisualRadius,
          ];
        } else {
          pos = [earthDisplayPos[0] + moonVisualRadius, earthDisplayPos[1], earthDisplayPos[2]];
        }
      } else {
        pos = scaleAUtoDisplay(keplerianToCartesian(elems, t));
      }

      ref.position.set(pos[0], pos[1], pos[2]);
    });
  });

  const cameraMode = useAppStore(s => s.cameraMode);

  // Don't render solar system bodies when focused on Earth
  if (cameraMode === 'planet') return null;

  return (
    <Suspense fallback={null}>
      <Sun position={[0, 0, 0]} />
      {PLANETS.filter(planet => !planet.parent).map(planet => {
        const elems = elementsMap.get(planet.name);
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
      {PLANETS.map((planet, idx) => {
        const r = displayRadius(planet.radiusKm);

        return (
          <group
            key={planet.name}
            ref={el => {
              planetRefs.current[idx] = el;
            }}
            rotation={[planet.axialTilt, 0, 0]}
            onClick={e => handlePlanetClick(e, planet, r)}
          >
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
