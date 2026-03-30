import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import Starfield from './components/Starfield';
import Earth from './components/Earth';
import CountryBorders from './components/CountryBorders';
import InfoPanel from './components/InfoPanel';

export default function App() {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}>
      <Canvas camera={{ fov: 45, near: 0.1, far: 1000, position: [0, 0, 5] }}>
        <ambientLight intensity={0.1} />
        <directionalLight position={[5, 3, 5]} intensity={1.5} />
        <OrbitControls enableDamping dampingFactor={0.05} />
        <Starfield />
        <Suspense fallback={null}>
          <Earth />
          <CountryBorders onHoverCountry={setHoveredCountry} />
        </Suspense>
        <EffectComposer>
          <Bloom intensity={0.4} luminanceThreshold={0.2} luminanceSmoothing={0.9} />
        </EffectComposer>
      </Canvas>
      <InfoPanel countryName={hoveredCountry} />
    </div>
  );
}
