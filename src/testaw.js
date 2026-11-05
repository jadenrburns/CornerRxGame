const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const p = await b.newPage({ viewport:{width:1200,height:900} });
  p.on('pageerror', e => errs.push(e.message+' '+(e.stack||'').split('\n').slice(0,3).join('|')));
  p.on('console', m => { if (m.type()==='error' && !/Failed to load|ERR_/.test(m.text())) errs.push('console: '+m.text()); });
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.waitForTimeout(600);
  console.log('first run shows creator:', await p.textContent('.pane h3'));
  for (const sel of ['[data-k="gender"][data-v="f"]','[data-k="body"][data-v="jacked"]','[data-k="hair"][data-v="4"]','[data-k="skin"][data-v="3"]','[data-k="hairColor"][data-v="2"]','[data-k="scrub"][data-v="2"]','[data-k="body"][data-v="slim"]','[data-k="hair"][data-v="2"]']) { await p.click(sel); }
  console.log('pressed', await p.$$eval('.pane [aria-pressed="true"]', e=>e.length));
  const pharmCount = await p.evaluate(()=>window.__objs.filter(o=>o.userData&&o.userData.P&&o.children[0]&&o.children[0].children.length>=0&&o.parent&&o.position.z<-1.5&&o.position.z>-2).length);
  console.log('pharmacist object(s) at counter', pharmCount);
  await p.click('[data-act="me-done"]'); console.log('card after start:', await p.textContent('.rx-meta b')); await p.waitForTimeout(5600);
  console.log('saved me', await p.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('cornerRx.v1')).me)));
  // seed mastery
  const seed = await p.evaluate(()=>{ const m={}; BANK.forEach(q=>{ if(['BG','CL','MOA'].includes(q.c)) m[q.k]={box:3,seen:3,ok:3}; }); return m; });
  await p.evaluate((m)=>{ const s=JSON.parse(localStorage.getItem('cornerRx.v1')); s.mastery=m; localStorage.setItem('cornerRx.v1', JSON.stringify(s)); }, seed);
  await p.reload(); await p.waitForTimeout(600);
  console.log('awards button', (await p.textContent('[data-act="awards"]')).trim());
  const petN = await p.evaluate(()=>window.__objs.filter(o=>o.children&&o.children.some&&o.children.some(c=>c.userData&&c.userData.pet)).length);
  console.log('pet groups in scene', petN);
  await p.click('[data-act="awards"]'); console.log('awards panel rows', await p.$$eval('.aw',e=>e.length), 'unlocked tiers', await p.$$eval('.tier.on',e=>e.length), 'pets on', await p.$$eval('.awp.on',e=>e.map(x=>x.textContent.trim().slice(0,12))));
  await p.click('[data-act="back"]');
  // click pharmacist / pet reaction
  await p.evaluate(()=>{ const o=window.__objs.find(o=>o.children&&o.children.some&&o.children.some(c=>c.userData&&c.userData.pet)); window.__hit=o.children.find(c=>c.userData.pet); });
  const box = await p.$eval('#stage', e=>{const r=e.getBoundingClientRect();return [r.x,r.y]});
  await p.mouse.click(box[0]+200, box[1]+150); await p.waitForTimeout(200);
  console.log('says after pet click', await p.$$eval('.say3d',e=>e.map(x=>x.textContent)));
  await p.waitForTimeout(8000);
  console.log('ERR', errs);
  await b.close();
})();
