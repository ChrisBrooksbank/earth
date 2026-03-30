import { useCallback, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import countriesData from '../data/countries.json';

// Must match Earth.tsx rotation speed to stay aligned with surface
const EARTH_ROTATION_SPEED = (2 * Math.PI) / 24;

// Slightly above Earth surface (1.000) and clouds (1.005)
const BORDER_RADIUS = 1.001;
// Highlight rendered just above borders to avoid z-fighting
const HIGHLIGHT_RADIUS = 1.002;
// Hit sphere must be outside clouds (1.005) so it receives pointer events first
const HIT_RADIUS = 1.006;

type PolygonRings = number[][][];
type MultiPolygonRings = number[][][][];

type GeoJsonGeometry =
  | { type: 'Polygon'; coordinates: PolygonRings }
  | { type: 'MultiPolygon'; coordinates: MultiPolygonRings };

type GeoJsonFeature = {
  type: 'Feature';
  geometry: GeoJsonGeometry;
  properties: Record<string, unknown>;
};

function lonLatToXYZ(lon: number, lat: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

function xyzToLonLat(x: number, y: number, z: number): [number, number] {
  const r = Math.sqrt(x * x + y * y + z * z);
  const phi = Math.acos(Math.max(-1, Math.min(1, y / r)));
  const lat = 90 - phi * (180 / Math.PI);
  let lon = Math.atan2(z, -x) * (180 / Math.PI) - 180;
  if (lon < -180) lon += 360;
  return [lon, lat];
}

function pointInRing(lon: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const pi = ring[i] as [number, number];
    const pj = ring[j] as [number, number];
    const xi = pi[0],
      yi = pi[1];
    const xj = pj[0],
      yj = pj[1];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

const features = (countriesData as { features: GeoJsonFeature[] }).features;

function findCountry(lon: number, lat: number): string | null {
  for (const feature of features) {
    const name = feature.properties.NAME as string;
    const { geometry } = feature;
    if (geometry.type === 'Polygon') {
      const outer = geometry.coordinates[0];
      const holes = geometry.coordinates.slice(1);
      if (outer && pointInRing(lon, lat, outer) && !holes.some(h => pointInRing(lon, lat, h))) {
        return name;
      }
    } else if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates) {
        const outer = polygon[0];
        const holes = polygon.slice(1);
        if (outer && pointInRing(lon, lat, outer) && !holes.some(h => pointInRing(lon, lat, h))) {
          return name;
        }
      }
    }
  }
  return null;
}

function buildBorderGeometry(): THREE.BufferGeometry {
  const vertices: number[] = [];

  const addRing = (ring: number[][]) => {
    for (let i = 0; i < ring.length - 1; i++) {
      const a = ring[i] as [number, number];
      const b = ring[i + 1] as [number, number];
      const [x1, y1, z1] = lonLatToXYZ(a[0], a[1], BORDER_RADIUS);
      const [x2, y2, z2] = lonLatToXYZ(b[0], b[1], BORDER_RADIUS);
      vertices.push(x1, y1, z1, x2, y2, z2);
    }
  };

  for (const feature of features) {
    const { geometry } = feature;
    if (geometry.type === 'Polygon') {
      for (const ring of geometry.coordinates) {
        addRing(ring);
      }
    } else if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates) {
        for (const ring of polygon) {
          addRing(ring);
        }
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
  return geo;
}

function buildCountryGeometry(name: string): THREE.BufferGeometry | null {
  const feature = features.find(f => (f.properties.NAME as string) === name);
  if (!feature) return null;

  const vertices: number[] = [];
  const addRing = (ring: number[][]) => {
    for (let i = 0; i < ring.length - 1; i++) {
      const a = ring[i] as [number, number];
      const b = ring[i + 1] as [number, number];
      const [x1, y1, z1] = lonLatToXYZ(a[0], a[1], HIGHLIGHT_RADIUS);
      const [x2, y2, z2] = lonLatToXYZ(b[0], b[1], HIGHLIGHT_RADIUS);
      vertices.push(x1, y1, z1, x2, y2, z2);
    }
  };

  const { geometry } = feature;
  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates) addRing(ring);
  } else if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      for (const ring of polygon) addRing(ring);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
  return geo;
}

// Build border geometry once at module init — no per-render allocations
const borderGeometry = buildBorderGeometry();
// Lazily built and cached per country on first hover
const countryGeometryCache = new Map<string, THREE.BufferGeometry | null>();

function getCountryGeometry(name: string): THREE.BufferGeometry | null {
  if (!countryGeometryCache.has(name)) {
    countryGeometryCache.set(name, buildCountryGeometry(name));
  }
  return countryGeometryCache.get(name) ?? null;
}

const borderMaterial = new THREE.LineBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.35,
  depthWrite: false,
});

const highlightMaterial = new THREE.LineBasicMaterial({
  color: 0xffff00,
  transparent: true,
  opacity: 0.9,
  depthWrite: false,
});

export default function CountryBorders({
  onHoverCountry,
}: {
  onHoverCountry?: (name: string | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const lastHoverRef = useRef<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += EARTH_ROTATION_SPEED * delta;
    }
  });

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (!groupRef.current) return;
      const localPoint = groupRef.current.worldToLocal(e.point.clone());
      const [lon, lat] = xyzToLonLat(localPoint.x, localPoint.y, localPoint.z);
      const name = findCountry(lon, lat);
      if (name !== lastHoverRef.current) {
        lastHoverRef.current = name;
        setHoveredCountry(name);
        onHoverCountry?.(name);
      }
    },
    [onHoverCountry]
  );

  const handlePointerOut = useCallback(() => {
    if (lastHoverRef.current !== null) {
      lastHoverRef.current = null;
      setHoveredCountry(null);
      onHoverCountry?.(null);
    }
  }, [onHoverCountry]);

  const highlightGeo = hoveredCountry ? getCountryGeometry(hoveredCountry) : null;

  return (
    <group ref={groupRef}>
      <lineSegments geometry={borderGeometry} material={borderMaterial} />
      {highlightGeo && <lineSegments geometry={highlightGeo} material={highlightMaterial} />}
      <mesh onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}>
        <sphereGeometry args={[HIT_RADIUS, 32, 32]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}
