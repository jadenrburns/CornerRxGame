const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:760,height:1000},deviceScaleFactor:1});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.goto('file://'+process.cwd()+'/corner-rx.html');await p.waitForTimeout(1200);
await p.evaluate(()=>{const b=document.querySelector('[data-act=settings]');b&&b.click()});await p.waitForTimeout(700);
await p.screenshot({path:'../shot_p2.png'});
for (const f of ['P3','P1']){ await p.click('[data-act=folder][data-v='+f+']'); await p.waitForTimeout(500); await p.screenshot({path:'../shot_'+f.toLowerCase()+'.png'}); }
await p.click('[data-act=folder][data-v=P3]'); await p.waitForTimeout(300);
console.log(await p.evaluate(()=>document.querySelector('.p3sched').innerText));
const info=await p.evaluate(()=>{const d=window.__rxDbg();const t=d.TOPQ;const c={};t.forEach(q=>c[q.c]=(c[q.c]||0)+1);return c});console.log(info);
console.log('errs',errs);await b.close()})();
