import { useAppStore } from '../store/appStore';
import { PLANETS } from '../data/planets';

export default function BodySelector() {
  const selectedBody = useAppStore(s => s.selectedBody);
  const setPendingFlyToBody = useAppStore(s => s.setPendingFlyToBody);

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '24px',
        transform: 'translateY(-50%)',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(10px)',
        color: '#fff',
        borderRadius: '8px',
        fontFamily: 'sans-serif',
        fontSize: '13px',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {PLANETS.map(planet => {
        const isSelected = selectedBody === planet.name;
        return (
          <button
            key={planet.name}
            onClick={() => setPendingFlyToBody(planet.name)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '8px 16px',
              background: isSelected ? 'rgba(255,255,255,0.2)' : 'transparent',
              border: 'none',
              borderLeft: isSelected
                ? `3px solid ${getPlanetColor(planet.name)}`
                : '3px solid transparent',
              color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => {
              if (!isSelected) {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
              }
            }}
            onMouseLeave={e => {
              if (!isSelected) {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }
            }}
          >
            {planet.name}
          </button>
        );
      })}
    </div>
  );
}

function getPlanetColor(name: string): string {
  const planet = PLANETS.find(p => p.name === name);
  return planet?.orbitColor ?? '#ffffff';
}
