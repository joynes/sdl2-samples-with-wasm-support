uniform vec2 u_resolution;
varying vec2 v_texcoord;
void main() {
  float PI = 3.1415926;
  vec2 t = (v_texcoord*2.-1.) * u_resolution/u_resolution.y;
  vec2 to = v_texcoord * u_resolution/u_resolution.y;

  float c = 0.;
  {
    float a = -PI/6.;
    vec2 t = mat2(cos(a), -sin(a), sin(a), cos(a))*t;
    t.x = t.x/2.5 - .4;
    t.y = t.y - .5;
    float d = length(t*2.);
    float r = fwidth(d);
    c = c + smoothstep(r, -r, d-.5);
  }
//  t.y -= .8;
//  t.x += 1.05;
//  c = c + step(max(0., abs(t.x*2.) + t.y) + step(t.y, -.4), .1);
  //c = max(abs(t.x), abs(t.y));
  //c = smoothstep(.2+p, .2-p, length(max(abs(t)-.3, 0.)));
  {
    vec2 t = abs(t);
    float d = length(max(vec2(0.), t-vec2(.7, .4)));
    float r = fwidth(d);
    c += smoothstep(r, -r, d-.05);
  }
  {
    vec2 t = to;
    //c = t.x;
    float w = fwidth(c)*1.5;
    //c = smoothstep(-w, w, c-.5);
  }
  gl_FragColor = vec4(vec3(c), c);
}
