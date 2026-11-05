const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  for (const vp of [{width:390,height:844},{width:1200,height:800}]) {
  const ctx = await b.newContext({ viewport:vp, hasTouch:vp.width<500, isMobile:vp.width<500 });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,lastShelve:30,cash:5,up:{shelf:3,tech:2,counsel:0,library:0,robot:0}})); });
  await p.clock.install(); await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.clock.runFor(500);
  await p.evaluate(()=>{__rxDbg().fp.cool=Date.now()+1e10; __rxDbg().fp.nextBottle=Date.now()+1e10;});
  await p.$eval('[data-act="menu"]',e=>e.click()); await p.$eval('#menu [data-act="shelve"]',e=>e.click()); await p.clock.runFor(600);
  await p.$eval('#fpq',e=>e.click()); await p.clock.runFor(700);
  for (let k=0;k<5;k++){ const t=await p.evaluate(()=>{const s=__rxDbg().fp.s;return s.targets[s.step]}); await p.evaluate(n=>World._click('bin'+n),t); await p.clock.runFor(120);
    const mid=await p.evaluate(()=>World._dbg().ids.filter(i=>i==='held*'||i==='held').length); await p.clock.runFor(900); }
  console.log(vp.width,'done state:', JSON.stringify(await p.evaluate(()=>{const d=__rxDbg();return {kind:d.fp.kind,done:d.fp.done,step:d.fp.s&&d.fp.s.step}})), 'ids', JSON.stringify(await p.evaluate(()=>World._dbg().ids)));
  await p.clock.runFor(3000); console.log(' after exit view', await p.evaluate(()=>__rxDbg().view), 'toast:', await p.textContent('#toast3d'));
  await ctx.close(); }
  console.log('ERR',errs); await b.close();
})();
