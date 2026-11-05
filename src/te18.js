const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1000,height:700}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:12,tutDone:true,playSec:999}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(800);
await p.evaluate(()=>document.querySelector('.brainTag').click());await p.waitForTimeout(500);
const seen={};
for(let i=0;i<200&&Object.keys(seen).length<2;i++){
 const info=await p.evaluate(()=>{const q=__rxDbg().synQ();return {n:q.d.name,m:!!q.d.multi,rows:[...document.querySelectorAll('.syndir span')].map(e=>e.textContent)}});
 if(info.m&&!seen[info.n]){ seen[info.n]=1; console.log(info.n,'rows',info.rows.join(' / '));
  await p.evaluate(()=>{const q=__rxDbg().synQ();q.d.sites.forEach(s=>{const n=q.d.name==='Valproate'?(q.d.acts[s]==='inh'?2:1):2;for(let k=0;k<n;k++)document.querySelector('[data-act=syn-dir][data-v='+s+']').click()});document.querySelector('[data-act=syn-dirsubmit]').click()});
  console.log(await p.$eval('.syncard .result',e=>e.innerText.replace(/\n/g,' | ').slice(0,260)));
 } else if(!info.m) await p.evaluate(()=>{document.querySelector('[data-act=syn-act]').click();__rxDbg().synTap(__rxDbg().synQ().d.sites[0])});
 await p.evaluate(()=>{const n=document.querySelector('[data-act=syn-next]');if(n)n.click()});
 if(info.m&&seen[info.n]===1&&!(await p.evaluate(()=>!!document.querySelector('.syncard .result')))) await p.evaluate(()=>{const q=__rxDbg().synQ();q.d.sites.forEach(s=>document.querySelector('[data-act=syn-dir][data-v='+s+']').click());document.querySelector('[data-act=syn-dirsubmit]').click();document.querySelector('[data-act=syn-next]').click()});
}
console.log('errs',errs);await b.close()})();
