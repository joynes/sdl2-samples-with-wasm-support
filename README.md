# sdl2-samples-with-wasm-support
Simple SDL2 with WebAssembly (wasm) support

```bash
# Build and run for macOS
clang -l SDL2-2.0.0 render_color_using_sdl2_wasm.c && ./a.out

# Build and run for chrome (no_browser workaround for issue with emrun)
emcc render_color_using_sdl2_wasm.c -s WASM=1 -s USE_SDL=2 -o render_color_using_sdl2_wasm/render_color_using_sdl2_wasm.html && open http://0.0.0.0:6931/render_color_using_sdl2_wasm.html && emrun --no_browser render_color_using_sdl2_wasm/render_color_using_sdl2_wasm.html
```
