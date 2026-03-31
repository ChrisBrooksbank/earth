uniform sampler2D cloudMap;
uniform float uTime;
uniform vec3 sunDirection;

varying vec2 vUv;
varying vec3 vWorldNormal;

void main() {
  // Primary cloud layer
  float clouds1 = texture2D(cloudMap, vUv).r;

  // Secondary layer with slow UV drift for animation
  vec2 uv2 = vUv + vec2(uTime * 0.0008, uTime * 0.0002);
  float clouds2 = texture2D(cloudMap, uv2).r;

  // Blend layers for evolving cloud patterns
  float cloudDensity = clouds1 * 0.65 + clouds2 * 0.35;

  // Darken clouds on night side
  float sunFactor = dot(normalize(vWorldNormal), normalize(sunDirection));
  float dayMix = smoothstep(-0.1, 0.3, sunFactor);
  float brightness = 0.25 + 0.75 * dayMix;

  gl_FragColor = vec4(vec3(brightness), cloudDensity * 0.75);
}
