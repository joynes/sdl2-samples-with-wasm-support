# SDL Space — Survival

AI remake of a retro game from July 2020. The original JavaScript engine, WebAssembly and data package are unchanged. This host adds a browser interface and input translation.

## Source and rules

Public repository [sdl2-samples-with-wasm-support](https://github.com/joynes/sdl2-samples-with-wasm-support/tree/184adda998c5b91e07c0f7cfebe464d87cd4b09a), commit `184adda998c5b91e07c0f7cfebe464d87cd4b09a`, 24 July 2020. The game is [`simple_game_using_sdl2_wasm.c`](https://github.com/joynes/sdl2-samples-with-wasm-support/blob/184adda998c5b91e07c0f7cfebe464d87cd4b09a/simple_game_using_sdl2_wasm.c); the other two programs are graphics demonstrations. The [BSD 2-Clause license](LICENSE) is preserved. [provenance.json](provenance.json) records exact engine, source, license and individual data-segment hashes.

- The native game uses mouse position in normalized coordinates. Mouse-down plays `sample.wav` through SDL_mixer.
- Ten object slots contain the star background, ship and eight reusable rocks. Rocks spawn on the right and move left, with a little vertical drift.
- Rock height varies from 0.1 to 0.3; width is height divided by 1920/1080. Horizontal speed is 0.02–0.04 scene units/frame; vertical speed is −0.01–0.01.
- Rectangular collision uses 0.6 of the ship’s half-width, 0.5 of its half-height and 0.5 of the rock half-dimensions. Collision resets the native world and random seed to 1.
- The original Game over message reports surviving frames. There are no chapters, win conditions, saved levels or shooting. The click sound is an effect.
- All five packaged assets are retained, including the unused `simple.frag` shader, ship/rock/background shaders and sample audio.

## Browser interface

The unchanged older Emscripten runtime receives preloaded original bytes through its existing `wasmBinary` and `getPreloadedPackage` inputs. Network failures offer Retry, which reloads the page. The engine requires the canvas id `canvas` even when `Module.canvas` is supplied.

The blocking native Game over alert becomes an HTML overlay. The score still comes from the engine’s actual collision message. Play again resumes the world already reset by the engine; New round reloads the entire engine.

The native window is 80% of the starting screen width. Mouse, finger and arrow/WASD coordinates are translated to that original resolution. The wrapper inverts SDL’s CSS-to-backbuffer scale using the current canvas rectangle and pixel dimensions, so fullscreen rotation retains the same native coordinates. SDL’s additional touch emulation is blocked to avoid conflicting positions. Keyboard movement uses ordinary SDL mouse events; no controller writes game memory. Space plays the same native sample using a mouse-down/up pair. Tab and Space/Enter on HTML controls retain normal browser focus and activation.

The first finger owns a drag. Extra contacts cannot move the ship or release the owner; they can use the overlaid pause, restart and fullscreen actions. End, cancellation, focus loss and pause release input. Pausing freezes the native loop and audio; Resume restarts both. Stale hardware repeats after pause or focus loss are ignored until a fresh press. Release also sends native mouse-up for an active touch.

Portrait and compact landscape preserve the board’s aspect ratio. Canvas pixel-size changes update the WebGL viewport without changing the native world. All controls sit inside the rendered game, without buttons below it. Native fullscreen preserves the scene proportions, supports touch and keyboard, and also works inside the homepage iframe. Browsers without the API get an expanded game view with an exit control and Escape. The shared `assets/game-view.mjs` helper handles secondary-finger actions and invokes input cleanup only once per fullscreen transition. Returning from the site menu fits the frame immediately, keeping touch targets still.

The original engine may print an initial `emscripten_set_main_loop_timing` message: its SDL swap interval is set before the main loop is registered. The engine bytes remain unchanged.

## Verification

`node --test scripts/test-sdl-space.mjs` checks the unchanged native engine, BSD license and all five packaged segments.

`npm run test:sdl-space:browser` performs real mouse, keyboard and touch gameplay: at least 300 surviving frames, all eight rock slots and variable sizes, actual collision/score/replay, pause, reset, decoded native sound, portrait/landscape mapping and recovery from separate native JavaScript/WASM/data and app/shared-host failures.

`npm run test:sdl-space:input` adds desktop and mobile-context keyboard-only movement, diagonal keys and aliases, independent release, stale-repeat cleanup, keyboard-triggered native audio, keyboard restart, two-finger drag ownership, cancellation and a real frame-window focus change. It checks the complete embedded board in phone landscape and return navigation.

The observer reads the unique wasm32 Context layout from the public C source. It reads native positions, frame counts and rocks to choose real input events. It never teleports the ship, changes memory, injects points or calls loss logic. Browser contexts emulate touch-capable phones; physical devices and Safari need separate verification.

`npm run test:sdl-space:fullscreen` verifies native keyboard/touch play and actual sound inside fullscreen, second-finger pause/resume/reset/fullscreen, all drag directions, device rotation, old-contact cleanup after a restarted engine, full WebGL viewport, in-scene controls, iframe fullscreen and the missing-API Escape fallback.
