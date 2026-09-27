/** Attribution required by the CC BY 4.0 licence of the planet textures. */
export default function Credits() {
  return (
    <div
      style={{
        position: 'absolute',
        right: '8px',
        bottom: '4px',
        fontSize: '10px',
        color: 'rgba(255,255,255,0.4)',
        userSelect: 'none',
      }}
    >
      Planet textures:{' '}
      <a
        href="https://www.solarsystemscope.com/textures/"
        target="_blank"
        rel="noreferrer"
        style={{ color: 'inherit' }}
      >
        Solar System Scope
      </a>{' '}
      (
      <a
        href="https://creativecommons.org/licenses/by/4.0/"
        target="_blank"
        rel="noreferrer"
        style={{ color: 'inherit' }}
      >
        CC BY 4.0
      </a>
      ); Pluto: NASA/JHUAPL/SwRI
    </div>
  );
}
