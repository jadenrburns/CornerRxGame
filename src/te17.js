const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();
for(const hol of ['none','halloween','christmas']){
const ctx=await b.newContext({viewport:{width:1000,height:700}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:12,tutDone:true,playSec:999}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1&holiday='+hol);await p.waitForTimeout(1500);
console.log(hol,'holiday',await p.evaluate(()=>[World.holiday&&World.holiday(),__rxDbg().holiday(),__rxDbg().holN()]));
// events as objects
console.log(' evt on before',await p.evaluate(()=>['shelve','bottle','prior'].map(k=>World.evtOn(k))));
await p.evaluate(()=>{__rxDbg().offer('shelve');__rxDbg().offer('prior');__rxDbg().offer('bottle')});await p.waitForTimeout(600);
console.log(' evt on after offer',await p.evaluate(()=>['shelve','bottle','prior'].map(k=>World.evtOn(k))),'view',await p.evaluate(()=>__rxDbg().view),'fp',await p.evaluate(()=>__rxDbg().fp.on));
await p.evaluate(()=>__rxDbg().onEvt('bottle'));await p.waitForTimeout(500);
console.log(' after click bottle: fp',await p.evaluate(()=>[__rxDbg().fp.on,__rxDbg().fp.kind,World.evtOn('bottle')]));
// answer one
await p.evaluate(()=>{const b=document.querySelector('[data-act=fp-b0],[data-act=bottle]');});
// correct answers advance holiday
if(hol!=='none'){ for(let i=0;i<10;i++){ await p.evaluate(()=>{const c=__rxDbg().cur; }); } }
console.log(' errs',errs);await ctx.close();}
await b.close()})();
