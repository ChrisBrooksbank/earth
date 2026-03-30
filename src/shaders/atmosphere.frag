uniform vec3 sunDirection;

varying vec3 vWorldNormal;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 viewDir = normalize(vViewPosition);

  // Fresnel rim glow: strongest at grazing angles (sphere edges)
  // For BackSide sphere the normal points inward; abs() handles both orientations
  float fresnel = 1.0 - abs(dot(viewDir, normal));
  fresnel = pow(fresnel, 2.5);

  // Rayleigh scattering: blue-dominant atmosphere color
  vec3 atmosphereColor = vec3(0.25, 0.55, 1.0);

  // Attenuate glow on night side so atmosphere fades away from the sun
  float sunFactor = dot(normal, normalize(sunDirection));
  float dayMix = smoothstep(-0.2, 0.4, sunFactor);
  float alpha = fresnel * (0.15 + 0.85 * dayMix);

  gl_FragColor = vec4(atmosphereColor, alpha);
}
