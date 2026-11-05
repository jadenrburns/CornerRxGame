const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const p = await b.newPage({ viewport:{width:1200,height:900} });
  p.on('pageerror', e => errs.push('pageerror: '+e.message+' '+(e.stack||'').split('\n').slice(0,3).join('|')));
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({cash:0,correct:30,served:20,up:{shelf:1,tech:0,counsel:0,library:0,robot:0}})); });
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.waitForTimeout(600);
  await p.evaluate(()=>{ window.__min=9; window.__says=0; window.__log=[];
    new MutationObserver(m=>m.forEach(r=>r.addedNodes.forEach(n=>{ if(n.className==='say3d'){ window.__says++; window.__log.push(n.textContent);} }))).observe(document.querySelector('.tags')||document.body,{childList:true,subtree:true});
    setInterval(()=>{ const ps=window.__objs.filter(o=>o.userData&&o.userData.P&&o.children[0]&&o.children[0].userData.cust&&o.parent); for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){ const a=ps[i].position,c=ps[j].position; const d=Math.hypot(a.x-c.x,a.z-c.z); if(d<window.__min) window.__min=d; } },16); });
  console.log('customers in scene', await p.evaluate(()=>window.__objs.filter(o=>o.userData&&o.userData.P&&o.children[0]&&o.children[0].userData.cust&&o.parent).length));
  for (let i=0;i<10;i++){ const n=await p.$$('.opt:not([disabled])'); if(!n.length) break; await n[0].click(); await p.waitForTimeout(150); await p.click('#nextbtn'); await p.waitForTimeout(900); }
  console.log('minDist', (await p.evaluate(()=>window.__min)).toFixed(2), 'says', await p.evaluate(()=>window.__says), await p.evaluate(()=>window.__log.join(',')));
  // click on a patient
  await p.evaluate(()=>{ const o=window.__objs.find(o=>o.userData&&o.userData.P&&o.children[0]&&o.children[0].userData.cust&&o.parent); window.__hit=o.children[0]; });
  const box = await p.$eval('#stage', e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height]});
  const before = await p.evaluate(()=>window.__says);
  await p.mouse.click(box[0]+200, box[1]+150); await p.waitForTimeout(300);
  await p.waitForTimeout(100); console.log('says after click', before, '->', await p.evaluate(()=>window.__says), await p.evaluate(()=>window.__log.slice(-3).join(',')));
  // keyboard camera
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(300); await p.keyboard.up('ArrowRight'); await p.keyboard.press('w');
  console.log('ERR', errs);
  await b.close();
})();
