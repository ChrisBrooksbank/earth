varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  // Transform normal to world space (Earth only rotates, no non-uniform scale)
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  // Lighting runs in world space, where sunDirection and cameraPosition live
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
