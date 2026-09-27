import { useAppStore } from '../store/appStore';
import { GLASS_PANEL_STYLE } from '../styles/glass';
import { isMobile } from '../lib/isMobile';
import { findCountry } from '../lib/countries';
import { flagEmoji, getCountryInfo } from '../lib/places';
import { localSolarTime, sunTimes } from '../lib/solar';
import { useSimTime } from '../hooks/useSimTime';

function formatCoord(value: number, positive: string, negative: string): string {
  return `${Math.abs(value).toFixed(2)}° ${value >= 0 ? positive : negative}`;
}

function formatUtc(ms: number): string {
  return `${new Date(ms).toISOString().slice(11, 16)} UTC`;
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '4px' }}
    >
      <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span style={{ fontSize: '12px', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

/** Details for the pinned place: coordinates, sun times and country facts. */
export default function LocationPanel() {
  const pin = useAppStore(s => s.pin);
  const setPin = useAppStore(s => s.setPin);
  const setSelectedCountry = useAppStore(s => s.setSelectedCountry);
  const now = useSimTime(1000);

  if (!pin) return null;

  const country = findCountry(pin.lon, pin.lat);
  const info = country ? getCountryInfo(country) : undefined;
  const flag = info?.iso2 ? flagEmoji(info.iso2) : '';
  const title = pin.name ?? country ?? 'Open water';
  const times = sunTimes(pin.lon, pin.lat, now);
  const isDaytime =
    times.kind === 'polarDay' ||
    (times.kind === 'normal' && now >= times.sunrise && now <= times.sunset);

  return (
    <div
      role="region"
      aria-label="Pinned location"
      style={{
        ...GLASS_PANEL_STYLE,
        position: 'absolute',
        top: isMobile ? '124px' : 'auto',
        bottom: isMobile ? 'auto' : '24px',
        right: '24px',
        width: isMobile ? 'min(260px, calc(100vw - 48px))' : '260px',
        maxHeight: isMobile ? 'calc(100vh - 220px)' : 'calc(100vh - 96px)',
        overflowY: 'auto',
        padding: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          gap: '8px',
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          paddingBottom: '8px',
        }}
      >
        <span>
          {flag && <span aria-hidden="true">{flag} </span>}
          {title}
        </span>
        <button
          onClick={() => {
            setPin(null);
            setSelectedCountry(null);
          }}
          aria-label="Remove pin"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <Row
          label="Coordinates"
          value={`${formatCoord(pin.lat, 'N', 'S')}, ${formatCoord(pin.lon, 'E', 'W')}`}
        />
        <Row label="Local solar time" value={formatHours(localSolarTime(pin.lon, now))} />
        <Row label="Sun" value={isDaytime ? 'Up' : 'Down'} />
        {times.kind === 'normal' ? (
          <>
            <Row label="Sunrise" value={formatUtc(times.sunrise)} />
            <Row label="Sunset" value={formatUtc(times.sunset)} />
          </>
        ) : (
          <Row label="Today" value={times.kind === 'polarDay' ? 'Midnight sun' : 'Polar night'} />
        )}
      </div>

      {country && info && (
        <div>
          {pin.name && pin.name !== country && <Row label="Country" value={country} />}
          {info.formal && info.formal !== country && (
            <Row label="Official name" value={info.formal} />
          )}
          {info.capital && <Row label="Capital" value={info.capital} />}
          {info.population !== undefined && (
            <Row
              label="Population"
              value={`${info.population.toLocaleString()}${
                info.populationYear ? ` (${info.populationYear})` : ''
              }`}
            />
          )}
          {info.subregion && <Row label="Region" value={info.subregion} />}
        </div>
      )}
    </div>
  );
}
