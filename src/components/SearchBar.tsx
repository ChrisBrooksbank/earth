import { useState, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useAppStore } from '../store/appStore';
import { computeSearchTarget, searchCountryNames } from '../lib/countries';
import { GLASS_PANEL_STYLE } from '../styles/glass';
import { earthGroupRef } from './EarthGroup';
import { lonLatToXYZ } from '../lib/geo-utils';
import { isMobile } from '../lib/isMobile';

const PANEL_STYLE: React.CSSProperties = GLASS_PANEL_STYLE;

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const setFlyTarget = useAppStore(s => s.setFlyTarget);
  const setIsPaused = useAppStore(s => s.setIsPaused);
  const setSelectedCountry = useAppStore(s => s.setSelectedCountry);
  const enterPlanetView = useAppStore(s => s.enterPlanetView);
  const selectedBody = useAppStore(s => s.selectedBody);

  const suggestions = useMemo(() => searchCountryNames(query), [query]);

  function flyToCountry(name: string) {
    const target = computeSearchTarget(name);
    if (!target) return;

    const flyToTarget = () => {
      const earth = earthGroupRef.current;
      if (!earth) return;

      // Pause so the country stays centred, then move the camera (not the Earth)
      // to look straight down on it. Leaving Earth's orientation alone keeps its
      // spin axis and the day/night terminator correct.
      setIsPaused(true);
      setSelectedCountry(name);

      earth.updateWorldMatrix(true, false);
      const direction = new THREE.Vector3(...lonLatToXYZ(target.lon, target.lat, 1))
        .applyMatrix4(earth.matrixWorld)
        .normalize();
      setFlyTarget({
        position: direction.multiplyScalar(target.zoomDistance).toArray(),
        lookAt: [0, 0, 0],
      });
    };

    if (selectedBody !== 'Earth') {
      enterPlanetView('Earth');
      window.setTimeout(flyToTarget, 50);
      return;
    }

    flyToTarget();
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
      const match = suggestions[0];
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
