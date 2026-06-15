#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform float uTime;
uniform float uProgress;
// __COMMON__
void main(){
  // forward approach across the movement
  float zoom = 1.0 - 0.30*uProgress;
  vec2 uv = (vUv - vec2(0.5,0.42)) * zoom + vec2(0.5,0.42);
  uv.y += 0.004*sin(uTime*0.13);

  // sky: warm at the horizon (low), indigo above
  vec3 sky = mix(vec3(0.96,0.42,0.14), vec3(0.06,0.05,0.16), pow(clamp(uv.y,0.0,1.0),0.7));

  // sun resting on the horizon
  float sun = smoothstep(0.15,0.0, distance(uv, vec2(0.5,0.33)));
  float shimmer = 0.92 + 0.08*sin(uTime*2.0);
  vec3 col = sky + vec3(1.0,0.6,0.22)*sun*1.7*shimmer;

  // drifting clouds in the warm band
  float clouds = noise(uv*vec2(3.0,9.0) + vec2(uTime*0.025,0.0));
  clouds = smoothstep(0.55,1.0,clouds) * smoothstep(0.65,0.30,uv.y);
  col = mix(col, col*vec3(0.5,0.4,0.5), clouds*0.5);

  // colossus silhouette: a dark broken mass rising from the horizon
  float trunk = smoothstep(0.16,0.12, abs(uv.x-0.5)) * step(uv.y, 0.60);
  float head  = smoothstep(0.10,0.07, distance(uv, vec2(0.5,0.58)));
  float arm   = smoothstep(0.05,0.0, abs(uv.y - 0.50 + 0.18*(uv.x-0.5))) * step(0.5,uv.x) * step(uv.x,0.82);
  float body  = clamp(trunk + head + arm, 0.0, 1.0);
  float brk   = noise(vec2(uv.x*16.0, 1.0))*0.04;
  body *= step(uv.y, 0.62 + brk);
  col *= mix(1.0, 0.05, body);

  o = vec4(col, 1.0);
}
