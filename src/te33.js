const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:760,height:1100}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:'normal',gender:'n',hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:25,tutDone:true,playSec:999,cash:5000}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html');await p.waitForTimeout(1200);
const ok=await p.evaluate(()=>{const d=window.__rxDbg();const S=d.S;
  Object.keys(S.set.topics).forEach(k=>S.set.topics[k]=(k==='TOP'));
  S.set.wkTypes={bg:false,ind:false,moa:false,class:false,cn:true};S.set.ahead=true;S.set.wkOnly=false;S.set.mode='smart';
  return d.pool().length});
console.log('pool',ok);
await p.evaluate(()=>{document.querySelectorAll('.tour').forEach(e=>e.remove())});await p.waitForTimeout(500);console.log(await p.evaluate(()=>({view:window.__rxDbg().view,cur:!!window.__rxDbg().cur,opts:document.querySelectorAll('.opt').length,panel:(document.querySelector('#qpanel')||{}).className})));await p.screenshot({path:'../shot_dbg.png'});
await p.click('.opt[data-i="0"]');await p.waitForTimeout(300);await p.click('#nextbtn');await p.waitForTimeout(400);
const st=await p.evaluate(()=>{const c=window.__rxDbg().cur;return {ms:!!(c&&c.q&&c.q.ms),opts:[...document.querySelectorAll('.opt')].map(o=>o.innerText.replace(/\n/g,' ')),submit:!!document.querySelector('#msgo'),dis:document.querySelector('#msgo')&&document.querySelector('#msgo').disabled}});
console.log(JSON.stringify(st,null,1));
// select all correct ones
const idx=await p.evaluate(()=>{const c=window.__rxDbg().cur;return c.opts.map((o,i)=>o.ok?i:-1).filter(i=>i>=0)});
for(const i of idx){await p.click('.opt[data-i="'+i+'"]');}
await p.screenshot({path:'../shot_ms1.png'});
await p.click('#msgo');await p.waitForTimeout(400);
const res=await p.evaluate(()=>({head:document.querySelector('#result h3').innerText,cls:document.querySelector('#result').className,S:window.__rxDbg().S.streak,cash:window.__rxDbg().S.cash}));
console.log(res);await p.screenshot({path:'../shot_ms2.png'});
// next card: ms wrong path
await p.click('#nextbtn');await p.waitForTimeout(300);
const ms2=await p.evaluate(()=>{const c=window.__rxDbg().cur;return !!(c&&c.q&&c.q.ms)});console.log('second ms',ms2);
if(ms2){ // pick first option only
  await p.click('.opt[data-i="0"]');await p.click('#msgo');await p.waitForTimeout(300);
  console.log(await p.evaluate(()=>document.querySelector('#result').innerText.slice(0,500)));await p.screenshot({path:'../shot_ms3.png'});}
// keyboard test
await p.click('#nextbtn');await p.waitForTimeout(300);
await p.keyboard.press('1');await p.keyboard.press('2');await p.keyboard.press('Enter');await p.waitForTimeout(300);
console.log('kb done', await p.evaluate(()=>window.__rxDbg().cur.done));
console.log('errs',errs);await b.close()})();
