const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1000,height:700}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:12,tutDone:true,playSec:999,up:{shelf:0,tech:3,counsel:0,library:0,robot:0}}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(800);
// queue size cap
await p.waitForTimeout(100);
const q=()=>p.evaluate(()=>{const d=World._dbg();return {n:d.queue.length,idl:d.queue.filter(c=>c.idl).length,sit:d.queue.filter(c=>c.sit).length}});
console.log('q start',await q());
// fast-forward arrivals: call dev-next many times? let time pass
for(let i=0;i<8;i++){await p.waitForTimeout(1500);}
console.log('q after 12s',await q());
// rush
await p.evaluate(()=>document.querySelector('[data-act=dev-rush]').click());await p.waitForTimeout(500);
for(let i=0;i<10;i++){await p.waitForTimeout(1200);}
console.log('rush q',await q(), await p.evaluate(()=>World._dbg().queue.map(c=>[+c.g.position.x.toFixed(1),+c.g.position.z.toFixed(1)]).join(' ')));
// switch to lab during rush
await p.evaluate(()=>document.querySelector('[data-act=lab]').click());await p.waitForTimeout(500);
console.log('lab on during rush',await p.evaluate(()=>({lab:!!__rxDbg().S.lab,w:World.labOn(),rush:__rxDbg().rush})));
const n=await p.evaluate(()=>World.devLabClick(0));console.log('lab items',n);
for(let i=0;i<n;i+=Math.ceil(n/40)){await p.evaluate(i=>World.devLabClick(i),i);await p.waitForTimeout(40);}
await p.waitForTimeout(2500);
// staff keeps moving? positions change
const s1=await p.evaluate(()=>World._dbg().staff.map(s=>[s.g.position.x,s.g.position.z]));await p.waitForTimeout(2500);const s2=await p.evaluate(()=>World._dbg().staff.map(s=>[s.g.position.x,s.g.position.z]));
console.log('staff vis in lab',await p.evaluate(()=>World._dbg().staff[0]&&World._dbg().staff[0].g.parent.visible),'moved',JSON.stringify(s1)!==JSON.stringify(s2));
await p.evaluate(()=>document.querySelector('[data-act=lab]').click());await p.waitForTimeout(500);
await p.waitForTimeout(600);console.log('back staff vis',await p.evaluate(()=>({v:World._dbg().staff[0].g.parent.visible,lab:World.labOn(),S:!!__rxDbg().S.lab,fpT:World._dbg().fpT,fpK:World._dbg().fpK})));
// capsules
await p.evaluate(()=>document.querySelector('[data-act=dev-sky]').click());await p.waitForTimeout(300);
console.log('caps',await p.evaluate(()=>{World.devCapsule('plant');return 1}));
await p.waitForTimeout(1500);
console.log('errs',errs);await b.close()})();
