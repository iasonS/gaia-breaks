#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform float uTime;
// __COMMON__
void main(){
  vec2 uv = vUv;
  vec3 sky = mix(vec3(0.09,0.06,0.19), vec3(0.88,0.33,0.12), pow(uv.y,1.6));
  float sun = smoothstep(0.16,0.0, distance(uv, vec2(0.5,0.30)));
  vec3 col = sky + vec3(1.0,0.55,0.15)*sun*1.4;
  // arch silhouette: dark where a noisy band crosses mid-screen
  float arch = smoothstep(0.0,0.04, abs(uv.y-0.5 - 0.18*sin(uv.x*3.14)) - 0.16);
  col *= mix(0.04, 1.0, arch);
  float drift = noise(uv*3.0 + uTime*0.02)*0.04;
  o = vec4(col+drift, 1.0);
}
