import { useState, useRef, useMemo, useId } from 'react';
import * as THREE from 'three';
import { useAppStore } from '../store/appStore';
import { computeSearchTarget, findCountry } from '../lib/countries';
import { searchPlaces, type PlaceResult } from '../lib/places';
import { GLASS_PANEL_STYLE } from '../styles/glass';
import { earthQuaternion } from '../lib/earthOrientation';
import { lonLatToXYZ } from '../lib/geo-utils';
import { isMobile } from '../lib/isMobile';

const PANEL_STYLE: React.CSSProperties = GLASS_PANEL_STYLE;

/** Camera distance (Earth radii from centre) when flying to a city. */
const CITY_ZOOM_DISTANCE = 1.35;

/**
 * Pause and move the camera (not the Earth) to look straight down on a point.
 * Leaving Earth's orientation alone keeps its spin axis and the day/night
 * boundary correct.
 */
function flyToLonLat(lon: number, lat: number, distance: number) {
  const { setIsPaused, setFlyTarget } = useAppStore.getState();
  setIsPaused(true);
  // Use the orientation for the current simulated time directly: the globe
  // object only catches up on the next rendered frame (e.g. after a time jump)
  const direction = new THREE.Vector3(...lonLatToXYZ(lon, lat, 1))
    .applyQuaternion(earthQuaternion())
    .normalize();
  setFlyTarget({ position: direction.multiplyScalar(distance).toArray(), lookAt: [0, 0, 0] });
}

function placeKey(place: PlaceResult): string {
  return place.kind === 'city' ? `city:${place.name}:${place.country}` : `country:${place.name}`;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const setSelectedCountry = useAppStore(s => s.setSelectedCountry);
  const setPin = useAppStore(s => s.setPin);

  const suggestions = useMemo(() => searchPlaces(query), [query]);

  function selectPlace(place: PlaceResult) {
    setQuery(place.name);
    setOpen(false);
    inputRef.current?.blur();

    if (place.kind === 'city') {
      // City data spells some countries differently, so look the country up by position
      setSelectedCountry(findCountry(place.lon, place.lat));
      setPin({ lon: place.lon, lat: place.lat, name: place.name });
      flyToLonLat(place.lon, place.lat, CITY_ZOOM_DISTANCE);
      return;
    }

    const target = computeSearchTarget(place.name);
    if (!target) return;
    setSelectedCountry(place.name);
    setPin({ lon: target.lon, lat: target.lat, name: place.name });
    flyToLonLat(target.lon, target.lat, target.zoomDistance);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (suggestions.length === 0) return;
      e.preventDefault();
      setOpen(true);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex(i => (i + step + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      const place = suggestions[activeIndex] ?? suggestions[0];
      if (place) selectPlace(place);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showList = open && suggestions.length > 0;
  const activeId = showList ? `${listId}-${activeIndex}` : undefined;

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
          role="combobox"
          aria-label="Search countries and cities"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          onChange={e => {
            setQuery(e.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search country or city..."
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

      {showList && (
        <div
          id={listId}
          role="listbox"
          style={{
            ...PANEL_STYLE,
            borderRadius: '0 0 8px 8px',
            marginTop: '2px',
            overflow: 'hidden',
          }}
        >
          {suggestions.map((place, i) => (
            <div
              key={placeKey(place)}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => selectPlace(place)}
              onMouseEnter={() => setActiveIndex(i)}
              style={{
                padding: '8px 12px',
                background: i === activeIndex ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: 'rgba(255,255,255,0.85)',
                cursor: 'pointer',
                fontSize: '13px',
                fontFamily: 'sans-serif',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <span>{place.name}</span>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>
                {place.kind === 'city' ? place.country : 'Country'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
