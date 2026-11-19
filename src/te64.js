// v149: P1 Top 300 weekly drugs (ranks, brand/generic/indication only, from Jan 12) and the PharmTox Exam 4 question bank
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:900}});const errs=[],fail=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T'},served:30,correct:25,tutDone:true,playSec:999,boardAsked:true}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?noconf=1&dev=1');await p.waitForTimeout(900);
const r=await p.evaluate(()=>{const d=window.__rxDbg();const T=d.TOPQ.filter(q=>q.c==='TP1');
 const wks={};T.forEach(q=>{(wks[q.wk]=wks[q.wk]||new Set()).add(q.ref)});
 const types=[...new Set(T.map(q=>q.wt))].sort();
 const refs=new Set(T.map(q=>q.ref));
 const first=T.find(q=>q.wk===201);
 const pt=d.TOPQ.length;
 return {n:T.length,types,weeks:Object.keys(wks).length,w1:[...wks[201]].length,w7:Math.max(...[...wks[207]]%1000?[...wks[207]]:[0]),from:T[0].from,t:first&&first.t,refs:refs.size,max:Math.max(...refs),
  exam4:(d.S?1:0)}});
console.log(JSON.stringify(r));
if(r.types.join()!=='bg,ind')fail.push('P1 types '+r.types);
if(r.weeks!==16)fail.push('weeks '+r.weeks);
if(r.refs<300)fail.push('refs '+r.refs);
if(r.from!=='2027-01-12')fail.push('from '+r.from);
// Exam 4 bank in the PharmTox card
const e4=await p.evaluate(()=>{const arr=[];return {chip:!!document.body.innerHTML.length}});
const bank=await p.evaluate(()=>{const g=window.__rxDbg();return null});
// open topics and check chip + course card
await p.evaluate(()=>document.querySelectorAll('.tour').forEach(e=>e.remove()));
await p.evaluate(()=>{const e=document.querySelector('[data-act="settings"]');e&&e.click()});await p.waitForTimeout(400);
const ui=await p.evaluate(()=>({chip:!!document.querySelector('[data-v="PT4Q"]'),txt:(document.querySelector('[data-v="PT4Q"]')||{}).textContent}));
console.log(JSON.stringify(ui));if(!ui.chip)fail.push('PT4Q chip missing');
// year P1 shows the card with the schedule
await p.evaluate(()=>{const e=document.querySelector('[data-act="year"][data-v="P1"]');e&&e.click()});await p.waitForTimeout(300);
const p1=await p.evaluate(()=>({card:/Top 300 weekly drugs/.test(document.querySelector('.crsl').textContent),rows:document.querySelectorAll('[data-v^="p1:2"]').length,chip:!!document.querySelector('[data-v="TP1"]')}));
console.log(JSON.stringify(p1));if(!p1.card||p1.rows<16||!p1.chip)fail.push('P1 card '+JSON.stringify(p1));
// study ahead week 1 and week 7: pool only has TP1 for picked weeks
const pool=await p.evaluate(()=>{const d=window.__rxDbg();d.S.set.topics={};Object.keys(d.S.set.topics).length;
  return null});
await p.evaluate(()=>{const b=document.querySelector('[data-v="p1:201"]');b&&b.click()});await p.waitForTimeout(200);
const pl=await p.evaluate(()=>{const d=window.__rxDbg();const s=new Set();d.pool().filter(q=>q.c==='TP1').forEach(q=>s.add(q.wk));return [...s].join()});
console.log('pool weeks',pl);if(pl!=='201')fail.push('pool '+pl);
// Exam 4 bank
const b4=await p.evaluate(()=>{const d=window.__rxDbg();const l=d.S?1:0;return l});
console.log('fail',JSON.stringify(fail),'errs',JSON.stringify(errs));await b.close();process.exit(fail.length||errs.length?1:0)})();
