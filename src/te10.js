const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1000,height:700}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:12,tutDone:true,playSec:999}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html');await p.waitForTimeout(600);
await p.evaluate(()=>document.querySelector('[data-act=lab]').click());await p.waitForTimeout(400);
await p.reload();await p.waitForTimeout(800);
console.log(await p.evaluate(()=>({lab:!!__rxDbg().S.lab,body:document.body.classList.contains('lab'),w:World.labOn(),cur:__rxDbg().cur.lab})));
// switch with a customer queued & karen etc: run 25 cards in lab, ensure all lab
const seen=await p.evaluate(()=>{const o=[];for(let i=0;i<25;i++){document.querySelector('.opt')&&document.querySelector('.opt').click();const nb=document.getElementById('nextbtn');if(nb)nb.click();o.push(__rxDbg().cur.lab||'x')}return o.join(',')});
console.log(seen);
await p.screenshot({path:'lab_desk.png'});
console.log('errs',errs);await b.close()})();
