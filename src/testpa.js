const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const p = await b.newPage({ viewport:{width:1200,height:900} });
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:12,lastShelve:12,up:{shelf:1,tech:0,counsel:0,library:0,robot:0}})); });
  await p.clock.install();
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.clock.runFor(500);
  await p.evaluate(()=>{const f=__rxDbg().fp; f.cool=0; f.nextPrior=0; f.nextBottle=Date.now()+1e9;}); await p.clock.runFor(30000);
  console.log(await p.evaluate(()=>{const e=document.getElementById('fpq'),r=e.getBoundingClientRect(),s=document.getElementById('stage').getBoundingClientRect();return JSON.stringify({style:e.getAttribute('style'),r:[r.left,r.top,r.width,r.height],s:[s.left,s.top,s.width,s.height],cls:e.className,hidden:e.hidden})}));
  await b.close();
})();
