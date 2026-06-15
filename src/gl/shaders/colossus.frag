#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform float uTime;
uniform float uProgress;
// __COMMON__
void main(){
  // forward approach across the movement
  float zoom = 1.0 - 0.28*uProgress;
  vec2 uv = (vUv - vec2(0.5,0.34)) * zoom + vec2(0.5,0.34);
  uv.y += 0.004*sin(uTime*0.13);

  // sky: warm at the horizon, indigo above
  vec3 sky = mix(vec3(0.98,0.45,0.16), vec3(0.05,0.04,0.15), pow(clamp(uv.y,0.0,1.0),0.65));

  // sun low, glowing through the arch
  vec2 sunp = vec2(0.5, 0.30);
  float sd = distance(uv, sunp);
  float sun = smoothstep(0.13,0.0, sd);
  float glow = smoothstep(0.5,0.0, sd)*0.4;
  vec3 col = sky + vec3(1.0,0.6,0.25)*(sun*1.8 + glow);

  // drifting clouds across the warm band
  float clouds = noise(uv*vec2(3.0,9.0) + vec2(uTime*0.025,0.0));
  clouds = smoothstep(0.55,1.0,clouds) * smoothstep(0.7,0.35,uv.y);
  col = mix(col, col*vec3(0.5,0.4,0.5), clouds*0.5);

  // broken colossal arch: dark stone ring + legs, sun shows through the opening
  vec2 a = uv - vec2(0.5, 0.30); a.x = abs(a.x);
  float ro = 0.42, ri = 0.31;
  float d = length(vec2(a.x, max(a.y,0.0)));
  float band = step(ri,d)*step(d,ro);
  float legs = step(ri,a.x)*step(a.x,ro)*step(a.y,0.0)*step(-0.30,a.y);
  float mask = clamp(band+legs,0.0,1.0);
  // ruin: missing chunks + crumbled edges (it is dead)
  mask *= 1.0 - 0.45*smoothstep(0.45,0.78, noise(uv*7.0+3.0));
  mask *= step(noise(uv*vec2(26.0,26.0)), 0.92);
  mask = clamp(mask,0.0,1.0);

  vec3 stone = vec3(0.02,0.015,0.03);
  col = mix(col, stone, mask);

  // warm rim light on the arch's inner edge facing the sun
  float rim = smoothstep(0.025,0.0, abs(d-ri)) * smoothstep(0.55,0.0,sd) * mask;
  col += vec3(1.0,0.5,0.2)*rim*0.7;

  // dark foreground ground
  col *= smoothstep(0.0,0.06, uv.y);
  o = vec4(col,1.0);
}
