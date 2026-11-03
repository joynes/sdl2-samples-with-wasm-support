const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.CHROMIUM_PLAYWRIGHT_MODULE||'playwright');
const {findContext,observe}=require('./sdl-space-observer.cjs');
const base=process.env.GAME_BASE_URL||'http://127.0.0.1:8767/games/sdl-space/';
const home=process.env.HOMEPAGE_BASE_URL||'http://127.0.0.1:8767/';
async function ship(p,a){return(await observe(p,a)).objects[1];}
function still(a,b){assert(Math.abs(a.x-b.x)<.02&&Math.abs(a.y-b.y)<.02,JSON.stringify({before:a,after:b}));}
async function start(p){await p.goto(base);await p.locator('#start:enabled').focus();await p.keyboard.press('Enter');await p.clock.runFor(70);return findContext(p);}
(async()=>{fs.mkdirSync('test-results',{recursive:true});const browser=await chromium.launch({args:['--enable-unsafe-swiftshader']});try{
 for(const viewport of[{width:1280,height:1000},{width:390,height:844},{width:844,height:390}]){
  const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});
  const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.clock.install();
  let a=await start(p),before=await ship(p,a);
  await p.keyboard.down('ArrowRight');await p.keyboard.down('KeyD');await p.clock.runFor(120);await p.keyboard.up('ArrowRight');
  const one=await ship(p,a);await p.clock.runFor(120);assert((await ship(p,a)).x>one.x+.08,'remaining keyboard alias keeps moving');
  await p.keyboard.down('KeyW');await p.clock.runFor(100);await p.keyboard.up('KeyD');
  const diagonal=await ship(p,a);assert(diagonal.x>before.x+.2&&diagonal.y>before.y+.08,'simultaneous horizontal and vertical keys');
  await p.clock.runFor(80);assert((await ship(p,a)).y>diagonal.y+.05);await p.keyboard.up('KeyW');
  await p.clock.runFor(40);before=await ship(p,a);await p.clock.runFor(80);still(before,await ship(p,a));
  for(const action of['pause','focus']){
   a=await start(p);await p.keyboard.down('ArrowRight');await p.clock.runFor(100);
   if(action==='pause'){await p.keyboard.press('KeyP');const frozen=await observe(p,a);await p.clock.runFor(100);assert.deepEqual(await observe(p,a),frozen);await p.locator('#resume').focus();await p.keyboard.press('Enter');}
   else{await p.locator('#pause').focus();await p.locator('#canvas').focus();}
   await p.clock.runFor(40);before=await ship(p,a);await p.keyboard.down('ArrowRight');await p.clock.runFor(120);still(before,await ship(p,a));
   await p.keyboard.up('ArrowRight');await p.keyboard.down('ArrowRight');await p.clock.runFor(100);await p.keyboard.up('ArrowRight');
   assert((await ship(p,a)).x>before.x+.08,'fresh key press works after cleanup');
  }
  a=await start(p);await p.keyboard.press('Space');await p.clock.runFor(50);
  await p.waitForFunction(()=>Module.SDL2.audioContext.state==='running'&&Module.SDL2.audio.currentOutputBuffer?.getChannelData(0).some(v=>Math.abs(v)>.0001));
  await p.locator('#reset').focus();await p.keyboard.press('Enter');await p.locator('#play:not([hidden])').waitFor();await p.clock.runFor(50);
  a=await findContext(p);assert((await observe(p,a)).frame<10);await p.keyboard.down('KeyD');await p.clock.runFor(100);await p.keyboard.up('KeyD');assert((await ship(p,a)).x>-.95,'keyboard restart returns to a playable native game');
  if(mobile){
   a=await start(p);const cdp=await context.newCDPSession(p);
   async function point(game,x,y,id){const r=await game.locator('#canvas').boundingBox();return{x:r.x+(x+1)/2*r.width,y:r.y+(1-y)/2*r.height,id};}
   let owner=await point(p,-.6,.8,1),second=await point(p,.6,-.8,2);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[owner]});await p.clock.runFor(50);
   before=await ship(p,a);assert(Math.abs(before.x+.6)<.06&&Math.abs(before.y-.8)<.06);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[owner,second]});await p.clock.runFor(40);still(before,await ship(p,a));
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[second]});
   owner=await point(p,-.4,.6,1);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[owner]});await p.clock.runFor(50);
   before=await ship(p,a);assert(Math.abs(before.x+.4)<.06&&Math.abs(before.y-.6)<.06,'secondary finger release preserves owner drag');
   await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await p.clock.runFor(60);still(before,await ship(p,a));
   await p.keyboard.down('KeyA');await p.clock.runFor(100);await p.keyboard.up('KeyA');assert((await ship(p,a)).x<before.x-.08,'keyboard works after canceled touch');
   owner=await point(p,-.6,.8,3);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[owner]});
   await p.locator('#reset').focus();await p.keyboard.press('Enter');await p.locator('#play:not([hidden])').waitFor();await p.clock.runFor(50);a=await findContext(p);
   before=await ship(p,a);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...owner,x:owner.x+30}]});await p.clock.runFor(50);still(before,await ship(p,a));
   await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});owner=await point(p,-.6,.8,4);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[owner]});await p.clock.runFor(50);assert(Math.abs((await ship(p,a)).x+.6)<.06,'fresh drag works after restart');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await p.goto(home+'#games/retro/sdl-space');const selector='iframe[title="SDL Space — Survival"]',frame=p.locator(selector),game=p.frameLocator(selector);
   await frame.scrollIntoViewIfNeeded();await game.locator('#start:enabled').focus();await p.keyboard.press('Enter');await p.clock.runFor(70);await frame.scrollIntoViewIfNeeded();
   const native=p.frames().find(f=>f.url().includes('/games/sdl-space/'));a=await findContext(native);
   if(viewport.width===844){const r=await game.locator('#board').boundingBox();assert(r.y>=48&&r.y+r.height<=390,'whole native board is visible in the embedded phone landscape viewport');}
   owner=await point(game,-.6,.8,5);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[owner]});await p.clock.runFor(60);
   assert(Math.abs((await ship(native,a)).x+.6)<.06);await p.locator('#choose-title').focus();assert.equal(await game.locator('#overlay').isVisible(),true);
   const frozen=await observe(native,a);await p.clock.runFor(100);assert.deepEqual(await observe(native,a),frozen,'real frame-window blur pauses native gameplay');
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...owner,x:owner.x+40}]});
   await game.locator('#resume').focus();await p.keyboard.press('Enter');await p.clock.runFor(50);still(frozen.objects[1],await ship(native,a));
   await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
   await p.keyboard.down('KeyD');await p.clock.runFor(100);await p.keyboard.up('KeyD');assert((await ship(native,a)).x>frozen.objects[1].x+.08);
   if(viewport.width===844){const r=await game.locator('#board').boundingBox();assert(r.y>=48&&r.y+r.height<=390,'returning from the site menu keeps the whole board visible');}
   await p.screenshot({path:`test-results/sdl-space-frame-${viewport.width}.png`});
   if(viewport.width===844)await p.setViewportSize({width:390,height:844});
   await game.getByRole('link',{name:'← Retro games',exact:true}).tap();await p.waitForFunction(()=>location.hash==='#games/retro'&&!document.querySelector('iframe'));
   await cdp.detach();
  }
  assert.deepEqual(errors,[]);await context.close();console.log('PASS native SDL controls',viewport.width,'keyboard aliases/diagonal/release, pause/focus/repeat, keyboard audio/restart, two-finger ownership/cancel and real frame focus');
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
