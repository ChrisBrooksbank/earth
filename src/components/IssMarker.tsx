import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type * as THREE from 'three';
import { lonLatToXYZ } from '../lib/geo-utils';
import { simClock } from '../lib/simClock';
import { useAppStore } from '../store/appStore';

const ISS_URL = 'https://api.wheretheiss.at/v1/satellites/25544';
const POLL_MS = 5000;
const EARTH_RADIUS_KM = 6371;
/** The feed is live, so only show it while the simulation is near the present. */
const MAX_CLOCK_OFFSET_MS = 2 * 60_000;

interface IssPosition {
  lat: number;
  lon: number;
  altitudeKm: number;
}

/** Live International Space Station position, polled from wheretheiss.at. */
export default function IssMarker() {
  const showIss = useAppStore(s => s.showIss);
  const [position, setPosition] = useState<IssPosition | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!showIss) return;
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(ISS_URL);
        if (!res.ok) return;
        const data = (await res.json()) as {
          latitude: number;
          longitude: number;
          altitude: number;
        };
        if (!cancelled) {
          setPosition({ lat: data.latitude, lon: data.longitude, altitudeKm: data.altitude });
        }
      } catch {
        // Network hiccup: keep the last known position and try again next poll
      }
    }
    void poll();
    const id = window.setInterval(() => void poll(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [showIss]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.visible = Math.abs(simClock.ms - Date.now()) < MAX_CLOCK_OFFSET_MS;
    }
  });

  if (!showIss || !position) return null;

  const radius = 1 + position.altitudeKm / EARTH_RADIUS_KM;
  return (
    <group ref={groupRef} position={lonLatToXYZ(position.lon, position.lat, radius)}>
      <mesh>
        <sphereGeometry args={[0.008, 16, 16]} />
        <meshBasicMaterial color="#ffd54a" />
      </mesh>
      <Html center zIndexRange={[0, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            transform: 'translateY(-16px)',
            color: '#ffd54a',
            fontSize: '11px',
            fontWeight: 600,
            textShadow: '0 0 4px #000',
            whiteSpace: 'nowrap',
          }}
        >
          ISS
        </div>
      </Html>
    </group>
  );
}
