varying vec2 v_texcoord;
void main() {
  float PI = 3.1415926;
  vec2 t = v_texcoord*2. - 1.;
  t.x *= 2.;

  float c = step(abs((t.x+.5)/2.), .5) * step(abs(t.y), .5);

  float a = -PI/6.;
  vec2 t1 = mat2(cos(a), -sin(a), sin(a), cos(a))*t;
  t1.x = t1.x/2. - .5;
  t1.y = t1.y - .3;
  c = c + max(0., (1. - length(t1*2.)));
  gl_FragColor = vec4(vec3(c), 1.);
}
