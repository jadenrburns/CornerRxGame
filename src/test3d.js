const { chromium } = require('playwright');
const fs=require('fs');
(async () => {
  const b = await chromium.launch();
  const errs=[];
  const p = await b.newPage({ viewport:{width:1200,height:900} });
  p.on('pageerror', e => errs.push('pageerror: '+e.message+' '+(e.stack||'').split('\n')[1]));
  p.on('console', m => { if (m.type()==='error' && !/ERR_TUNNEL|Failed to load resource/.test(m.text())) errs.push('console: '+m.text()); });
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub.js','utf8') }));
  await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},cash:5000,correct:30,up:{shelf:1,tech:2,counsel:0,library:0,robot:0}})); });
  await p.goto('file://'+process.cwd()+'/corner-rx.html');
  await p.waitForTimeout(800);
  console.log('stage hidden?', await p.$eval('#stage', e=>e.hidden), 'tags', await p.$$eval('.tag3d', t=>t.length));
  for (let i=0;i<8;i++){
    const n = await p.$$('.opt:not([disabled])'); if(!n.length) break;
    await n[i%n.length].click(); await p.waitForTimeout(100);
    await p.click('#nextbtn');
  }
  // buy via tags
  for (const id of ['shelf','tech','counsel','library','robot']) { await p.click(`.tag3d[data-up="${id}"]`, {force:true}); }
  await p.waitForTimeout(400);
  console.log('levels', await p.evaluate(()=>JSON.parse(localStorage.getItem('cornerRx.v1')||'{}').up));
  await p.waitForTimeout(1200);
  console.log('tag text', await p.$$eval('.tag3d', t=>t.map(x=>x.textContent)));
  await p.click('.hud [data-z="in"]'); await p.click('.hud [data-z="reset"]');
  const box = await p.$eval('#stage', e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height]});
  await p.mouse.move(box[0]+300, box[1]+200); await p.mouse.down(); await p.mouse.move(box[0]+400, box[1]+220,{steps:5}); await p.mouse.up();
  await p.mouse.click(box[0]+200, box[1]+150);
  await p.waitForTimeout(300);
  console.log('ERRORS', JSON.stringify(errs,null,1));
  // fallback path: no THREE at all
  const p2 = await b.newPage({ viewport:{width:390,height:800} });
  p2.on('pageerror', e => errs.push('fb pageerror: '+e.message));
  await p2.goto('file://'+process.cwd()+'/corner-rx.html'); await p2.waitForTimeout(500);
  console.log('fallback stage hidden', await p2.$eval('#stage', e=>e.hidden), 'svg scene', await p2.$$eval('.scene', s=>s.length));
  await p2.click('.opt'); await p2.click('#nextbtn');
  console.log('FINAL ERRORS', JSON.stringify(errs));
  await b.close();
})();
