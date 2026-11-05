const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const p = await b.newPage({ viewport:{width:900,height:900} });
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(()=>{ Math.random=function(){return 0.01;}; localStorage.setItem('cornerRx.v1', JSON.stringify({cash:0,correct:30,served:20,up:{shelf:3,tech:2,counsel:0,library:0,robot:0}})); });
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.waitForTimeout(400);
  console.log('label', await p.textContent('.rx-meta b'), '| panel karen class', await p.$eval('#qpanel',e=>e.classList.contains('karen')));
  // settings pause test
  await p.click('.qset'); await p.waitForTimeout(1500); await p.click('[data-act="back"]');
  await p.waitForTimeout(14200);
  console.log('result:', (await p.textContent('#result')).replace(/\s+/g,' ').slice(0,260));
  console.log('up now', JSON.stringify(await p.evaluate(()=>{ return JSON.parse(localStorage.getItem('cornerRx.v1')||'{}').up; })));
  await p.waitForTimeout(600);
  console.log('up saved', JSON.stringify(await p.evaluate(()=>JSON.parse(localStorage.getItem('cornerRx.v1')).up)), 'stats', await p.textContent('#store .note'));
  await p.screenshot({path:'karen-flat.png'});
  console.log('ERR', errs);
  await b.close();
})();
