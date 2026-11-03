// Read-only observer of the original wasm32 Context/Obj layout in public C source.
const assert=require('node:assert/strict');
async function findContext(page){const matches=await page.evaluate(()=>{const h=Module.HEAP32,f=Module.HEAPF32,found=[];for(let n=86;n<h.length;n++){if(h[n]!==10)continue;const p=n*4-344;if(p%8||Math.abs(f[(p+68)/4]-.1125)>.0001||Math.abs(f[(p+72)/4]-.1)>.0001||f[(p+36)/4]!==1||f[(p+40)/4]!==1)continue;if(h[(p+4)/4]>0&&h[(p+8)/4]>0)found.push(p);}return found;});assert.equal(matches.length,1,'unique native Context');return matches[0];}
async function observe(page,address){return page.evaluate(p=>{const h=Module.HEAP32,f=Module.HEAPF32,d=Module.HEAPF64;return{w:h[(p+4)/4],h:h[(p+8)/4],frame:d[(p+16)/8],objects:Array.from({length:10},(_,i)=>{const k=(p+24+i*32)/4;return{x:f[k],y:f[k+1],alive:h[k+2],w:f[k+3],h:f[k+4],vx:f[k+5],vy:f[k+6]};})};},address);}
module.exports={findContext,observe};
