import { Html } from '@react-three/drei';
import { useAppStore } from '../store/appStore';

interface PlanetLabelProps {
  name: string;
  /** Height above the body's centre, in scene units */
  offset: number;
  color: string;
}

/** Clickable name tag floating above a body in the solar system view. */
export default function PlanetLabel({ name, offset, color }: PlanetLabelProps) {
  const setPendingFlyToBody = useAppStore(s => s.setPendingFlyToBody);

  return (
    // zIndexRange [0, 0] keeps labels beneath the HUD panels
    <Html position={[0, offset, 0]} center zIndexRange={[0, 0]}>
      <button
        onClick={() => setPendingFlyToBody(name)}
        aria-label={`Fly to ${name}`}
        style={{
          transform: 'translateY(-50%)',
          background: 'rgba(0,0,0,0.45)',
          border: 'none',
          borderLeft: `2px solid ${color}`,
          borderRadius: '3px',
          color: 'rgba(255,255,255,0.85)',
          fontSize: '11px',
          fontFamily: 'inherit',
          padding: '2px 6px',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </button>
    </Html>
  );
}
