uniform sampler2D dayTexture;
uniform sampler2D nightTexture;
uniform sampler2D specularMap;
uniform vec3 sunDirection;

varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 sun = normalize(sunDirection);

  // Day/night blend factor with smooth terminator transition
  float cosAngle = dot(normal, sun);
  float dayMix = smoothstep(-0.1, 0.1, cosAngle);

  vec3 dayColor = texture2D(dayTexture, vUv).rgb;
  // City lights visible on night side
  vec3 nightColor = texture2D(nightTexture, vUv).rgb * 1.5;

  vec3 color = mix(nightColor, dayColor, dayMix);

  // Specular highlight on oceans (specular map encodes water vs land)
  vec4 specMap = texture2D(specularMap, vUv);
  vec3 viewDir = normalize(vViewPosition);
  vec3 halfVec = normalize(sun + viewDir);
  float specular = pow(max(dot(normal, halfVec), 0.0), 30.0) * specMap.r;
  color += vec3(specular) * dayMix * 0.6;

  gl_FragColor = vec4(color, 1.0);
}
