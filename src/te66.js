// v151: P1 Biochemistry card with two chips (BIOG, BIO4); every question answerable and unique
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:900}});const errs=[],fail=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T'},served:30,correct:25,tutDone:true,playSec:999,boardAsked:true}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?noconf=1');await p.waitForTimeout(900);
await p.evaluate(()=>document.querySelectorAll('.tour').forEach(e=>e.remove()));
const r=await p.evaluate(()=>{const d=window.__rxDbg();const P=d.pool();const out={};for(const c of ['BIOG','BIO4']){const q=P.filter(x=>x.c===c);out[c]={n:q.length,uniq:new Set(q.map(x=>x.q)).size,bad:q.filter(x=>new Set([x.a].concat(x.w||[])).size!==4).length}}return out});
console.log(JSON.stringify(r));
if(r.BIOG.n!==34||r.BIO4.n!==38)fail.push('counts '+JSON.stringify(r));
for(const c of ['BIOG','BIO4']) if(r[c].uniq!==r[c].n||r[c].bad)fail.push('quality '+c);
await p.evaluate(()=>{const e=document.querySelector('[data-act="settings"]');e&&e.click()});await p.waitForTimeout(300);
await p.evaluate(()=>{const e=document.querySelector('[data-act="year"][data-v="P1"]');e&&e.click()});await p.waitForTimeout(300);
const ui=await p.evaluate(()=>({card:/Biochemistry/.test(document.querySelector('.crsl').textContent),g:!!document.querySelector('[data-v="BIOG"]'),f:!!document.querySelector('[data-v="BIO4"]')}));
console.log(JSON.stringify(ui));if(!ui.card||!ui.g||!ui.f)fail.push('ui '+JSON.stringify(ui));
console.log('fail',JSON.stringify(fail),'errs',JSON.stringify(errs));await b.close();process.exit(fail.length||errs.length?1:0)})();
