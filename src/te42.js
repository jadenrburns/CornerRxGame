const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:420,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,set:{ahead3:true,folder:'P3'}}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html');await p.waitForTimeout(900);
await p.evaluate(()=>document.querySelectorAll('.tour').forEach(e=>e.remove()));
const wks=()=>p.evaluate(()=>{const d=window.__rxDbg();const s=new Set();d.pool().filter(q=>q.c==='TP3').forEach(q=>s.add(q.wk));return [...s].sort((a,b)=>a-b).join(',')});
console.log('all weeks',await wks());
await p.evaluate(()=>{const e=document.querySelector('[data-act="settings"]');e&&e.click()});await p.waitForTimeout(500);
let n=await p.$$('.p3sched li button');console.log('rows',n.length);
if(!n.length){console.log('settings not open; trying menu');}
else{
 const first=await p.evaluate(()=>document.querySelector('.p3sched li button').dataset.v);
 await p.click('[data-act="p3wk-none"]');console.log('none',JSON.stringify(await wks()));
 await p.click('.p3sched li button[data-v="'+first+'"]');console.log('only first',await wks(),'first=',first);
 await p.click('.p3sched li button[data-v="'+first+'"]');console.log('first off again',JSON.stringify(await wks()));
 await p.click('[data-act="p3wk-all"]');console.log('all again',await wks());
 console.log('aria',await p.evaluate(()=>document.querySelector('.p3sched li button').getAttribute('aria-pressed')));
 console.log('overflow',await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
 await p.screenshot({path:process.env.SHOT||'/tmp/p3.png'});
}
console.log('errs',errs);await b.close()})();
