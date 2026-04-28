import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Detailed, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { isMobile } from '../lib/isMobile';

interface MoonProps {
  radius: number;
  texture: string;
  rotationSpeed?: number;
}

function MoonSurface({
  radius,
  colorMap,
  segments,
}: {
  radius: number;
  colorMap: THREE.Texture;
  segments: number;
}) {
  return (
    <mesh>
      <sphereGeometry args={[radius, segments, segments]} />
      <meshStandardMaterial
        map={colorMap}
        bumpMap={colorMap}
        bumpScale={radius * 0.035}
        color="#d8d3c8"
        emissive="#151515"
        emissiveIntensity={0.22}
        roughness={0.96}
        metalness={0}
      />
    </mesh>
  );
}

export default function Moon({ radius, texture, rotationSpeed = 0 }: MoonProps) {
  const groupRef = useRef<THREE.Group>(null);
  const colorMap = useTexture(texture);
  const { gl } = useThree();

  const moonMap = useMemo(() => {
    const configuredMap = colorMap.clone();
    configuredMap.colorSpace = THREE.SRGBColorSpace;
    configuredMap.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    configuredMap.needsUpdate = true;
    return configuredMap;
  }, [colorMap, gl]);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed * delta;
    }
  });

  const highSegments = isMobile ? 48 : 96;

  return (
    <group ref={groupRef}>
      <pointLight
        position={[radius * 3.2, radius * 2.2, radius * 4]}
        intensity={0.55}
        distance={radius * 16}
        decay={1}
        color="#fff1d6"
      />
      <Detailed distances={[0, radius * 220, radius * 700]}>
        <MoonSurface radius={radius} colorMap={moonMap} segments={highSegments} />
        <MoonSurface radius={radius} colorMap={moonMap} segments={48} />
        <MoonSurface radius={radius} colorMap={moonMap} segments={24} />
      </Detailed>
      <mesh>
        <sphereGeometry args={[radius * 1.015, 48, 48]} />
        <meshBasicMaterial
          color="#b8c7d6"
          transparent
          opacity={0.08}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
