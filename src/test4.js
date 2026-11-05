const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  async function mk(w,h,stub,seed){
    const p = await b.newPage({ viewport:{width:w,height:h} });
    p.on('pageerror', e => errs.push((stub?'stub ':'flat ')+'pageerror: '+e.message+' | '+(e.stack||'').split('\n').slice(1,3).join(' ')));
    p.on('console', m => { if (m.type()==='error' && !/ERR_TUNNEL|Failed to load resource/.test(m.text())) errs.push('console: '+m.text()); });
    if (stub) await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub.js','utf8') }));
    await p.addInitScript((s)=>{ localStorage.setItem('cornerRx.v1', JSON.stringify(s)); }, seed);
    await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.waitForTimeout(500); return p;
  }
  const seed={cash:900,correct:30,served:20,up:{shelf:3,tech:2,counsel:0,library:1,robot:0}};
  for (const stub of [true,false]) {
    const p = await mk(1200,900,stub,seed);
    console.log(stub?'STUB':'FLAT','panel text:', (await p.textContent('.qbar')).replace(/\s+/g,' ').trim());
    // settings
    await p.click('.qset'); await p.waitForSelector('.pane');
    await p.click('[data-act="topic"][data-v="BG"]'); await p.click('[data-act="diff"][data-v="1"]'); await p.click('[data-act="mode"][data-v="even"]');
    console.log('count', await p.textContent('.count'), '| summary', (await p.textContent('.qset')).trim());
    await p.click('[data-act="back"]'); await p.waitForSelector('.rx');
    // studies
    await p.click('[data-act="studies"]'); await p.waitForSelector('#studytext');
    await p.click('[data-act="template"]');
    await p.fill('#deckname','Test deck'); await p.click('[data-act="preview"]');
    console.log('preview', (await p.textContent('#studyprev')).replace(/\s+/g,' ').slice(0,140));
    await p.click('[data-act="addstudy"]');
    console.log('deck rows', await p.$$eval('.deckrow', r=>r.map(x=>x.textContent.replace(/\s+/g,' ').trim().slice(0,50))));
    await p.fill('#studytext','Quick one | answer one\nQuick two | answer two\nQuick three | answer three\nQuick four | answer four\nbogus');
    await p.click('[data-act="preview"]'); console.log('quick preview', (await p.textContent('#studyprev')).replace(/\s+/g,' ').slice(0,200));
    await p.click('[data-act="addstudy"]');
    // MY topic only
    await p.click('[data-act="settings"]'); await p.click('[data-act="topics-none"]'); await p.click('[data-act="topic"][data-v="MY"]'); await p.click('[data-act="diff"][data-v="1"]'); await p.click('[data-act="mode"][data-v="mixed"]');
    console.log('count2', await p.textContent('.count'));
    await p.click('[data-act="back"]'); await p.waitForSelector('.rx');
    console.log('card label', await p.textContent('.rx-meta b'));
    // force a karen: monkey-patch Math.random? use answer wrong repeatedly; instead set served and force via evaluate not possible (closure). Use random cycling.
    let sawKaren=false;
    for (let i=0;i<60;i++){
      const lab = await p.textContent('.rx-meta b'); if (/KAREN/.test(lab)) { sawKaren=true; break; }
      const o = await p.$('.opt:not([disabled])'); if(!o) break; await o.click(); await p.click('#nextbtn');
    }
    console.log('saw karen (non-stub may need 3D queue):', sawKaren);
    await p.screenshot({ path: (stub?'stub':'flat')+'.png', fullPage:false });
    await p.close();
  }
  // Karen test in flat mode: stub Math.random for roll
  const p = await mk(900,900,false,{cash:0,correct:30,served:20,karenCd:0,up:{shelf:3,tech:2,counsel:0,library:0,robot:0},set:{topics:{BG:true,CL:true},diffs:[1,2,3],mode:'mixed',timer:true}});
  await p.evaluate(()=>{ const r=Math.random; let n=0; Math.random=function(){ return 0.01; }; });
  await p.click('#nextbtn').catch(()=>{});
  for (let i=0;i<4;i++){ const o=await p.$('.opt:not([disabled])'); if(o){ await o.click(); } const nb=await p.$('#nextbtn'); if(nb) await nb.click(); }
  const lab = await p.textContent('.rx-meta b'); console.log('label now', lab);
  if (/KAREN/.test(lab)) {
    const before = await p.evaluate(()=>JSON.parse(localStorage.getItem('cornerRx.v1')).up);
    // answer wrong: find wrong option by evaluating - click all until result says refund
    const opts = await p.$$('.opt'); let lost=false;
    for (const o of opts){ if (await o.isDisabled()) continue; await o.click(); const t=await p.textContent('.result h3'); if(/refund/i.test(t)){ lost=true; console.log('result:', (await p.textContent('.result')).replace(/\s+/g,' ').slice(0,200)); break;} else { console.log('(correct pick) ', t); break; } }
    await p.waitForTimeout(500);
    console.log('before', JSON.stringify(before), 'after', JSON.stringify(await p.evaluate(()=>JSON.parse(localStorage.getItem('cornerRx.v1')).up)));
  }
  console.log('ERRORS', JSON.stringify(errs,null,1));
  await b.close();
})();
