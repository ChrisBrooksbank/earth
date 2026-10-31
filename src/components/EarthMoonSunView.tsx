import { Html, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useAppStore } from '../store/appStore';
import { GLASS_PANEL_STYLE } from '../styles/glass';
import { isMobile } from '../lib/isMobile';
import { formatRate, moonPhase, simClock } from '../lib/simClock';
import { earthQuaternionSunFromMinusX } from '../lib/earthOrientation';
import { moonLitPath } from '../lib/moonDisc';
import { MOON_ORBIT_TILT, moonNodeFrameAngle, nextEclipse, sunNodeOffsetDeg } from '../lib/eclipse';
import { chase, logMix, smoothstep01 } from '../lib/solarScale';
import { glowTexture } from '../lib/glowTexture';
import { useSimTime } from '../hooks/useSimTime';
import { EARTH_MOON_SUN_REAL_VIEW, EARTH_MOON_SUN_VIEW } from './CameraController';

const EARTH_RADIUS = 0.9;

// Each pair is [diagram, true scale]. True scale keeps the real proportions:
// the Sun is 109 Earth-widths across and 23,481 Earth-radii away, the Moon is
// 0.2727 Earth-widths across and 60.3 Earth-radii away.
const SUN_DISTANCE: [number, number] = [4.7, EARTH_RADIUS * 23_481];
const SUN_RADIUS: [number, number] = [1.05, EARTH_RADIUS * 109.1];
const MOON_ORBIT_RADIUS: [number, number] = [2.85, EARTH_RADIUS * 60.3];
const MOON_RADIUS: [number, number] = [0.24, EARTH_RADIUS * 0.2727];
/** The diagram exaggerates the Moon's orbital tilt so it visibly misses Earth's shadow. */
const MOON_TILT: [number, number] = [(16 * Math.PI) / 180, MOON_ORBIT_TILT];
/** Where Earth's shadow cone starts (x), and how wide and long it is. */
const SHADOW_START: [number, number] = [0.3, 0];
const SHADOW_BASE: [number, number] = [0.78, EARTH_RADIUS];
const SHADOW_LENGTH: [number, number] = [
  3.9,
  (EARTH_RADIUS * SUN_DISTANCE[1]) / (SUN_RADIUS[1] - EARTH_RADIUS),
];
/** Extra width of the penumbra's fuzzy edge beyond the umbra, at the Moon. */
const PENUMBRA_SOFTNESS: [number, number] = [0.3, 0.55];

/** Blend a parameter between its diagram and true-scale values (geometric). */
const mix = (pair: [number, number], t: number) => logMix(pair[0], pair[1], t);
/** Linear blend, for values that can be zero. */
const lin = (pair: [number, number], t: number) => pair[0] + (pair[1] - pair[0]) * t;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const _moonWorld = new THREE.Vector3();

/** A unit circle in the XZ plane, drawn as a thin line that stays thin at any scale. */
function buildUnitCircle(): THREE.BufferGeometry {
  const points: number[] = [];
  for (let i = 0; i < 160; i++) {
    const a = (i / 160) * Math.PI * 2;
    points.push(Math.cos(a), 0, Math.sin(a));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
  return geo;
}

function Label({
  children,
  position,
  factor = 12,
}: {
  children: React.ReactNode;
  position: [number, number, number];
  /** Label size is relative to this camera distance; raise it for far-out views */
  factor?: number;
}) {
  return (
    <Html position={position} center distanceFactor={factor} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          padding: '4px 8px',
          borderRadius: '4px',
          background: 'rgba(0,0,0,0.62)',
          color: '#fff',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        {children}
      </div>
    </Html>
  );
}

function MoonPhaseDisc({ phase }: { phase: number }) {
  const r = 27;
  return (
    <svg
      width={2 * r}
      height={2 * r}
      viewBox={`0 0 ${2 * r} ${2 * r}`}
      aria-hidden="true"
      style={{
        borderRadius: '50%',
        background: '#151515',
        border: '1px solid rgba(255,255,255,0.22)',
        boxShadow: '0 0 18px rgba(255,255,255,0.12)',
        flexShrink: 0,
      }}
    >
      <path d={moonLitPath(phase, r)} fill="#e7e0d1" />
    </svg>
  );
}

function phaseName(phase: number) {
  if (phase < 0.06 || phase > 0.94) return 'New Moon';
  if (phase < 0.19) return 'Waxing Crescent';
  if (phase < 0.31) return 'First Quarter';
  if (phase < 0.44) return 'Waxing Gibbous';
  if (phase < 0.56) return 'Full Moon';
  if (phase < 0.69) return 'Waning Gibbous';
  if (phase < 0.81) return 'Last Quarter';
  return 'Waning Crescent';
}

const PANEL_BUTTON: React.CSSProperties = {
  flex: 1,
  border: '1px solid rgba(255,255,255,0.25)',
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
  borderRadius: '4px',
  padding: '7px 8px',
  fontSize: '12px',
  fontFamily: 'inherit',
  cursor: 'pointer',
};

export function EarthMoonSunPanel() {
  const cameraMode = useAppStore(s => s.cameraMode);
  const timeMultiplier = useAppStore(s => s.timeMultiplier);
  const isPaused = useAppStore(s => s.isPaused);
  const reversed = useAppStore(s => s.timeDirection === -1);
  const phase = useAppStore(s => s.earthMoonSunPhase);
  const real = useAppStore(s => s.emsRealScale);
  const simMs = useSimTime();
  const [jumped, setJumped] = useState<string | null>(null);

  if (cameraMode !== 'earthMoonSun') return null;

  const offset = Math.abs(sunNodeOffsetDeg(simMs));
  const inSeason = offset < 15.4;

  function toggleScale() {
    const state = useAppStore.getState();
    state.setEmsRealScale(!real);
    state.setFlyTarget(real ? EARTH_MOON_SUN_VIEW : EARTH_MOON_SUN_REAL_VIEW);
  }

  function jumpToEclipse() {
    const eclipse = nextEclipse(simClock.ms + 86_400_000);
    const state = useAppStore.getState();
    simClock.ms = eclipse.ms;
    state.setTimeDirection(1);
    state.setIsPaused(true);
    const when = new Date(eclipse.ms).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
    setJumped(
      eclipse.kind === 'lunar'
        ? `Lunar eclipse, about ${when}: the full Moon crosses Earth's shadow.`
        : `Solar eclipse, about ${when}: the new Moon crosses the Sun-Earth line.`
    );
  }

  return (
    <div
      style={{
        ...GLASS_PANEL_STYLE,
        position: 'absolute',
        right: '24px',
        bottom: isMobile ? '96px' : '24px',
        width: isMobile ? 'calc(100vw - 48px)' : '320px',
        maxHeight: isMobile ? '38vh' : 'calc(100vh - 120px)',
        overflowY: 'auto',
        padding: '16px',
        lineHeight: 1.45,
        fontSize: '13px',
      }}
    >
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '12px' }}>
        <MoonPhaseDisc phase={phase} />
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>Earth-Moon-Sun View</div>
          <div style={{ color: 'rgba(255,255,255,0.65)' }}>
            {isPaused
              ? 'Paused'
              : `Running ${reversed ? 'backward ' : ''}at ${formatRate(timeMultiplier)}`}
          </div>
        </div>
      </div>
      <div style={{ marginBottom: '10px', color: 'rgba(255,255,255,0.86)' }}>
        Current phase cue: <strong>{phaseName(phase)}</strong>
      </div>
      <div style={{ color: 'rgba(255,255,255,0.72)' }}>
        {real ? (
          <>
            <strong style={{ color: '#fff' }}>True scale.</strong> The Moon really is about 60
            Earth-radii away, and Earth&apos;s shadow is a thin needle. The Sun is 109 times wider
            than Earth and 23,000 Earth-radii away, far off the left edge, so its light arrives
            almost perfectly parallel.
          </>
        ) : (
          <>
            <strong style={{ color: '#fff' }}>Not to scale.</strong> Earth and the Moon are in true
            proportion, but the Moon is really about 60 Earth-radii away, and the Sun is 109 times
            wider than Earth and 23,000 Earth-radii away. Sunlight travels left to right: Earth has
            day on the lit half, night on the dark half, and sunrise or sunset along the boundary.
          </>
        )}
      </div>
      <div style={{ marginTop: '10px', color: 'rgba(255,255,255,0.72)' }}>
        The Moon&apos;s orbit is tilted about 5°, so most months it passes above or below
        Earth&apos;s shadow.{' '}
        <strong style={{ color: inSeason ? '#ffd27a' : '#fff' }}>
          {inSeason
            ? `Eclipse season now: the Sun is ${offset.toFixed(0)}° from where the orbits cross.`
            : 'No eclipse season now.'}
        </strong>
      </div>
      {jumped && (
        <div style={{ marginTop: '8px', color: '#ffd27a' }}>
          {jumped} <span style={{ opacity: 0.7 }}>(Approximate. Press play to watch it pass.)</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button style={PANEL_BUTTON} onClick={toggleScale} aria-pressed={real}>
          {real ? 'Back to diagram' : 'True scale'}
        </button>
        <button style={PANEL_BUTTON} onClick={jumpToEclipse}>
          Next eclipse
        </button>
      </div>
    </div>
  );
}

export default function EarthMoonSunView() {
  const earthRef = useRef<THREE.Group>(null);
  const sunRef = useRef<THREE.Group>(null);
  const sunLightRef = useRef<THREE.PointLight>(null);
  const raysRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const nodeRef = useRef<THREE.Group>(null);
  const tiltRef = useRef<THREE.Group>(null);
  const moonOrbitRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.LineLoop>(null);
  const moonGroupRef = useRef<THREE.Group>(null);
  const moonMeshRef = useRef<THREE.Mesh>(null);
  const moonDotRef = useRef<THREE.Points>(null);
  const lastReportedPhaseRef = useRef(-1);
  const blend = useRef(0);
  const real = useAppStore(s => s.emsRealScale);
  const [earthMap, moonMap] = useTexture(['/textures/earth_day.jpg', '/textures/moon_color.jpg']);

  const shadowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#080b16',
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );
  const sunHaloMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ff6b1a',
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const ringGeometry = useMemo(() => buildUnitCircle(), []);
  const dotGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
    return geo;
  }, []);
  // At true scale the Moon is a few pixels, and a new Moon is unlit: a dot keeps it findable
  const dotMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 7,
        sizeAttenuation: false,
        map: glowTexture(),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  const ringMaterial = useMemo(
    () => new THREE.LineBasicMaterial({ color: '#b7c2d0', transparent: true, opacity: 0.55 }),
    []
  );
  const moonMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: moonMap,
        roughness: 0.95,
        bumpMap: moonMap,
        bumpScale: 0.035,
      }),
    [moonMap]
  );

  useEffect(
    () => () => {
      shadowMaterial.dispose();
      sunHaloMaterial.dispose();
      ringGeometry.dispose();
      dotGeometry.dispose();
      dotMaterial.dispose();
      ringMaterial.dispose();
      moonMaterial.dispose();
    },
    [
      shadowMaterial,
      sunHaloMaterial,
      ringGeometry,
      ringMaterial,
      moonMaterial,
      dotGeometry,
      dotMaterial,
    ]
  );

  // Phase and spin come from the shared simulation clock, so the Moon shows its real phase
  useFrame((_state, delta) => {
    const target = useAppStore.getState().emsRealScale ? 1 : 0;
    blend.current = chase(blend.current, target, delta, 2.2);
    const e = smoothstep01(blend.current);

    const phase = moonPhase();
    if (Math.abs(phase - lastReportedPhaseRef.current) > 0.01) {
      useAppStore.getState().setEarthMoonSunPhase(phase);
      lastReportedPhaseRef.current = phase;
    }
    // Real tilt, season and time of day, turned so sunlight arrives from the left (-x)
    if (earthRef.current) earthQuaternionSunFromMinusX(undefined, earthRef.current.quaternion);

    // The Sun: further and bigger as the scene moves to true scale
    const sunX = -mix(SUN_DISTANCE, e);
    sunRef.current?.position.set(sunX, 0, 0);
    sunRef.current?.scale.setScalar(mix(SUN_RADIUS, e));
    sunLightRef.current?.position.set(sunX, 0, 0);
    if (raysRef.current) {
      raysRef.current.scale.setScalar(Math.max(1e-3, 1 - e));
      raysRef.current.visible = e < 0.98;
    }

    // The Moon's tilted orbit: its crossing points (nodes) turn with the real
    // calendar, which is what limits eclipses to two short seasons a year.
    // The Moon mesh sits at +x (away from the Sun), so offset by π: phase 0 puts it sunward (new)
    const nodeAngle = moonNodeFrameAngle(simClock.ms);
    const angle = (phase + 0.5) * Math.PI * 2;
    const orbitRadius = mix(MOON_ORBIT_RADIUS, e);
    const moonRadius = mix(MOON_RADIUS, e);
    if (nodeRef.current) nodeRef.current.rotation.y = nodeAngle;
    if (tiltRef.current) tiltRef.current.rotation.x = mix(MOON_TILT, e);
    if (moonOrbitRef.current) moonOrbitRef.current.rotation.y = angle - nodeAngle;
    ringRef.current?.scale.setScalar(orbitRadius);
    moonGroupRef.current?.position.set(orbitRadius, 0, 0);
    moonMeshRef.current?.scale.setScalar(moonRadius);

    // Earth's shadow: a cone pointing away from the Sun
    const start = lin(SHADOW_START, e);
    const length = mix(SHADOW_LENGTH, e);
    const base = mix(SHADOW_BASE, e);
    if (shadowRef.current) {
      shadowRef.current.position.set(start + length / 2, 0, 0);
      shadowRef.current.scale.set(base, length, base);
    }

    // Dim and redden the Moon as it enters the penumbra and umbra of that shadow
    if (moonMeshRef.current) {
      moonMeshRef.current.getWorldPosition(_moonWorld);
      const x = _moonWorld.x;
      const fromAxis = Math.hypot(_moonWorld.y, _moonWorld.z);
      let umbra = 0;
      let penumbra = 0;
      if (x > start) {
        const umbraRadius = Math.max(0, base * (1 - (x - start) / length));
        const penumbraRadius = umbraRadius + lin(PENUMBRA_SOFTNESS, e);
        umbra = clamp01((umbraRadius + moonRadius - fromAxis) / (2 * moonRadius));
        penumbra = clamp01((penumbraRadius + moonRadius - fromAxis) / (2 * moonRadius));
      }
      const brightness = 1 - 0.5 * penumbra - 0.45 * umbra;
      moonMaterial.color.setRGB(
        brightness * (1 - umbra * 0.25),
        brightness * (1 - umbra * 0.72),
        brightness * (1 - umbra * 0.86)
      );
      const dot = moonDotRef.current;
      if (dot) {
        const dotMat = dot.material as THREE.PointsMaterial;
        // Visible only at true scale; wears the same dimming and red as the Moon
        dotMat.opacity = Math.max(0.12, brightness) * e;
        dotMat.color.copy(moonMaterial.color);
        dot.visible = e > 0.02;
      }
    }
  });

  const labelFactor = real ? 110 : 12;

  return (
    <group>
      <ambientLight intensity={0.05} />
      {/* Sunlight does not fade over the distances in this view, so it has no falloff:
          the Moon is lit as brightly as Earth, as it is in reality */}
      <pointLight ref={sunLightRef} intensity={1.1} distance={0} decay={0} color="#fff1c7" />

      <group ref={sunRef} position={[-SUN_DISTANCE[0], 0, 0]} scale={SUN_RADIUS[0]}>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshBasicMaterial color="#ffb02e" />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.45, 64, 64]} />
          <primitive object={sunHaloMaterial} attach="material" />
        </mesh>
      </group>

      <group ref={earthRef} position={[0, 0, 0]}>
        {/* Spin axis, drawn through the poles */}
        <mesh>
          <cylinderGeometry args={[0.018, 0.018, EARTH_RADIUS * 3.3, 12]} />
          <meshBasicMaterial color="#9fd2ff" transparent opacity={0.75} />
        </mesh>
        <mesh>
          <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
          <meshStandardMaterial map={earthMap} roughness={0.75} metalness={0.02} />
        </mesh>
        <mesh>
          <sphereGeometry args={[EARTH_RADIUS * 1.035, 64, 64]} />
          <meshBasicMaterial color="#74b8ff" transparent opacity={0.13} side={THREE.BackSide} />
        </mesh>
      </group>

      <mesh ref={shadowRef} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[1, 1, 48, 1, true]} />
        <primitive object={shadowMaterial} attach="material" />
      </mesh>

      {/* node line (where the Moon's orbit crosses Earth's) > tilt > the Moon's turn around Earth */}
      <group ref={nodeRef}>
        <group ref={tiltRef}>
          <group ref={moonOrbitRef}>
            <lineLoop ref={ringRef} geometry={ringGeometry} material={ringMaterial} />
            {/* Fixed within the rotating orbit group, so it stays tidally locked to Earth */}
            <group ref={moonGroupRef} position={[MOON_ORBIT_RADIUS[0], 0, 0]}>
              <mesh ref={moonMeshRef} scale={MOON_RADIUS[0]} material={moonMaterial}>
                <sphereGeometry args={[1, 64, 64]} />
              </mesh>
              <points
                ref={moonDotRef}
                geometry={dotGeometry}
                material={dotMaterial}
                frustumCulled={false}
              />
            </group>
          </group>
        </group>
      </group>

      <group ref={raysRef}>
        <mesh position={[-2.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.01, 0.01, 2.8, 8]} />
          <meshBasicMaterial color="#ffd27a" transparent opacity={0.55} />
        </mesh>
        <mesh position={[-2.15, 0.28, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.01, 0.01, 2.45, 8]} />
          <meshBasicMaterial color="#ffd27a" transparent opacity={0.35} />
        </mesh>
        <mesh position={[-2.15, -0.28, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.01, 0.01, 2.45, 8]} />
          <meshBasicMaterial color="#ffd27a" transparent opacity={0.35} />
        </mesh>
      </group>

      {real ? (
        <>
          <Label position={[-34, 6, 0]} factor={labelFactor}>
            To the Sun: 23,000 Earth-radii that way
          </Label>
          <Label position={[0, 4, 0]} factor={labelFactor}>
            Day/night boundary
          </Label>
          <Label position={[0, 3, -58]} factor={labelFactor}>
            Moon orbit: 60 Earth-radii
          </Label>
          <Label position={[110, 6, 0]} factor={labelFactor}>
            Earth&apos;s shadow
          </Label>
        </>
      ) : (
        <>
          <Label position={[-3.25, 1.35, 0]}>Sunlight source</Label>
          <Label position={[0, 1.55, 0]}>Day/night boundary</Label>
          <Label position={[2.4, 1.3, 0]}>Moon orbit and phases</Label>
          <Label position={[1.9, -0.82, 0]}>Eclipse shadow path</Label>
        </>
      )}
    </group>
  );
}
