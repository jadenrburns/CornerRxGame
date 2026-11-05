const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:12,tutDone:true,playSec:999,cash:50,up:{shelf:1,tech:0,counsel:0,library:0,robot:0}}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(600);
const click=async(sel)=>p.$eval(sel,e=>e.click());
for(const k of ['dev-mumble','dev-driver','dev-insp','dev-mumble']){
await click('[data-act="menu"]');
const r=await p.evaluate((k)=>{const W=window.World; return typeof World==='undefined'?'noWorld':'ok'},k);
await click('[data-act="'+k+'"]');await click('[data-act="menu"]');await click('[data-act="dev-next"]');await p.waitForTimeout(300);
console.log(k,await p.$eval('.rx-meta b',e=>e.textContent),'|',await p.evaluate(()=>JSON.stringify(World._dbg&&World._dbg())).then(x=>x&&x.slice(0,200)));
await p.evaluate(()=>{});
}
console.log(errs);await b.close()})();
