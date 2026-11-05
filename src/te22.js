const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1000,height:700}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:25,tutDone:true,playSec:999}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(800);
await p.evaluate(()=>document.querySelector('.brainTag').click());await p.waitForTimeout(400);
const seen={};
for(let i=0;i<400;i++){const n=await p.evaluate(()=>{const q=__rxDbg().synQ();return q.d.name+'|'+(q.d.multi?1:0)});seen[n]=1;
 await p.evaluate(()=>{const q=__rxDbg().synQ();if(q.d.multi){q.d.sites.forEach(s=>{for(let k=0;k<(q.d.acts[s]==='inh'?2:1);k++)document.querySelector('[data-act=syn-dir][data-v='+s+']').click()});document.querySelector('[data-act=syn-dirsubmit]').click()}else{document.querySelector('[data-act=syn-act]'+(q.d.act==='act'?':nth-child(2)':'')).click();__rxDbg().synTap(q.d.sites[0])}
  document.querySelector('.syncard .result h3').textContent!=='Correct!'&&console.log('WRONG',q.d.name);document.querySelector('[data-act=syn-next]').click()});}
console.log(Object.keys(seen).filter(x=>/Retig|Tiag|Peram|Ethos|Vigab|Felba/.test(x)).join(' ; '));console.log('errs',errs);await b.close()})();
