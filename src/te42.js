const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:420,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,set:{folder:'P3'}}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html');await p.waitForTimeout(900);
await p.evaluate(()=>document.querySelectorAll('.tour').forEach(e=>e.remove()));
const wks=()=>p.evaluate(()=>{const d=window.__rxDbg();const s=new Set();d.pool().filter(q=>q.c==='TP3').forEach(q=>s.add(q.wk));return [...s].sort((a,b)=>a-b).join(',')});
console.log('all weeks',await wks());
await p.evaluate(()=>{const e=document.querySelector('[data-act="settings"]');e&&e.click()});await p.waitForTimeout(500);
let n=await p.$$('.p3sched li button');console.log('rows',n.length);
if(!n.length){console.log('settings not open; trying menu');}
else{
 const first=await p.evaluate(()=>document.querySelector('.p3sched li button').dataset.v);
 const wkNowN=await p.evaluate(()=>{const c=[...document.querySelectorAll('.p3sched li.now button')][0];return c&&c.dataset.v});console.log('current',wkNowN);
 console.log('default (past+current only)',await wks());
 await p.click('[data-v="p3:only"]');console.log('this week only',await wks(),'pressed',await p.getAttribute('[data-v="p3:only"]','aria-pressed'));
 await p.click('[data-v="p3:only"]');console.log('restored',await wks());
 await p.click('[data-v="p3:none"]');console.log('none',JSON.stringify(await wks()));
 await p.click('.p3sched li button[data-v="p3:111"]');console.log('future only',await wks());
 await p.click('[data-v="p3:all"]');console.log('all',await wks());
 console.log('removed buttons',await p.$$eval('[data-act="ahead3"]',e=>e.length),await p.$$eval('.fb-P3 .chip[data-act="topic"]',e=>e.length));
 await p.click('[data-act="wkfold"][data-v="p3"]');console.log('folded rows',await p.$$eval('.p3sched li',e=>e.length),(await p.innerText('.grp:has(.grphd) .note')).slice(0,40));await p.click('[data-act="wkfold"][data-v="p3"]');console.log('unfolded rows',await p.$$eval('.p3sched li',e=>e.length));
 console.log('aria',await p.evaluate(()=>document.querySelector('.p3sched li button').getAttribute('aria-pressed')));
 console.log('overflow',await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
 await p.evaluate(()=>{document.querySelectorAll('.unlock,.unlockov').forEach(e=>e.remove());const e=document.querySelector('.grphd');e.scrollIntoView({block:'center'})});await p.waitForTimeout(300);await p.screenshot({path:process.env.SHOT||'/tmp/p3.png'});
}
console.log('errs',errs);await b.close()})();
