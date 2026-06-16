#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform float uTime;
uniform float uProgress;
// __COMMON__
void main(){
  // gentle forward drift toward the gate
  float adv = 0.12*uProgress;
  vec2 uv = (vUv - vec2(0.5,0.5)) * (1.0 - adv) + vec2(0.5,0.5);
  uv.y += 0.003*sin(uTime*0.1);

  vec3 col = mix(vec3(0.06,0.13,0.20), vec3(0.55,0.50,0.45), pow(uv.y,2.0));

  // faint stars in the upper sky (gentle twinkle)
  if (uv.y > 0.5){
    vec2 sg = floor(uv*vec2(300.0,170.0));
    float sh = hash(sg);
    float fade = smoothstep(0.5,0.85,uv.y);
    col += vec3(0.8,0.85,1.0) * smoothstep(0.9965,1.0,sh) * (0.5+0.5*sin(uTime*1.5+sh*40.0)) * fade * 0.6;
  }

  // soft drifting mist (two layers)
  float mist = noise(uv*vec2(4.0,2.0)+vec2(uTime*0.02,0.0))*0.06;
  mist += noise(uv*vec2(7.0,3.0)+vec2(-uTime*0.015,0.3))*0.04;
  col += vec3(0.3,0.34,0.4)*mist;

  float md = distance(uv, vec2(0.62,0.78));
  col += vec3(1.0,0.96,0.88) * smoothstep(0.06,0.0, md);
  col += vec3(0.7,0.72,0.62) * smoothstep(0.2,0.0, md) * (0.05 + 0.03*sin(uTime*0.5)); // breathing halo

  // slow-rising spirit lights drifting up over the scene
  for(int i=0;i<12;i++){
    float fi=float(i);
    float t = fract(hash(vec2(fi,21.0)) + uTime*(0.018+0.02*hash(vec2(fi,22.0))));
    vec2 fp = vec2(fract(hash(vec2(fi,23.0)) + sin(uTime*0.3+fi)*0.02), 0.42 + t*0.42);
    col += vec3(0.7,0.85,0.8) * smoothstep(0.004,0.0, distance(uv,fp)) * (0.5+0.5*sin(uTime*2.0+fi)) * smoothstep(1.0,0.75,t);
  }

  if (uv.y < 0.42){ // water: animated ripples + shimmering moon reflection
    float ripple = sin(uv.y*70.0 + noise(uv*8.0+uTime*0.25)*5.0 + uTime*0.6)*0.5+0.5;
    ripple = mix(ripple, 0.5+0.5*sin(uv.x*7.0 - uTime*0.45 + uv.y*12.0), 0.35); // rolling swell
    float refl = smoothstep(0.10,0.0, abs(uv.x-0.62)) * smoothstep(0.42,0.0,uv.y);
    col = mix(vec3(0.04,0.08,0.11), col, 0.5) + ripple*0.04;
    col += vec3(0.8,0.78,0.7)*refl*ripple*0.25;
    // reflected stars wobbling on the surface
    vec2 ruv = vec2(uv.x + noise(uv*10.0+uTime*0.2)*0.01, 0.84 - uv.y);
    vec2 rg = floor(ruv*vec2(300.0,170.0));
    col += vec3(0.7,0.75,0.9) * smoothstep(0.9965,1.0,hash(rg)) * ripple * 0.15;
  }

  // torii-like gate: two posts + a lintel
  float post = step(0.02, abs(uv.x-0.44)) * step(0.02, abs(uv.x-0.56));
  float lintel = step(abs(uv.y-0.60),0.02) * step(abs(uv.x-0.5),0.10);
  if (uv.y>0.30 && uv.y<0.60) col *= mix(0.1,1.0,post);
  if (lintel>0.5) col *= 0.1;

  o = vec4(col,1.0);
}
