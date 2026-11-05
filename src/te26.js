const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();
for(const [w,h] of [[1000,700],[390,844]]){
const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:25,tutDone:true,playSec:999,cash:5000,up:{tech:5,shelf:3}}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(900);
for(const s of [4,12,40]){await p.evaluate(s=>{const d=__rxDbg();d.S.streak=s;d.S.best=Math.max(d.S.best,s);d.renderStats()},s);await p.waitForTimeout(500);
 await p.screenshot({path:`t26-${w}-${s}.png`,clip:{x:0,y:0,width:w,height:260}});}
console.log(w,'dbg keys',await p.evaluate(()=>Object.keys(__rxDbg()).join(',')));
console.log('rate',await p.evaluate(()=>{const d=__rxDbg();const a=d.passive();d.S.cash=1e6;d.buyUp('train');d.buyUp('train');return [a,d.passive(),d.S.up.train]}));console.log('errs',errs);await ctx.close();}
await b.close()})();
