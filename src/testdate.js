const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const p = await b.newPage({ viewport:{width:1200,height:900} });
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:2})); });
  await p.goto('file://'+process.cwd()+'/corner-rx.html');
  await p.click('[data-act="studies"]');
  const d=new Date(Date.now()+7*864e5), f=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  await p.fill('#deckname','Future'); await p.fill('#deckdate',f);
  await p.fill('#studytext','Q: a1?\nA: x\nW: 1\nW: 2\nW: 3\n\nQ: a2?\nA: y\nW: 1\nW: 2\nW: 3\nS: 2020-01-01\n');
  await p.click('[data-act="addstudy"]'); await p.waitForTimeout(200);
  console.log((await p.textContent('.deckrow')).replace(/\s+/g,' '));
  const n=await p.evaluate(()=>__rxDbg().S.decks[0].items.map(i=>i.from)); console.log(n, 'today-eligible=1 expected');
  console.log('ERR',errs); await b.close();
})();
