#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform float uTime;
uniform float uProgress;
// __COMMON__
void main(){
  // plunge: accelerate inward through the movement; the second half is a real dive
  float plunge = smoothstep(0.5,1.0,uProgress);          // 0 until halfway, then dives
  float fall = 1.0 - 0.5*uProgress - 0.30*plunge;        // core swells, then we rush in
  vec2 p = (vUv - 0.5) * fall; p.x *= 1.78;
  float r = length(p);
  float ang = atan(p.y,p.x);
  vec3 col = vec3(0.02,0.015,0.05);

  // starfield streaming inward — blueshifts and stretches into long streaks as we dive
  float streakLen = 0.05 + 0.22*plunge;                  // short orbit -> long radial streaks
  for (int i=0;i<32;i++){
    float fi=float(i);
    float seed=hash(vec2(fi,3.0));
    float spd = 0.06 + 0.04*seed + 0.12*uProgress + 0.5*plunge;
    float life = fract(seed + uTime*spd);
    float rr = mix(0.9,0.03,life);
    float a = seed*6.2831 + uTime*0.1;
    vec2 sp = vec2(cos(a),sin(a))*rr; sp.x*=1.78;
    // streak: stretch toward the core as it accelerates
    vec2 dir = normalize(-sp + 1e-4);
    float along = clamp(dot(p-sp, dir),0.0,streakLen);
    vec2 q = sp + dir*along;
    float s = smoothstep(0.010,0.0, distance(p,q)) * life;
    vec3 sc = mix(vec3(0.7,0.8,1.0), vec3(0.9,0.7,1.0), uProgress);
    sc = mix(sc, vec3(0.6,0.85,1.0), plunge);            // blueshift on the dive
    col += sc*s*(0.7+1.0*plunge);
  }

  // spinning accretion ring — tighter, hotter, more turbulent as we fall;
  // the disk tilts toward edge-on as we dive in (squash y), so the silhouette keeps shifting
  float tilt = 1.0 - 0.45*plunge;
  float rT = length(vec2(p.x, p.y/max(tilt,0.2)));
  float rIn = 0.17 - 0.02*uProgress, rOut = 0.32 - 0.02*uProgress;
  float ring = smoothstep(rOut,rOut-0.05,rT) * smoothstep(rIn,rIn+0.05,rT);
  float spin = uTime*(2.5 + 0.7*sin(uTime*0.2)) + 18.0*plunge;   // ring accelerates on the dive
  float swirl = 0.5+0.5*sin(ang*6.0 + spin - rT*34.0 + noise(vec2(ang*3.0,uTime*0.4))*3.0);
  float hot = 0.5+0.5*sin(ang*3.0 - uTime*1.7);
  vec3 hotCol = mix(vec3(1.0,0.9,0.6), vec3(1.0,0.6,0.9), uProgress*0.6);
  col += mix(vec3(0.9,0.35,0.08), hotCol, swirl) * ring * (1.4+hot+0.8*uProgress);

  // pulsing lens halo, widening as the pull strengthens
  float halo = smoothstep(0.5+0.2*uProgress,0.2,r)*0.15*(0.6+0.4*sin(uTime*0.8));
  col += mix(vec3(0.4,0.2,0.7), vec3(0.6,0.2,0.5), uProgress)*halo;

  // sweeping bright jet raking across the disk
  float jet = pow(max(0.0, sin(ang - uTime*0.6)), 36.0);
  col += mix(vec3(1.0,0.8,0.6), vec3(1.0,0.6,0.95), uProgress) * jet * smoothstep(0.46,0.16,r) * (0.5+0.7*uProgress);

  // black core with a lensing wobble (event horizon breathing)
  float core = 0.165 + 0.012*sin(uTime*1.3) + 0.01*noise(vec2(ang*2.0,uTime*0.5));
  col *= smoothstep(core,core+0.035,r);

  // crossing the horizon: at the very end the void inverts into a blinding bloom
  // that blows the frame out — the dive resolves into light, handing off to the Gate
  float cross = smoothstep(0.93,1.0,uProgress);
  float bloom = smoothstep(core+0.20, core-0.02, r);        // brightest at the core
  col += vec3(1.0,0.95,0.9) * bloom * cross * (1.0 + 6.0*cross);
  col += vec3(1.0,0.97,0.92) * smoothstep(0.6,0.0,r) * cross*cross * 2.5;
  o = vec4(col, 1.0);
}
