varying vec2 v_texcoord;
void main() {
  float PI = 3.1415926;
  vec2 t = v_texcoord*2. - 1.;
  t.x *= 2.;

  float c = step(abs((t.x+.3)/2.), .5) * step(abs(t.y), .4);

  float a = -PI/6.;
  vec2 t1 = mat2(cos(a), -sin(a), sin(a), cos(a))*t;
  t1.x = t1.x/2.5 - .4;
  t1.y = t1.y - .5;
  c = c + 1. - step(.5, length(t1*2.));
  t.y -= .8;
  t.x += 1.05;
  c = c + step(max(0., abs(t.x*2.) + t.y) + step(t.y, -.4), .1);
  gl_FragColor = vec4(vec3(c), c);
}
