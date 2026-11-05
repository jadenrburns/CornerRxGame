const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const p = await b.newPage({ viewport:{width:1200,height:900} });
  p.on('pageerror', e => errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.addInitScript(()=>{ const r=Math.random; Math.random=function(){ return r()*0.3; }; localStorage.setItem('cornerRx.v1', JSON.stringify({cash:5000,correct:30,served:0,karenCd:999,sweatyCd:999,up:{shelf:1,tech:3,counsel:0,library:0,robot:0}})); });
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.waitForTimeout(40000);
  const info = await p.evaluate(()=>{ const res={}; window.__objs.filter(o=>o.userData&&o.userData.P&&o.parent).forEach(o=>{ const sc=o.children.filter(c=>c.scale&&c.scale.x!==1||c.children&&c.children.length).length; res[o.userData.P.waddle?'obese':'other']=(res[o.userData.P.waddle?'obese':'other']||0)+1; }); return res; });
  console.log(JSON.stringify(info), 'ERR', errs);
  await b.close();
})();
