varying vec2 v_texcoord;
uniform vec2 u_resolution;
uniform float u_time;
float rand(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
}
float grid(vec2 t, float size, float speed, float similar) {
  float PI = 3.14;
  t.x += speed;
  float c = rand(floor(t));
  float r = rand(floor(t+1.));
  return ((similar + rand(floor(t-1.)*(1.-similar)))*step(size, c)*max(0., 1.-length(fract(t)*2.-1.)))*(.3+.6*sin(u_time+r*2.*PI)+1.)/2.;
}
void main() {
  vec2 t = v_texcoord;
  t.x *= u_resolution.x/u_resolution.y;
  float c = grid(t*20., .81, u_time, 0.)*.2;
  float d = grid(t*15., .90, u_time*1.5, .3)*.3;
  c = max(c, d);
  c = max(c, grid(t*9., .98, u_time*1.7, .5)*.5);
  gl_FragColor = vec4(vec3(c), 1.);
}
