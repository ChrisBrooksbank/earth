import { useState, useRef, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import countriesData from '../data/countries.json';
import { GLASS_PANEL_STYLE } from '../styles/glass';
import { earthGroupRef } from './EarthGroup';
import { lonLatToXYZ } from '../lib/geo-utils';

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

function computeCentroid(name: string): [number, number] | null {
  const feature = features.find(f => (f.properties.NAME as string) === name);
  if (!feature) return null;

  let sumLon = 0;
  let sumLat = 0;
  let count = 0;

  const processRing = (ring: number[][]) => {
    for (const pt of ring) {
      sumLon += pt[0] as number;
      sumLat += pt[1] as number;
      count++;
    }
  };

  if (feature.geometry.type === 'Polygon') {
    const outer = feature.geometry.coordinates[0];
    if (outer) processRing(outer);
  } else {
    // MultiPolygon: use the largest polygon (most vertices)
    let bestRing: number[][] | null = null;
    let bestCount = 0;
    for (const polygon of feature.geometry.coordinates) {
      const outer = polygon[0];
      if (outer && outer.length > bestCount) {
        bestCount = outer.length;
        bestRing = outer;
      }
    }
    if (bestRing) processRing(bestRing);
  }

  if (count === 0) return null;
  return [sumLon / count, sumLat / count];
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

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return COUNTRY_NAMES.filter(n => n.toLowerCase().includes(lower)).slice(0, 8);
  }, [query]);

  function flyToCountry(name: string) {
    const centroid = computeCentroid(name);
    if (!centroid) return;

    const [lon, lat] = centroid;

    // Rotate earth so the country faces the camera dead-center:
    // Y-rotation for longitude, X-rotation to tilt latitude to equator
    const [cx, , cz] = lonLatToXYZ(lon, lat, 1);
    const rotY = -Math.atan2(cx, cz);
    const latRad = lat * (Math.PI / 180);
    if (earthGroupRef.current) {
      earthGroupRef.current.rotation.order = 'YXZ';
      earthGroupRef.current.rotation.set(latRad, rotY, 0);
    }

    setIsPaused(true);
    setSelectedCountry(name);

    // Country is now at the equator facing +Z, so camera flies straight in
    setFlyTarget({
      position: [0, 0, ZOOM_DISTANCE],
      lookAt: [0, 0, 0],
    });
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
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '260px',
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
