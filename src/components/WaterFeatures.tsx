import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { lonLatToXYZ } from '../lib/geo-utils';
import { useAppStore } from '../store/appStore';

// Between surface (1.0) and borders (1.001)
const WATER_RADIUS = 1.0005;

// Only show water features when camera is closer than this
const VISIBILITY_THRESHOLD = 4.0;

type GeoJsonFeature = {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: number[][] | number[][][] | number[][][][];
  };
};

type GeoJsonCollection = {
  features: GeoJsonFeature[];
};

function buildRiverGeometry(data: GeoJsonCollection): THREE.BufferGeometry {
  const vertices: number[] = [];

  for (const feature of data.features) {
    const { geometry } = feature;
    if (geometry.type === 'LineString') {
      const coords = geometry.coordinates as number[][];
      for (let i = 0; i < coords.length - 1; i++) {
        const a = coords[i] as [number, number];
        const b = coords[i + 1] as [number, number];
        const [x1, y1, z1] = lonLatToXYZ(a[0], a[1], WATER_RADIUS);
        const [x2, y2, z2] = lonLatToXYZ(b[0], b[1], WATER_RADIUS);
        vertices.push(x1, y1, z1, x2, y2, z2);
      }
    } else if (geometry.type === 'MultiLineString') {
      const lines = geometry.coordinates as number[][][];
      for (const line of lines) {
        for (let i = 0; i < line.length - 1; i++) {
          const a = line[i] as [number, number];
          const b = line[i + 1] as [number, number];
          const [x1, y1, z1] = lonLatToXYZ(a[0], a[1], WATER_RADIUS);
          const [x2, y2, z2] = lonLatToXYZ(b[0], b[1], WATER_RADIUS);
          vertices.push(x1, y1, z1, x2, y2, z2);
        }
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
  return geo;
}

function buildLakeGeometry(data: GeoJsonCollection): THREE.BufferGeometry {
  const vertices: number[] = [];

  for (const feature of data.features) {
    const { geometry } = feature;
    const polygons: number[][][] =
      geometry.type === 'Polygon'
        ? [geometry.coordinates as number[][]]
        : geometry.type === 'MultiPolygon'
          ? (geometry.coordinates as number[][][][]).map(p => p[0]!)
          : [];

    for (const ring of polygons) {
      if (!ring) continue;
      for (let i = 0; i < ring.length - 1; i++) {
        const a = ring[i] as [number, number];
        const b = ring[i + 1] as [number, number];
        const [x1, y1, z1] = lonLatToXYZ(a[0], a[1], WATER_RADIUS);
        const [x2, y2, z2] = lonLatToXYZ(b[0], b[1], WATER_RADIUS);
        vertices.push(x1, y1, z1, x2, y2, z2);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
  return geo;
}

const riverMaterial = new THREE.LineBasicMaterial({
  color: 0x4488cc,
  transparent: true,
  opacity: 0.5,
  depthWrite: false,
});

const lakeMaterial = new THREE.LineBasicMaterial({
  color: 0x2266aa,
  transparent: true,
  opacity: 0.6,
  depthWrite: false,
});

export default function WaterFeatures() {
  const [riverGeo, setRiverGeo] = useState<THREE.BufferGeometry | null>(null);
  const [lakeGeo, setLakeGeo] = useState<THREE.BufferGeometry | null>(null);
  const visible = useAppStore(s => s.cameraDistance <= VISIBILITY_THRESHOLD);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [riversRes, lakesRes] = await Promise.all([
          fetch('/data/rivers.json'),
          fetch('/data/lakes.json'),
        ]);
        if (cancelled) return;
        const [rivers, lakes] = (await Promise.all([riversRes.json(), lakesRes.json()])) as [
          GeoJsonCollection,
          GeoJsonCollection,
        ];
        if (cancelled) return;
        setRiverGeo(buildRiverGeometry(rivers));
        setLakeGeo(buildLakeGeometry(lakes));
      } catch {
        // Silently fail if data not available
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!riverGeo && !lakeGeo) return null;
  if (!visible) return null;

  return (
    <group>
      {riverGeo && <lineSegments geometry={riverGeo} material={riverMaterial} />}
      {lakeGeo && <lineSegments geometry={lakeGeo} material={lakeMaterial} />}
    </group>
  );
}
