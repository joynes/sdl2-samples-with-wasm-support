uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
varying vec2 v_texcoord;

vec2 rot(vec2 t, float a) {
  return mat2(cos(a), -sin(a), sin(a), cos(a))*t;
}

void main() {
  float PI = 3.1415926;
  vec2 t = (v_texcoord*2.-1.) * u_resolution/u_resolution.y;
  vec2 to = v_texcoord * u_resolution/u_resolution.y;
  t.x += .4;
  vec2 mouse = u_mouse/u_resolution;

  float c = 0.;
  {
    float a = -PI/6.;
    vec2 t = rot(t, a);
    t.x = t.x/2.5 - .4;
    t.y = t.y - .5;
    float d = length(t*2.);
    float r = .03; //float r = fwidth(d);
    c = c + smoothstep(r, -r, d-.44);
  }
  {
    vec2 t = abs(t);
    float d = length(max(vec2(0.), t-vec2(.7, .4)));
    float r = .03; //float r = fwidth(d);
    c += smoothstep(r, -r, d-.05);
  }
  {
    vec2 t = abs(rot(t+vec2(.6, -.3), PI/4.));
    float d = (t.x)*4. + t.y;
    float r = .03;//float r = fwidth(d);
    c += smoothstep(r, -r, d-.8);
  }
  {
    vec2 t = abs(rot(t+vec2(-1., -.1), PI/6. + u_time/2.));
    c = min(1., c);
    float d = t.x+t.y;
    d *= sqrt(sqrt(d/2.));
    gl_FragColor = vec4(vec3(d), c);
  }
}
