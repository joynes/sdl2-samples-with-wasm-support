# SDL Space / hinderbana

Offentligt original `joynes/sdl2-samples-with-wasm-support`, commit `184adda998c5b91e07c0f7cfebe464d87cd4b09a` från 24 juli 2020. Det riktiga spelet är `simple_game_using_sdl2_wasm.c`; repots två andra program är grafikdemoexempel.

## Bevarat original

Alla tre originalruntimefiler (JS, WASM, data) och BSD-licensen är bytebevarade. Datapaketets fem ursprungliga filer (skepp, stenar, stjärnbakgrund, oanvänd enkel shader och sample.wav) kontrolleras individuellt mot källrepot. Ingen emulering eller JavaScript-rekonstruktion av spelreglerna ersätter originalet. Exakta hashvärden, paketoffseter och källhash finns i spelets provenance.json.

Native-regler: tio objektplatser, varav åtta stenar, variabel storlek/hastighet, vänsterrörelse och vertikal drift, ursprunglig rektangelkollision, frö 1 vid omstart och poäng i bildrutor. Ingen bana, vinst, skjutmekanik eller multiplayer finns i originalet. Klicket spelar den ursprungliga ljudfilen.

## Webbvärd

Förladdning av originalbytes genom Emscriptens befintliga wasmBinary/getPreloadedPackage-gränssnitt, start, paus, omstart, ny runda, HTML-förlustruta och nätfel/nytt försök. Förlustrutans poäng kommer från den riktiga SDL-alert som anropas efter en verklig native-kollision, efter att motorn redan återställt världen. Omspel fortsätter denna återställda loop; manuell ny runda laddar om hela motorn.

Webbvärden översätter mus, fingerdrag och tangentbord till källans ursprungliga startupplösning (80 procent av skärmbredden). Upplösningen sparas även vid senare rotation. SDL:s separata touch-emulering blockeras för att inte skriva över positionen. Tab/Enter/Space till HTML-kontroller undantas från den gamla globala tangentfångsten. Paus återupptar ljudkontexten vid fortsättning. Mutation av canvasstorlek uppdaterar WebGL-viewporten så att hela scenen fyller den skalade spelrutan, utan att ändra native-spelvärlden. Motorn kräver id canvas även när Module.canvas anges.

Native-konsolraden om main_loop_timing före loopstart är ursprunglig: SDL_GL_SetSwapInterval anropas före emscripten_set_main_loop_arg. Full spelbarhet verifieras efter detta meddelande; binären ändras inte för att tysta det.

## Verifiering

- `npm test`: 32 godkända kontroller, inklusive originalfilernas identitet och samtliga paketerade tillgångar.
- `npm run test:sdl-space:browser`: verklig musstyrd överlevnad minst 300 bildrutor med alla åtta stenplatser och varierande storlek, därefter riktig kollision, native-poäng, fryst återställd värld och omspel. Tangentstyrning testas tidigt före tät stenfas så testet inte blandar ihop faktisk kollision med utebliven tangentrespons.
- Läsande observer från C-kodens wasm32-strukturlayout identifierar en unik Context och läser bara positioner/bildrutetal/stenar. Vanliga musrörelser används för att undvika eller träffa befintliga stenar. Ingen teleport, minnesskrivning, artificiell poäng eller direkt förlustinjektion.
- Normal Tab-fokus och aktivering med Space/Enter, verkligt fryst native-bildrutetal vid paus, omstart och faktisk Web Audio-utbuffert med icke-noll samples verifierade.
- Riktiga CDP-touchhändelser: drag, cancel, ändrad riktning, native-kollision och omspel. Mobil stående och liggande, inklusive fortsatt korrekt koordinatmappning efter rotation och WebGL-viewport som matchar hela pixelbufferten.
- Separata 503-fel för JS, WASM och data kräver att nytt försök följs av ett faktiskt styrbart skepp.
- Skärmbilder på desktop 1280×1000, porträtt 390×844, landskap 844×390 och Game over granskade. Visuell kontroll hittade först partiellt renderad scen efter rotation; viewport-fix och test lades till före publicering.

Katalogkontroll passerade lokalt: spelbar iframe under Retrospel, utelämnat från AI-spel. Tidigare spel och AI-musik passerade navigationsregression. Publiceringen är verifierad enligt nedan.

## Publicerad och verifierad

https://joynes.github.io/joynes.se/games/sdl-space/

Kodcommit `6b1f8695611e69e5c5107f77f0aea9c8158b0fff`, Pages-körning `41296724273` lyckad och deployment-API succeed. Alla elva spel-/motor-/licens-/katalog-/HTML-filer SHA256-verifierade från kanoniska liveadresser. Hela motorsviten och katalogkontrollen passerade även på liveadressen, inklusive native-poäng/ljud, faktiskt touchomspel och tre nätfel med körbart nytt försök. Tidigare spel och AI-musik passerade navigationsregression. Inventeringen går vidare till Hello Multiplayer Game.
