const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const p = await b.newPage({ viewport:{width:1200,height:900} });
  p.on('pageerror', e => errs.push('pageerror: '+e.message+' '+(e.stack||'').split('\n').slice(0,3).join('|')));
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.addInitScript(()=>{ const r=Math.random; let n=0; Math.random=function(){ return r()*0.3; }; localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},cash:0,correct:30,served:0,karenCd:999,sweatyCd:999,up:{shelf:1,tech:0,counsel:0,library:0,robot:0}})); });
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.waitForTimeout(500);
  await p.evaluate(()=>{ window.__min=9; window.__obs=9; window.__says=[]; window.__maxY=0;
    const B=[[-3.75,4.15,-1,1.05],[4.05,6.75,-1.8,-0.6],[-7.8,-4.6,0.2,3.4],[-8.8,-7.7,-4.4,-0.8],[5.5,8.1,-5.5,-2.9],[-6.2,3.2,-5.9,-4.8]];
    new MutationObserver(m=>m.forEach(r=>r.addedNodes.forEach(n=>{ if(n.className==='say3d') window.__says.push(n.textContent); }))).observe(document.querySelector('.tags'),{childList:true,subtree:true});
    setInterval(()=>{ const all=window.__objs.filter(o=>o.userData&&o.userData.P&&o.parent&&o.parent.children.length>0);
      const cust=all.filter(o=>o.children[0]&&o.children[0].userData.cust);
      for(let i=0;i<cust.length;i++){ const a=cust[i].position; if(a.y>window.__maxY)window.__maxY=a.y; for(let j=i+1;j<cust.length;j++){ const c=cust[j].position; const d=Math.hypot(a.x-c.x,a.z-c.z); if(d<window.__min) window.__min=d; } }
      all.forEach(o=>{ const q=o.position; B.forEach(b=>{ const cx=Math.max(b[0],Math.min(b[1],q.x)),cz=Math.max(b[2],Math.min(b[3],q.z)); const d=Math.hypot(q.x-cx,q.z-cz); if(d<window.__obs) window.__obs=d; }); });
    },16); });
  for (let t=0;t<14;t++){ await p.waitForTimeout(5000); console.log(t*5+5,'s', await p.textContent('.line3d')); }
  console.log('min person dist', (await p.evaluate(()=>window.__min)).toFixed(2), 'min dist to furniture', (await p.evaluate(()=>window.__obs)).toFixed(2));
  console.log('says', JSON.stringify(await p.evaluate(()=>window.__says)));
  // click reactions
  await p.evaluate(()=>{ const o=window.__objs.find(o=>o.userData&&o.userData.P&&o.parent&&o.children[0]&&o.children[0].userData.cust); window.__hit=o.children[0]; window.__tgt=o; });
  const box = await p.$eval('#stage', e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height]});
  const kinds=new Set(); let maxY=0;
  for(let i=0;i<14;i++){ const before=await p.evaluate(()=>window.__says.length); await p.mouse.click(box[0]+200, box[1]+150); await p.waitForTimeout(250); const my=await p.evaluate(()=>{ const y=window.__tgt.position.y; return y; }); 
    for(let k=0;k<12;k++){ await p.waitForTimeout(80); maxY=Math.max(maxY, await p.evaluate(()=>window.__tgt.position.y)); }
    await p.waitForTimeout(1300); const s=await p.evaluate(()=>window.__says.slice(-1)[0]); kinds.add(s); }
  console.log('click reactions seen', JSON.stringify([...kinds]), 'max y of clicked person', maxY.toFixed(2));
  console.log('ERR', errs);
  await b.close();
})();
