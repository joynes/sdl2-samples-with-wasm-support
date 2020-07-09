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

struct Obj { float x, y; int alive; float w, h; float speed_x, speed_y; };
struct Context { SDL_Window *window; double i; GLuint prg; struct Obj objs[10]; int objs_size; double next_spawn; };

int bail(int i) { if (i) SDL_Log("Error: %s, code %d\n", SDL_GetError(), i); exit(i); return 1; }
int glbail(int i) { char str[10000]; glGetShaderInfoLog(i, 10000, NULL, str); SDL_Log("GL: %s, code %x\n", str, glGetError()); exit(i); return 1; }
void quit_on_glerr() { GLuint e; ((e = glGetError()) == GL_NO_ERROR) || bail(e); }
void quit() { SDL_Quit(); }
float rnd() { return rand() / (float)RAND_MAX; }
void reset_game(struct Context *ctx) {
  srand(1);
  ctx->objs_size = sizeof ctx->objs / sizeof *(ctx->objs);
  ctx->objs[0].x = -1.;
  ctx->objs[0].y = 0.;
  ctx->objs[0].w = .1;
  ctx->objs[0].h = .07;
  ctx->objs[0].alive = 1;
  ctx->i = 0.;
  for (int i = 1; i < ctx->objs_size; i++) {
    ctx->objs[i].alive = 0;
  }
  ctx->next_spawn = ctx->i;
}

void step(void * _ctx) {
  struct Context *ctx = (struct Context *)_ctx;
  ctx->i++;
  SDL_Event event;
  while (SDL_PollEvent(&event)) {
    event.type == SDL_QUIT && bail(0);
    if (event.type == SDL_MOUSEMOTION) {
      SDL_MouseMotionEvent e = event.motion;
      ctx->objs[0].x = (e.x*2./_W) - 1.;
      ctx->objs[0].y = -1.*((e.y*2./_H) - 1.);
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
  for (int i = 1; i < ctx->objs_size; i++) {
    struct Obj *obj = &ctx->objs[i];
    if (!obj->alive && ctx->i > ctx->next_spawn) {
      ctx->next_spawn = ctx->i + 30.*rnd();
      obj->alive = 1;
      obj->x = 1 + obj->w;
      obj->y = 2.*rnd() - 1.;
      obj->w = .2;
      obj->h = .1;
      obj->speed_x = .04 - .02*rnd();
      obj->speed_y = (.02*rnd() - .01);
    }
    if (obj->alive) {
      obj->x -= obj->speed_x;
      obj->y -= obj->speed_y;
      struct Obj *player = &ctx->objs[0];
      if (0 && player->x+player->w > obj->x-obj->w && player->x-player->w < obj->x+obj->w &&
          player->y+player->h > obj->y-obj->h && player->y-player->h < obj->y+obj->h) {
        reset_game(ctx);
        SDL_ShowSimpleMessageBox(SDL_MESSAGEBOX_INFORMATION, "Game over", "You died!", NULL);
      }
      if (obj->x < -1.-obj->w) { obj->alive = 0; }
    }
  }
  glClearColor(0., 0., 0, 1.);
  glClear(GL_COLOR_BUFFER_BIT);
  for (int i = 0; i < ctx->objs_size; i++) {
    struct Obj *obj = &ctx->objs[i];
    if (!obj->alive) continue;
    float mat[16] = {0.};
    mat[0] = mat[5] = mat[10] = mat[15] = 1.;
    mat[0] *= obj->w; mat[5] *= obj->h;
    mat[12] += obj->x; mat[13] += obj->y;
    glUniform1f(glGetUniformLocation(ctx->prg, "time"), ctx->i/60.);
    glUniform2f(glGetUniformLocation(ctx->prg, "u_resolution"), obj->w*_W, obj->h*_H);
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
varying vec2 v_texcoord;\
void main() {\
  gl_Position = MV * vec4(vertice, 0., 1.);\
  v_texcoord = (vertice+1.)/2.;\
}\
";

  GLuint vert = glCreateShader(GL_VERTEX_SHADER);
  glShaderSource(vert, 1, &vsrc, NULL);
  glCompileShader(vert);
  GLint status; glGetShaderiv(vert, GL_COMPILE_STATUS, &status); (status == GL_TRUE) || glbail(vert);
  glAttachShader(prg, vert);

  GLuint frag = glCreateShader(GL_FRAGMENT_SHADER);
  {
    char buf[1024*4];
    int size = 0, read;
    SDL_RWops *file = SDL_RWFromFile("assets/ship.frag", "r");
    while ((read = SDL_RWread(file, buf, 1, sizeof(buf)))) size += read;
    buf[size] = '\0';
    char *pbuf[2];
#ifdef __APPLE__
    pbuf[0] = "";
#else
    pbuf[0] = "precision highp float;";
#endif
    pbuf[1] = buf;
    glShaderSource(frag, 2, (const char **)&pbuf, NULL);
    SDL_RWclose(file);
  }
  glCompileShader(frag);
  glGetShaderiv(frag, GL_COMPILE_STATUS, &status); (status == GL_TRUE) || glbail(frag);
  glAttachShader(prg, frag);

  glLinkProgram(prg);
  glGetProgramiv(prg, GL_LINK_STATUS, &status); (status == GL_TRUE) || bail(4);
  glUseProgram(prg);

  GLuint vertices_attr = glGetAttribLocation(prg, "vertice");
  glVertexAttribPointer(vertices_attr, 2, GL_FLOAT, GL_FALSE, 0, 0);
  glEnableVertexAttribArray(vertices_attr);

  glEnable(GL_BLEND);
  glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

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
  reset_game(&ctx);
  ctx.prg = prg;

#ifdef __EMSCRIPTEN__
  emscripten_set_main_loop_arg(step, &ctx, -1, 1);
#else
  while(1) step(&ctx);
#endif
  return 0;
}
