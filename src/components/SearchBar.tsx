import { useState, useRef, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import countriesData from '../data/countries.json';

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

function lonLatToPosition(lon: number, lat: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

const PANEL_STYLE: React.CSSProperties = {
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(10px)',
  color: '#fff',
  borderRadius: '8px',
  fontFamily: 'sans-serif',
};

const CAMERA_DISTANCE = 2.8;

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const setFlyTarget = useAppStore(s => s.setFlyTarget);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return COUNTRY_NAMES.filter(n => n.toLowerCase().includes(lower)).slice(0, 8);
  }, [query]);

  function selectCountry(name: string) {
    setQuery(name);
    setOpen(false);
    inputRef.current?.blur();

    const centroid = computeCentroid(name);
    if (!centroid) return;

    const [lon, lat] = centroid;
    const [px, py, pz] = lonLatToPosition(lon, lat, CAMERA_DISTANCE);
    setFlyTarget({
      position: [px, py, pz],
      lookAt: [0, 0, 0],
    });
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
