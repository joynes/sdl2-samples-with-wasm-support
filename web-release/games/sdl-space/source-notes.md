# SDL Space — hinderbana

AI-remake av retrospel. Det här är Johannes överlevnadsspel från juli 2020 med ett nytt webbgränssnitt. **Originalets JavaScript-runtime, WebAssembly och datapaket är oförändrade.** Ny motor eller nya spelregler ersätter inte originalet.

## Källa

Offentligt repo [sdl2-samples-with-wasm-support](https://github.com/joynes/sdl2-samples-with-wasm-support/tree/184adda998c5b91e07c0f7cfebe464d87cd4b09a), commit `184adda998c5b91e07c0f7cfebe464d87cd4b09a`, 24 juli 2020. Spelkoden är [`simple_game_using_sdl2_wasm.c`](https://github.com/joynes/sdl2-samples-with-wasm-support/blob/184adda998c5b91e07c0f7cfebe464d87cd4b09a/simple_game_using_sdl2_wasm.c). Repots andra två program är grafikdemonstrationer och utgör inte ytterligare spel.

BSD 2-Clause-licensen ligger i [LICENSE](LICENSE). Exakta hashvärden för de tre ursprungliga runtimefilerna, källan, licensen och varje del av datapaketet finns i [provenance.json](provenance.json).

## Originalets spel

- Ett skepp styrs med muspositionen i normaliserade koordinater. Musknapp ned spelar `sample.wav` via SDL_mixer.
- Tio objektplatser: stjärnbakgrund, ett skepp och åtta återanvändbara stenplatser. Stenarna skapas till höger och flyttar åt vänster, med varierande storlek och en liten vertikal hastighet.
- Stenhöjd 0.1–0.3, bredd höjd/(1920/1080), horisontell fart 0.02–0.04 scenenheter per bildruta, vertikal fart -0.01–0.01.
- Rektangulär kollision använder 0.6 av skeppets halvbredd, 0.5 av dess halvhöjd och 0.5 av stenarnas halvmått enligt källan. Kollisionen återställer den inbyggda spelvärlden och slumptalsfröet till 1.
- Poängen i den ursprungliga Game over-rutan är antalet bildrutor som överlevts. Det finns inga kapitel, vinstmål, sparade banor eller skjutmekanik. Klickljudet är en effekt, inte ett skott.
- Shaderfilerna ritar skepp, stenar och animerade stjärnor. Samtliga fem paketerade filer, även den oanvända `simple.frag`, behålls byte för byte i datapaketet.

## Webbgränssnitt och inmatning

Filerna förladdas innan den oförändrade äldre Emscripten-runtimen startas. Den får sina vanliga `wasmBinary`- och `getPreloadedPackage`-inmatningar från samma originalbytes. Nätfel ger en återhämtningsknapp, som laddar om sidan. Motorn behöver canvas-id `canvas`; den gamla SDL-runtimen söker det namnet även när Module.canvas är satt.

Meny, instruktioner, paus, ny runda, tangentbord och touch tillkommer. Webbläsarens blockerande Game over-alert ersätts med en HTML-ruta. Resultatet kommer från originalmotorns meddelande efter verklig kollision. Motorn har redan återställt världen då; ”Spela igen” fortsätter den återställda inbyggda loopen. ”Ny runda” laddar om hela motorn.

Originalet räknar muskoordinater mot ett fönster som är 80 procent av skärmbredden. Den skalade webbspelrutan kan ha en annan storlek. Webbgränssnittet översätter därför mus, piltangenter/WASD och fingerdrag till det ursprungliga fönstrets koordinater. SDL:s parallella touchöversättning stoppas så att samma finger inte ger två olika muspositioner. Tangentbordets virtuella pekare går genom samma vanliga SDL-mushändelser. Tab och aktivering av HTML-knappar med mellanslag/Enter undantas från SDL:s globala tangentfångst så att fokus kan lämna spelrutan. Ingen webbkontroll skriver till spelets minne.

Paus använder den befintliga native-loopens pause/resume-funktioner, släpper kontroller och pausar ljudkontexten. Återgång med knappen återupptar även ljudkontexten. Stående och kompakt liggande mobilvy behåller spelrutans bildförhållande. Originalets startupplösning sparas för inmatningen även efter rotation; den ändras inte när skärmbredden senare ändras. När SDL ändrar canvasens pixelstorlek uppdateras WebGL-viewporten till samma storlek, så att hela scenen fortsätter fylla spelrutan. Det ändrar renderingens yta, inte spelvärlden.

Originalmotorn kan skriva en initial konsolrad om `emscripten_set_main_loop_timing` innan huvudloopen har registrerats: SDL:s swap interval sätts före loopstart i originalkällan. Det hindrar inte den efterföljande körningen. Runtimen ändras inte för att tysta raden.

## Testning

`node --test scripts/test-sdl-space.mjs` kontrollerar originalfilernas identitet, licensen och alla fem segment i datapaketet.

`npm run test:sdl-space:browser` spelar med vanliga mus-, tangentbords- och touchhändelser och observerar originalmotorn utan att skriva till den. En läsande testobservatör identifierar Context-layouten från den öppna C-koden och läser positioner, åtta stenplatser och bildrutepoäng. Det används för att styra verkliga musrörelser och för att kontrollera att paus verkligen stannar motorn. Kollisioner uppnås genom att flytta skeppet in i en befintlig sten, inte genom att ändra spelminne eller anropa förlustlogik från testet.
