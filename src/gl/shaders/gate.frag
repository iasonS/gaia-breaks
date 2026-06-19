#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform float uTime;
uniform float uProgress;
uniform float uAspect;
// __COMMON__
float capsule(vec2 p, vec2 a, vec2 b, float r){
  vec2 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);
  return length(pa-ba*h)-r;
}
float boxd(vec2 p, vec2 c, vec2 h){ vec2 d=abs(p-c)-h; return length(max(d,0.0))+min(max(d.x,d.y),0.0); }
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

  // a proper torii: tapered pillars, swept top beam (kasagi) + shimaki, the
  // protruding tie-beam (nuki) and the little centre strut (gakuzuka).
  float td = 1e9;
  td = min(td, boxd(uv, vec2(0.40,0.39), vec2(0.017,0.21)));   // left pillar
  td = min(td, boxd(uv, vec2(0.60,0.39), vec2(0.017,0.21)));   // right pillar
  td = min(td, boxd(uv, vec2(0.50,0.47), vec2(0.135,0.012)));  // nuki (protruding tie-beam)
  td = min(td, boxd(uv, vec2(0.50,0.535),vec2(0.011,0.05)));   // gakuzuka (centre strut)
  td = min(td, boxd(uv, vec2(0.50,0.575),vec2(0.165,0.011)));  // shimaki (lower top beam)
  float sweep = 0.028*pow(clamp(abs(uv.x-0.5)/0.20,0.0,1.0), 2.2); // ends curve upward
  td = min(td, boxd(uv - vec2(0.0,sweep), vec2(0.50,0.605), vec2(0.20,0.016))); // kasagi (swept top beam)
  float toriiMask = smoothstep(0.0035,0.0, td);
  col = mix(col, vec3(0.025,0.02,0.03), toriiMask);            // dark weathered silhouette
  float trim = smoothstep(0.010,0.0, abs(td));
  col += mix(vec3(0.32,0.42,0.62), vec3(0.95,0.78,0.55), pow(uv.y,1.5)) * trim * 0.55; // dawn rim
  col += vec3(0.45,0.10,0.07) * toriiMask * (0.12 + 0.18*smoothstep(0.30,0.66,uv.y));  // weathered vermillion

  // 七転び八起き — a figure rises and stands at the gate (fall seven, rise eight).
  // It climbs up out of the water and straightens, head lifting, over the whole outro.
  float rise = smoothstep(0.05, 0.85, uProgress);
  vec2 f = vec2((uv.x-0.5)*uAspect + 0.5, uv.y) - vec2(0.0, mix(-0.14,0.0,rise));
  float hl = mix(0.46, 0.52, rise);                    // head lifts as it straightens
  float fig = 1e9;
  fig = min(fig, capsule(f, vec2(0.5,0.30), vec2(0.5,0.46), 0.022));            // torso
  fig = min(fig, capsule(f, vec2(0.5,0.46), vec2(0.5,hl), 0.018));              // head/neck
  fig = min(fig, capsule(f, vec2(0.5,0.44), vec2(mix(0.47,0.455,rise),0.34), 0.013)); // left arm
  fig = min(fig, capsule(f, vec2(0.5,0.44), vec2(mix(0.53,0.545,rise),0.34), 0.013)); // right arm
  fig = min(fig, capsule(f, vec2(0.49,0.30), vec2(0.48,0.18), 0.015));          // left leg
  fig = min(fig, capsule(f, vec2(0.51,0.30), vec2(0.52,0.18), 0.015));          // right leg
  float figMask = smoothstep(0.004,0.0, fig);
  col = mix(col, vec3(0.02,0.03,0.05), figMask);                               // dark silhouette
  float frim = smoothstep(0.012,0.0, abs(fig));
  col += mix(vec3(0.4,0.5,0.7), vec3(1.0,0.85,0.6), rise) * frim * (0.35+0.85*rise); // dawn rim = strength
  col += vec3(0.85,0.72,0.5) * smoothstep(0.10,0.0, fig) * rise * 0.14 * (0.75+0.25*sin(uTime*0.7)); // resolve aura

  o = vec4(col,1.0);
}
