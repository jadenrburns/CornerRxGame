const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.goto('file://'+process.cwd()+'/corner-rx.html');await p.waitForTimeout(1200);
const t=await p.evaluate(()=>window.__rxDbg().TOPQ.map(q=>({wt:q.wt,d:q.d,ms:!!q.ms,q:q.q,a:q.a,as:q.as,w:q.w,ref:q.ref,wk:q.wk,k:q.k})));
fs.writeFileSync('../topq.json',JSON.stringify(t));console.log(t.length,errs);
const c={};t.forEach(q=>c[q.wt]=(c[q.wt]||0)+1);console.log(c);await b.close()})();
