const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const p = await b.newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:2})); });
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.waitForTimeout(500);
  const r = await p.evaluate(()=>{const d=__rxDbg(),T=d.TOPQ;const bad=T.filter(q=>q.w.length!==3||new Set(q.w.concat(q.a)).size!==4||q.w.concat(q.a).some(x=>!x)).length;
    const keys=new Set(T.map(q=>q.k)).size; const by={};T.forEach(q=>by[q.k.length]=1);
    return {n:T.length,bad,keys,pool:d.pool().filter(q=>q.c==='TOP').length,sample:[T[3],T[40],T[200]].map(q=>q.q+' => '+q.a+' | '+q.w.join(' / ')+' | '+q.t)}});
  console.log(JSON.stringify(r,null,1)); console.log('ERR',errs); await b.close();
})();
