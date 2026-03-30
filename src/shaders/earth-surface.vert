varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vViewPosition;

void main() {
  vUv = uv;
  // Transform normal to world space (Earth only rotates, no non-uniform scale)
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
