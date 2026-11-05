const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const ctx = await b.newContext({ viewport:{width:390,height:740}, hasTouch:true, isMobile:true });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:2,cash:500})); });
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.waitForTimeout(700);
  const hit = async (sel) => p.evaluate((s)=>{const e=document.querySelector(s); if(!e) return 'missing'; const r=e.getBoundingClientRect(); const x=r.left+r.width/2,y=r.top+r.height/2; const t=document.elementFromPoint(x,y); return (t&&(t===e||e.contains(t)))?'ok':('BLOCKED by '+(t?t.tagName+'.'+t.className+'#'+t.id:'none')+' @'+Math.round(x)+','+Math.round(y));},sel);
  const tap = async (sel) => { const r=await p.$eval(sel,e=>{const r=e.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]}); await p.touchscreen.tap(r[0],r[1]); await p.waitForTimeout(450); };
  const cls = ()=>p.evaluate(()=>document.body.className+' view='+__rxDbg().view);
  const open_=async()=>{ await tap('.drawerbtn'); };
  console.log('menu btn', await hit('.drawerbtn')); await open_(); console.log(' open ->', await cls());
  await tap('.drawerbtn'); console.log('tap ☰ again (hits scrim) ->', await cls());
  await open_(); await p.touchscreen.tap(60,500); await p.waitForTimeout(450); console.log('tap outside menu ->', await cls());
  await open_(); await tap('#menu .menuclose'); console.log('menu Close ->', await cls());
  await open_(); await tap('#menu [data-act="sheet-ups"]'); console.log('ups sheet ->', await cls());
  await p.touchscreen.tap(195,20); await p.waitForTimeout(450); console.log('tap dimmed area above sheet ->', await cls());
  await open_(); await tap('#menu [data-act="sheet-prog"]'); await tap('.drawerhead .btn'); console.log('sheet Close btn ->', await cls());
  await open_(); await tap('#menu [data-act="studies"]'); console.log('studies ->', await cls()); await tap('.nbclose'); await p.waitForTimeout(400); console.log(' notebook close ->', await cls());
  await open_(); await tap('#menu [data-act="settings"]'); console.log('settings ->', await cls()); await tap('#counter [data-act="back"]'); console.log(' back ->', await cls());
  await tap('#qgrab'); console.log('hide card ->', await p.$eval('#qpanel',e=>e.className+' h='+Math.round(e.getBoundingClientRect().height)));
  await tap('#qgrab'); console.log('show card ->', await p.$eval('#qpanel',e=>e.className+' h='+Math.round(e.getBoundingClientRect().height)));
  const fit=async(label)=>console.log(label, JSON.stringify(await p.evaluate(()=>{const q=document.querySelector('#qpanel'),c=document.querySelector('#counter');return {scrolls:q.scrollHeight>q.clientHeight+1,zoom:c.style.zoom||1,panelTop:Math.round(q.getBoundingClientRect().top),vh:innerHeight}})));
  await fit('question:');
  // very long question + options
  await p.evaluate(()=>{ const q=document.querySelector('.bubble p'); if(q) q.textContent='A 68-year-old patient with heart failure, atrial fibrillation and stage 3 chronic kidney disease is started on a new medication. Which of the following counseling points is most important to tell this patient before they leave the pharmacy today?'; document.querySelectorAll('.opt').forEach(o=>{o.lastElementChild.textContent+=' and also remember to take it with a full glass of water in the morning every day'}); });
  await p.evaluate(()=>window.dispatchEvent(new Event('resize'))); await p.waitForTimeout(100); await fit('long question (after resize refit):');
  // answer to see the result state
  await tap('.opt[data-i="0"]'); await p.waitForTimeout(300); await fit('after answering:');
  console.log('ERR',errs); await b.close();
})();
