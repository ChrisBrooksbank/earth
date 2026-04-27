import { useState, useRef, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import countriesData from '../data/countries.json';
import { GLASS_PANEL_STYLE } from '../styles/glass';
import { earthGroupRef } from './EarthGroup';
import { lonLatToXYZ } from '../lib/geo-utils';
import { isMobile } from '../lib/isMobile';

type GeoJsonFeature = {
  type: 'Feature';
  geometry:
    | { type: 'Polygon'; coordinates: number[][][] }
    | { type: 'MultiPolygon'; coordinates: number[][][][] };
  properties: Record<string, unknown>;
};

const features = (countriesData as { features: GeoJsonFeature[] }).features;

const COUNTRY_NAMES: string[] = features
  .map(f => f.properties.NAME as string)
  .filter(Boolean)
  .sort();

interface RingCentroid {
  area: number;
  lon: number;
  lat: number;
  angularRadius: number;
}

function normalizeLon(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

function angularDistanceDeg(lonA: number, latA: number, lonB: number, latB: number): number {
  const toRad = Math.PI / 180;
  const aLat = latA * toRad;
  const bLat = latB * toRad;
  const deltaLon = (lonB - lonA) * toRad;
  const cosDistance =
    Math.sin(aLat) * Math.sin(bLat) + Math.cos(aLat) * Math.cos(bLat) * Math.cos(deltaLon);
  return Math.acos(Math.max(-1, Math.min(1, cosDistance))) / toRad;
}

function unwrapRing(ring: number[][]): [number, number][] {
  const points: [number, number][] = [];
  let previousLon: number | null = null;
  let offset = 0;

  for (const point of ring) {
    const rawLon = point[0];
    const rawLat = point[1];
    if (
      typeof rawLon !== 'number' ||
      typeof rawLat !== 'number' ||
      !Number.isFinite(rawLon) ||
      !Number.isFinite(rawLat)
    ) {
      continue;
    }

    let lon = rawLon + offset;
    if (previousLon !== null) {
      while (lon - previousLon > 180) {
        offset -= 360;
        lon -= 360;
      }
      while (lon - previousLon < -180) {
        offset += 360;
        lon += 360;
      }
    }

    points.push([lon, rawLat]);
    previousLon = lon;
  }

  return points;
}

function computeRingCentroid(ring: number[][]): RingCentroid | null {
  const points = unwrapRing(ring);
  if (points.length < 3) return null;

  let twiceArea = 0;
  let lonSum = 0;
  let latSum = 0;

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [lonA, latA] = points[j]!;
    const [lonB, latB] = points[i]!;
    const cross = lonA * latB - lonB * latA;
    twiceArea += cross;
    lonSum += (lonA + lonB) * cross;
    latSum += (latA + latB) * cross;
  }

  if (Math.abs(twiceArea) < 1e-9) return null;

  const lon = normalizeLon(lonSum / (3 * twiceArea));
  const lat = latSum / (3 * twiceArea);
  const angularRadius = points.reduce(
    (maxRadius, point) =>
      Math.max(maxRadius, angularDistanceDeg(lon, lat, normalizeLon(point[0]), point[1])),
    0
  );

  return {
    area: twiceArea / 2,
    lon,
    lat,
    angularRadius,
  };
}

function computeSearchTarget(
  name: string
): { lon: number; lat: number; zoomDistance: number } | null {
  const feature = features.find(f => (f.properties.NAME as string) === name);
  if (!feature) return null;

  const rings =
    feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates[0]]
      : feature.geometry.coordinates.map(polygon => polygon[0]);

  let bestCentroid: RingCentroid | null = null;

  for (const ring of rings) {
    if (!ring) continue;
    const centroid = computeRingCentroid(ring);
    if (centroid && (!bestCentroid || Math.abs(centroid.area) > Math.abs(bestCentroid.area))) {
      bestCentroid = centroid;
    }
  }

  if (!bestCentroid) return null;

  return {
    lon: bestCentroid.lon,
    lat: bestCentroid.lat,
    zoomDistance: Math.min(
      3.1,
      Math.max(ZOOM_DISTANCE, ZOOM_DISTANCE + bestCentroid.angularRadius / 60)
    ),
  };
}

const PANEL_STYLE: React.CSSProperties = GLASS_PANEL_STYLE;

const ZOOM_DISTANCE = 1.35;

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const setFlyTarget = useAppStore(s => s.setFlyTarget);
  const setIsPaused = useAppStore(s => s.setIsPaused);
  const setSelectedCountry = useAppStore(s => s.setSelectedCountry);
  const enterPlanetView = useAppStore(s => s.enterPlanetView);
  const selectedBody = useAppStore(s => s.selectedBody);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return COUNTRY_NAMES.filter(n => n.toLowerCase().includes(lower)).slice(0, 8);
  }, [query]);

  function flyToCountry(name: string) {
    const target = computeSearchTarget(name);
    if (!target) return;

    // Rotate earth so the country faces the camera dead-center:
    // Y-rotation for longitude, X-rotation to tilt latitude to equator
    const [cx, , cz] = lonLatToXYZ(target.lon, target.lat, 1);
    const rotY = -Math.atan2(cx, cz);
    const latRad = target.lat * (Math.PI / 180);
    const rotateAndFly = () => {
      if (!earthGroupRef.current) return;
      earthGroupRef.current.rotation.order = 'XYZ';
      earthGroupRef.current.rotation.set(latRad, rotY, 0);

      setIsPaused(true);
      setSelectedCountry(name);

      // Country is now at the equator facing +Z, so camera flies straight in
      setFlyTarget({
        position: [0, 0, target.zoomDistance],
        lookAt: [0, 0, 0],
      });
    };

    if (selectedBody !== 'Earth') {
      enterPlanetView('Earth');
      window.setTimeout(rotateAndFly, 50);
      return;
    }

    rotateAndFly();
  }

  function selectCountry(name: string) {
    setQuery(name);
    setOpen(false);
    inputRef.current?.blur();
    flyToCountry(name);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      // Use first suggestion if available, otherwise try exact match
      const match =
        suggestions[0] ?? COUNTRY_NAMES.find(n => n.toLowerCase() === query.trim().toLowerCase());
      if (match) {
        selectCountry(match);
      }
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: isMobile ? '72px' : '24px',
        left: isMobile ? '24px' : 'auto',
        right: '24px',
        width: isMobile ? 'auto' : 'min(260px, calc(100vw - 48px))',
        zIndex: 10,
      }}
    >
      <div style={{ ...PANEL_STYLE, padding: '8px 12px' }}>
        <input
          ref={inputRef}
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search country..."
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontSize: '13px',
            fontFamily: 'sans-serif',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {open && suggestions.length > 0 && (
        <div
          style={{
            ...PANEL_STYLE,
            borderRadius: '0 0 8px 8px',
            marginTop: '2px',
            overflow: 'hidden',
          }}
        >
          {suggestions.map(name => (
            <button
              key={name}
              onMouseDown={() => selectCountry(name)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.85)',
                cursor: 'pointer',
                fontSize: '13px',
                fontFamily: 'sans-serif',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
