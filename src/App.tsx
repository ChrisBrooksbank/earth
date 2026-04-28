import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import Starfield from './components/Starfield';
import EarthGroup from './components/EarthGroup';
import InfoPanel from './components/InfoPanel';
import SolarSystem from './components/SolarSystem';
import TimeControls from './components/TimeControls';
import CameraController from './components/CameraController';
import BodySelector from './components/BodySelector';
import SearchBar from './components/SearchBar';
import ViewModeToggle from './components/ViewModeToggle';
import ControlsHint from './components/ControlsHint';
import LoadingScreen from './components/LoadingScreen';
import EarthMoonSunView, { EarthMoonSunPanel } from './components/EarthMoonSunView';
import { useAppStore } from './store/appStore';

export default function App() {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const cameraMode = useAppStore(s => s.cameraMode);
  const selectedBody = useAppStore(s => s.selectedBody);
  const showPlanetScene = cameraMode === 'planet';
  const showCountryControls = cameraMode === 'planet' && selectedBody === 'Earth';
  const showTeachingView = cameraMode === 'earthMoonSun';

  return (
    <div
      className="scene-root"
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Canvas
        camera={{ fov: 45, near: 0.1, far: 2000, position: [0, 0, 2.8] }}
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.1} />
        <directionalLight position={[5, 3, 5]} intensity={1.5} />
        <CameraController />
        <Starfield />
        {showPlanetScene && <EarthGroup onHoverCountry={setHoveredCountry} />}
        <SolarSystem />
        {showTeachingView && <EarthMoonSunView />}
        <EffectComposer>
          <Bloom intensity={0.4} luminanceThreshold={0.2} luminanceSmoothing={0.9} />
        </EffectComposer>
      </Canvas>
      <LoadingScreen />
      <ViewModeToggle />
      {showCountryControls && <SearchBar />}
      <InfoPanel countryName={showCountryControls ? hoveredCountry : null} />
      <TimeControls />
      <BodySelector />
      <ControlsHint />
      <EarthMoonSunPanel />
    </div>
  );
}
