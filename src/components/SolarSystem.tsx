import { useRef, Suspense, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import Planet from './Planet';
import Sun from './Sun';
import PlanetRings from './PlanetRings';
import PlanetLabel from './PlanetLabel';
import OrbitLine from './OrbitLine';
import Beacon from './Beacon';
import Comet from './Comet';
import LightPulse from './LightPulse';
import { PLANETS } from '../data/planets';
import { HALLEY } from '../data/comet';
import { keplerianToCartesian } from '../lib/orbital-mechanics';
import { getElements } from '../lib/bodyPositions';
import { useAppStore } from '../store/appStore';
import { secondsSinceJ2000 } from '../lib/simClock';
import { EARTH_VIEW_DISTANCE } from './CameraController';
import { earthDayViewPosition } from '../lib/earthOrientation';
import { bodyObjects } from '../lib/sceneBodies';
import {
  blendedDistance,
  blendedRadius,
  lineupSlot,
  logMix,
  moonDistance,
  scaleState,
  smoothstep01,
  stepScaleState,
  sunRadius,
} from '../lib/solarScale';

type Vec3 = [number, number, number];
type PlanetData = (typeof PLANETS)[number];

const _worldPos = new THREE.Vector3();

/** Scene position of Earth's orbit centre for a blend value (before any lineup). */
function earthPosition(tSec: number, blend: number): Vec3 {
  const [x, y, z] = keplerianToCartesian(getElements('Earth')!, tSec);
  const r = Math.hypot(x, y, z) || 1;
  const d = blendedDistance(r, blend);
  return [(x / r) * d, (y / r) * d, (z / r) * d];
}

/**
 * Where a body sits and how big it is, for a museum/true blend and a lineup
 * blend. Pure so it can also work out where a body is about to be.
 */
function placeBody(
  planet: PlanetData,
  tSec: number,
  blend: number,
  lineup: number
): { position: Vec3; radius: number } {
  const elements = getElements(planet.name)!;
  const [x, y, z] = keplerianToCartesian(elements, tSec);
  const r = Math.hypot(x, y, z) || 1;

  let position: Vec3;
  if (planet.parent === 'Earth') {
    const earth = earthPosition(tSec, blend);
    const d = moonDistance(r, elements.a, blend);
    position = [earth[0] + (x / r) * d, earth[1] + (y / r) * d, earth[2] + (z / r) * d];
  } else {
    const d = blendedDistance(r, blend);
    position = [(x / r) * d, (y / r) * d, (z / r) * d];
  }
  let radius = blendedRadius(planet.radiusKm, blend);

  const slot = lineupSlot(planet.name);
  const L = smoothstep01(lineup);
  if (slot && L > 0) {
    position = [position[0] * (1 - L) + slot.x * L, position[1] * (1 - L), position[2] * (1 - L)];
    radius = logMix(radius, slot.radius, L);
  }
  return { position, radius };
}

/** Fly to a body: Earth opens the detailed globe, other bodies are framed in place. */
function flyToBody(name: string, object: THREE.Object3D) {
  const { enterPlanetView, setFlyTarget, scaleTarget } = useAppStore.getState();
  if (name === 'Earth') {
    // The detailed Earth globe (EarthGroup) lives at the origin
    setFlyTarget({ position: earthDayViewPosition(EARTH_VIEW_DISTANCE), lookAt: [0, 0, 0] });
    enterPlanetView(name);
    return;
  }

  // Frame the body where it is about to be (the layout may be mid-blend or in the
  // lineup, which dissolves when a body is chosen)
  const planet = PLANETS.find(p => p.name === name);
  let radius: number;
  if (planet) {
    const placed = placeBody(planet, secondsSinceJ2000(), scaleTarget, 0);
    radius = placed.radius;
    _worldPos.set(...placed.position);
  } else {
    radius = name === HALLEY.name ? 0.35 + (0.01 - 0.35) * scaleTarget : 1;
    object.getWorldPosition(_worldPos);
  }
  const outward = _worldPos
    .clone()
    .normalize()
    .multiplyScalar(radius * 6);
  const camPos = _worldPos.clone().add(outward);
  setFlyTarget({
    position: camPos.toArray() as Vec3,
    lookAt: _worldPos.toArray() as Vec3,
  });
  enterPlanetView(name);
}

/** The Moon's tag crowds Earth's unless the view is close, so show it only then. */
function MoonLabel({ color, name }: { color: string; name: string }) {
  const show = useAppStore(s => s.lineup || (s.cameraDistance < 45 && s.scaleTarget < 0.5));
  return show ? <PlanetLabel name={name} offset={0} color={color} /> : null;
}

export default function SolarSystem() {
  const planetRefs = useRef<(THREE.Group | null)[]>(PLANETS.map(() => null));
  const scaleRefs = useRef<(THREE.Group | null)[]>(PLANETS.map(() => null));
  const labelRefs = useRef<(THREE.Group | null)[]>(PLANETS.map(() => null));
  const sunRef = useRef<THREE.Group>(null);
  const sunLightRef = useRef<THREE.PointLight>(null);
  const lineupLightRef = useRef<THREE.DirectionalLight>(null);

  const handlePlanetClick = useCallback((event: ThreeEvent<MouseEvent>, name: string) => {
    event.stopPropagation();
    flyToBody(name, event.eventObject);
  }, []);

  useFrame((_state, delta) => {
    const state = useAppStore.getState();
    stepScaleState(delta, state.scaleTarget, state.lineup);
    const { t, lineup } = scaleState;
    const lineupEase = smoothstep01(lineup);
    const tSec = secondsSinceJ2000();

    PLANETS.forEach((planet, idx) => {
      const ref = planetRefs.current[idx];
      if (!ref) return;
      const { position, radius } = placeBody(planet, tSec, t, lineup);
      ref.position.set(position[0], position[1], position[2]);
      scaleRefs.current[idx]?.scale.setScalar(radius);
      labelRefs.current[idx]?.position.set(0, radius * 1.25, 0);
    });

    // The Sun shrinks away for the lineup, and its light swaps for a key light
    if (sunRef.current) {
      sunRef.current.scale.setScalar(Math.max(1e-4, sunRadius(t) * (1 - lineupEase)));
      sunRef.current.visible = lineupEase < 0.99;
    }
    if (sunLightRef.current) {
      // Sunlight fades with distance in the museum layout; true scale would leave
      // the outer planets black, so flatten it as the layout stretches out
      sunLightRef.current.decay = 1 - t;
      sunLightRef.current.intensity = (3 + (0.45 - 3) * t) * (1 - lineupEase);
    }
    if (lineupLightRef.current) lineupLightRef.current.intensity = 2.2 * lineupEase;

    // Handle fly-to requests from BodySelector once positions are current
    const { pendingFlyToBody, setPendingFlyToBody } = state;
    if (pendingFlyToBody) {
      const object = bodyObjects.get(pendingFlyToBody);
      if (object) {
        flyToBody(pendingFlyToBody, object);
        setPendingFlyToBody(null);
      }
    }
  });

  const cameraMode = useAppStore(s => s.cameraMode);
  const selectedBody = useAppStore(s => s.selectedBody);

  // Shown in the overview and when viewing any body other than Earth, which has
  // its own detailed globe. The teaching view owns the scene while it is active.
  const visible =
    cameraMode === 'solarSystem' || (cameraMode === 'planet' && selectedBody !== 'Earth');
  if (!visible) return null;

  const moonElements = getElements('Moon')!;
  const haloOrbit = (name: string) => (selectedBody === name ? 0.95 : 0.4);

  return (
    <Suspense fallback={null}>
      <group ref={sunRef}>
        <Sun position={[0, 0, 0]} />
        <Beacon color="#ffd37a" size={14} />
      </group>
      <pointLight ref={sunLightRef} intensity={3} distance={0} decay={1} color="#fff5e0" />
      <directionalLight
        ref={lineupLightRef}
        position={[-30, 25, 60]}
        intensity={0}
        color="#fff5e0"
      />

      {PLANETS.filter(planet => !planet.parent).map(planet => {
        const elems = getElements(planet.name);
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
            distanceAt={blendedDistance}
            opacity={haloOrbit(planet.name)}
          />
        );
      })}
      <OrbitLine
        key="orbit-Halley"
        semiMajorAxisAU={HALLEY.elements.a}
        eccentricity={HALLEY.elements.e}
        inclination={HALLEY.elements.i}
        ascendingNode={HALLEY.elements.omega}
        argPerihelion={HALLEY.elements.w}
        color={HALLEY.color}
        distanceAt={blendedDistance}
        opacity={selectedBody === HALLEY.name ? 0.95 : 0.3}
      />
      <Comet />
      <LightPulse />

      {PLANETS.map((planet, idx) => (
        <group
          key={planet.name}
          ref={el => {
            planetRefs.current[idx] = el;
            if (el) bodyObjects.set(planet.name, el);
            else bodyObjects.delete(planet.name);
          }}
          onClick={e => handlePlanetClick(e, planet.name)}
        >
          {/* Scaled each frame, so geometry is built once at unit radius */}
          <group
            ref={el => {
              scaleRefs.current[idx] = el;
            }}
          >
            {/* Tilt only the body and rings, so the label stays upright */}
            <group rotation={[planet.axialTilt, 0, 0]}>
              <Planet
                radius={1}
                texture={planet.texture}
                axialTilt={0}
                rotationSpeed={planet.rotationSpeed}
                position={[0, 0, 0]}
              />
              {planet.rings === 'saturn' && (
                <PlanetRings innerRadius={1.3} outerRadius={2.4} ringStyle="saturn" />
              )}
              {planet.rings === 'uranus' && (
                <PlanetRings innerRadius={1.6} outerRadius={2.0} ringStyle="uranus" />
              )}
            </group>
          </group>
          <Beacon color={planet.orbitColor} />
          {planet.name === 'Earth' && (
            <OrbitLine
              semiMajorAxisAU={moonElements.a}
              eccentricity={moonElements.e}
              inclination={moonElements.i}
              ascendingNode={moonElements.omega}
              argPerihelion={moonElements.w}
              color="#c9d3e0"
              distanceAt={(au, blend) => moonDistance(au, moonElements.a, blend)}
              opacity={0.35}
            />
          )}
          {cameraMode === 'solarSystem' && (
            <group
              ref={el => {
                labelRefs.current[idx] = el;
              }}
            >
              {planet.parent ? (
                <MoonLabel name={planet.name} color={planet.orbitColor} />
              ) : (
                <PlanetLabel name={planet.name} offset={0} color={planet.orbitColor} />
              )}
            </group>
          )}
        </group>
      ))}
    </Suspense>
  );
}
