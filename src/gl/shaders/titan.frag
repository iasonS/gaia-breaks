#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform float uTime;
uniform float uProgress;
// __COMMON__
float capsule(vec2 p, vec2 a, vec2 b, float r){
  vec2 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);
  return length(pa-ba*h)-r;
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
  // approach the fallen titan
  float zoom = 1.0 - 0.25*uProgress;
  vec2 uv = (vUv - vec2(0.5,0.45))*zoom + vec2(0.5,0.45);
  vec2 p = vec2((uv.x-0.5)*1.78 + 0.5, uv.y);

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

  // the fallen titan: a colossal broken humanoid (head bowed), swaying as it fails
  vec2 ps = p;
  ps.x += sin(uTime*0.35)*0.006 + sin(uTime*0.11)*0.004; // slow unstable sway
  ps.y += sin(uTime*0.6)*0.003;                          // labored breathing
  float body = 1e9;
  body = min(body, capsule(ps, vec2(0.5,0.50), vec2(0.5,0.16), 0.075)); // torso
  body = min(body, capsule(ps, vec2(0.5,0.55), vec2(0.47,0.60), 0.055));// bowed head/neck
  body = min(body, capsule(ps, vec2(0.5,0.49), vec2(0.33,0.28), 0.04)); // left arm (hanging)
  body = min(body, capsule(ps, vec2(0.5,0.49), vec2(0.66,0.40), 0.04)); // right arm (slack)
  body = min(body, capsule(ps, vec2(0.47,0.18), vec2(0.43,0.0), 0.045));// left leg
  body = min(body, capsule(ps, vec2(0.53,0.18), vec2(0.58,0.0), 0.045));// right leg
  float mask = smoothstep(0.006,0.0, body);
  mask *= step(noise(ps*22.0), 0.93);                      // eroded pitting
  // missing chunks, worsening as the titan dies
  mask *= 1.0 - (0.4+0.4*uProgress)*smoothstep(0.5,0.82, noise(ps*6.0+1.0));
  col = mix(col, vec3(0.02,0.015,0.03), mask);

  // molten cracks spreading across the body as it dies (grow with progress)
  float cn = noise(ps*16.0 + 2.0);
  float crack = smoothstep(0.46,0.5,cn)*smoothstep(0.56,0.52,cn);
  float cn2 = noise(ps*7.0 + uTime*0.03);
  crack += smoothstep(0.5,0.52,cn2)*smoothstep(0.6,0.55,cn2)*0.7;
  col += vec3(1.0,0.4,0.1) * crack * mask * (0.25 + 1.4*uProgress) * (0.7+0.3*sin(uTime*4.0));

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
    cp.x = (cp.x-0.5)*1.78 + 0.5;
    float ch = smoothstep(0.012,0.0, distance(p,cp)) * (1.0-t) * em;
    col = mix(col, vec3(0.03,0.02,0.03), ch);
    col += vec3(1.0,0.45,0.15) * ch * 0.8;             // molten glow on falling chunks
  }

  // warm rim light along the figure's edge from the sun behind
  float rim = smoothstep(0.02,0.0, abs(body)) * smoothstep(0.55,0.0,sd);
  col += vec3(1.0,0.5,0.25) * rim * 0.9;

  // foreground ground with scattered rubble
  float gline = 0.04 + 0.015*noise(vec2(uv.x*30.0, 0.0));
  if (uv.y < gline){
    col = mix(col, vec3(0.05,0.025,0.04), smoothstep(gline,gline-0.04,uv.y));
    // rubble bumps catching the rim light
    float rub = step(0.7, noise(vec2(uv.x*40.0, 1.0)));
    col += vec3(0.6,0.28,0.15) * rub * smoothstep(0.02,0.0, abs(uv.y-gline*0.6)) * 0.4;
  }
  col *= smoothstep(0.0,0.04, uv.y);
  o = vec4(col, 1.0);
}
