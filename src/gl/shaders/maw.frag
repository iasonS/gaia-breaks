#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform float uTime;
uniform float uProgress;
// __COMMON__
void main(){
  float fall = 1.0 - 0.5*uProgress;     // falling into the core across the movement
  vec2 p = (vUv - 0.5) * fall; p.x *= 1.78;
  float r = length(p);
  float ang = atan(p.y,p.x);
  vec3 col = vec3(0.02,0.015,0.05);

  // starfield streaming inward, faster as we fall
  for (int i=0;i<16;i++){
    float fi=float(i);
    float seed=hash(vec2(fi,3.0));
    float spd = 0.06 + 0.04*seed + 0.10*uProgress;
    float life = fract(seed + uTime*spd);
    float rr = mix(0.8,0.03,life);
    float a = seed*6.2831 + uTime*0.1;
    vec2 sp = vec2(cos(a),sin(a))*rr; sp.x*=1.78;
    float s = smoothstep(0.011,0.0, distance(p,sp)) * life;
    col += vec3(0.7,0.8,1.0)*s*0.7;
  }

  // spinning accretion ring
  float ring = smoothstep(0.32,0.27,r) * smoothstep(0.17,0.22,r);
  float swirl = 0.5+0.5*sin(ang*6.0 + uTime*2.5 - r*34.0);
  float hot = 0.5+0.5*sin(ang*3.0 - uTime*1.7);
  col += mix(vec3(0.9,0.35,0.08), vec3(1.0,0.9,0.6), swirl) * ring * (1.4+hot);

  // pulsing lens halo
  float halo = smoothstep(0.5,0.2,r)*0.15*(0.6+0.4*sin(uTime*0.8));
  col += vec3(0.4,0.2,0.7)*halo;

  col *= smoothstep(0.15,0.19,r); // black core
  o = vec4(col, 1.0);
}
