#define GL_SILENCE_DEPRECATION

#include <math.h>
#include <SDL2/SDL.h>
#include <OpenGL/OpenGL.h>
#include <OpenGL/gl3.h>
#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

struct Context { SDL_Window *window; double i; GLuint time; };

int bail(int i) { if (i) SDL_Log("Error: %s, code %d\n", SDL_GetError(), i); exit(i); return 1; }
int glbail(int i, int s) { char str[10000]; glGetShaderInfoLog(i, 10000, NULL, str); SDL_Log("GL: %s, code %x\n", str, glGetError()); exit(i); return 1; }
void quit_on_glerr() { GLuint e; ((e = glGetError()) == GL_NO_ERROR) || bail(e); }
void quit() { SDL_Quit(); }

void step(void * _ctx) {
  struct Context *ctx = (struct Context *)_ctx;
  ctx->i++;
  SDL_Event event;
  while (SDL_PollEvent(&event)) { event.type == SDL_QUIT && bail(0); }

  glUniform1f(ctx->time, ctx->i/60.);
  glClearColor(0., 0., 0, 1.);
  glClear(GL_COLOR_BUFFER_BIT);
  glDrawArrays(GL_TRIANGLE_FAN, 0, 4);

  SDL_GL_SwapWindow(ctx->window);
}

int main() {
  SDL_Init(SDL_INIT_VIDEO) && bail(1);
  atexit(quit);

  struct Context ctx = {0};

  (ctx.window = SDL_CreateWindow("Render color", 0, 0, 640, 480, SDL_WINDOW_OPENGL | SDL_WINDOW_RESIZABLE)) || bail(2);
  SDL_GLContext glcontext = SDL_GL_CreateContext(ctx.window);
  SDL_GL_SetSwapInterval(1);

  GLfloat vertices[] = {
    -1., -1.,
    1., -1.,
    1., 1.,
    -1., 1.
  };
  GLuint buf;
  glGenBuffers(1, &buf);
  glBindBuffer(GL_ARRAY_BUFFER, buf);
  glBufferData(GL_ARRAY_BUFFER, sizeof(GLfloat) * 8, vertices, GL_STATIC_DRAW);

  GLuint prg = glCreateProgram();

  const char *vsrc =
"\
attribute vec2 vertice;\
varying vec2 coord;\
void main() {\
  gl_Position = vec4(vertice, 0., 1.);\
  coord = (vertice + 1.)/2.;\
}\
";

  GLuint vert = glCreateShader(GL_VERTEX_SHADER);
  glShaderSource(vert, 1, &vsrc, NULL);
  glCompileShader(vert);
  GLint status; glGetShaderiv(vert, GL_COMPILE_STATUS, &status); (status == GL_TRUE) || glbail(vert, status);
  glAttachShader(prg, vert);

  const char *fsrc =
"\
varying vec2 coord;\
uniform float time;\
void main() {\
  gl_FragColor = vec4((sin(coord.x + time)+1.)/2., (cos(coord.y + time*.9)+1.)/2., sin(coord.y+coord.x + time*.8), 1.);\
}\
";
  GLuint frag = glCreateShader(GL_FRAGMENT_SHADER);
  glShaderSource(frag, 1, &fsrc, NULL);
  glCompileShader(frag);
  glGetShaderiv(frag, GL_COMPILE_STATUS, &status); (status == GL_TRUE) || glbail(frag, status);
  glAttachShader(prg, frag);

  glLinkProgram(prg);
  glGetProgramiv(prg, GL_LINK_STATUS, &status); (status == GL_TRUE) || bail(4);
  glUseProgram(prg);

  GLuint vertices_attr = glGetAttribLocation(prg, "vertice");
  glVertexAttribPointer(vertices_attr, 2, GL_FLOAT, GL_FALSE, 0, 0);
  glEnableVertexAttribArray(vertices_attr);

  ctx.time = glGetUniformLocation(prg, "time");

#ifdef __EMSCRIPTEN__
  emscripten_set_main_loop_arg(step, &ctx, -1, 1);
#else
  while(1) step(&ctx);
#endif
  return 0;
}
