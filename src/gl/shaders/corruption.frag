#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uA;
uniform sampler2D uB;
uniform float uBlend;       // 0..1 scene crossfade
uniform float uCorrupt;     // 0..~1.5 corruption intensity
uniform float uTime;
uniform float uWire;        // 0/1 render-mode break (wireframe/debug view)
// __COMMON__
float luma(vec3 c){ return dot(c, vec3(0.299,0.587,0.114)); }
void main(){
  vec2 uv = vUv;
  float c = uCorrupt;
  // subtle living-camera breath so the frame never feels locked
  uv += vec2(sin(uTime*0.27)*0.0016, cos(uTime*0.19)*0.0012);
  uv += (vec2(noise(vec2(uTime*0.6,3.0)), noise(vec2(uTime*0.5,8.0)))-0.5) * 0.0014;
  // horizontal tear/displacement, stronger with corruption. Gated below ~0.15 so
  // near-healed stretches (the Gate, the quiet intro) don't get their clean edges
  // chewed into blocky notches by residual displacement.
  float band = step(0.5, noise(vec2(floor(uv.y*40.0), floor(uTime*7.0))));
  uv.x += (band-0.5) * 0.035 * c * smoothstep(0.06, 0.22, c);

  // datamosh: rectangular blocks jump + smear at high corruption, stuttering in steps.
  // Slower, sparser and smaller than it wants to be — it must WOUND the image, not
  // bury it; the circle underneath has to stay readable.
  float dm = smoothstep(0.85, 1.5, c);
  if (dm > 0.0){
    float step1 = floor(uTime*8.0);                  // quantized time -> stutter, not slide
    vec2 grid = floor(uv * vec2(14.0, 9.0));
    float bsel = hash(grid + step1*3.1);
    if (bsel > 1.0 - 0.30*dm){                        // only a few blocks glitch each step
      vec2 jump = (vec2(hash(grid+step1), hash(grid+step1+7.0)) - 0.5);
      uv += jump * vec2(0.07, 0.04) * dm;             // block displacement
      uv.x += (hash(vec2(grid.y, step1)) - 0.5) * 0.025 * dm; // horizontal smear within row
    }
  }
  // chromatic split
  vec2 off = vec2(0.008*c, 0.0);
  float blend = clamp(uBlend,0.0,1.0);
  vec3 col;
  col.r = mix(texture(uA,uv+off).r, texture(uB,uv+off).r, blend);
  col.g = mix(texture(uA,uv).g,     texture(uB,uv).g,     blend);
  col.b = mix(texture(uA,uv-off).b, texture(uB,uv-off).b, blend);
  // ink edge accent (cheap): difference from a small neighbor
  vec3 n = mix(texture(uA,uv+vec2(0.002)).rgb, texture(uB,uv+vec2(0.002)).rgb, blend);
  float edge = clamp(length(col-n)*8.0,0.0,1.0);
  col = mix(col, vec3(0.0), edge*0.5*c);
  col += vec3(0.48,0.24,1.0) * edge * c; // violet ink

  // cheap bloom: pull a soft halo from bright neighbours so suns, molten cracks,
  // the photon ring, spirit lights and the horizon-crossing all glow cinematically
  vec3 bl = vec3(0.0);
  for(int i=0;i<6;i++){
    float a = float(i)/6.0*6.2831 + 0.4;
    vec2 o2 = vec2(cos(a),sin(a)) * 0.014;
    bl += mix(texture(uA, vUv+o2).rgb, texture(uB, vUv+o2).rgb, blend);
  }
  bl = max(vec3(0.0), bl/6.0 - 0.55);
  col += bl * 0.7;

  // render-mode break: the engine flips to a wireframe/debug X-ray view for a beat.
  // Edge-detect the clean frame and redraw it as glowing lines on black — subject
  // edges in green, background structure in electric blue — flickering like a crash.
  if (uWire > 0.001){
    float px = 1.4/720.0;
    vec3 c0 = mix(texture(uA,vUv).rgb, texture(uB,vUv).rgb, blend);
    vec3 cx = mix(texture(uA,vUv+vec2(px,0.0)).rgb, texture(uB,vUv+vec2(px,0.0)).rgb, blend);
    vec3 cy = mix(texture(uA,vUv+vec2(0.0,px)).rgb, texture(uB,vUv+vec2(0.0,px)).rgb, blend);
    float l0=luma(c0), lx=luma(cx), ly=luma(cy);
    float e = clamp((abs(l0-lx)+abs(l0-ly))*16.0, 0.0, 1.0);
    e = pow(e, 0.6);
    // brighter regions of the frame read as the "subject" (green), dim as structure (blue)
    float subj = smoothstep(0.12,0.45,l0);
    vec3 wire = mix(vec3(0.15,0.45,1.0), vec3(0.25,1.0,0.45), subj) * e;
    wire += vec3(0.2,0.9,0.5) * pow(e,2.0) * 0.6;             // hot core on strong edges
    wire *= 0.65 + 0.35*step(0.5, fract(vUv.y*260.0));         // scanlines
    wire += vec3(0.1,0.25,0.6) * step(0.978, hash(vec2(vUv.y*3.0, floor(uTime*40.0)))); // stray debug rows
    float flick = step(0.12, fract(uTime*22.0));              // rapid crash-flicker
    col = mix(col, wire, uWire * (0.85 + 0.15*flick));
  }

  // scanlines + grain scale with corruption
  col *= 1.0 - 0.25*c*step(0.5, fract(uv.y*220.0));
  col += (hash(uv*vec2(uTime*60.0,1.0))-0.5)*0.10*c;
  o = vec4(col,1.0);
}
