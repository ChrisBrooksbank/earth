import { Html, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type React from 'react';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useAppStore } from '../store/appStore';
import { GLASS_PANEL_STYLE } from '../styles/glass';
import { isMobile } from '../lib/isMobile';

const SUN_POSITION: [number, number, number] = [-4.7, 0, 0];
const EARTH_POSITION: [number, number, number] = [0, 0, 0];
const MOON_ORBIT_RADIUS = 2.85;
const EARTH_RADIUS = 0.9;
const MOON_RADIUS = 0.24;
const SUN_RADIUS = 1.05;
const EARTH_TILT = 23.44 * (Math.PI / 180);

function Label({
  children,
  position,
}: {
  children: React.ReactNode;
  position: [number, number, number];
}) {
  return (
    <Html position={position} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
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
  const clip = phase < 0.5 ? 50 + phase * 100 : 150 - phase * 100;
  const waxing = phase <= 0.5;

  return (
    <div
      style={{
        width: 54,
        height: 54,
        borderRadius: '50%',
        background: '#151515',
        border: '1px solid rgba(255,255,255,0.22)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 0 18px rgba(255,255,255,0.12)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#e7e0d1',
          clipPath: waxing
            ? `ellipse(${clip}% 50% at 100% 50%)`
            : `ellipse(${clip}% 50% at 0% 50%)`,
        }}
      />
    </div>
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

export function EarthMoonSunPanel() {
  const cameraMode = useAppStore(s => s.cameraMode);
  const timeMultiplier = useAppStore(s => s.timeMultiplier);
  const isPaused = useAppStore(s => s.isPaused);
  const phase = useAppStore(s => s.earthMoonSunPhase);

  if (cameraMode !== 'earthMoonSun') return null;

  return (
    <div
      style={{
        ...GLASS_PANEL_STYLE,
        position: 'absolute',
        right: '24px',
        bottom: isMobile ? '96px' : '24px',
        width: isMobile ? 'calc(100vw - 48px)' : '320px',
        maxHeight: isMobile ? '38vh' : 'none',
        overflowY: isMobile ? 'auto' : 'visible',
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
            {isPaused ? 'Paused' : 'Running'} at {timeMultiplier.toLocaleString()}x
          </div>
        </div>
      </div>
      <div style={{ marginBottom: '10px', color: 'rgba(255,255,255,0.86)' }}>
        Current phase cue: <strong>{phaseName(phase)}</strong>
      </div>
      <div style={{ color: 'rgba(255,255,255,0.72)' }}>
        This explanatory model is not to scale. Sunlight travels left to right. Earth&apos;s lit
        half has day, the dark half has night, and sunrise or sunset happens along the boundary.
      </div>
      <div style={{ marginTop: '10px', color: 'rgba(255,255,255,0.72)' }}>
        Moon phases depend on how much of its sunlit half faces us. Lineups with the shadow cone
        show eclipse geometry.
      </div>
    </div>
  );
}

export default function EarthMoonSunView() {
  const moonRef = useRef<THREE.Group>(null);
  const earthRef = useRef<THREE.Group>(null);
  const moonOrbitRef = useRef<THREE.Group>(null);
  const phaseRef = useRef(0.14);
  const lastReportedPhaseRef = useRef(-1);
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

  useFrame((_state, delta) => {
    const { timeMultiplier, isPaused, setEarthMoonSunPhase } = useAppStore.getState();
    if (!isPaused) {
      const earthSpeed = (2 * Math.PI) / 24;
      phaseRef.current = (phaseRef.current + (delta * timeMultiplier) / 29.5) % 1;
      if (Math.abs(phaseRef.current - lastReportedPhaseRef.current) > 0.01) {
        setEarthMoonSunPhase(phaseRef.current);
        lastReportedPhaseRef.current = phaseRef.current;
      }
      if (moonOrbitRef.current) moonOrbitRef.current.rotation.y = phaseRef.current * Math.PI * 2;
      if (earthRef.current) earthRef.current.rotation.y += delta * earthSpeed * timeMultiplier;
    } else if (moonOrbitRef.current) {
      moonOrbitRef.current.rotation.y = phaseRef.current * Math.PI * 2;
    }
    if (moonRef.current) moonRef.current.rotation.y += delta * 0.15;
  });

  return (
    <group>
      <ambientLight intensity={0.05} />
      <pointLight
        position={SUN_POSITION}
        intensity={5.5}
        distance={80}
        decay={1.15}
        color="#fff1c7"
      />

      <group position={SUN_POSITION}>
        <mesh>
          <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
          <meshBasicMaterial color="#ffb02e" />
        </mesh>
        <mesh>
          <sphereGeometry args={[SUN_RADIUS * 1.45, 64, 64]} />
          <primitive object={sunHaloMaterial} attach="material" />
        </mesh>
      </group>

      <group ref={earthRef} position={EARTH_POSITION} rotation={[EARTH_TILT, 0, 0]}>
        <mesh>
          <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
          <meshStandardMaterial map={earthMap} roughness={0.75} metalness={0.02} />
        </mesh>
        <mesh>
          <sphereGeometry args={[EARTH_RADIUS * 1.035, 64, 64]} />
          <meshBasicMaterial color="#74b8ff" transparent opacity={0.13} side={THREE.BackSide} />
        </mesh>
      </group>

      <group rotation={[0, 0, EARTH_TILT]}>
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.018, EARTH_RADIUS * 3.3, 12]} />
          <meshBasicMaterial color="#9fd2ff" transparent opacity={0.75} />
        </mesh>
      </group>

      <mesh position={[2.25, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.78, 3.9, 48, 1, true]} />
        <primitive object={shadowMaterial} attach="material" />
      </mesh>

      <group ref={moonOrbitRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[MOON_ORBIT_RADIUS, 0.012, 8, 160]} />
          <meshBasicMaterial color="#b7c2d0" transparent opacity={0.55} />
        </mesh>
        <group ref={moonRef} position={[MOON_ORBIT_RADIUS, 0, 0]}>
          <mesh>
            <sphereGeometry args={[MOON_RADIUS, 64, 64]} />
            <meshStandardMaterial
              map={moonMap}
              roughness={0.95}
              bumpMap={moonMap}
              bumpScale={0.035}
            />
          </mesh>
        </group>
      </group>

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

      <Label position={[-3.25, 1.35, 0]}>Sunlight source</Label>
      <Label position={[0, 1.55, 0]}>Day/night boundary</Label>
      <Label position={[1.95, 0.9, 0]}>Moon orbit and phases</Label>
      <Label position={[1.9, -0.82, 0]}>Eclipse shadow path</Label>
    </group>
  );
}
