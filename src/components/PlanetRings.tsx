import { useMemo } from 'react';
import * as THREE from 'three';
import type { RingStyle } from '../data/planets';

interface PlanetRingsProps {
  /** Inner radius of the ring in scene units */
  innerRadius: number;
  /** Outer radius of the ring in scene units */
  outerRadius: number;
  ringStyle?: RingStyle;
}

const ringVertShader = /* glsl */ `
  uniform float innerRadius;
  uniform float outerRadius;
  // 0 at the inner edge, 1 at the outer edge. RingGeometry's own UVs are a
  // flat projection, not radial, so derive it from the vertex position.
  varying float vRadial;
  void main() {
    vRadial = (length(position.xy) - innerRadius) / (outerRadius - innerRadius);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ringFragShader = /* glsl */ `
  uniform float innerRadius;
  uniform float outerRadius;
  uniform int ringStyle;
  varying float vRadial;

  float narrowRing(float x, float centre, float width) {
    return 1.0 - smoothstep(0.0, width, abs(x - centre));
  }

  // Uranus: a handful of narrow, dark rings, the outermost (epsilon) brightest
  vec4 uranusRings(float x) {
    float alpha = narrowRing(x, 0.12, 0.012);
    alpha = max(alpha, narrowRing(x, 0.3, 0.012));
    alpha = max(alpha, narrowRing(x, 0.45, 0.012));
    alpha = max(alpha, narrowRing(x, 0.6, 0.012));
    alpha = max(alpha, narrowRing(x, 0.93, 0.03));
    return vec4(vec3(0.62, 0.68, 0.72), alpha * 0.4);
  }

  void main() {
    if (ringStyle == 1) {
      gl_FragColor = uranusRings(vRadial);
      return;
    }

    float x = vRadial;
    float alpha = 1.0;

    // Soft inner and outer fade
    float innerFade = smoothstep(0.0, 0.08, x);
    float outerFade = smoothstep(1.0, 0.85, x);
    alpha *= innerFade * outerFade;

    // Subtle ring gap around Cassini Division (~halfway through B ring)
    float gapCenter = 0.52;
    float gapWidth = 0.04;
    float gap = 1.0 - smoothstep(gapWidth, 0.0, abs(x - gapCenter));
    alpha *= gap;

    // Warm golden-tan ring colour with density variation
    float density = 0.5 + 0.5 * sin(x * 60.0);
    vec3 colour = mix(vec3(0.72, 0.60, 0.42), vec3(0.88, 0.76, 0.56), density);

    gl_FragColor = vec4(colour, alpha * 0.85);
  }
`;

export default function PlanetRings({
  innerRadius,
  outerRadius,
  ringStyle = 'saturn',
}: PlanetRingsProps) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ringVertShader,
        fragmentShader: ringFragShader,
        uniforms: {
          innerRadius: { value: innerRadius },
          outerRadius: { value: outerRadius },
          ringStyle: { value: ringStyle === 'uranus' ? 1 : 0 },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [innerRadius, outerRadius, ringStyle]
  );

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[innerRadius, outerRadius, 128]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
