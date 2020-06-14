#include <SDL2/SDL.h>
#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

struct Context { SDL_Renderer *renderer; int i; };

int bail(int i) { SDL_Log("Error: %s", SDL_GetError()); exit(i); return 1; }

void step(void * _ctx) {
  struct Context *ctx = (struct Context *)_ctx;
  SDL_SetRenderDrawColor(ctx->renderer, 0, 255, 0, SDL_ALPHA_OPAQUE);
  SDL_RenderClear(ctx->renderer);
  SDL_Event event;
  while (SDL_PollEvent(&event)) { event.type == SDL_QUIT && bail(3); }
  SDL_RenderPresent(ctx->renderer);
}

int main() {
  SDL_Init(SDL_INIT_VIDEO) && bail(1);

  SDL_Window* window = NULL;
  struct Context ctx;
  SDL_CreateWindowAndRenderer(640, 480, 0, &window, &ctx.renderer) && bail(2);

#ifdef __EMSCRIPTEN__
  emscripten_set_main_loop_arg(step, &ctx, -1, 1);
#else
  while(1) step(&ctx);
#endif

  SDL_DestroyRenderer(ctx.renderer);
  SDL_DestroyWindow(window);
  SDL_Quit();
  return 0;
}
