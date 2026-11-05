const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const ctx = await b.newContext({ viewport:{width:390,height:844}, hasTouch:true, isMobile:true });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,lastShelve:30,cash:5,set:{topics:{TOP:true},diffs:[1,2,3],mode:'mixed',timer:true,ahead:true},up:{shelf:3,tech:2,counsel:0,library:0,robot:0}})); });
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.waitForTimeout(500);
  await p.evaluate(()=>{__rxDbg().fp.cool=Date.now()+1e10; __rxDbg().fp.nextBottle=Date.now()+1e10;});
  // restock pairs
  await p.$eval('[data-act="menu"]',e=>e.click()); await p.$eval('#menu [data-act="shelve"]',e=>e.click()); await p.waitForTimeout(300);
  console.log('pairs', JSON.stringify(await p.evaluate(()=>__rxDbg().fp.s.pairs)));
  await p.$eval('#fpleave',e=>e.click()); await p.waitForTimeout(600);
  // menu entries
  console.log('menu', JSON.stringify(await p.$$eval('#menu button span',e=>e.map(x=>x.textContent))));
  // hub tabs
  await p.$eval('[data-act="menu"]',e=>e.click()); await p.$eval('#menu [data-act="settings"]',e=>e.click()); await p.waitForTimeout(200);
  console.log('tabs', JSON.stringify(await p.$$eval('.hubtabs button',e=>e.map(x=>x.textContent+':'+x.getAttribute('aria-selected')))));
  await p.$eval('[data-act="tab-studies"]',e=>e.click()); await p.waitForTimeout(200);
  console.log('view', await p.evaluate(()=>__rxDbg().view), 'tabs2', await p.$$eval('.hubtabs button',e=>e.length));
  await p.$eval('[data-act="tab-set"]',e=>e.click()); await p.waitForTimeout(200);
  console.log('view', await p.evaluate(()=>__rxDbg().view));
  await p.screenshot({path:'f_set.png'});
  // focus on
  await p.$eval('[data-act="focus"]',e=>e.click()); await p.waitForTimeout(200);
  await p.$eval('[data-act="back"]',e=>e.click()); await p.waitForTimeout(500);
  console.log('focus body', await p.evaluate(()=>document.body.classList.contains('focus')), 'canvas display', await p.evaluate(()=>{const c=document.querySelector('#stage canvas');return c?getComputedStyle(c).display:'none-el'}), 'timer el', await p.$('#timerbar')!==null);
  const r=await p.evaluate(()=>{const e=document.querySelector('#qpanel').getBoundingClientRect();return [e.top,e.bottom,e.left,e.right]});
  console.log('qpanel rect', r);
  await p.evaluate(()=>{const d=__rxDbg(); d.fp.cool=0; d.fp.nextBottle=0;});
  await p.waitForTimeout(1500);
  console.log('fp on during focus', await p.evaluate(()=>__rxDbg().fp.on), 'rush', await p.evaluate(()=>__rxDbg().rush.on));
  // missed badge
  await p.evaluate(()=>{const d=__rxDbg();});
  await p.screenshot({path:'f_focus.png'});
  console.log('ERR',errs); await b.close();
})();
