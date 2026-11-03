# SDL Space — Survival

The playable release uses the original SDL2/WebAssembly game from public repository `joynes/sdl2-samples-with-wasm-support`, commit `184adda998c5b91e07c0f7cfebe464d87cd4b09a` (24 July 2020). The game is `simple_game_using_sdl2_wasm.c`; two other programs in the repository are graphics demonstrations.

All three native engine files, five packaged shader/audio assets and the BSD license remain byte-identical. The original rules still control eight recurring rocks, random sizes and speeds, collision, native frame-count scoring and world reset. There is no authored victory condition or shooting mechanic.

The browser host supplies start, pause, replay, New round, recovery, touch dragging and keyboard movement. It translates input into ordinary native SDL mouse events at the original starting resolution. Space now plays the original click sound for keyboard users. Stale key repeats after pause/focus loss cannot resume movement; active touch cleanup sends native mouse-up. Extra fingers do not steal or release the owning drag. The interface is in English.

The full gameplay suite observes native WebAssembly state without writing it. It plays at least 300 surviving frames, observes all rock slots, deliberately reaches a genuine collision, checks the resulting score and replay, observes actual audio samples and verifies loading recovery. Expanded checks cover keyboard-only desktop and mobile contexts, simultaneous/alias keys, release, pause/focus, touch ownership/cancellation, restart and the embedded landscape board.

Detailed rules, preservation facts and test commands are in [the source notes](../../games/sdl-space/source-notes.md). Publication and renewed-audit results are recorded in [the inventory](../../data/games-inventory.json) and [repository map](../../data/game-repositories.json).

Canonical release: [Play SDL Space](https://joynes.github.io/joynes.se/games/sdl-space/).

## Fullscreen and in-game controls

The next update keeps pause, restart and fullscreen inside the rendered scene. Direct dragging remains the native mouse game’s touch control. A second finger can use the actions while a drag is held. The wrapper corrects pointer scaling against both CSS size and the current WebGL backbuffer, including fullscreen rotation; native engine bytes remain unchanged. The new browser suite verifies touch sound, native fullscreen, all drag directions, owning/secondary fingers, held-contact restart and fullscreen inside the homepage. Publication is pending.
