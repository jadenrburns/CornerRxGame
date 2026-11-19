// v150: P1 weeks are cumulative: started weeks stay on, new weeks join automatically, "So far" re-selects everything started
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:900}});const errs=[],fail=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{window.__now=new Date('2027-01-20T12:00:00').getTime();const D=Date;window.Date=class extends D{constructor(...a){if(a.length)super(...a);else super(window.__now)}static now(){return window.__now}};
 if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T'},served:30,correct:25,tutDone:true,playSec:999,boardAsked:true}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?noconf=1');await p.waitForTimeout(900);
await p.evaluate(()=>document.querySelectorAll('.tour').forEach(e=>e.remove()));
const wks=()=>p.evaluate(()=>{const d=window.__rxDbg();const s=new Set();d.pool().filter(q=>q.c==='TP1').forEach(q=>s.add(q.wk));return [...s].sort().join()});
await p.evaluate(()=>{const e=document.querySelector('[data-act="settings"]');e&&e.click()});await p.waitForTimeout(300);
await p.evaluate(()=>{const e=document.querySelector('[data-act="year"][data-v="P1"]');e&&e.click()});await p.waitForTimeout(300);
const a=await wks();console.log('default Jan 20',a);if(a!=='201,202')fail.push('default '+a);
await p.click('[data-v="p1:only"]');const o=await wks();console.log('only',o);if(o!=='202')fail.push('only '+o);
await p.click('[data-v="p1:sofar"]');const s1=await wks();console.log('so far',s1);if(s1!=='201,202')fail.push('sofar '+s1);
await p.evaluate(()=>{window.__now=new Date('2027-02-03T12:00:00').getTime()});
const s2=await wks();console.log('Feb 3 (weeks 203, 204 started)',s2);if(s2!=='201,202,203,204')fail.push('auto join '+s2);
await p.evaluate(()=>{const b=document.querySelector('[data-act="settings"]');});
console.log('fail',JSON.stringify(fail),'errs',JSON.stringify(errs));await b.close();process.exit(fail.length||errs.length?1:0)})();
