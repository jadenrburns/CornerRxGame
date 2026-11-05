const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const p = await b.newPage({ viewport:{width:1200,height:900} });
  p.on('pageerror', e => errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},cash:2e15,correct:30,served:12,lastShelve:12,karenCd:999,sweatyCd:999,up:{shelf:3,tech:2,counsel:0,library:0,robot:0},rep:60})); });
  await p.clock.install();
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.clock.runFor(500);
  const st=()=>p.evaluate(()=>{const d=__rxDbg();return {on:d.fp.on,kind:d.fp.kind,view:d.view,bad:d.S.bottleBad||0}});
  // bottle: wrong -> X element
  await p.evaluate(()=>{__rxDbg().fp.cool=0; __rxDbg().fp.nextBottle=0;}); await p.clock.runFor(1500);
  await p.evaluate(()=>{const f=__rxDbg().fp; World._click('b'+(1-f.q.ok));}); await p.clock.runFor(200);
  console.log('X elements after wrong pick:', await p.$$eval('.fpx',e=>e.length), JSON.stringify(await st()));
  await p.clock.runFor(16000);
  // bottle leave
  await p.evaluate(()=>{__rxDbg().fp.cool=0; __rxDbg().fp.nextBottle=0;}); await p.clock.runFor(1500);
  console.log('bottle started', JSON.stringify(await st()));
  await p.$eval('#fpleave',e=>e.click()); await p.clock.runFor(300); console.log('after leave', JSON.stringify(await st()));
  // prior leave
  await p.evaluate(()=>{__rxDbg().fp.cool=0; __rxDbg().fp.nextPrior=0; __rxDbg().fp.nextBottle=Date.now()+1e9;}); await p.clock.runFor(30000);
  console.log('prior', JSON.stringify(await st()));
  await p.$eval('#fpleave',e=>e.click()); await p.clock.runFor(4000); console.log('after prior leave', JSON.stringify(await st()), await p.textContent('#toast3d'));
  console.log('ERR',errs); await b.close();
})();
