const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const p = await b.newPage({ viewport:{width:1200,height:900} });
  p.on('pageerror', e => errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  const today=new Date(); const fmt=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const fut=new Date(Date.now()+5*864e5);
  await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},cash:2e15,correct:30,served:5,lastShelve:5,karenCd:999,sweatyCd:999,up:{shelf:3,tech:2,counsel:0,library:0,robot:0},rep:60})); });
  await p.clock.install();
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.clock.runFor(500);
  const dbg=()=>p.evaluate(()=>{const d=__rxDbg();return {kind:d.fp.kind,on:d.fp.on,done:d.fp.done,view:d.view,step:d.fp.s&&d.fp.s.step,miss:d.fp.s&&d.fp.s.miss}});
  // retirement
  console.log('retire btn', await p.$eval('#retirebtn',e=>e.disabled), await p.textContent('.retire p'));
  console.log('cash', await p.textContent('#cashv'));
  // manual shelve
  await p.click('[data-act="shelve"]'); await p.clock.runFor(1500);
  console.log('shelve start', JSON.stringify(await dbg()), 'stage fpmode', await p.$eval('#stage',e=>e.classList.contains('fpmode')), 'panel hidden', await p.$eval('#qpanel',e=>getComputedStyle(e).display));
  console.log('banner', (await p.textContent('#fpq')).replace(/\s+/g,' '));
  console.log('ids', JSON.stringify(await p.evaluate(()=>World._dbg().ids)));
  // wrong then right
  const target = ()=>p.evaluate(()=>{const s=__rxDbg().fp.s;return s.targets[s.step]});
  let t=await target(); const wrong=(t+1)%6;
  await p.evaluate(w=>World._click('bin'+w), wrong); await p.clock.runFor(200);
  console.log('after 1 wrong', JSON.stringify(await dbg()));
  for(let i=0;i<5;i++){ t=await target(); await p.evaluate(w=>World._click('bin'+w), t); await p.clock.runFor(100); }
  console.log('after 5 right', JSON.stringify(await dbg()), (await p.textContent('#fpq')).replace(/\s+/g,' '));
  await p.clock.runFor(2000);
  console.log('exit', JSON.stringify(await dbg()), 'qpanel', await p.$eval('#qpanel',e=>getComputedStyle(e).display), 'toast', await p.textContent('#toast3d'));
  // fail path: two wrongs
  await p.click('[data-act="shelve"]'); await p.clock.runFor(1500);
  t=await target(); const w2=(t+1)%6; await p.evaluate(w=>World._click('bin'+w), w2); await p.evaluate(w=>World._click('bin'+w), w2);
  console.log('2 wrongs', JSON.stringify(await dbg())); await p.clock.runFor(2500); console.log('exit', JSON.stringify(await dbg()), await p.textContent('#toast3d'));
  // auto shelve trigger: served jump
  await p.evaluate(()=>{__rxDbg().S.served=40; __rxDbg().fp.cool=0;}); await p.clock.runFor(1500);
  console.log('auto', JSON.stringify(await dbg()));
  await p.evaluate(()=>World._click('bin0')); // finish quickly by failing
  for(let i=0;i<4;i++){ const tt=await target(); if(tt===undefined) break; const w=(tt+1)%6; await p.evaluate(w=>World._click('bin'+w), w); }
  await p.clock.runFor(2500);
  // bottle: wrong
  await p.evaluate(()=>{__rxDbg().fp.cool=0; __rxDbg().fp.nextBottle=0;}); await p.clock.runFor(1500);
  console.log('bottle', JSON.stringify(await dbg()), (await p.textContent('#fpq')).replace(/\s+/g,' '));
  console.log('ids', JSON.stringify(await p.evaluate(()=>World._dbg().ids)));
  await p.evaluate(()=>{const f=__rxDbg().fp; World._click('b'+(1-f.q.ok));}); await p.clock.runFor(300);
  console.log('after wrong', (await p.textContent('#fpq')).replace(/\s+/g,' ').slice(0,200));
  await p.clock.runFor(14000);
  console.log('police job', JSON.stringify(await p.evaluate(()=>{const d=World._dbg();return d.copJob&&d.copJob.phase})), await p.textContent('#toast3d'));
  // prior auth
  await p.evaluate(()=>{__rxDbg().fp.cool=0; __rxDbg().fp.nextPrior=0; __rxDbg().fp.nextBottle=Date.now()+1e9;}); await p.clock.runFor(30000);
  console.log('prior', JSON.stringify(await dbg()));
  console.log((await p.textContent('#fpq')).replace(/\s+/g,' ').slice(0,300));
  for(let i=0;i<3;i++){ await p.$eval('.pbtn[data-pa="0"]',e=>e.click()); await p.clock.runFor(1200); console.log('  res', (await p.textContent('.pres')).replace(/\s+/g,' ').slice(0,200)); await p.$eval('[data-panext]',e=>e.click()); await p.clock.runFor(1200); }
  console.log('exit', JSON.stringify(await dbg()), await p.textContent('#toast3d'));
  // retire
  await p.click('#retirebtn'); console.log('retire panel', (await p.textContent('.pane')).replace(/\s+/g,' ').slice(0,200));
  await p.click('[data-act="retire-new"]'); await p.clock.runFor(300);
  const S=await p.evaluate(()=>{const s=__rxDbg().S;return {retired:s.retired,cash:s.cash,up:s.up}}); console.log('after retire', JSON.stringify(S));
  console.log('ERR', errs); await b.close();
})();
