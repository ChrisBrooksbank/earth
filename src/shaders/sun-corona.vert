varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormalWorld;
varying vec3 vViewDirection;

void main() {
  vUv = uv;
  vPosition = position;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vNormalWorld = normalize(mat3(modelMatrix) * normal);
  vViewDirection = normalize(cameraPosition - worldPosition.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
