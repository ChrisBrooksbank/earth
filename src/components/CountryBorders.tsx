import { useCallback, useRef, useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { countryFeatures as features, findCountry, isValidLonLat } from '../lib/countries';
import { lonLatToXYZ, xyzToLonLat } from '../lib/geo-utils';
import { useAppStore } from '../store/appStore';

// Slightly above Earth surface (1.000) and clouds (1.005)
const BORDER_RADIUS = 1.001;
// Highlight rendered just above borders to avoid z-fighting
const HIGHLIGHT_RADIUS = 1.002;
// Hit sphere must be outside clouds (1.005) so it receives pointer events first
const HIT_RADIUS = 1.006;

function buildBorderGeometry(): THREE.BufferGeometry {
  const vertices: number[] = [];

  const addRing = (ring: number[][]) => {
    for (let i = 0; i < ring.length - 1; i++) {
      const a = ring[i];
      const b = ring[i + 1];
      if (!isValidLonLat(a) || !isValidLonLat(b)) continue;
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
      const a = ring[i];
      const b = ring[i + 1];
      if (!isValidLonLat(a) || !isValidLonLat(b)) continue;
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
  const selectedCountry = useAppStore(s => s.selectedCountry);

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

  // Click (not drag) on the globe drops a location pin
  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 4 || !groupRef.current) return;
    e.stopPropagation();
    const localPoint = groupRef.current.worldToLocal(e.point.clone());
    const [lon, lat] = xyzToLonLat(localPoint.x, localPoint.y, localPoint.z);
    const { setPin, setSelectedCountry } = useAppStore.getState();
    setPin({ lon, lat });
    // Replace any highlight left over from a search with the clicked country
    setSelectedCountry(findCountry(lon, lat));
  }, []);

  const handlePointerOut = useCallback(() => {
    if (lastHoverRef.current !== null) {
      lastHoverRef.current = null;
      setHoveredCountry(null);
      onHoverCountry?.(null);
    }
  }, [onHoverCountry]);

  const highlightName = hoveredCountry ?? selectedCountry;
  const highlightGeo = highlightName ? getCountryGeometry(highlightName) : null;

  return (
    <group ref={groupRef}>
      <lineSegments geometry={borderGeometry} material={borderMaterial} />
      {highlightGeo && <lineSegments geometry={highlightGeo} material={highlightMaterial} />}
      <mesh onPointerMove={handlePointerMove} onPointerOut={handlePointerOut} onClick={handleClick}>
        <sphereGeometry args={[HIT_RADIUS, 32, 32]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}
