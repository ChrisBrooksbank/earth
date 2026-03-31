uniform sampler2D dayTexture;
uniform sampler2D nightTexture;
uniform sampler2D specularMap;
uniform sampler2D normalMap;
uniform float normalScale;
uniform vec3 sunDirection;

varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 sun = normalize(sunDirection);
  vec3 viewDir = normalize(vViewPosition);

  // Normal mapping via screen-space derivatives (no tangent attributes needed)
  vec3 normalTex = texture2D(normalMap, vUv).rgb * 2.0 - 1.0;
  vec3 dPdx = dFdx(vViewPosition);
  vec3 dPdy = dFdy(vViewPosition);
  vec2 dUVdx = dFdx(vUv);
  vec2 dUVdy = dFdy(vUv);
  vec3 T = normalize(dPdx * dUVdy.y - dPdy * dUVdx.y);
  vec3 B = normalize(dPdy * dUVdx.x - dPdx * dUVdy.x);
  mat3 TBN = mat3(T, B, normal);
  vec3 perturbedNormal = normalize(mix(normal, TBN * normalTex, normalScale));

  // Day/night blend factor with smooth terminator transition
  float cosAngle = dot(perturbedNormal, sun);
  float dayMix = smoothstep(-0.1, 0.1, cosAngle);

  vec3 dayColor = texture2D(dayTexture, vUv).rgb;

  // City lights: additive blend so they stay visible at terminator
  float nightFactor = 1.0 - smoothstep(-0.25, 0.1, cosAngle);
  vec3 cityLights = texture2D(nightTexture, vUv).rgb * 2.5 * nightFactor;

  // Darken the day texture on the night side; add city lights on top
  vec3 color = dayColor * dayMix + cityLights;

  // Specular highlight on oceans (specular map encodes water vs land)
  vec4 specMap = texture2D(specularMap, vUv);
  vec3 halfVec = normalize(sun + viewDir);
  float specular = pow(max(dot(perturbedNormal, halfVec), 0.0), 30.0) * specMap.r;
  color += vec3(specular) * dayMix * 0.6;

  // Fresnel-based ocean reflection for depth and realism
  float oceanFresnel = pow(1.0 - max(dot(perturbedNormal, viewDir), 0.0), 4.0);
  color += vec3(0.08, 0.12, 0.18) * oceanFresnel * specMap.r * dayMix;

  gl_FragColor = vec4(color, 1.0);
}
