const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:420,height:900},hasTouch:false});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:40,correct:25,tutDone:true,playSec:999,set:{topics:{TH3:false}}}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?noconf=1');await p.waitForTimeout(900);
await p.evaluate(()=>document.querySelectorAll('.tour').forEach(e=>e.remove()));
// migration: TH3 off => new TH3F/TH3C off too
console.log('topics',await p.evaluate(()=>{const t=window.__rxDbg().S.set.topics;return JSON.stringify({TH3:t.TH3,TH3F:t.TH3F,TH3C:t.TH3C})}));
const cats=await p.evaluate(()=>{const c={};BANK.forEach(q=>{if(/^TH3/.test(q.c))c[q.c]=(c[q.c]||0)+1});return c});console.log('cats',JSON.stringify(cats));
const run=async(hq,mode)=>{ // force the draw question as the current card
 await p.evaluate((hq)=>{const d=window.__rxDbg();const q=BANK.find(x=>x.draw===hq);d.S.set.topics.TH3C=true;d.S.set.mode='new';window.__force=q},hq);
};
for(const h of ['LH','FSH','E2','P4']){
 await p.evaluate((h)=>{const d=window.__rxDbg();const q=BANK.find(x=>x.draw===h);d.S.set.focus=true;d.S.set.topics={};for(const k in d.S.set.topics)d.S.set.topics[k]=false;d.S.set.topics.TH3C=true;
   BANK.filter(x=>x.draw).forEach(x=>{delete d.S.mastery[x.k]});const all=BANK.filter(x=>x.c==='TH3C'&&!x.draw);all.forEach(x=>{d.S.mastery[x.k]={box:3,seen:3,ok:3,n:5,d:30,ef:2.5,due:Date.now()+9e9,lt:Date.now()}});
   BANK.filter(x=>x.draw&&x.draw!==h).forEach(x=>{d.S.mastery[x.k]={box:3,seen:3,ok:3,n:5,d:30,ef:2.5,due:Date.now()+9e9,lt:Date.now()}});d.S.set.mode='new';d.nc()},h);
 await p.waitForTimeout(300);
 const cur=await p.evaluate(()=>{const c=window.__rxDbg().cur;return c&&c.q?c.q.draw:'none'});
 if(cur!==h){console.log(h,'card is',cur,await p.evaluate(()=>{const d=window.__rxDbg();return JSON.stringify({empty:d.cur&&d.cur.empty,view:d.view,pool:d.pool().length,mode:d.S.set.mode,q:d.cur&&d.cur.q&&d.cur.q.q.slice(0,50),shift:!!document.querySelector('.shift')})}));continue}
 console.log(h,'svg',await p.$$eval('#cycsvg',e=>e.length),'submit disabled',await p.$eval('#drawgo',e=>e.disabled));
 // draw the true curve with mouse
 const box=await p.$eval('#cycsvg',e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}});
 const pts=await p.evaluate((h)=>{const a=[];for(let d=1;d<=28;d+=.5)a.push([d,cycVal(h,d)]);return a},h);
 const sx=d=>box.x+(34+(d-1)/27*316)/360*box.w, sy=v=>box.y+(170-v*158)/222*box.h;
 await p.mouse.move(sx(pts[0][0]),sy(pts[0][1]));await p.mouse.down();for(const q of pts)await p.mouse.move(sx(q[0]),sy(q[1]));await p.mouse.up();
 console.log(' pts drawn',await p.evaluate(()=>window.__rxDbg().cur.dpts.length),'go enabled',!(await p.$eval('#drawgo',e=>e.disabled)));
 await p.click('#drawgo');await p.waitForTimeout(300);
 console.log(' result',await p.evaluate(()=>{const c=window.__rxDbg().cur;return JSON.stringify({ok:c.ok,done:c.done,sc:c.dscore&&c.dscore.reason})}),'true path',await p.$$eval('.cytrue',e=>e.length),'head',await p.$eval('#result h3',e=>e.textContent));
 // next card cleanup
 await p.evaluate(()=>{document.querySelector('#nextbtn')&&document.querySelector('#nextbtn').click()});await p.waitForTimeout(150);
}
// wrong drawing: flat line at midpoint for LH -> fail
await p.evaluate(()=>{const d=window.__rxDbg();BANK.filter(x=>x.draw).forEach(x=>{delete d.S.mastery[x.k]});d.S.set.mode='new';BANK.filter(x=>x.draw&&x.draw!=='LH').forEach(x=>{d.S.mastery[x.k]={box:3,seen:3,ok:3,n:5,d:30,ef:2.5,due:Date.now()+9e9,lt:Date.now()}});const keep=BANK.find(x=>x.draw==='LH');BANK.filter(x=>x.c==='TH3C'&&x!==keep).forEach(x=>{d.S.mastery[x.k]={box:3,seen:3,ok:3,n:5,d:30,ef:2.5,due:Date.now()+9e9,lt:Date.now()}});d.nc()});await p.waitForTimeout(300);
const box=await p.$eval('#cycsvg',e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}});
const sx=d=>box.x+(34+(d-1)/27*316)/360*box.w, sy=v=>box.y+(170-v*158)/222*box.h;
await p.mouse.move(sx(1),sy(.5));await p.mouse.down();for(let d=1;d<=28;d+=.5)await p.mouse.move(sx(d),sy(.5));await p.mouse.up();
await p.click('#drawgo');await p.waitForTimeout(200);
console.log('flat -> still undone?',await p.evaluate(()=>!window.__rxDbg().cur.done),'note',await p.$eval('.drawnote',e=>e.textContent));
await p.click('#drawclr');await p.waitForTimeout(100);
await p.mouse.move(sx(1),sy(.9));await p.mouse.down();for(let d=1;d<=28;d+=.5)await p.mouse.move(sx(d),sy(d<20?.9-d/40:.2));await p.mouse.up();
await p.click('#drawgo');await p.waitForTimeout(300);
console.log('wrong -> ok',await p.evaluate(()=>window.__rxDbg().cur.ok),'head',await p.$eval('#result h3',e=>e.textContent),'answer shown',await p.$eval('#result',e=>/Answer/.test(e.textContent)));
await p.keyboard.press('1');
await b.close();console.log('errs',JSON.stringify(errs));})();
