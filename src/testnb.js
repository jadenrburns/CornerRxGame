const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const p = await b.newPage({ viewport:{width:1200,height:900} });
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:2})); });
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.waitForTimeout(400);
  await p.$eval('[data-act="tab-studies"]',e=>e.click()); await p.waitForTimeout(600);
  await p.screenshot({path:'nb.png'});
  console.log('nbk', await p.$$eval('.nbk',e=>e.length), 'closeBtn', await p.$$eval('.nbclose',e=>e.length));
  await p.$eval('.nbclose',e=>e.click()); await p.waitForTimeout(100);
  console.log('closing', await p.$$eval('.nbk.closing',e=>e.length)); await p.waitForTimeout(500);
  console.log('after', await p.$$eval('.nbk',e=>e.length), await p.evaluate(()=>__rxDbg().view));
  console.log('ERR',errs); await b.close();
})();
