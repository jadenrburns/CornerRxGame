const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:700}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:25,tutDone:true,playSec:999}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(800);
const out=[];
for(let i=0;i<4;i++){
  const r=await p.evaluate((i)=>{const d=__rxDbg();const q=d.cur&&d.cur.q;if(!q||q.gen)return null;const k=q.k;
    if(i===0){d.S.mastery[k]={box:3,seen:4,ok:4,iv:1,t:Date.now()};}
    const wrong=[...document.querySelectorAll('.opt')].findIndex((_,j)=>j!==d.cur.opts.findIndex(o=>o.ok));
    document.querySelectorAll('.opt')[wrong].click();
    return {k,m:JSON.stringify(d.S.mastery[k])};},i);
  out.push(r); if(!r) break;
  await p.waitForTimeout(300);
  // second miss on same key: re-ask by forcing
  const r2=await p.evaluate(()=>{const d=__rxDbg();return d.cur.q.k});
  break;
}
console.log(out);console.log('errs',errs);await b.close()})();
