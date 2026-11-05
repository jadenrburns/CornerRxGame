const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  for (const vp of [{width:390,height:844},{width:1200,height:800}]) {
  const ctx = await b.newContext({ viewport:vp, hasTouch:vp.width<500, isMobile:vp.width<500 });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:12,lastShelve:12,cash:5,up:{shelf:3,tech:2,counsel:0,library:0,robot:0}})); });
  await p.clock.install(); await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.clock.runFor(500);
  await p.evaluate(()=>{__rxDbg().fp.cool=0; __rxDbg().fp.nextBottle=0;}); await p.clock.runFor(1500);
  console.log(vp.width,'bottle ids',JSON.stringify(await p.evaluate(()=>World._dbg().ids)));
  await p.evaluate(()=>{const f=__rxDbg().fp; World._click('b'+f.q.ok);}); await p.clock.runFor(2500);
  await p.evaluate(()=>{__rxDbg().fp.cool=0; __rxDbg().fp.nextBottle=Date.now()+1e9;});
  await p.$eval('[data-act="menu"]',e=>e.click()); await p.$eval('#menu [data-act="shelve"]',e=>e.click()); await p.clock.runFor(600);
  console.log(vp.width,'shelve ids',JSON.stringify(await p.evaluate(()=>World._dbg().ids)), (await p.textContent('#fpq')).replace(/\s+/g,' ').slice(0,160));
  await ctx.close(); }
  console.log('ERR',errs); await b.close();
})();
