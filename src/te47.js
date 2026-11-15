const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,cash:100}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html');await p.waitForTimeout(900);
await p.evaluate(()=>document.querySelectorAll('.tour').forEach(e=>e.remove()));
// SM-2 math
console.log('sm2',JSON.stringify(await p.evaluate(()=>{const d=window.__rxDbg();const m={box:0,seen:0,ok:0},o=[];const s=(ok,c)=>{m.due=0;d.sr(m,ok,c);o.push([m.n,m.d,m.ef])};s(true,'certain');s(true,'certain');s(true,'certain');s(false,'certain');s(true,'guess');return o})));
// get a single-answer question card
async function card(){for(let i=0;i<30;i++){const r=await p.evaluate(()=>{const d=window.__rxDbg();if(d.cur&&d.cur.q&&!d.cur.done&&!d.cur.q.ms&&!d.cur.q.gen&&!d.cur.karen&&!d.cur.sweaty&&!d.cur.elder&&!d.cur.evt&&!d.cur.caller&&!d.cur.visit&&!d.cur.lab)return 1;const n=document.querySelector('#nextbtn');if(n)n.click();else d.nc();return 0});if(r)return true;await p.waitForTimeout(80)}return false}
console.log('got card',await card());
let k=await p.evaluate(()=>window.__rxDbg().cur.q.k);
const wi=await p.evaluate(()=>window.__rxDbg().cur.opts.findIndex(o=>!o.ok));
await p.click('.opt[data-i="'+wi+'"]');await p.waitForTimeout(150);
console.log('after pick: confbar',await p.$$eval('.confbar',e=>e.length),'result',await p.$$eval('#result',e=>e.length),'done',await p.evaluate(()=>window.__rxDbg().cur.done),'pend',await p.evaluate(()=>window.__rxDbg().cur.pend));
await p.keyboard.press('3');await p.waitForTimeout(250);
console.log('after certain+wrong',JSON.stringify(await p.evaluate((k)=>{const d=window.__rxDbg();const m=d.S.mastery[k];return {done:d.cur.done,ok:d.cur.ok,n:m.n,d:m.d,cw:m.cw,box:m.box,cf:d.S.cf,missed:d.S.missed.indexOf(k)>=0}},k)),'chips',await p.$$eval('.pay span',e=>e.map(x=>x.innerText)));
// next: correct with guess (click button)
console.log('got card2',await card());
k=await p.evaluate(()=>window.__rxDbg().cur.q.k);
const ri=await p.evaluate(()=>window.__rxDbg().cur.opts.findIndex(o=>o.ok));
await p.click('.opt[data-i="'+ri+'"]');await p.waitForTimeout(100);await p.click('.confbtn[data-conf="guess"]');await p.waitForTimeout(250);
console.log('after guess+right',JSON.stringify(await p.evaluate((k)=>{const m=window.__rxDbg().S.mastery[k];return {n:m.n,d:m.d,box:m.box,gr:m.gr}},k)),'chips',await p.$$eval('.pay span',e=>e.map(x=>x.innerText)));
// change pick while prompt up
console.log('got card3',await card());
const two=await p.evaluate(()=>{const d=window.__rxDbg();return [d.cur.opts.findIndex(o=>!o.ok),d.cur.opts.findIndex(o=>o.ok)]});
await p.click('.opt[data-i="'+two[0]+'"]');await p.click('.opt[data-i="'+two[1]+'"]');await p.waitForTimeout(100);
console.log('changed pick pend',await p.evaluate(()=>window.__rxDbg().cur.pend),'expected',two[1]);
await p.click('.confbtn[data-conf="certain"]');await p.waitForTimeout(250);
console.log('result ok',await p.evaluate(()=>window.__rxDbg().cur.ok));
// toggle off
await p.evaluate(()=>{window.__rxDbg().S.set.conf=false});
console.log('got card4',await card());
const ri4=await p.evaluate(()=>window.__rxDbg().cur.opts.findIndex(o=>o.ok));
await p.click('.opt[data-i="'+ri4+'"]');await p.waitForTimeout(250);
console.log('conf off -> done immediately',await p.evaluate(()=>window.__rxDbg().cur.done),'confbar',await p.$$eval('.confbar',e=>e.length));
// due weighting + migration
console.log('legacy reviewDue',await p.evaluate(()=>{const d=window.__rxDbg();return 1}));
console.log('errs',errs);await b.close()})();
