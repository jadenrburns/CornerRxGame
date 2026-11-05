const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const p = await b.newPage({ viewport:{width:900,height:900} });
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(()=>{ let n=0; Math.random=function(){ n++; return 0.1; }; localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},cash:0,correct:30,served:20,karenCd:999,up:{shelf:1,tech:0,counsel:0,library:0,robot:0}})); });
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.waitForTimeout(400);
  console.log('label', await p.textContent('.rx-meta b'), '| sweaty class', await p.$eval('.rx',e=>e.classList.contains('sweaty')));
  // answer wrong: click options until a bad one
  for (let i=0;i<4;i++){ await p.click(`.opt[data-i="${i}"]`); if (await p.$('.opt.bad')) break; await p.click('#nextbtn').catch(()=>{}); await p.keyboard.press('Enter'); await p.waitForTimeout(100); }
  console.log('result:', (await p.textContent('#result')).replace(/\s+/g,' ').slice(0,200));
  await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  console.log('jim overlay', !!(await p.$('.jim')), 'disabled opts', await p.$$eval('.opt:disabled',e=>e.length));
  await p.screenshot({path:'jim-flat.png'});
  // blocked key should do nothing
  const j = await p.$eval('.jim',e=>e.style.gridRow); console.log('gridRow', j);
  await p.waitForTimeout(2700); console.log('button visible', await p.$eval('#jimgo',e=>!e.hidden));
  await p.click('#jimgo'); console.log('after dismiss overlay', !!(await p.$('.jim')), 'disabled', await p.$$eval('.opt:disabled',e=>e.length));
  // second: auto dismiss isn't re-triggered
  console.log('ERR', errs);
  await b.close();
})();
