import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import countriesData from '../data/countries.json';

// Must match Earth.tsx rotation speed to stay aligned with surface
const EARTH_ROTATION_SPEED = (2 * Math.PI) / 24;

// Slightly above Earth surface (1.000) and clouds (1.005)
const BORDER_RADIUS = 1.001;

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

  const features = (countriesData as { features: GeoJsonFeature[] }).features;
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

// Build geometry once at module init — no per-render allocations
const borderGeometry = buildBorderGeometry();

const borderMaterial = new THREE.LineBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.35,
  depthWrite: false,
});

export default function CountryBorders() {
  const linesRef = useRef<THREE.LineSegments>(null);

  useFrame((_state, delta) => {
    if (linesRef.current) {
      linesRef.current.rotation.y += EARTH_ROTATION_SPEED * delta;
    }
  });

  return <lineSegments ref={linesRef} geometry={borderGeometry} material={borderMaterial} />;
}
