const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1200,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:process.env.THREE_JS,contentType:'text/javascript'}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,boardAsked:true,set:{topics:{}},mic:{st:{},mode:'drag',set:'body'}}));localStorage.setItem('rxNet','{"off":1}')});
await p.goto('file://'+process.cwd()+'/corner-rx.html?noconf=1');await p.waitForTimeout(3500);
await p.evaluate(()=>document.querySelectorAll('.tour,.unlock').forEach(e=>e.remove()));
await p.evaluate(()=>{document.querySelector('#menu [data-act="mic"]').click()});await p.waitForTimeout(2500);
const D=process.argv[2];await p.screenshot({path:D+'/menu.png'});
const pt=await p.evaluate(()=>{for(let y=60;y<740;y+=6)for(let x=20;x<700;x+=6){if(World.micSiteAt(x,y)==='heart')return [x,y]}return null});console.log('heart px',pt);

console.log(await p.evaluate(()=>{const R=window.__rxDbg().micDbg().R;return R?R.kind+':'+R.part:'none'}));
const hp=await p.evaluate(()=>{for(let y=60;y<740;y+=5)for(let x=20;x<700;x+=5){if(World.micSiteAt(x,y)==='heart')return [x,y]}return null});console.log('zoom heart px',hp);
// tap a correct bug, then tap the heart
await p.evaluate(()=>{const d=window.__rxDbg().micDbg();const c=d.R.chips.find(c=>c.valid.length);d.sel?0:0;document.querySelector('.petri[data-chip="'+c.id+'"]').click()});await p.waitForTimeout(300);
await p.mouse.click(hp[0],hp[1]);await p.waitForTimeout(1500);
console.log(await p.evaluate(()=>{const R=window.__rxDbg().micDbg().R;return JSON.stringify({placed:R.placed,mist:R.mist})}));
await p.screenshot({path:D+'/placed.png'});
console.log('errs',JSON.stringify(errs));await b.close()})();
