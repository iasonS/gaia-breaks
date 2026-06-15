#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform float uTime;
// __COMMON__
void main(){
  vec2 uv = vUv;
  vec3 col = mix(vec3(0.06,0.13,0.20), vec3(0.55,0.50,0.45), pow(uv.y,2.0));
  float moon = smoothstep(0.06,0.0, distance(uv, vec2(0.62,0.78)));
  col += vec3(1.0,0.96,0.88)*moon;
  if (uv.y < 0.42){ // water
    float ripple = sin((uv.y*60.0) + noise(uv*8.0+uTime*0.1)*4.0)*0.5+0.5;
    col = mix(vec3(0.04,0.08,0.11), col, 0.5) + ripple*0.03;
  }
  // two pillars (the gate) as dark vertical bands near center
  float g = step(0.02, abs(uv.x-0.44)) * step(0.02, abs(uv.x-0.56));
  if (uv.y>0.30 && uv.y<0.62) col *= mix(0.1,1.0,g);
  o = vec4(col,1.0);
}
