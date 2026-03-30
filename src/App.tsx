import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Starfield from './components/Starfield';
import Earth from './components/Earth';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas camera={{ fov: 45, near: 0.1, far: 1000, position: [0, 0, 5] }}>
        <ambientLight intensity={0.1} />
        <OrbitControls enableDamping dampingFactor={0.05} />
        <Starfield />
        <Suspense fallback={null}>
          <Earth />
        </Suspense>
      </Canvas>
    </div>
  );
}
