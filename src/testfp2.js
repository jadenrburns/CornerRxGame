const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const ctx = await b.newContext({ viewport:{width:390,height:844}, hasTouch:true, isMobile:true });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:8})); });
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.waitForTimeout(600);
  const c=async s=>p.$eval(s,e=>e.click());
  // panel fit
  const m=await p.evaluate(()=>{const q=document.querySelector('#qpanel');return {sh:q.scrollHeight,ch:q.clientHeight,top:Math.round(q.getBoundingClientRect().top)}});
  console.log('panel scroll needed:', m.sh>m.ch+1, JSON.stringify(m));
  console.log('avatar img:', await p.$$eval('#counter img.avatar',e=>e.length), 'svg fallback:', await p.$$eval('#counter svg.avatar',e=>e.length));
  // shelve tip
  await c('.drawerbtn'); await c('#menu [data-act="shelve"]'); await p.waitForTimeout(500);
  console.log('tip class:', await p.$eval('#fpq',e=>e.className), 'leave visible:', await p.$eval('#fpleave',e=>getComputedStyle(e).display));
  await c('#fpq'); await p.waitForTimeout(100); console.log('flying:', await p.$eval('#fpq',e=>e.className)); await p.waitForTimeout(600);
  console.log('mini:', await p.$eval('#fpq',e=>e.className+' | '+e.textContent));
  await c('#fpleave'); await p.waitForTimeout(300); console.log('after leave view:', await p.evaluate(()=>__rxDbg().view), 'fp.on', await p.evaluate(()=>__rxDbg().fp.on));
  // bottle wrong -> X
  await p.evaluate(()=>{__rxDbg().fp.cool=0}); 
  await p.evaluate(()=>{ window.__startB && window.__startB(); });
  console.log('ERR',errs); await b.close();
})();
