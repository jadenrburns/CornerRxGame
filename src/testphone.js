const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const p = await b.newPage({ viewport:{width:1200,height:900} });
  p.on('pageerror', e => errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},cash:0,correct:30,served:20,karenCd:999,sweatyCd:999,up:{shelf:1,tech:0,counsel:0,library:0,robot:0}})); });
  await p.clock.install();
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.clock.runFor(500);
  const vis=()=>p.$eval('#phonebtn',e=>!e.hidden);
  async function until(ms){ for(let t=0;t<ms;t+=1000){ await p.clock.runFor(1000); if(await vis()) return t; } return -1; }
  console.log('first ring after ~s', await until(130000));
  console.log('btn text', await p.textContent('#phonebtn'));
  console.log('say bubbles', await p.$$eval('.say3d',e=>e.map(x=>x.textContent)));
  await p.$eval('#phonebtn',e=>e.click());
  console.log('view', await p.textContent('.rx-meta b'), '|', (await p.textContent('.rx-meta span')));
  const before=await p.evaluate(()=>JSON.parse(localStorage.getItem('cornerRx.v1')||'{}').rep);
  for(let i=0;i<4;i++){ await p.click(`.opt[data-ph="${i}"]`); if(await p.$('.opt.ok.bad,.result.good')) break; break; }
  console.log('result', (await p.textContent('#result')).replace(/\s+/g,' ').slice(0,160));
  await p.click('#hangbtn'); console.log('back at card', await p.textContent('.rx-meta b'));
  // missed call
  console.log('second ring after ~s', await until(230000));
  await p.clock.runFor(17000);
  console.log('toast', await p.textContent('#toast3d'), '| btn hidden', !(await vis()));
  console.log('says', await p.$$eval('.say3d',e=>e.map(x=>x.textContent)));
  // answer current patient then check the next one is the caller karen
  const n=await p.$$('.opt:not([disabled])'); await n[0].click(); await p.click('#nextbtn'); await p.clock.runFor(300);
  console.log('next patient', await p.textContent('.rx-meta b'), '|', (await p.textContent('.bubble em')));
  console.log('ERR', errs);
  await b.close();
})();
