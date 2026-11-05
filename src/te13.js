const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1000,height:700}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:12,tutDone:true,playSec:999}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(800);
for(const k of ['sky','plant','sky','plant','sky','sky']){
 const spawned=await p.evaluate(k=>World.devCapsule(k),k);await p.waitForTimeout(1300);
 const had=await p.evaluate(()=>World._capClick());await p.waitForTimeout(300);
 console.log(k,'spawned',spawned,'clicked',had,'caps',await p.evaluate(()=>JSON.stringify(__rxDbg().S.caps)),'cash',await p.evaluate(()=>Math.round(__rxDbg().S.cash)),'ok',await p.evaluate(()=>0));
 await p.evaluate(()=>{document.querySelectorAll('.unlock').forEach(e=>e.remove())});
}
console.log('title',await p.evaluate(()=>document.querySelector('.unlock b')&&document.querySelector('.unlock b').textContent));
await p.evaluate(()=>document.querySelector('[data-act=awards]').click());await p.waitForTimeout(300);
console.log('awards capsule row',(await p.$eval('.capsrow',e=>e.textContent)).slice(0,160));
console.log('errs',errs);await b.close()})();
