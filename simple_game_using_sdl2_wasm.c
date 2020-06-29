#define GL_SILENCE_DEPRECATION
#define _W 640
#define _H 480

#include <math.h>
#include <SDL2/SDL.h>
#ifdef __APPLE__
#include <SDL2_mixer/SDL_mixer.h>
#include <OpenGL/OpenGL.h>
#include <OpenGL/gl3.h>
#endif
#ifdef __EMSCRIPTEN__
#include <SDL2/SDL_mixer.h>
#include <SDL2/SDL_opengles2.h>
#include <emscripten.h>
#endif

Mix_Chunk * sample;

struct Obj { float pos[2]; };
struct Context { SDL_Window *window; double i; GLuint prg; struct Obj objs[2]; };

int bail(int i) { if (i) SDL_Log("Error: %s, code %d\n", SDL_GetError(), i); exit(i); return 1; }
int glbail(int i) { char str[10000]; glGetShaderInfoLog(i, 10000, NULL, str); SDL_Log("GL: %s, code %x\n", str, glGetError()); exit(i); return 1; }
void quit_on_glerr() { GLuint e; ((e = glGetError()) == GL_NO_ERROR) || bail(e); }
void quit() { SDL_Quit(); }

void step(void * _ctx) {
  struct Context *ctx = (struct Context *)_ctx;
  ctx->i++;
  SDL_Event event;
  while (SDL_PollEvent(&event)) {
    event.type == SDL_QUIT && bail(0);
    if (event.type == SDL_MOUSEMOTION) {
      SDL_MouseMotionEvent e = event.motion;
      ctx->objs[0].pos[0] = (e.x*2./_W) - 1.;
      ctx->objs[0].pos[1] = -1.*((e.y*2./_H) - 1.);
    }
    if (event.type == SDL_MOUSEBUTTONDOWN) {
#ifdef __EMSCRIPTEN__
      EM_ASM({
        var SDL2 = Module['SDL2'];
        (SDL2.audioContext.state == 'suspended') && SDL2.audioContext.resume();
      });
#endif
      (Mix_PlayChannel(-1, sample, 0) == -1) && bail(5);
    }
  }
  glClearColor(0., 0., 0, 1.);
  glClear(GL_COLOR_BUFFER_BIT);
  for (unsigned long i = 0; i < sizeof ctx->objs / sizeof *(ctx->objs); i++) {
    printf("%u: Pos %f %f\n", i, ctx->objs[i].pos[0], ctx->objs[i].pos[1]);
    printf("\n");
    float mat[16] = {0.};
    mat[0] = mat[5] = mat[10] = mat[15] = 1.;
    mat[0] *= .2;
    mat[5] *= .1;
    mat[12] += ctx->objs[i].pos[0];
    mat[13] += ctx->objs[i].pos[1];
    glUniform1f(glGetUniformLocation(ctx->prg, "time"), ctx->i/60.);
    glUniformMatrix4fv(glGetUniformLocation(ctx->prg, "MV"), 1, GL_FALSE, mat);
    glDrawArrays(GL_TRIANGLE_FAN, 0, 4);
  }

  SDL_GL_SwapWindow(ctx->window);
}

int main() {
  SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO) && bail(1);
  //SDL_SetRelativeMouseMode(SDL_ENABLE);
  atexit(quit);

  struct Context ctx = {0};

  (ctx.window = SDL_CreateWindow("Render color", 0, 0, _W, _H, SDL_WINDOW_OPENGL | SDL_WINDOW_RESIZABLE)) || bail(2);
  SDL_GL_CreateContext(ctx.window);
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
uniform mat4 MV;\
varying vec2 coord;\
void main() {\
  gl_Position = MV * vec4(vertice, 0., 1.);\
  coord = vertice;\
}\
";

  GLuint vert = glCreateShader(GL_VERTEX_SHADER);
  glShaderSource(vert, 1, &vsrc, NULL);
  glCompileShader(vert);
  GLint status; glGetShaderiv(vert, GL_COMPILE_STATUS, &status); (status == GL_TRUE) || glbail(vert);
  glAttachShader(prg, vert);

  char *fsrc =
"\
precision highp float;\
uniform float time;\
void main() {\
  gl_FragColor = vec4(vec3(.5), 1.);\
}\
";
  GLuint frag = glCreateShader(GL_FRAGMENT_SHADER);
#ifdef __APPLE__
  fsrc = fsrc+22;
#endif
  glShaderSource(frag, 1, (const char **)&fsrc, NULL);
  glCompileShader(frag);
  glGetShaderiv(frag, GL_COMPILE_STATUS, &status); (status == GL_TRUE) || glbail(frag);
  glAttachShader(prg, frag);

  glLinkProgram(prg);
  glGetProgramiv(prg, GL_LINK_STATUS, &status); (status == GL_TRUE) || bail(4);
  glUseProgram(prg);

  GLuint vertices_attr = glGetAttribLocation(prg, "vertice");
  glVertexAttribPointer(vertices_attr, 2, GL_FLOAT, GL_FALSE, 0, 0);
  glEnableVertexAttribArray(vertices_attr);

  int const frequency =
#ifdef __EMSCRIPTEN__
  EM_ASM_INT_V({
    try {
        return new AudioContext().sampleRate;
    } catch (e) {
        return new webkitAudioContext().sampleRate; // safari only
    }
  });
#else
  44100;
#endif
  Mix_OpenAudio(frequency, MIX_DEFAULT_FORMAT, 2, 1024) && bail(8);
  (sample = Mix_LoadWAV("assets/sample.wav")) || bail(9);
  ctx.prg = prg;

#ifdef __EMSCRIPTEN__
  emscripten_set_main_loop_arg(step, &ctx, -1, 1);
#else
  while(1) step(&ctx);
#endif
  return 0;
}
