#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform float uTime;
uniform float uProgress;
uniform float uAspect;
// __COMMON__
void main(){
  // slow approach toward the dead world
  float zoom = 1.0 - 0.18*uProgress;
  vec2 uv = (vUv - vec2(0.5,0.30))*zoom + vec2(0.5,0.30);
  vec2 p = (uv - 0.5); p.x *= uAspect;

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

  // the dead world: big cracked sphere, low center
  vec2 wc = vec2(0.0, -0.12);
  float R = 0.45;
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
  // the core fights to keep beating: a double-thump heartbeat throbbing through the cracks
  float beat = pow(0.5+0.5*sin(uTime*2.6),6.0) + 0.7*pow(0.5+0.5*sin(uTime*2.6-0.7),6.0);
  float pulse = 0.55 + 0.9*beat;
  vec3 surf = vec3(0.04,0.03,0.05)*(0.15 + lit*0.85);
  surf += vec3(0.05,0.035,0.06) * noise(rc*9.0) * lit * 0.8; // rotating terrain mottle catching the light
  surf += vec3(1.0,0.35,0.08) * cracks * (0.4 + 0.6*(1.0-lit)) * pulse * (1.0+0.6*uProgress); // cracks glow on the dark side
  col = mix(col, surf, disc);
  // atmosphere rim on the lit limb
  float rim = smoothstep(R+0.025,R,dd) * smoothstep(R-0.03,R,dd);
  col += vec3(0.5,0.3,0.8) * rim * (0.3 + lit) * 1.2;

  // meteor impacts hammering the dead surface: flash + expanding shockwave ring
  {
    float ip = 2.3, ik = floor(uTime/ip), il = fract(uTime/ip);
    vec2 hit = wc + vec2((hash(vec2(ik,5.0))-0.5)*0.55, (hash(vec2(ik,6.0))-0.5)*0.55);
    float onDisc = smoothstep(R,R-0.01,length(hit-wc)) * disc;
    float flash = exp(-il*9.0);
    float ring = smoothstep(0.018,0.0, abs(distance(p,hit) - il*0.30)) * (1.0-il);
    col += vec3(1.0,0.7,0.4) * (flash*smoothstep(0.05,0.0,distance(p,hit)) + ring*0.7) * onDisc;
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
    float life = smoothstep(0.0,0.04,bl)*smoothstep(0.55,0.32,bl);
    col += vec3(0.45,1.0,0.65) * smoothstep(0.0065,0.0, distance(p,q)) * life * 1.9;   // tracer
    col += vec3(0.2,0.6,0.35) * smoothstep(0.016,0.0, distance(p,q)) * life * 0.6;     // tracer glow
    col += vec3(0.7,1.0,0.8) * exp(-bl*15.0) * smoothstep(0.028,0.0,distance(p,origin)); // muzzle flash
    float det = smoothstep(0.4,0.46,bl)*smoothstep(0.6,0.42,bl);
    col += vec3(1.0,0.95,0.7) * det * smoothstep(0.045,0.0,distance(p,target)) * 2.2;   // intercept detonation
  }

  // flak: anti-orbital defense bursts popping in the sky
  {
    float per=1.3, fk=floor(uTime/per), fl=fract(uTime/per);
    vec2 fp = vec2(0.12+0.76*hash(vec2(fk,40.0)), 0.46+0.34*hash(vec2(fk,41.0)));
    float fring = smoothstep(0.012,0.0, abs(distance(uv,fp)-fl*0.06))*(1.0-fl);
    col += vec3(1.0,0.8,0.5) * (exp(-fl*7.0)*smoothstep(0.02,0.0,distance(uv,fp)) + fring*0.6) * 1.2;
  }

  // failing shield flickering over the world as it takes hits
  float shell = smoothstep(R+0.055,R+0.042,dd)*smoothstep(R+0.018,R+0.034,dd);
  float shieldHit = exp(-fract(uTime*0.9)*6.0);
  col += vec3(0.3,0.7,1.0) * shell * (0.12+0.5*shieldHit) * (0.5+0.5*sin(uTime*28.0));

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

  o = vec4(col, 1.0);
}
