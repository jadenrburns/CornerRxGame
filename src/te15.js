const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();
for(const [w,h] of [[1000,700],[390,844]]){
const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:12,tutDone:true,playSec:999}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(800);
console.log(w,'brain tag',!!(await p.$('.brainTag')));
await p.evaluate(()=>document.querySelector('.brainTag').click());await p.waitForTimeout(600);
console.log('syn view',await p.evaluate(()=>({view:__rxDbg().view,w:World.synOn(),body:document.body.classList.contains('syn')})),'labels',await p.$$eval('.syn3d',e=>e.length));
for(const cat of ['epi','ad','cbd']){
 await p.evaluate(c=>document.querySelector('[data-act=syn-cat][data-v='+c+']').click(),cat);await p.waitForTimeout(250);
 let ok=0,n=0,multiN=0;
 for(let i=0;i<40;i++){
  const info=await p.evaluate(()=>{const b=document.querySelector('.synq b');return b.textContent});
  const multi=await p.evaluate(()=>!!__rxDbg().synQ().d.multi);
  if(multi){ multiN++; await p.evaluate(()=>{const q=__rxDbg().synQ();q.d.sites.forEach(s=>{const n=q.d.acts[s]==='inh'?2:1;for(let k=0;k<n;k++)document.querySelector('[data-act=syn-dir][data-v='+s+']').click()});document.querySelector('[data-act=syn-dirsubmit]').click()}); }
  else { await p.evaluate(()=>document.querySelector('[data-act=syn-act]').click());
  await p.waitForTimeout(30);
  await p.evaluate(()=>{const q=__rxDbg().synQ();__rxDbg().synTap(q.d.sites[0])}); }
  const cnt=4;
  const r=await p.$eval('.syncard .result h3',e=>e.textContent);n++;if(r==='Correct!')ok++;
  await p.evaluate(()=>document.querySelector('[data-act=syn-next]').click());
  if(cnt!==4)console.log('opts!=4',cnt);
 }
 console.log(cat,'answered',n,'correct',ok,'multi',multiN);
}
// tap on site while awaiting
await p.evaluate(()=>document.querySelector('[data-act=syn-act]').click());
await p.evaluate(()=>document.querySelector('[data-act=back]').click());await p.waitForTimeout(500);
console.log('after back',await p.evaluate(()=>({view:__rxDbg().view,w:World.synOn(),body:document.body.classList.contains('syn')})));
await p.evaluate(()=>document.querySelector('[data-act=syn]').click());await p.waitForTimeout(300);
await p.evaluate(()=>document.querySelector('[data-act=awards]')&&document.querySelector('[data-act=awards]').click());await p.waitForTimeout(300);
console.log('after nav away',await p.evaluate(()=>({view:__rxDbg().view,w:World.synOn()})));
console.log('errs',errs);await ctx.close();}
await b.close()})();
