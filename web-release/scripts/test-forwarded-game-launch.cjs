const assert=require('node:assert/strict'),http=require('node:http');
const {chromium}=require(process.env.CHROMIUM_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.HOMEPAGE_BASE_URL||'http://127.0.0.1:8767/';
(async()=>{let server;const browser=await chromium.launch(process.env.CHROMIUM_PLAYWRIGHT_MODULE?{args:['--enable-unsafe-swiftshader']}:{channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 let outer=process.env.FORWARDED_BASE_URL;
 if(!outer){server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html><head><title>Domain forwarding test</title></head><frameset rows="*"><frame src="${base}"></frameset></html>`);});await new Promise(r=>server.listen(0,'127.0.0.1',r));outer=`http://127.0.0.1:${server.address().port}/`;}
 for(const viewport of[{width:1280,height:1000},{width:390,height:844}]){
  const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'}),p=await context.newPage();await p.goto(outer);const site=p.frameLocator('frame').first();await site.locator('#mainMenu').waitFor();assert.equal(await site.locator('body').evaluate(()=>document.fullscreenEnabled),false,'the forwarding frame denies native fullscreen');
  if(!await site.locator('#mainMenu').evaluate(e=>e.open))await site.locator('#choose-title').click();await site.locator('[data-category="games"]').click();
  for(const [id,title]of[['car-topview','Top-down Driving'],['sdl-space','SDL Space — Survival']]){
   await site.locator('#gameControls').getByRole('link',{name:'All games',exact:true}).click();await site.locator('#contentList .item-title a').getByText(title,{exact:true}).click();
   const play=site.locator('#contentList a[href*="games/'+id+'/"]').filter({hasText:/^Play$/});await play.waitFor();assert.equal(await site.locator('iframe').count(),0,'a restricted forwarding frame does not trap the game in a preview');assert.equal(await play.getAttribute('target'),'_blank');assert((await play.evaluate(a=>a.href)).includes('/games/'+id+'/'));
   const [game]=await Promise.all([context.waitForEvent('page'),play.click()]);await game.locator('#start:enabled').focus();await game.keyboard.press('Enter');await game.locator(id==='car-topview'?'#view':'#canvas').waitFor();assert.equal(await game.evaluate(()=>document.fullscreenEnabled&&window.top===window),true,'the direct game window supports native fullscreen');
   const enter=game.getByRole('button',{name:'Enter fullscreen',exact:true});if(mobile)await enter.tap();else{await enter.focus();await game.keyboard.press('Enter');}await game.waitForFunction(()=>document.fullscreenElement?.id==='board');const exit=game.getByRole('button',{name:'Exit fullscreen',exact:true});await exit.focus();await game.keyboard.press('Enter');await game.waitForFunction(()=>!document.fullscreenElement);await game.close();console.log('PASS forwarded-domain launch',id,viewport.width,'direct window and native touch/keyboard fullscreen');
  }
  await context.close();
 }
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1});
