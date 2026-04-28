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
  const surfaceRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  const surfaceMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormalWorld;
          varying vec3 vViewDirection;

          void main() {
            vUv = uv;
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vNormalWorld = normalize(mat3(modelMatrix) * normal);
            vViewDirection = normalize(cameraPosition - worldPosition.xyz);
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `,
        fragmentShader: `
          uniform float time;
          varying vec2 vUv;
          varying vec3 vNormalWorld;
          varying vec3 vViewDirection;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
          }

          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
              mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
              u.y
            );
          }

          float fbm(vec2 p) {
            float value = 0.0;
            float amp = 0.5;
            for (int i = 0; i < 5; i++) {
              value += amp * noise(p);
              p *= 2.03;
              amp *= 0.52;
            }
            return value;
          }

          void main() {
            vec2 flowUv = vec2(vUv.x + time * 0.018, vUv.y);
            float cells = fbm(flowUv * vec2(18.0, 9.0));
            float fine = fbm((flowUv + vec2(time * 0.035, -time * 0.015)) * vec2(48.0, 18.0));
            float granulation = smoothstep(0.34, 0.92, cells * 0.72 + fine * 0.38);

            float rim = 1.0 - max(0.0, dot(normalize(vNormalWorld), normalize(vViewDirection)));
            float limbHeat = pow(rim, 2.2);

            vec3 ember = vec3(1.0, 0.25, 0.02);
            vec3 gold = vec3(1.0, 0.62, 0.08);
            vec3 whiteHot = vec3(1.0, 0.96, 0.58);
            vec3 color = mix(ember, gold, granulation);
            color = mix(color, whiteHot, smoothstep(0.68, 1.0, granulation));
            color += vec3(1.0, 0.32, 0.05) * limbHeat * 0.7;

            gl_FragColor = vec4(color, 1.0);
          }
        `,
      }),
    []
  );

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
        blending: THREE.AdditiveBlending,
      }),
    [radius]
  );

  const haloMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ff7a18',
        transparent: true,
        opacity: 0.11,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useFrame((_state, delta) => {
    if (surfaceRef.current) {
      const mat = surfaceRef.current.material as THREE.ShaderMaterial;
      if (mat.uniforms['time']) mat.uniforms['time'].value += delta;
      surfaceRef.current.rotation.y += delta * 0.025;
    }
    if (coronaRef.current) {
      const mat = coronaRef.current.material as THREE.ShaderMaterial;
      if (mat.uniforms['time']) mat.uniforms['time'].value += delta;
      coronaRef.current.rotation.y += delta * 0.04;
    }
    if (haloRef.current) {
      haloRef.current.rotation.y -= delta * 0.015;
    }
  });

  return (
    <group position={position}>
      {/* Point light emanating from the Sun */}
      <pointLight intensity={4.8} distance={700} decay={1} color="#fff2cf" />

      {/* Animated plasma surface */}
      <mesh ref={surfaceRef}>
        <sphereGeometry args={[radius, 96, 96]} />
        <primitive object={surfaceMaterial} attach="material" />
      </mesh>

      {/* Animated corona layer (slightly larger, transparent shader) */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[radius * 1.32, 96, 96]} />
        <primitive object={coronaMaterial} attach="material" />
      </mesh>

      {/* Wide soft halo */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[radius * 2.25, 64, 64]} />
        <primitive object={haloMaterial} attach="material" />
      </mesh>
    </group>
  );
}
