file=$1
emcc $file.c -s WASM=1 -s USE_SDL=2 -s USE_SDL_MIXER=2 --preload-file assets -lopenal -o $file/$file.html && open http://0.0.0.0:6931/$file.html && emrun --no_browser $file/$file.html
