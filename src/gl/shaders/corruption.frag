#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uA;
uniform sampler2D uB;
uniform float uBlend;       // 0..1 scene crossfade
uniform float uCorrupt;     // 0..~1.5 corruption intensity
uniform float uTime;
// __COMMON__
void main(){
  vec2 uv = vUv;
  float c = uCorrupt;
  // subtle living-camera breath so the frame never feels locked
  uv += vec2(sin(uTime*0.27)*0.0016, cos(uTime*0.19)*0.0012);
  uv += (vec2(noise(vec2(uTime*0.6,3.0)), noise(vec2(uTime*0.5,8.0)))-0.5) * 0.0014;
  // horizontal tear/displacement, stronger with corruption
  float band = step(0.5, noise(vec2(floor(uv.y*40.0), floor(uTime*12.0))));
  uv.x += (band-0.5) * 0.06 * c;

  // datamosh: rectangular blocks jump + smear at high corruption, stuttering in steps.
  // Engages above ~0.7 so calm stretches stay clean; intensity climbs to the peak.
  float dm = smoothstep(0.7, 1.3, c);
  if (dm > 0.0){
    float step1 = floor(uTime*14.0);                 // quantized time -> stutter, not slide
    vec2 grid = floor(uv * vec2(14.0, 9.0));
    float bsel = hash(grid + step1*3.1);
    if (bsel > 1.0 - 0.55*dm){                        // only some blocks glitch each step
      vec2 jump = (vec2(hash(grid+step1), hash(grid+step1+7.0)) - 0.5);
      uv += jump * vec2(0.10, 0.05) * dm;             // block displacement
      uv.x += (hash(vec2(grid.y, step1)) - 0.5) * 0.04 * dm; // horizontal smear within row
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

  // scanlines + grain scale with corruption
  col *= 1.0 - 0.25*c*step(0.5, fract(uv.y*220.0));
  col += (hash(uv*vec2(uTime*60.0,1.0))-0.5)*0.10*c;
  o = vec4(col,1.0);
}
