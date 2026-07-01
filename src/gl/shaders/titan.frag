#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform float uTime;
uniform float uProgress;
uniform float uAspect;
// __COMMON__
// --- the titan is a real 3D body: articulated capsules raymarched with normals,
// --- backlit by the dying sun, molten cracks wrapping the actual form
float cap3(vec3 p, vec3 a, vec3 b, float r){
  vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);
  return length(pa-ba*h)-r;
}
mat3 rotAxis(vec3 x, float t){
  float c=cos(t), s=sin(t), ic=1.0-c;
  return mat3(c+x.x*x.x*ic,     x.x*x.y*ic-x.z*s, x.x*x.z*ic+x.y*s,
              x.y*x.x*ic+x.z*s, c+x.y*x.y*ic,     x.y*x.z*ic-x.x*s,
              x.z*x.x*ic-x.y*s, x.z*x.y*ic+x.x*s, c+x.z*x.z*ic);
}
vec3 J_HP,J_SH,J_HD,J_LK,J_RK,J_LF,J_RF,J_LH,J_RH;   // posed joints (set in main)
float bodySDF(vec3 q){
  float d =        cap3(q,J_HP,J_SH,0.075);   // torso
  d = min(d, cap3(q,J_SH,J_HD,0.05));         // neck/head
  d = min(d, cap3(q,J_SH,J_LH,0.04));         // arms
  d = min(d, cap3(q,J_SH,J_RH,0.04));
  d = min(d, cap3(q,J_HP,J_LK,0.045));        // thighs
  d = min(d, cap3(q,J_HP,J_RK,0.045));
  d = min(d, cap3(q,J_LK,J_LF,0.04));         // shins
  d = min(d, cap3(q,J_RK,J_RF,0.04));
  d += (noise(q.xy*14.0)+noise(q.zy*14.0)-1.0)*0.007;  // eroded, pitted hide
  return d;
}
vec3 bodyN(vec3 q){
  vec2 e=vec2(0.0045,0.0);
  return normalize(vec3(bodySDF(q+e.xyy)-bodySDF(q-e.xyy),
                        bodySDF(q+e.yxy)-bodySDF(q-e.yxy),
                        bodySDF(q+e.yyx)-bodySDF(q-e.yyx)));
}
// blocky ruined skyline sitting on the horizon
float skyline(vec2 uv, float base, float scale, float seed){
  float seg = floor(uv.x*scale);
  float h = base + 0.08*hash(vec2(seg,seed)) + 0.03*hash(vec2(seg,seed+2.0));
  // knock the tops off some buildings (ruined)
  float broken = step(0.6, hash(vec2(seg,seed+9.0)));
  h -= broken * 0.03 * (0.5+0.5*sin(seg*3.0));
  return step(uv.y, h) * step(0.0, uv.y);
}
void main(){
  // approach the fallen titan; at the very end the camera pulls back and drops
  // to frame the wreck of the final fall — the one it doesn't get up from
  float endFrame = smoothstep(0.94, 1.0, uProgress);
  float zoom = 1.0 - 0.25*uProgress + 0.14*endFrame;
  vec2 cc = vec2(0.5, 0.45 - 0.10*endFrame);
  vec2 uv = (vUv - cc)*zoom + cc;
  // escalating tremors: periodic camera jolts that hit harder as collapse nears
  float quake = exp(-fract(uTime*0.6)*12.0) * step(0.4, hash(vec2(floor(uTime*0.6),4.0)));
  uv += vec2(sin(uTime*73.0), cos(uTime*61.0)) * quake * (0.25+0.75*uProgress) * 0.016;
  vec2 p = vec2((uv.x-0.5)*uAspect + 0.5, uv.y);

  // oppressive dim sky, low sun behind the figure
  vec3 col = mix(vec3(0.20,0.07,0.11), vec3(0.03,0.02,0.08), pow(clamp(uv.y,0.0,1.0),0.7));
  vec2 sun = vec2(0.5,0.27);
  float sd = distance(uv, sun);
  col += vec3(0.95,0.42,0.22) * smoothstep(0.45,0.0,sd) * 0.45;

  // volumetric god-rays fanning from the sun behind
  vec2 toSun = uv - sun;
  float rayAng = atan(toSun.y, toSun.x);
  float rays = pow(0.5+0.5*sin(rayAng*26.0 + sin(rayAng*7.0+uTime*0.15)*1.5), 3.0);
  col += vec3(1.0,0.5,0.28) * rays * smoothstep(0.7,0.05,length(toSun)) * 0.22;

  // lightning cracking the doomed sky — discrete flashes, more frequent as it worsens
  float lk = floor(uTime*0.7);
  float lflash = exp(-fract(uTime*0.7)*16.0) * step(0.62 - 0.3*uProgress, hash(vec2(lk,3.0)));
  float lx = hash(vec2(lk,8.0));                          // bolt position across the sky
  col += vec3(0.75,0.55,0.85) * lflash * (0.25+0.5*uProgress)
       * (0.4 + smoothstep(0.25,0.0, abs(uv.x-lx)) * smoothstep(0.0,0.6,uv.y));

  // distant ruined skyline (two parallax bands)
  float sky1 = skyline(uv, 0.135, 26.0, 7.0);
  float sky2 = skyline(vec2(uv.x+0.02,uv.y), 0.165, 14.0, 3.0);
  col = mix(col, vec3(0.07,0.03,0.06), sky2*0.85);   // far band
  col += vec3(0.9,0.4,0.2) * sky2 * smoothstep(0.005,0.0, abs(uv.y-0.165)) * 0.6; // rim
  col = mix(col, vec3(0.04,0.02,0.04), sky1*0.92);   // near band
  col += vec3(1.0,0.45,0.22) * sky1 * smoothstep(0.005,0.0, abs(uv.y-0.135)) * 0.7;

  // drifting ash in three depth layers (parallax)
  for(int i=0;i<40;i++){
    float fi=float(i);
    float layer = mod(fi,3.0);                       // 0 far .. 2 near
    float sz = 0.0025 + 0.0018*layer;
    float spd = 0.012 + 0.012*layer;
    float sx=hash(vec2(fi,2.0)), sy=hash(vec2(fi,5.0));
    vec2 ap=vec2(fract(sx + sin(fi)*0.13 + sin(uTime*0.05+fi)*0.01),
                 fract(sy - uTime*spd));
    float tw = 0.35 + 0.45*sin(uTime*3.0+fi);
    col += vec3(1.0,0.5,0.2) * smoothstep(sz,0.0, distance(uv,ap)) * tw * (0.4+0.3*layer);
  }

  // the titan COLLAPSES and rises: under its own dying weight the knees buckle, the
  // hips sink, the torso folds and it crashes into a broken heap — lies there — then
  // drags itself back up. Heavy and slow, not a tip-over. The fall of 七転び八起き.
  // the titan FALLS: it strains to hold, then overbalances and PITCHES over with the
  // weight of a mountain — crashing down, lying broken — then drags itself back up.
  // Heavy and violent, never a gentle slump. (The true rise of 七転び八起き is the Gate.)
  // the falls are LOCKED to the track's real hits (kick-onset analysis of the mp3):
  // each crash lands ON a heavy hit; the last fall lands just before the drop and it
  // does NOT get up from that one — the Maw takes it.
  const int NC = 4;
  const float CRS[NC]   = float[](58.02, 72.14, 95.06, 107.39);    // crash instants (real hits)
  const float SEG[NC+1] = float[](46.0, 66.0, 80.0, 103.0, 113.0); // cycle spans
  float ck = 0.0, tl = 0.05, Ci = CRS[0];
  for (int i=0;i<NC;i++){
    if (uTime >= SEG[i] && uTime < SEG[i+1]){
      ck = float(i); Ci = CRS[i];
      tl = (uTime < Ci) ? 0.47*clamp((uTime-SEG[i])/(Ci-SEG[i]),0.0,1.0)
                        : 0.47 + 0.53*clamp((uTime-Ci)/(SEG[i+1]-Ci),0.0,1.0);
    }
  }
  if (uTime >= SEG[NC]) { ck = float(NC-1); tl = 0.999; Ci = CRS[NC-1]; }
  float finalFall = step(2.5, ck);                       // the 4th fall is the one it stays down from
  float desp = 0.75 + 0.5*uProgress;
  float r1=hash(vec2(ck,3.0)), r2=hash(vec2(ck,7.0)), r3=hash(vec2(ck,13.0)), r4=hash(vec2(ck,19.0));
  float dirn = (r1<0.5)?1.0:-1.0;                        // which way it goes down (varies per fall)
  float fallAt = 0.35;
  float crashT = 0.47;                                   // phase anchored to the authored hit
  // an accelerating pitch (momentum), a held beat down, then a slow rise
  float fv = smoothstep(fallAt, crashT, tl);
  float fallP = fv*fv;
  float upP   = smoothstep(0.74,0.95,tl); upP = 1.0-(1.0-upP)*(1.0-upP);
  upP *= 1.0 - finalFall;                                // the last time, there is no getting up
  float angAmt = clamp(fallP - upP, 0.0, 1.0);
  float maxAng = mix(0.90,1.10,r3);                      // ~52-63deg: down hard, but the wreck stays IN FRAME
  // MASS: it slams past the ground and rebounds once before settling — momentum, not keyframes
  float since = max(0.0, uTime - Ci);                    // seconds since impact
  float bounce = sin(since*6.5) * exp(-since*2.4) * 0.13 * step(0.5, fallP);
  float lagAmt = 4.0*fv*(1.0-fv);                        // how fast it's pitching right now
  float crash  = smoothstep(crashT-0.03,crashT,tl)*smoothstep(crashT+0.14,crashT,tl);
  float c = smoothstep(crashT-0.02, crashT+0.05, tl) * mix(1.0-smoothstep(0.74,0.90,tl), 1.0, finalFall);
  float effort = smoothstep(0.74,0.86,tl)*(1.0-smoothstep(0.93,1.0,tl)) * (1.0-finalFall);      // strain to rise
  // while down it TRIES: a first push at rising that fails and drops back — then the real one
  float tryP = smoothstep(0.58,0.63,tl)*(1.0-smoothstep(0.63,0.70,tl)) * step(0.5,fallP) * (1.0-finalFall);
  // between falls it takes hits it HOLDS against — jolting ON real hits, staying up
  const int NS = 5;
  const float STG[NS] = float[](65.11, 68.05, 84.11, 88.99, 101.42);
  float upright = clamp(1.0 - angAmt, 0.0, 1.0);
  float stag = 0.0, stagLean = 0.0;
  for (int i=0;i<NS;i++){
    float dt = uTime - STG[i];
    float en = step(0.0,dt)*exp(-max(dt,0.0)*2.6);   // max() keeps exp finite pre-hit (0*inf = NaN)
    stag += en;
    stagLean += en*cos(dt*7.0) * ((mod(float(i),2.0)<1.0)?1.0:-1.0);
  }
  stag = min(stag,1.0) * upright;
  angAmt -= 0.11*tryP;
  effort = max(effort, tryP);
  float ang = (angAmt + bounce) * maxAng * dirn + 0.10*stagLean*upright;
  float tension = smoothstep(0.0,fallAt,tl); float tremor = tension*tension;             // trembling builds
  // camera shakes ride the ray origin now (the body is a true 3D form)
  vec2 camOfs = vec2(0.0);
  camOfs.x += sin(uTime*0.7)*0.004 + sin(uTime*24.0)*0.007*tremor;        // teeters harder at the brink
  camOfs += crash * vec2(sin(uTime*95.0),cos(uTime*88.0)) * 0.022 * desp; // violent ground-impact shake
  camOfs += stag * vec2(sin(uTime*82.0),cos(uTime*74.0)) * 0.008;         // jolt on the hits it holds against
  camOfs.y += 0.016 * desp * sin(since*11.0) * exp(-since*3.0) * step(0.001, since) * step(0.5,fallP);
  // each fall topples along its OWN axis in depth; the LAST one comes down TOWARD us
  float psi = ((dirn>0.0)?0.0:3.14159) + (r2-0.5)*1.1;
  psi = mix(psi, -1.5708 + (r2-0.5)*0.4, finalFall);
  vec3 fallDir = vec3(cos(psi), 0.0, sin(psi));
  float fdx = fallDir.x;                                 // screen-x component (dust / ground ring)
  vec3 axisR = normalize(cross(vec3(0.0,1.0,0.0), fallDir) + 1e-5);
  // before the break: knees buckle and the hips sag — you SEE the weight win
  float buckle = tremor * (1.0 - fallP) * (0.5+0.5*r4);
  // body crumples a little on landing so it's a broken heap, not a rigid plank
  vec3 HP=mix(vec3(0.5,0.18 - 0.020*buckle,0.0), vec3(0.5,0.15,0.0), c);
  vec3 SH=mix(vec3(0.5,0.48 - 0.030*buckle,0.0), vec3(0.5,0.40,0.0)+fallDir*0.04, c);
  vec3 HD=mix(vec3(0.5,0.62 - 0.035*buckle,0.0), vec3(0.5,0.50,0.0)+fallDir*0.08, c);
  HD = mix(HD, HD+vec3(0.0,0.07,0.0), effort);           // head lifts as it strains upright
  vec3 LK=vec3(0.47-0.014*buckle,0.10,0.012), RK=vec3(0.53+0.014*buckle,0.10,-0.012);
  vec3 LF=vec3(0.45,0.0,0.02),  RF=vec3(0.55,0.0,-0.02);
  vec3 LH=mix(vec3(0.33+0.03*(r4-0.5),0.28,0.03), vec3(0.31,0.34,0.05), c);  // stance varies per fall
  vec3 RH=mix(vec3(0.66,0.40+0.05*(r1-0.5),-0.02), vec3(0.69,0.34,-0.04), c);
  // ALIVE: it breathes, pants when down, shifts its weight, its head wanders and
  // sinks with the weariness — never a held pose, never a statue
  float br = sin(uTime*0.9 + 0.4*sin(uTime*0.13));       // breath, slightly irregular
  float pant = c * (0.5+0.5*sin(uTime*4.2));             // heaving hard while down
  SH.y += 0.008*br + 0.012*pant;
  HD.y += 0.005*br + 0.010*pant - 0.035*tremor*(1.0-effort); // head hangs as weariness builds
  HP.x += 0.007*sin(uTime*0.31 + r1*6.0);                // weight shifting foot to foot
  SH.x += 0.005*sin(uTime*0.27 + 2.0);
  HD.x += 0.010*sin(uTime*0.23 + r4*6.0);                // head slowly wandering
  HD.z += 0.028*sin(uTime*0.17 + r1*4.0);                // ...and TURNING, in depth
  SH.z += 0.012*sin(uTime*0.21 + 1.0);                   // shoulders counter-rotate slightly
  // one hand guards the burning heart; the other hangs, riding the breath
  LH = mix(LH, mix(HP,SH,0.55) + vec3(-0.07, 0.01+0.010*br, 0.06), 0.5*(1.0-fallP)*(1.0-c));
  RH.y += 0.012*br*(1.0-fallP);
  // and it FLINCHES from the lightning — recoiling, half-guarding: a creature, not a loop
  float flinch = lflash * (1.0-fallP) * (1.0-c);
  float away = (lx<0.5) ? 1.0 : -1.0;
  HD.x += 0.020*away*flinch; SH.x += 0.010*away*flinch;
  LH += vec3(-0.02, 0.09, 0.02)*flinch; RH += vec3(0.03, 0.12, -0.02)*flinch;
  // INERTIA: the upper body lags the pitch, then whips past and folds on impact —
  // the joints articulate through the fall instead of riding it like a plank
  float bend = maxAng * (-0.30*lagAmt + 0.45*crash);
  mat3 BM  = rotAxis(axisR, bend);
  mat3 BM2 = rotAxis(axisR, bend*1.6);
  SH = HP + BM*(SH-HP);
  HD = HP + BM2*(HD-HP);                                 // the head whips hardest
  // arms trail UP against the fall, flailing, then slam down with the crash
  vec3 flail = vec3(0.0,(0.10+0.06*r2)*lagAmt,0.0) + (fallDir*0.05 + vec3(0.0,-0.08,0.0))*crash;
  LH = HP + BM*(LH-HP) + flail + vec3(-0.02, 0.020, 0.015)*sin(uTime*11.0)*lagAmt;
  RH = HP + BM*(RH-HP) + flail + vec3( 0.02,-0.015,-0.015)*sin(uTime*13.0)*lagAmt;
  // pitch the whole body about its feet, along this fall's own axis in depth
  vec3 pivot3 = vec3(0.5,0.03,0.0);
  mat3 FM = rotAxis(axisR, ang);
  J_HP=pivot3+FM*(HP-pivot3); J_SH=pivot3+FM*(SH-pivot3); J_HD=pivot3+FM*(HD-pivot3);
  J_LK=pivot3+FM*(LK-pivot3); J_RK=pivot3+FM*(RK-pivot3);
  J_LF=pivot3+FM*(LF-pivot3); J_RF=pivot3+FM*(RF-pivot3);
  J_LH=pivot3+FM*(LH-pivot3); J_RH=pivot3+FM*(RH-pivot3);

  // raymarch the colossus: a real volume, backlit by the dying sun
  vec3 ro = vec3(0.5 + camOfs.x, 0.35 + camOfs.y, -2.4);
  vec3 rdir = normalize(vec3(p.x-0.5, p.y-0.35, 2.4));
  float beat = pow(0.5+0.5*sin(uTime*2.6),6.0) + 0.7*pow(0.5+0.5*sin(uTime*2.6-0.7),6.0);
  vec3 chest3 = mix(J_HP, J_SH, 0.55);                     // rides the body through fall + rise
  float tm = 1.0, mask = 0.0, crack = 0.0;
  vec3 q = ro;
  for (int i=0;i<72;i++){
    q = ro + rdir*tm;
    float d = bodySDF(q);
    if (d < 0.0035){ mask = 1.0; break; }
    tm += d*0.85;
    if (tm > 4.2) break;
  }
  if (mask > 0.5){
    vec3 n = bodyN(q);
    // molten cracks wrap the actual 3D form (triplanar bands)
    float cn = noise(q.xy*16.0+2.0)*abs(n.z) + noise(q.zy*16.0+2.0)*abs(n.x) + noise(q.xz*16.0+2.0)*abs(n.y);
    crack = smoothstep(0.40,0.48,cn)*smoothstep(0.60,0.52,cn);
    float cn2 = noise(q.xy*7.0 + uTime*0.03) + noise(q.zy*7.0)*0.5;
    crack += smoothstep(0.68,0.74,cn2)*smoothstep(0.9,0.78,cn2)*0.7;
    // dark volcanic hide, lit by the world — it STAYS a dark colossus
    vec3 base = vec3(0.020,0.015,0.030)*(0.35+0.65*noise(q.xy*9.0+q.z*4.0));
    vec3 sunD = normalize(vec3(0.0,-0.10,1.0));            // the low sun BEHIND it
    float fres = pow(1.0-max(dot(n,-rdir),0.0), 2.6);
    float back = max(dot(n, sunD), 0.0);
    float top  = max(n.y, 0.0);
    col = base;
    col += vec3(0.14,0.06,0.10)*top*0.5;                            // dim sky fill
    col += vec3(1.0,0.50,0.25)*fres*(0.35+0.65*back)*1.25;          // burning rim from the sun behind
    col += vec3(1.0,0.40,0.10)*crack*(0.30+0.55*uProgress)*(0.7+0.3*sin(uTime*4.0)); // wounds glow
    col += vec3(1.0,0.60,0.20)*crack*effort*(0.5+0.5*uProgress);    // flare with the strain to rise
    col += vec3(1.0,0.50,0.15)*crack*c*(0.6+0.5*uProgress);         // blown open by the crash
    col += vec3(1.0,0.70,0.35)*(0.25+0.75*crack)*crash*(0.7+0.6*uProgress); // impact flash in the wounds
    // THE HEART — self-preservation — glows from INSIDE the chest, through the wounds.
    // The same heart that beats in the dead world, the void, and the risen figure.
    float hd3 = distance(q, chest3);
    col += vec3(1.0,0.50,0.18)*exp(-hd3*8.0)*(0.5+0.8*beat)*(0.45+0.75*crack);
  }
  // the heart's halo bleeds past the silhouette (closest ray approach to the chest)
  {
    vec3 w = chest3 - ro;
    float tc = clamp(dot(w, rdir), 0.0, 4.2);
    float dray = length(w - rdir*tc);
    float occl = (mask > 0.5 && tm < tc) ? 0.25 : 1.0;
    col += vec3(1.0,0.50,0.18) * (0.35+0.65*beat) / (1.0 + 1400.0*dray*dray) * 0.55 * occl;
  }

  // dust explodes out where the body crashes into the ground
  {
    float dl = tl;
    float hit = smoothstep(crashT-0.05,crashT,dl)*smoothstep(crashT+0.22,crashT,dl) * desp;
    float spread = max(0.0, dl-crashT);
    for(int i=0;i<12;i++){
      float fi=float(i);
      float da = (hash(vec2(fi,71.0))-0.5)*2.4;
      vec2 dp = vec2(0.5 + fdx*(0.12+0.8*spread) + sin(da)*(0.05+0.7*spread), 0.02 + abs(cos(da))*0.26*spread);
      dp.x = (dp.x-0.5)*uAspect + 0.5;
      col += vec3(0.85,0.5,0.28) * smoothstep(0.024,0.0, distance(p,dp)) * hit;
    }
    // the ground itself cracks outward from where it lands — a shockwave along the earth
    float swr = since*0.55;
    float gring = smoothstep(0.014,0.0, abs(distance(p, vec2(0.5+fdx*0.34,0.035)) - swr))
                * exp(-since*2.2) * step(0.001,since) * step(0.5,fallP);
    col += vec3(1.0,0.55,0.25) * gring * desp * 1.1;
  }

  // eruption bursts: the cracks flare in sudden flashes across the body
  float ek = floor(uTime*0.8);
  float erupt = exp(-fract(uTime*0.8)*9.0) * step(0.45, hash(vec2(ek,9.0)));
  col += vec3(1.0,0.55,0.18) * erupt * mask * (0.25+0.75*crack) * (0.35 + 0.65*uProgress);

  // rising sparks lifting off the burning titan
  for(int i=0;i<10;i++){
    float fi=float(i);
    float t = fract(hash(vec2(fi,11.0)) + uTime*(0.14+0.10*hash(vec2(fi,12.0))));
    vec2 sk = vec2(0.42 + 0.16*hash(vec2(fi,13.0)) + sin(uTime*2.0+fi)*0.012, 0.04 + t*0.52);
    col += vec3(1.0,0.6,0.2) * smoothstep(0.004,0.0, distance(uv,sk)) * (1.0-t) * (0.6+0.4*sin(uTime*6.0+fi));
  }

  // heat shimmer rising in front of the figure
  float haze = noise(vec2(uv.x*26.0, uv.y*10.0 - uTime*0.9));
  col += vec3(0.45,0.18,0.06) * haze * smoothstep(0.45,0.0, abs(uv.x-0.5)) * smoothstep(0.0,0.45,uv.y) * 0.07;

  // chunks breaking off and falling away (increase with progress)
  for(int i=0;i<14;i++){
    float fi=float(i);
    float em = float(uProgress>0.15)*step(hash(vec2(fi,8.0)), 0.3+0.6*uProgress);
    float bx = 0.40 + 0.20*hash(vec2(fi,1.0));
    float t = fract(hash(vec2(fi,4.0)) + uTime*(0.05+0.05*hash(vec2(fi,6.0))));
    vec2 cp = vec2(bx + (hash(vec2(fi,2.0))-0.5)*0.15*t, 0.45 - t*0.42);
    cp.x = (cp.x-0.5)*uAspect + 0.5;
    float ch = smoothstep(0.012,0.0, distance(p,cp)) * (1.0-t) * em;
    col = mix(col, vec3(0.03,0.02,0.03), ch);
    col += vec3(1.0,0.45,0.15) * ch * 0.8;             // molten glow on falling chunks
  }

  // foreground ground with scattered rubble
  float gline = 0.04 + 0.015*noise(vec2(uv.x*30.0, 0.0));
  if (uv.y < gline){
    col = mix(col, vec3(0.05,0.025,0.04), smoothstep(gline,gline-0.04,uv.y));
    // rubble bumps catching the rim light
    float rub = step(0.7, noise(vec2(uv.x*40.0, 1.0)));
    col += vec3(0.6,0.28,0.15) * rub * smoothstep(0.02,0.0, abs(uv.y-gline*0.6)) * 0.4;
  }
  col *= smoothstep(0.0,0.04, uv.y);
  // emerging through the planet's crust: a warm flash on arrival that clears fast
  col += vec3(1.0,0.55,0.25) * (1.0 - smoothstep(0.0,0.05,uProgress)) * 0.45;
  o = vec4(col, 1.0);
}
