import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import Starfield from './components/Starfield';
import Earth from './components/Earth';
import CountryBorders from './components/CountryBorders';
import InfoPanel from './components/InfoPanel';
import SolarSystem from './components/SolarSystem';
import TimeControls from './components/TimeControls';
import CameraController from './components/CameraController';
import BodySelector from './components/BodySelector';

export default function App() {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}>
      <Canvas camera={{ fov: 45, near: 0.1, far: 2000, position: [0, 0, 5] }}>
        <ambientLight intensity={0.1} />
        <directionalLight position={[5, 3, 5]} intensity={1.5} />
        <CameraController />
        <Starfield />
        <Suspense fallback={null}>
          <Earth />
          <CountryBorders onHoverCountry={setHoveredCountry} />
        </Suspense>
        <SolarSystem />
        <EffectComposer>
          <Bloom intensity={0.4} luminanceThreshold={0.2} luminanceSmoothing={0.9} />
        </EffectComposer>
      </Canvas>
      <InfoPanel countryName={hoveredCountry} />
      <TimeControls />
      <BodySelector />
    </div>
  );
}
