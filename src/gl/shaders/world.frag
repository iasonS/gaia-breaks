#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform float uTime;
uniform float uProgress;
// __COMMON__
void main(){
  // slow approach toward the dead world
  float zoom = 1.0 - 0.18*uProgress;
  vec2 uv = (vUv - vec2(0.5,0.30))*zoom + vec2(0.5,0.30);
  vec2 p = (uv - 0.5); p.x *= 1.78;

  // deep space + faint nebula
  vec3 col = mix(vec3(0.02,0.02,0.05), vec3(0.06,0.03,0.10), uv.y);
  col += vec3(0.10,0.04,0.16) * noise(uv*3.0 + uTime*0.01) * 0.5;

  // drifting starfield (twinkle)
  vec2 sg = floor(uv*vec2(220.0,124.0));
  float sh = hash(sg);
  col += vec3(smoothstep(0.994,1.0, sh) * (0.6+0.4*sin(uTime*2.0 + sh*30.0)));

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
  // cracks spread and pulse brighter as the world dies further (progress)
  float crackThresh = 0.5 - 0.06*uProgress;
  float cracks = smoothstep(0.45,crackThresh, noise(sp*3.0 + 3.0)) * smoothstep(0.62,0.55, noise(sp*6.0 + uTime*0.02));
  float pulse = 0.7 + 0.5*sin(uTime*1.5) * uProgress;
  vec3 surf = vec3(0.04,0.03,0.05)*(0.15 + lit*0.85);
  surf += vec3(1.0,0.35,0.08) * cracks * (0.4 + 0.6*(1.0-lit)) * pulse * (1.0+0.6*uProgress); // cracks glow on the dark side
  col = mix(col, surf, disc);
  // atmosphere rim on the lit limb
  float rim = smoothstep(R+0.025,R,dd) * smoothstep(R-0.03,R,dd);
  col += vec3(0.5,0.3,0.8) * rim * (0.3 + lit) * 1.2;

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
