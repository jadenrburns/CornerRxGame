const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();
for(const [w,h] of [[390,844],[1000,700]]){
const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:w<500});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:12,tutDone:true,playSec:999,cash:50,up:{shelf:1,tech:0,counsel:0,library:0,robot:0}}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html');await p.waitForTimeout(700);
console.log(w,'btn rect',await p.$eval('#restockhud',e=>{const r=e.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom].map(Math.round)}),'line',await p.$eval('#line3d',e=>{const r=e.getBoundingClientRect();return [r.left,r.top,r.right].map(Math.round)}));
await p.screenshot({path:'rs_'+w+'.png',clip:{x:0,y:0,width:w,height:140}});
await p.touchscreen.tap(...(await p.$eval('#restockhud',e=>{const r=e.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})));
await p.waitForTimeout(800);
console.log('view after tap',await p.evaluate(()=>__rxDbg().view),errs);await ctx.close();}
await b.close()})();
