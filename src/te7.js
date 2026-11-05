const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:12,tutDone:true,playSec:999,cash:50,up:{shelf:1,tech:0,counsel:0,library:0,robot:0},set:{topics:{TOP:true},diffs:[1,2,3],mode:'mixed',timer:true,focus:false,ahead:true}}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(600);
const click=async(sel)=>p.$eval(sel,e=>e.click());
const types=await p.evaluate(()=>{const o={};__rxDbg().TOPQ.forEach(q=>o[q.wt]=(o[q.wt]||0)+1);return o});console.log('TOPQ by type',types);
console.log('pearl sample',await p.evaluate(()=>{const q=__rxDbg().TOPQ.find(q=>q.wt==='pearl');return q.q+' => '+q.a+' | wrong: '+q.w.join(' / ')}));
// toggles
await click('[data-act="menu"]');await click('[data-act="settings"]');await p.waitForTimeout(300);
console.log('chips',await p.$$eval('[data-act="wktype"]',e=>e.map(x=>x.textContent+':'+x.getAttribute('aria-pressed'))));
for(const v of ['bg','ind','class']) {await click('[data-act="wktype"][data-v="'+v+'"]');await p.waitForTimeout(100);}
console.log('after off',await p.$$eval('[data-act="wktype"]',e=>e.map(x=>x.textContent+':'+x.getAttribute('aria-pressed'))));
const kinds=await p.evaluate(()=>{const o={};for(let i=0;i<300;i++){}const pool=__rxDbg().pool();pool.forEach(q=>{if(q.c==='TOP')o[q.wt]=(o[q.wt]||0)+1});return o});console.log('pool TOP kinds',kinds);
await click('[data-act="wktype"][data-v="moa"]');await click('[data-act="wktype"][data-v="pearl"]');
console.log('last toggle refused, pearl still on:',await p.$eval('[data-v="pearl"]',e=>e.getAttribute('aria-pressed')));
// focus: queued karen must not show
await click('[data-act="back"]').catch(()=>{});await p.waitForTimeout(500);
await p.evaluate(()=>{const S=__rxDbg().S;S.set.focus=true});
await p.evaluate(()=>{const q=World._dbg().queue;q[1].karen=true;});
await click('[data-act="menu"]');await click('[data-act="dev-next"]');await p.waitForTimeout(300);
console.log('focus card label',await p.$eval('.rx-meta b',e=>e.textContent),'karen class',await p.$('.rx.karen')!==null,'ktimer',await p.$('.ktimer')!==null);
console.log(errs);await b.close()})();
