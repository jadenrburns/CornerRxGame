const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.goto('file://'+process.cwd()+'/corner-rx.html');await p.waitForTimeout(1200);
const r=await p.evaluate(()=>{const c={};BANK.forEach(q=>c[q.c]=(c[q.c]||0)+1);return c});console.log(JSON.stringify(r));
const t=await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Topics/.test(x.textContent)&&x.dataset.act);return b?b.dataset.act:null});console.log('topicsbtn',t);
console.log('errs',errs.length,errs.slice(0,2));await b.close()})();
