const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const ctx = await b.newContext({ viewport:{width:390,height:740}, hasTouch:true, isMobile:true, deviceScaleFactor:2 });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:2,cash:12345,streak:4,up:{shelf:3,tech:2,counsel:1,library:5,robot:0}})); });
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.waitForTimeout(700);
  console.log('toast hidden state:', JSON.stringify(await p.$eval('#toast3d',e=>{const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return {vis:cs.visibility,op:cs.opacity,bottom:Math.round(r.bottom)}})));
  await p.evaluate(()=>{ document.querySelector('#toast3d').textContent='Police took the patient away. Reputation -15.'; document.querySelector('#toast3d').classList.add('on'); });
  await p.waitForTimeout(500); await p.screenshot({path:'fx_stats_toast.png'});
  await p.evaluate(()=>document.querySelector('#toast3d').classList.remove('on')); await p.waitForTimeout(600);
  console.log('toast after hide:', JSON.stringify(await p.$eval('#toast3d',e=>{const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return {vis:cs.visibility,op:cs.opacity,bottom:Math.round(r.bottom)}})));
  console.log('top bar height', await p.$eval('.top',e=>Math.round(e.getBoundingClientRect().height)), 'tb', await p.evaluate(()=>getComputedStyle(document.body).getPropertyValue('--tb')));
  console.log('ERR',errs); await b.close();
})();
