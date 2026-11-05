const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();
for(const [w,h] of [[1000,700],[390,844]]){
const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:25,tutDone:true,playSec:999}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(900);
for(const s of [0,1,2,5,12,25,40]){await p.evaluate(s=>{__rxDbg().S.streak=s;document.querySelector('[data-act=back]')||0},s);
 await p.evaluate(()=>{window.__r&&0});}
console.log(w,'quick btns',await p.$$eval('.quick .qk',e=>e.map(x=>{const r=x.getBoundingClientRect();return [x.id,Math.round(r.x),Math.round(r.y),Math.round(r.width)]})));
console.log('menu order',await p.$$eval('#menu button span',e=>e.filter(x=>!/Test/.test(x.textContent)).map(x=>x.textContent).join(' | ')));
await p.evaluate(()=>document.querySelector('#sfxbtn').click());console.log('sfx',await p.evaluate(()=>__rxDbg().S.sfx));
await p.evaluate(()=>document.querySelector('#focusbtn').click());await p.waitForTimeout(200);console.log('focus',await p.evaluate(()=>document.body.classList.contains('focus')));
await p.evaluate(()=>document.querySelector('#focusbtn').click());
const fires=await p.evaluate(()=>{const out=[];[0,1,3,6,12,22,35].forEach(s=>{__rxDbg().S.streak=s;});return out});
console.log('errs',errs);await ctx.close();}
await b.close()})();
