#include <math.h>
#include <SDL2/SDL.h>
#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

struct Context { SDL_Renderer *renderer; double i; int quit; };

int bail(int i) { if (i) SDL_Log("Error: %s", SDL_GetError()); exit(i); return 1; }
void quit() { SDL_Quit(); }

int anim(float i) { return (sin(i)+1.)*127.; }

void step(void * _ctx) {
  struct Context *ctx = (struct Context *)_ctx;
  ctx->i++;
  SDL_SetRenderDrawColor(ctx->renderer, anim(ctx->i*.05), anim(ctx->i*.03), anim(ctx->i*.01), SDL_ALPHA_OPAQUE);
  SDL_RenderClear(ctx->renderer);
  SDL_Event event;
  while (SDL_PollEvent(&event)) { event.type == SDL_QUIT && bail(0); }
  SDL_RenderPresent(ctx->renderer);
}

int main() {
  SDL_Init(SDL_INIT_VIDEO) && bail(1);
  atexit(quit);

  SDL_Window* window = NULL;
  struct Context ctx = {0};
  (window = SDL_CreateWindow( "Render color", SDL_WINDOWPOS_UNDEFINED, SDL_WINDOWPOS_UNDEFINED, 640, 480, SDL_WINDOW_SHOWN )) || bail(2);
  (ctx.renderer = SDL_CreateRenderer( window, -1, SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC )) || bail(3);
#ifdef __EMSCRIPTEN__
  emscripten_set_main_loop_arg(step, &ctx, -1, 1);
#else
  while(1) step(&ctx);
#endif
  return 0;
}
