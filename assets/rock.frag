varying vec2 v_texcoord;
uniform float u_time;

void main() {
  vec2 t = v_texcoord*2. - 1.;
  float rad = atan(t.y, t.x);
  float c = length(t) + .07*sin(rad*5. + u_time*2.);
  float r = .8;
  float p = .03;//float p = fwidth(c)*1.5;
  c = smoothstep(r+p, r-p, c);
  c *= length(t);
  c = sqrt(c);
  gl_FragColor = vec4(vec3(c), c);
}
