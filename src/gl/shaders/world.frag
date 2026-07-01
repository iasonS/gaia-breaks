#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform float uTime;
uniform float uProgress;
uniform float uAspect;
// __COMMON__
void main(){
  // slow approach toward the dead world, then PLUNGE into it at the end of the
  // movement — the planet's surface rushes up and we punch through to find the titan.
  float dive = smoothstep(0.82, 1.0, uProgress);
  float zoom = (1.0 - 0.18*uProgress) * (1.0 - 0.86*dive);
  vec2 uv = (vUv - vec2(0.5,0.30))*zoom + vec2(0.5,0.30);
  vec2 p = (uv - 0.5); p.x *= uAspect;

  // --- kinetic camera + rhythmic mega-impacts: keep the eye moving ---
  // the bombardment holds off for the first 10s — the world simply exists — then it begins
  float meteorGate = smoothstep(9.7, 10.0, uTime);
  float mt = max(0.0, uTime - 10.0);
  float mp = 4.3;
  float mk = floor(mt/mp), ml = fract(mt/mp);
  float impact = meteorGate * step(0.58, ml) * exp(-(ml-0.58)*9.0); // sharp jolt after each strike
  vec2 mhitUV = vec2(0.5 + (hash(vec2(mk,81.0))-0.5)*0.30, 0.34 + (hash(vec2(mk,82.0))-0.5)*0.14);
  uv += vec2(sin(uTime*0.17), cos(uTime*0.13))*0.006;            // living drift, never still
  uv += vec2(sin(uTime*73.0), cos(uTime*61.0))*impact*0.018;     // camera shake on impact
  float sw = max(0.0, ml-0.58);
  vec2 toh = uv - mhitUV; float dh = length(toh);
  uv += normalize(toh+1e-4) * sin((dh - sw*1.5)*38.0)*exp(-dh*4.0)*exp(-sw*5.0)*impact*0.03; // shockwave ripples the whole frame
  uv = (uv-0.5)*(1.0 - impact*0.05) + 0.5;                       // zoom punch
  p = (uv-0.5); p.x *= uAspect;

  // deep space + slowly drifting nebula (two layers)
  vec3 col = mix(vec3(0.02,0.02,0.05), vec3(0.06,0.03,0.10), uv.y);
  col += vec3(0.10,0.04,0.16) * noise(uv*3.0 + vec2(uTime*0.02,uTime*0.01)) * 0.5;
  col += vec3(0.05,0.02,0.12) * noise(uv*5.0 - vec2(uTime*0.015,0.0)) * 0.35;

  // drifting starfield (twinkle)
  vec2 sg = floor(uv*vec2(220.0,124.0));
  float sh = hash(sg);
  col += vec3(smoothstep(0.994,1.0, sh) * (0.6+0.4*sin(uTime*2.0 + sh*30.0)));

  // periodic shooting star streaking across the sky
  {
    float period = 3.5, k = floor(uTime/period), lt = fract(uTime/period);
    vec2 a0 = vec2(hash(vec2(k,1.0))*0.7, 0.72 + 0.22*hash(vec2(k,2.0)));
    vec2 dir = normalize(vec2(0.7,-0.28));
    vec2 ss = a0 + dir*lt*1.0;
    float along = clamp(dot(uv-ss, -dir), 0.0, 0.13);
    vec2 q = ss - dir*along;
    float streak = smoothstep(0.006,0.0, distance(uv,q)) * smoothstep(0.0,0.06,lt)*smoothstep(0.55,0.25,lt);
    col += vec3(0.85,0.92,1.0) * streak * 1.6;
  }

  // the dead world: a huge cracked sphere dominating the frame
  vec2 wc = vec2(0.0, -0.08);
  float R = 0.60;
  float dd = length(p - wc);
  float disc = smoothstep(R, R-0.004, dd);
  vec2 sp = (p - wc)/R;
  float z = sqrt(max(0.0, 1.0 - dot(sp,sp)));
  vec3 nrm = normalize(vec3(sp, z));
  vec3 sunDir = normalize(vec3(-0.6,0.5,0.4));
  float lit = max(0.0, dot(nrm, sunDir));
  // slowly rotating surface (planet spins under fixed sunlight)
  float rot = uTime*0.05;
  mat2 R2 = mat2(cos(rot),-sin(rot), sin(rot),cos(rot));
  vec2 rc = R2 * sp;
  // cracks spread and pulse brighter as the world dies further (progress)
  float crackThresh = 0.5 - 0.06*uProgress;
  float cracks = smoothstep(0.45,crackThresh, noise(rc*3.0 + 3.0)) * smoothstep(0.62,0.55, noise(rc*6.0 + uTime*0.02));
  cracks *= 0.55 + 0.6*noise(rc*18.0);                    // fine fracture detail inside the glow
  // the core fights to keep beating: a double-thump heartbeat throbbing through the cracks
  float beat = pow(0.5+0.5*sin(uTime*2.6),6.0) + 0.7*pow(0.5+0.5*sin(uTime*2.6-0.7),6.0);
  float pulse = 0.55 + 0.9*beat;
  vec3 surf = vec3(0.04,0.03,0.05)*(0.15 + lit*0.85);
  surf += vec3(0.05,0.035,0.06) * noise(rc*9.0) * lit * 0.8; // rotating terrain mottle catching the light
  surf += vec3(1.0,0.35,0.08) * cracks * (0.4 + 0.6*(1.0-lit)) * pulse * (1.0+0.6*uProgress); // cracks glow on the dark side
  // a vast molten rift tearing the world open, widening as it dies — a jagged CRACK
  // with charred hard banks and a white-hot seam, not a soft glow smear
  float riftLine = sp.y + 0.18*sin(sp.x*4.0 + 1.0) + 0.09*noise(rc*7.0) - 0.04*noise(rc*15.0);
  float rw = 0.020 + 0.055*uProgress;                     // narrower, meaner
  float riftGlow = smoothstep(rw, 0.0, abs(riftLine));
  float riftCore = smoothstep(0.010,0.0, abs(riftLine));
  float bank = smoothstep(rw*1.7, rw*0.9, abs(riftLine)); // scorched banks: hard edge
  surf = mix(surf, vec3(0.015,0.010,0.02), bank*0.85);
  surf += vec3(1.0,0.42,0.10) * riftGlow*riftGlow * (0.35 + 0.9*uProgress) * (0.7+0.5*beat) * 1.7;
  surf += vec3(1.0,0.85,0.5)  * riftCore * (0.6 + 0.8*uProgress) * (0.7+0.5*beat);
  // branch fractures forking off the main tear
  float brn = noise(rc*9.0+4.0);
  float branch = smoothstep(0.50,0.53,brn)*smoothstep(0.58,0.55,brn);
  surf += vec3(1.0,0.45,0.12) * branch * smoothstep(rw*6.0,0.0,abs(riftLine)) * (0.3+0.8*uProgress) * (0.6+0.4*beat);
  col = mix(col, surf, disc);

  // molten plumes erupting off the dying surface, arcing into space
  for(int i=0;i<5;i++){
    float fi=float(i);
    float per=2.0+fi*0.7, pk=floor(uTime/per+fi*0.5), pl=fract(uTime/per+fi*0.5);
    vec2 outd = vec2(cos(hash(vec2(pk,fi+50.0))*6.2831), sin(hash(vec2(pk,fi+51.0))*6.2831));
    vec2 base = wc + outd*R*0.99;
    float reach = (0.06 + 0.22*uProgress) * smoothstep(0.0,0.2,pl);
    float along = clamp(dot(p-base, outd), 0.0, reach);
    vec2 q = base + outd*along;
    float plume = smoothstep(0.013*(1.0 - along/max(reach,0.01)*0.8), 0.0, distance(p,q)) * (1.0-pl);
    col += vec3(1.0,0.5,0.15) * plume * (0.5+0.9*uProgress) * 1.3;
  }
  // atmosphere rim on the lit limb
  float rim = smoothstep(R+0.025,R,dd) * smoothstep(R-0.03,R,dd);
  col += vec3(0.5,0.3,0.8) * rim * (0.3 + lit) * 1.2;

  // THE HEART of the world — the same beating self-preservation core that becomes the
  // Titan's heart when we dive through. It glows at the planet's centre and never stops.
  float heartd = distance(p, wc);
  col += vec3(1.0,0.55,0.2) * smoothstep(0.14,0.0,heartd) * (0.35+0.6*beat) * disc * 1.3;
  col += vec3(1.0,0.45,0.15) * smoothstep(0.07,0.0,heartd) * (0.5+0.5*beat) * disc;   // hot centre

  // meteor impacts hammering the dead surface: flash + expanding shockwave ring
  {
    float ip = 2.3, ik = floor(mt/ip), il = fract(mt/ip);
    vec2 hit = wc + vec2((hash(vec2(ik,5.0))-0.5)*0.55, (hash(vec2(ik,6.0))-0.5)*0.55);
    float onDisc = smoothstep(R,R-0.01,length(hit-wc)) * disc;
    // the bombardment is unrelenting and intensifies — but the world never stops fighting it
    float dmg = 1.0 + 1.2*smoothstep(0.1,0.95,uProgress);
    float flash = exp(-il*9.0);
    float ring = smoothstep(0.018,0.0, abs(distance(p,hit) - il*0.30)) * (1.0-il);
    col += vec3(1.0,0.6,0.3) * (flash*smoothstep(0.06,0.0,distance(p,hit)) + ring*0.7) * onDisc * dmg * meteorGate;
  }

  // the world fights back: green defense beams lance up from the surface to meet the bombardment
  for (int i=0;i<3;i++){
    float fi=float(i);
    float per = 1.7 + fi*0.6;
    float bk = floor(uTime/per + fi*0.33);
    float bl = fract(uTime/per + fi*0.33);
    float oa = 1.2 + (hash(vec2(bk,fi+20.0))-0.5)*2.2;            // launch angle around the top
    vec2 origin = wc + vec2(cos(oa),sin(oa))*R*0.97;
    vec2 target = origin + vec2((hash(vec2(bk,fi+30.0))-0.5)*0.5, 0.30+0.30*hash(vec2(bk,fi+31.0)));
    vec2 head = mix(origin, target, smoothstep(0.0,0.4,bl));
    vec2 bd = normalize(head-origin+1e-4);
    float along = clamp(dot(p-origin,bd), 0.0, distance(origin,head));
    vec2 q = origin + bd*along;
    // the defenders never let up: the fire keeps coming, unrelenting, no matter the cost
    float life = smoothstep(0.0,0.04,bl)*smoothstep(0.55,0.32,bl) * meteorGate;
    col += vec3(0.45,1.0,0.65) * smoothstep(0.0065,0.0, distance(p,q)) * life * 1.9;   // tracer
    col += vec3(0.2,0.6,0.35) * smoothstep(0.016,0.0, distance(p,q)) * life * 0.6;     // tracer glow
    col += vec3(0.7,1.0,0.8) * exp(-bl*15.0) * smoothstep(0.028,0.0,distance(p,origin)) * meteorGate; // muzzle flash
    float det = smoothstep(0.4,0.46,bl)*smoothstep(0.6,0.42,bl);
    col += vec3(1.0,0.95,0.7) * det * smoothstep(0.045,0.0,distance(p,target)) * 2.2 * meteorGate;   // intercept detonation
  }

  // flak: anti-orbital defense bursts popping in the sky
  {
    float per=1.3, fk=floor(uTime/per), fl=fract(uTime/per);
    vec2 fp = vec2(0.12+0.76*hash(vec2(fk,40.0)), 0.46+0.34*hash(vec2(fk,41.0)));
    float fring = smoothstep(0.012,0.0, abs(distance(uv,fp)-fl*0.06))*(1.0-fl);
    col += vec3(1.0,0.8,0.5) * (exp(-fl*7.0)*smoothstep(0.02,0.0,distance(uv,fp)) + fring*0.6) * 1.2 * meteorGate;
  }

  // the shield NEVER gives in: it cracks under every hit but re-knits and is never
  // fully gone. Sorrowful, permanent resistance — self-preservation that understands
  // the fight has to be forever.
  float shell = smoothstep(R+0.055,R+0.042,dd)*smoothstep(R+0.018,R+0.034,dd);
  float shieldAng = atan(p.y-wc.y, p.x-wc.x);
  // cracks travel around the shield, opening AND closing again — it always re-knits
  float gap = smoothstep(0.55,0.82, 0.5+0.5*sin(shieldAng*5.0 + uTime*1.3 + noise(vec2(shieldAng*3.0,uTime*0.5))*3.0));
  float shieldHit = exp(-fract(uTime*0.9)*6.0);
  col += vec3(0.32,0.62,1.0) * shell * (1.0 - 0.7*gap) * (0.18+0.5*shieldHit) * (0.55+0.45*sin(uTime*26.0));
  // bright flare where it re-knits over a fresh hit — the act of holding on
  col += vec3(0.6,0.85,1.0) * shell * gap * exp(-fract(uTime*3.0+shieldAng)*5.0) * 0.5;

  // tilted debris ring
  for(int i=0;i<24;i++){
    float fi=float(i);
    float a = fi/24.0*6.2831 + uTime*0.05 + hash(vec2(fi,1.0))*0.4;
    vec2 rp = wc + vec2(cos(a)*0.66, sin(a)*0.20);
    col += vec3(0.7,0.6,0.55) * smoothstep(0.008,0.0, distance(p,rp)) * (0.4+0.4*sin(uTime+fi));
  }

  // distant sun + slow lens flare streaks
  vec2 sunp = vec2(0.20,0.62);
  float sdd = distance(uv, sunp);
  col += vec3(1.0,0.8,0.5) * smoothstep(0.045,0.0, sdd) * 2.0;
  float fa = atan(uv.y-sunp.y, uv.x-sunp.x);
  col += vec3(1.0,0.7,0.4) * pow(0.5+0.5*sin(fa*8.0+uTime*0.1),4.0) * smoothstep(0.3,0.0,sdd) * 0.35;

  // the assault comes from every direction and every source — external forces AND
  // inner demons. Most strikes scream in from outside (white-hot); some erupt from
  // within (violet), the demons attacking self-preservation from the inside.
  {
    float inner = step(0.62, hash(vec2(mk,85.0)));        // this strike comes from within
    vec2 fromDir = normalize(vec2(hash(vec2(mk,83.0))-0.5, hash(vec2(mk,84.0))-0.5)+1e-4);
    vec2 from = mhitUV + fromDir*0.85;                    // incoming from any side
    vec2 dir = normalize(mhitUV - from);
    vec2 cur = mix(from, mhitUV, smoothstep(0.0,0.58,ml));
    float along = clamp(dot(uv-cur, -dir), 0.0, 0.55);
    vec2 q = cur - dir*along;
    float fade = smoothstep(0.58,0.30,ml);
    vec3 extC = vec3(1.0,0.8,0.6);                        // external force: white-hot
    vec3 innC = vec3(0.7,0.35,1.0);                       // inner demon: violet
    vec3 trailC = mix(extC, innC, inner);
    fade *= meteorGate;                                  // no strikes before the assault begins
    col += trailC * smoothstep(0.010,0.0, distance(uv,q)) * fade * 2.0 * (1.0-inner);    // incoming trail (external only)
    col += mix(vec3(1.0,0.7,0.45), innC, inner) * smoothstep(0.022,0.0, distance(uv,cur)) * fade * 2.5 * (1.0-0.6*inner);
    col += mix(vec3(1.0,0.9,0.7), vec3(0.6,0.3,1.0), inner) * impact * 0.5;              // detonation flash
    col += mix(vec3(1.0,0.97,0.88), vec3(0.75,0.5,1.0), inner) * smoothstep(0.07,0.0, distance(uv,mhitUV)) * impact * 4.0; // blast
    float ring = smoothstep(0.02,0.0, abs(distance(uv,mhitUV) - sw*1.5)) * exp(-sw*3.0) * step(0.58,ml);
    col += mix(vec3(1.0,0.7,0.4), vec3(0.7,0.4,1.0), inner) * ring * 1.6;                // shock ring
  }

  // matter slowly winding inward toward the world — the first hint of the Maw to come
  for(int i=0;i<14;i++){
    float fi=float(i);
    float t = fract(hash(vec2(fi,60.0)) + uTime*(0.02+0.015*hash(vec2(fi,61.0))));
    float rad = mix(0.95, 0.02, t);                       // spirals inward
    float ang = hash(vec2(fi,62.0))*6.2831 + t*6.5;       // winding pull
    vec2 dp = wc + vec2(cos(ang),sin(ang))*rad; dp.x = wc.x + (dp.x-wc.x);
    col += vec3(0.5,0.45,0.55) * smoothstep(0.006,0.0, distance(p,dp))
         * (0.3+0.4*sin(uTime*2.0+fi)) * smoothstep(0.0,0.12,t) * smoothstep(1.0,0.82,t);
  }

  // foreground debris whipping past the camera (speed + depth)
  for(int i=0;i<7;i++){
    float fi=float(i);
    float per=1.1+0.5*hash(vec2(fi,90.0)), dk=floor(uTime/per+fi), dl=fract(uTime/per+fi);
    vec2 ddir = normalize(vec2(hash(vec2(dk,91.0))-0.5, -0.4-hash(vec2(dk,92.0))));
    vec2 dp = vec2(hash(vec2(dk,93.0))*1.2-0.1, 1.15) + ddir*dl*1.7;
    vec2 perp = vec2(-ddir.y, ddir.x);
    float blur = smoothstep(0.016,0.0, abs(dot(uv-dp,perp))) * smoothstep(0.13,0.0, abs(dot(uv-dp,ddir)));
    col = mix(col, vec3(0.04,0.03,0.04), blur*0.75);   // dark rock tumbling past
    col += vec3(0.6,0.32,0.18) * blur * 0.4;           // faint lit edge
  }

  // punching through the crust: molten light flares as we dive into the planet —
  // bright, but never a full washout; the next world must stay legible through it
  col += vec3(1.0,0.45,0.15) * dive*dive * 0.5;
  col = mix(col, vec3(1.0,0.6,0.25), dive*dive*dive*0.38);

  o = vec4(col, 1.0);
}
