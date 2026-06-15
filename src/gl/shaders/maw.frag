#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform float uTime;
// __COMMON__
void main(){
  vec2 p = vUv - 0.5; p.x *= 1.78;
  float r = length(p);
  vec3 col = vec3(0.02,0.015,0.05);
  float ring = smoothstep(0.30,0.26,r) * smoothstep(0.18,0.22,r);
  float swirl = 0.5+0.5*sin(atan(p.y,p.x)*6.0 + uTime*1.5 - r*30.0);
  col += mix(vec3(0.9,0.35,0.08), vec3(1.0,0.85,0.5), swirl) * ring * 1.6;
  col *= smoothstep(0.16,0.19,r); // black core
  o = vec4(col, 1.0);
}
