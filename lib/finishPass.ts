// The last touch on every HD frame: a soft vignette, fine film grain, and colour fringing that grows
// toward the edges, like a real lens. Runs after tone mapping, so the values are in display space.
export const finishShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    grain: { value: 0.035 },
    aberration: { value: 0.0025 },
    vignette: { value: 0.35 },
  },
  vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time, grain, aberration, vignette; varying vec2 vUv;
    float rand(vec2 c) { return fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 d = vUv - 0.5;
      float r = dot(d, d);
      vec2 off = d * aberration * r * 4.0;
      vec3 c = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
      c *= 1.0 - vignette * smoothstep(0.1, 0.55, r * 1.6);
      c += (rand(vUv * 1000.0 + fract(time)) - 0.5) * grain;
      gl_FragColor = vec4(c, 1.0);
    }`,
};
