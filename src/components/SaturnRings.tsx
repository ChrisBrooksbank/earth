import { useMemo } from 'react';
import * as THREE from 'three';

interface SaturnRingsProps {
  /** Inner radius of the ring in scene units */
  innerRadius: number;
  /** Outer radius of the ring in scene units */
  outerRadius: number;
}

const ringVertShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ringFragShader = /* glsl */ `
  uniform float innerRadius;
  uniform float outerRadius;
  varying vec2 vUv;

  void main() {
    // vUv.x goes 0→1 from inner to outer edge on RingGeometry
    float alpha = 1.0;

    // Soft inner and outer fade
    float innerFade = smoothstep(0.0, 0.08, vUv.x);
    float outerFade = smoothstep(1.0, 0.85, vUv.x);
    alpha *= innerFade * outerFade;

    // Subtle ring gap around Cassini Division (~halfway through B ring)
    float gapCenter = 0.52;
    float gapWidth = 0.04;
    float gap = 1.0 - smoothstep(gapWidth, 0.0, abs(vUv.x - gapCenter));
    alpha *= gap;

    // Warm golden-tan ring colour with density variation
    float density = 0.5 + 0.5 * sin(vUv.x * 60.0);
    vec3 colour = mix(vec3(0.72, 0.60, 0.42), vec3(0.88, 0.76, 0.56), density);

    gl_FragColor = vec4(colour, alpha * 0.85);
  }
`;

export default function SaturnRings({ innerRadius, outerRadius }: SaturnRingsProps) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ringVertShader,
        fragmentShader: ringFragShader,
        uniforms: {
          innerRadius: { value: innerRadius },
          outerRadius: { value: outerRadius },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [innerRadius, outerRadius]
  );

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[innerRadius, outerRadius, 128]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
