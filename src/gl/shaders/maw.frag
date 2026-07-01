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
void main(){
  // plunge: accelerate inward through the movement; the second half is a real dive
  float plunge = smoothstep(0.5,1.0,uProgress);          // 0 until halfway, then dives
  float fall = 1.0 - 0.5*uProgress - 0.30*plunge;        // core swells, then we rush in
  // THE NADIR: in the breakdown the void goes almost silent — everything fades until
  // only the heart is left, beating alone in the dark. The loneliest moment.
  float nad = smoothstep(172.0,178.0,uTime) * (1.0 - smoothstep(193.0,199.0,uTime));
  vec2 p = (vUv - 0.5) * fall; p.x *= uAspect;
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
    vec2 sp = vec2(cos(a),sin(a))*rr; sp.x*=uAspect;
    // streak: stretch toward the core as it accelerates
    vec2 dir = normalize(-sp + 1e-4);
    float along = clamp(dot(p-sp, dir),0.0,streakLen);
    vec2 q = sp + dir*along;
    float s = smoothstep(0.010,0.0, distance(p,q)) * life;
    vec3 sc = mix(vec3(0.7,0.8,1.0), vec3(0.9,0.7,1.0), uProgress);
    sc = mix(sc, vec3(0.6,0.85,1.0), plunge);            // blueshift on the dive
    col += sc*s*(0.7+1.0*plunge);
  }

  // larger debris tumbling in on decaying spiral orbits — the consumed world/titan,
  // winding up and heating as they near the horizon
  for(int i=0;i<5;i++){
    float fi=float(i);
    float seed=hash(vec2(fi,17.0));
    float life=fract(seed + uTime*(0.022+0.015*seed+0.05*uProgress));
    float rr = mix(0.6, 0.17, life);
    float a = seed*6.2831 + uTime*0.25 + (1.0-life)*7.0;   // orbit speeds up as it falls in
    vec2 dp = vec2(cos(a)*uAspect, sin(a)*0.62)*rr;         // tilted into the disk plane
    float d = distance(p, dp);
    float heat = life*life;                                 // glows hotter near the core
    col = mix(col, vec3(0.02,0.018,0.025), smoothstep(0.013,0.0,d)); // dark rocky body
    col += mix(vec3(0.7,0.4,0.25), vec3(1.0,0.7,0.4), heat) * smoothstep(0.016,0.005,d) * (0.4+0.8*heat);
  }

  // spinning accretion ring — tighter, hotter, more turbulent as we fall;
  // the disk tilts toward edge-on as we dive in (squash y), so the silhouette keeps shifting
  float tilt = 1.0 - 0.45*plunge - 0.06*sin(uTime*0.11);         // disk slowly precesses, never frozen
  float rT = length(vec2(p.x, p.y/max(tilt,0.2)));
  // radii breathe on slow cycles so the maw evolves across its whole long reign
  float rIn = 0.17 - 0.02*uProgress + 0.012*sin(uTime*0.23);
  float rOut = 0.32 - 0.02*uProgress + 0.022*sin(uTime*0.31+2.0);
  float ring = smoothstep(rOut,rOut-0.05,rT) * smoothstep(rIn,rIn+0.05,rT);
  float spin = uTime*(2.5 + 0.7*sin(uTime*0.2)) + 18.0*plunge;   // ring accelerates on the dive
  float swirl = 0.5+0.5*sin(ang*6.0 + spin - rT*34.0 + noise(vec2(ang*3.0,uTime*0.4))*3.0);
  float hot = 0.5+0.5*sin(ang*3.0 - uTime*1.7);
  vec3 hotCol = mix(vec3(1.0,0.9,0.6), vec3(1.0,0.6,0.9), uProgress*0.6);
  // spiral-arm structure: intensity rides the swirl so the disk keeps visible turbulence
  col += mix(vec3(0.9,0.35,0.08), hotCol, swirl) * ring * (0.85 + 0.6*hot + 0.45*uProgress) * (0.55+0.45*swirl);

  // pulsing lens halo, widening as the pull strengthens
  float halo = smoothstep(0.5+0.2*uProgress,0.2,r)*0.15*(0.6+0.4*sin(uTime*0.8));
  col += mix(vec3(0.4,0.2,0.7), vec3(0.6,0.2,0.5), uProgress)*halo;

  // sweeping bright jet raking across the disk
  float jet = pow(max(0.0, sin(ang - uTime*0.6)), 36.0);
  col += mix(vec3(1.0,0.8,0.6), vec3(1.0,0.6,0.95), uProgress) * jet * smoothstep(0.46,0.16,r) * (0.5+0.7*uProgress);

  // black core with a lensing wobble (event horizon breathing)
  float core = 0.165 + 0.045*uProgress + 0.012*sin(uTime*1.3) + 0.01*noise(vec2(ang*2.0,uTime*0.5)); // the horizon GROWS as it wins
  col *= smoothstep(core,core+0.035,r);

  col *= 1.0 - 0.94*nad;                                   // the nadir: the void falls silent

  // THE TITAN, dragged in from its fall — tumbling toward the core, stretched by the pull,
  // its heart the last light before the void swallows it. Drawn over the void so the lone
  // falling being reads against the black. (the through-line continues)
  float present = smoothstep(0.48, 0.0, uProgress);        // sinks in through the drop, starkly visible in the breakdown calm, then gone
  present = max(present, 0.85*nad);                        // in the nadir it lingers — the heart refuses to go out
  {
    float fallIn = 1.0 - present;                          // 0 at edge .. 1 consumed
    vec2 fc = mix(vec2(0.10,0.06), vec2(0.0,0.0), fallIn);  // tumbles in toward the core, over the black
    float ta = 0.8 + uTime*0.5 + fallIn*7.0;               // tumbling helplessly
    float cs=cos(ta), sn=sin(ta);
    vec2 lp = vec2(cs*(p.x-fc.x)-sn*(p.y-fc.y), sn*(p.x-fc.x)+cs*(p.y-fc.y));
    lp.y /= mix(1.0, 2.6, fallIn);                         // spaghettified, stretched toward the core
    lp /= mix(0.24, 0.14, fallIn);                         // big as it enters, shrinks as it recedes
    float fig=1e9;
    fig=min(fig,capsule(lp, vec2(0.0,0.4), vec2(0.0,-0.2), 0.16)); // torso
    fig=min(fig,capsule(lp, vec2(0.0,0.4), vec2(0.0,0.72), 0.12)); // head
    fig=min(fig,capsule(lp, vec2(0.0,0.2), vec2(-0.45,-0.1),0.09));// arm
    fig=min(fig,capsule(lp, vec2(0.0,0.2), vec2(0.45,-0.1), 0.09));// arm
    fig=min(fig,capsule(lp, vec2(0.0,-0.2),vec2(-0.2,-0.85),0.1)); // leg
    fig=min(fig,capsule(lp, vec2(0.0,-0.2),vec2(0.2,-0.85), 0.1)); // leg
    // a luminous falling being — bright cold outline against the void
    col += vec3(0.6,0.8,1.0) * smoothstep(0.05,0.0,abs(fig)) * present * 1.4 * (1.0-0.88*nad); // glowing outline, dims in the nadir
    col += vec3(0.4,0.6,1.0) * smoothstep(0.13,0.0,fig) * present * 0.4 * (1.0-0.88*nad);      // soft aura
    float beatM = pow(0.5+0.5*sin(uTime*2.6),6.0)+0.7*pow(0.5+0.5*sin(uTime*2.6-0.7),6.0);
    float hdm = length(lp - vec2(0.0,0.12));
    col += vec3(1.0,0.55,0.2) * smoothstep(0.24,0.0,hdm) * (0.45+0.7*beatM) * present * 2.0 * (1.0+0.7*nad); // the heart alone survives the silence
  }

  // Gargantua lensing: a thin bright photon ring hugging the shadow + disk light
  // bent up and over the top of the hole (the iconic halo).
  float photon = smoothstep(0.010,0.0, abs(r - (core+0.018)));
  col += mix(vec3(1.0,0.85,0.6), vec3(1.0,0.7,0.9), uProgress*0.5) * photon * (1.1+0.5*uProgress) * (1.0-0.9*nad);
  float overTop = smoothstep(0.055,0.0, abs(r-(core+0.06))) * smoothstep(-0.1,0.5, p.y/max(r,1e-3));
  col += vec3(1.0,0.82,0.55) * overTop * 0.45 * (1.0-0.9*nad);

  // THE OPHANIM — the void has a face. Two counter-rotating wheels of eyes around the
  // horizon, waking as we come closer. It does not attack. It only watches.
  {
    float oph = smoothstep(0.25,0.65,uProgress) * (1.0 - smoothstep(0.93,1.0,uProgress));
    oph *= 1.0 - 0.85*nad;                               // in the nadir even the eyes close
    if (oph > 0.003){
      for (int ringI=0; ringI<2; ringI++){
        float fr = float(ringI);
        float rr = core + 0.075 + 0.055*fr;              // wheels hugging the horizon
        float rotA = uTime*(0.045+0.03*fr) * ((fr<0.5)?1.0:-1.0);
        float N = 9.0 + 4.0*fr;                          // sparse — uncanny, not a swarm
        float cell = floor((ang + rotA)/6.2831*N + 0.5); // nearest eye slot on the wheel
        float ca2 = cell/N*6.2831 - rotA;                // its centre angle in world space
        vec2 ec = vec2(cos(ca2), sin(ca2))*rr;
        vec2 tangent = vec2(-sin(ca2), cos(ca2));
        vec2 radial  = vec2(cos(ca2), sin(ca2));
        vec2 lp2 = vec2(dot(p-ec,tangent), dot(p-ec,radial));
        // each eye wakes on its own slow clock; all of them are open near the end
        float open = smoothstep(0.25,0.75, oph*(0.6+0.5*sin(uTime*0.37 + hash(vec2(cell,fr+31.0))*6.2831)));
        float eyeD = length(lp2/vec2(0.014, 0.008*open + 1e-4));
        float eyeM = smoothstep(1.0,0.75,eyeD) * oph;
        // and every pupil looks INWARD — at what the void is swallowing
        vec2 pup = lp2 + vec2(0.0, 0.0035*open);         // radially inward in the local frame
        col = mix(col, vec3(0.80,0.76,0.68)*(0.25+0.55*open), eyeM*0.6);
        col = mix(col, vec3(0.75,0.45,0.20), smoothstep(0.0050,0.0034,length(pup))*eyeM*0.9); // amber iris
        col = mix(col, vec3(0.0),            smoothstep(0.0026,0.0016,length(pup))*eyeM);     // black pupil
        col += vec3(0.7,0.6,0.45) * smoothstep(0.12,0.0,abs(eyeD-1.0)) * eyeM * 0.06;         // faint lid glow
        col += vec3(0.4,0.32,0.25) * smoothstep(0.0016,0.0,abs(r-rr)) * oph * 0.3;            // the hairline wheel binding them
      }
    }
  }

  // crossing the horizon: at the very end the void inverts into a blinding bloom
  // that blows the frame out — the dive resolves into light, handing off to the Gate
  float cross = smoothstep(0.93,1.0,uProgress);
  float bloom = smoothstep(core+0.20, core-0.02, r);        // brightest at the core
  col += vec3(1.0,0.95,0.9) * bloom * cross * (1.0 + 6.0*cross);
  col += vec3(1.0,0.97,0.92) * smoothstep(0.6,0.0,r) * cross*cross * 2.5;
  // soft-shoulder tone map: tame the additive pile-up so the disk keeps its internal
  // structure instead of clipping to a featureless white donut (the final crossing
  // still blows past 1.0 and whites out — that part is intentional)
  col = col / (1.0 + 0.28*col);
  col *= 1.25;
  o = vec4(col, 1.0);
}
