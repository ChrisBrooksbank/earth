import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import Starfield from './components/Starfield';
import EarthGroup from './components/EarthGroup';
import InfoPanel from './components/InfoPanel';
import SolarSystem from './components/SolarSystem';
import TimeControls from './components/TimeControls';
import CameraController from './components/CameraController';
import SimulationClock from './components/SimulationClock';
import BodySelector from './components/BodySelector';
import SearchBar from './components/SearchBar';
import ViewModeToggle from './components/ViewModeToggle';
import ControlsHint from './components/ControlsHint';
import Credits from './components/Credits';
import UrlState from './components/UrlState';
import LoadingScreen from './components/LoadingScreen';
import EarthMoonSunView, { EarthMoonSunPanel } from './components/EarthMoonSunView';
import { useAppStore } from './store/appStore';
import { earthDayViewPosition } from './lib/earthOrientation';
import { EARTH_VIEW_DISTANCE } from './components/CameraController';

export default function App() {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const cameraMode = useAppStore(s => s.cameraMode);
  const selectedBody = useAppStore(s => s.selectedBody);
  // The detailed globe is only for Earth; other bodies are viewed inside the solar system
  const showPlanetScene = cameraMode === 'planet' && selectedBody === 'Earth';
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
      <h1 className="visually-hidden">Earth Explorer</h1>
      <Canvas
        aria-label="Interactive 3D view of Earth and the solar system"
        camera={{
          fov: 45,
          near: 0.1,
          far: 2000,
          position: earthDayViewPosition(EARTH_VIEW_DISTANCE),
        }}
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.1} />
        <SimulationClock />
        <Starfield />
        {showPlanetScene && <EarthGroup onHoverCountry={setHoveredCountry} />}
        <SolarSystem />
        {/* After SolarSystem so it can follow bodies using this frame's positions */}
        <CameraController />
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
      <Credits />
      <UrlState />
    </div>
  );
}
