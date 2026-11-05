const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();
for(const [w,h] of [[1000,700],[390,844]]){
const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:12,tutDone:true,playSec:999,set:{topics:{BG:false,CL:false,MOA:false,AE:false,DDI:false,CN:false,AD:false,SIG:false,TOP:false,CALC:false,MY:false,PT3:true},diffs:[1,2,3],mode:'mixed'}}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(800);
console.log(w,'topics',await p.evaluate(()=>JSON.stringify(__rxDbg().S.set.topics)));
console.log('pool',await p.evaluate(()=>__rxDbg().pool().length));
let seen={},n3=0,n4=0;
for(let i=0;i<30;i++){
  const info=await p.evaluate(()=>{const c=__rxDbg().cur;return c&&c.q?{c:c.q.c,t:c.q.t,n:c.opts.length}:null});
  if(info){seen[info.t]=1;info.n===3?n3++:n4++;if(info.c!=='PT3')console.log('wrong cat',info);}
  await p.evaluate(()=>{const o=document.querySelector('.opt');o&&o.click()});await p.waitForTimeout(120);
  await p.evaluate(()=>{const n=document.querySelector('[data-act=next],[data-act=continue]');n&&n.click()});await p.waitForTimeout(120);
}
console.log('sections seen',Object.keys(seen),'3opt',n3,'4opt',n4);
console.log('label',await p.evaluate(()=>{const e=document.querySelector('.qlabel,.qcat,.label');return e&&e.textContent}));
await p.screenshot({path:'pt3_q_'+w+'.png'});
await p.evaluate(()=>{const t=document.querySelector('[data-act=settings],[data-act=tab-set]');t&&t.click()});await p.waitForTimeout(400);
console.log('subgrp',await p.$$eval('.subgrp .chip',e=>e.map(x=>x.textContent)));
await p.screenshot({path:'pt3_set_'+w+'.png'});
console.log('errs',errs);await ctx.close();}
await b.close()})();
