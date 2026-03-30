import { useAppStore } from '../store/appStore';
import { PLANETS } from '../data/planets';
import { getBodyInfo } from '../data/bodyInfo';
import { GLASS_PANEL_STYLE } from '../styles/glass';

const PANEL_STYLE: React.CSSProperties = {
  ...GLASS_PANEL_STYLE,
  pointerEvents: 'none',
};

function formatDays(days: number): string {
  if (days < 1) return `${days.toFixed(2)} days`;
  if (days < 365.25) return `${days.toFixed(1)} days`;
  const years = days / 365.25;
  return `${years.toFixed(2)} years`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', marginBottom: '4px' }}
    >
      <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span style={{ fontSize: '12px', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function PlanetInfoPanel({ bodyName }: { bodyName: string }) {
  const planet = PLANETS.find(p => p.name === bodyName);
  const info = getBodyInfo(bodyName);

  if (!planet || !info) return null;

  const distanceLabel = planet.parent ? 'Semi-major axis' : 'Distance from Sun';
  const distanceValue = planet.parent
    ? `${(planet.semiMajorAxisAU * 384400).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} km`
    : planet.semiMajorAxisAU < 1
      ? `${planet.semiMajorAxisAU.toFixed(3)} AU`
      : `${planet.semiMajorAxisAU.toFixed(3)} AU`;

  return (
    <div
      style={{
        ...PANEL_STYLE,
        position: 'absolute',
        bottom: '24px',
        right: '24px',
        width: '260px',
        maxHeight: 'calc(100vh - 96px)',
        overflowY: 'auto',
        padding: '16px',
      }}
    >
      <div
        style={{
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          paddingBottom: '8px',
        }}
      >
        {planet.name}
      </div>

      <div style={{ marginBottom: '12px' }}>
        <Row label="Radius" value={`${planet.radiusKm.toLocaleString()} km`} />
        <Row label="Mass" value={info.mass} />
        <Row label={distanceLabel} value={distanceValue} />
        <Row label="Orbital period" value={formatDays(info.orbitalPeriodDays)} />
      </div>

      <div>
        <div
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: '11px',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Fun Facts
        </div>
        {info.funFacts.map((fact, i) => (
          <div
            key={i}
            style={{ fontSize: '12px', marginBottom: '4px', display: 'flex', gap: '6px' }}
          >
            <span style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>•</span>
            <span style={{ color: 'rgba(255,255,255,0.85)' }}>{fact}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InfoPanel({ countryName }: { countryName: string | null }) {
  const selectedBody = useAppStore(s => s.selectedBody);

  return (
    <>
      {selectedBody && <PlanetInfoPanel bodyName={selectedBody} />}
      {countryName && (
        <div
          style={{
            ...PANEL_STYLE,
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 20px',
            fontSize: '14px',
            whiteSpace: 'nowrap',
          }}
        >
          {countryName}
        </div>
      )}
    </>
  );
}
