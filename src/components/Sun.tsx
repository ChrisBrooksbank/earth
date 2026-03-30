import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import sunCoronaVert from '../shaders/sun-corona.vert?raw';
import sunCoronaFrag from '../shaders/sun-corona.frag?raw';

interface SunProps {
  radius?: number;
  position?: [number, number, number];
}

export default function Sun({ radius = 2.5, position = [0, 0, 0] }: SunProps) {
  const coronaRef = useRef<THREE.Mesh>(null);

  const coronaMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: sunCoronaVert,
        fragmentShader: sunCoronaFrag,
        uniforms: {
          time: { value: 0 },
          radius: { value: radius },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.FrontSide,
      }),
    [radius]
  );

  useFrame((_state, delta) => {
    if (coronaRef.current) {
      const mat = coronaRef.current.material as THREE.ShaderMaterial;
      if (mat.uniforms['time']) mat.uniforms['time'].value += delta;
      coronaRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group position={position}>
      {/* Point light emanating from the Sun */}
      <pointLight intensity={3} distance={500} decay={1} color="#fff5e0" />

      {/* Emissive core sphere */}
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          color="#fff5a0"
          emissive="#ffcc33"
          emissiveIntensity={2.5}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Animated corona layer (slightly larger, transparent shader) */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[radius * 1.4, 64, 64]} />
        <primitive object={coronaMaterial} attach="material" />
      </mesh>
    </group>
  );
}
