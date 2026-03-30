export default function InfoPanel({ countryName }: { countryName: string | null }) {
  if (!countryName) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(10px)',
        color: '#fff',
        padding: '8px 20px',
        borderRadius: '8px',
        fontSize: '14px',
        fontFamily: 'sans-serif',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {countryName}
    </div>
  );
}
