const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const p = await b.newPage({ viewport:{width:1200,height:900} });
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.addInitScript(()=>{ const r=Math.random; Math.random=function(){ return r()*0.3; }; localStorage.setItem('cornerRx.v1', JSON.stringify({cash:0,correct:30,served:0,karenCd:999,sweatyCd:999,up:{shelf:1,tech:0,counsel:0,library:0,robot:0}})); });
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.waitForTimeout(500);
  const count=()=>p.evaluate(()=>window.__objs.filter(o=>o.userData&&o.userData.P&&o.parent&&o.parent.children.length&&o.children[0]&&o.children[0].userData.cust).length);
  await p.waitForTimeout(45000); console.log('full line', await p.textContent('.line3d'), 'people', await count());
  for(let i=0;i<8;i++){ const n=await p.$$('.opt:not([disabled])'); if(!n.length) break; await n[0].click(); await p.waitForTimeout(200); await p.click('#nextbtn'); await p.waitForTimeout(2500); }
  console.log('after serving', await p.textContent('.line3d'), 'people', await count());
  await p.waitForTimeout(12000); console.log('settled', await p.textContent('.line3d'), 'people', await count(), 'ERR', errs);
  await b.close();
})();
