const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,cash:100}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html');await p.waitForTimeout(900);
await p.evaluate(()=>document.querySelectorAll('.tour').forEach(e=>e.remove()));
const single=`(d)=>d.cur&&d.cur.q&&!d.cur.done&&!d.cur.q.ms&&!d.cur.q.gen&&!d.cur.karen&&!d.cur.sweaty&&!d.cur.elder&&!d.cur.evt&&!d.cur.caller&&!d.cur.visit&&!d.cur.lab`;
async function card(){for(let i=0;i<40;i++){const r=await p.evaluate(`(()=>{const d=window.__rxDbg();if((${single})(d))return 1;const n=document.querySelector('#nextbtn');if(n)n.click();else d.nc();return 0})()`);if(r)return true;await p.waitForTimeout(60)}return false}
const modes=await p.evaluate(()=>{document.body.insertAdjacentHTML('beforeend','<button id="ts" data-act="settings"></button>');document.getElementById('ts').click();return [...document.querySelectorAll('[data-act="mode"]')].map(x=>x.innerText)});
console.log('modes',modes);await p.evaluate(()=>window.__rxDbg().nc());
// Review misses / New only: no prompt
await p.evaluate(()=>{window.__rxDbg().S.set.mode='new'});console.log('card',await card());
const ri=await p.evaluate(()=>window.__rxDbg().cur.opts.findIndex(o=>o.ok));
await p.click('.opt[data-i="'+ri+'"]');await p.waitForTimeout(200);
console.log('new-only: done',await p.evaluate(()=>window.__rxDbg().cur.done),'confbar',await p.$$eval('.confbar',e=>e.length),'sm2 fields',await p.evaluate(()=>{const d=window.__rxDbg();const m=d.S.mastery[d.cur.q.k];return m.due===undefined&&m.n===undefined}));
// Smart mix: prompt + sm2
await p.evaluate(()=>{window.__rxDbg().S.set.mode='mixed'});console.log('card',await card());
await p.click('.opt[data-i="0"]');await p.waitForTimeout(150);
console.log('smart: confbar',await p.$$eval('.confbar',e=>e.length),'done',await p.evaluate(()=>window.__rxDbg().cur.done));
await p.click('.confbtn[data-conf="sure"]');await p.waitForTimeout(200);
console.log('smart: sm2 set',await p.evaluate(()=>{const d=window.__rxDbg();const m=d.S.mastery[d.cur.q.k];return m.due>0&&m.n!==undefined}));
// same-day repeat skips the prompt
await p.evaluate(()=>{window.__rxDbg().S.set.mode='mixed'});console.log('card',await card());
const kk=await p.evaluate(()=>{const d=window.__rxDbg();const k=d.cur.q.k;const m=d.S.mastery[k]||(d.S.mastery[k]={box:0,seen:1,ok:0});m.lt=Date.now();return k});
await p.click('.opt[data-i="0"]');await p.waitForTimeout(200);
console.log('same-day repeat: done at once',await p.evaluate(()=>window.__rxDbg().cur.done),'confbar',await p.$$eval('.confbar',e=>e.length));
// Review: nothing due -> empty message
await p.evaluate(()=>{const d=window.__rxDbg();for(const k in d.S.mastery){d.S.mastery[k].due=Date.now()+5*864e5}d.S.set.mode='review';d.nc()});await p.waitForTimeout(150);
console.log('review none:',await p.$eval('.empty-q',e=>e.innerText.replace(/\n/g,' | ')));
await p.click('[data-act="mode-go"]');await p.waitForTimeout(200);
console.log('back to',await p.evaluate(()=>window.__rxDbg().S.set.mode));
// Review: mark three due, topics off for them
const keys=await p.evaluate(()=>{const d=window.__rxDbg();const ks=Object.keys(d.S.mastery).slice(0,3);ks.forEach(k=>d.S.mastery[k].due=Date.now()-864e5);d.S.set.mode='review';d.S.set.topics=Object.fromEntries(Object.keys(d.S.set.topics).map(k=>[k,false]));return ks});
console.log('due keys',keys.length,'pool matches',await p.evaluate((ks)=>{const d=window.__rxDbg();const pl=d.pool().map(q=>q.k).sort().join();return pl===ks.slice().sort().join()},keys));
console.log('card',await card());
const sp=await p.evaluate(()=>{const c=window.__rxDbg().cur;return !!(c.recall||c.regular)});console.log('special patient',sp);const k=await p.evaluate(()=>window.__rxDbg().cur.q.k);await p.click('.opt[data-i="0"]');await p.waitForTimeout(200);
console.log('review: inKeys',keys.includes(k),'confbar',await p.$$eval('.confbar',e=>e.length),'mode',await p.evaluate(()=>window.__rxDbg().S.set.mode),'done',await p.evaluate(()=>window.__rxDbg().cur.done));
console.log('errs',errs);await b.close()})();
