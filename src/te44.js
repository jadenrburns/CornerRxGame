const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,cash:100,hintsLeft:3,up:{shelf:1,library:2}}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?noconf=1');await p.waitForTimeout(900);
await p.evaluate(()=>document.querySelectorAll('.tour').forEach(e=>e.remove()));
const D=()=>p.evaluate(()=>{const d=window.__rxDbg();return {cash:d.S.cash,pw:d.S.pw,up:d.S.up,hl:d.S.hintsLeft}});
console.log('migrated',JSON.stringify(await D()));
await p.evaluate(()=>{const d=window.__rxDbg();d.S.cash=2000;});
// shop
await p.evaluate(()=>{const e=document.querySelector('[data-act="pwshop"]');});
await p.evaluate(()=>{document.querySelector('[data-act="settings"]');});
console.log('btns',await p.$$eval('#hintbtn,#secbtn,#bindbtn',e=>e.map(x=>x.innerText+(x.disabled?'(dis)':''))));
// buy via actions
await p.evaluate(()=>{const d=window.__rxDbg();});
const buy=async(id)=>{await p.evaluate((id)=>{const d=window.__rxDbg();document.body.insertAdjacentHTML('beforeend','<button id="tb" data-act="shop-buy" data-k="pow" data-id="'+id+'"></button>');document.getElementById('tb').click();document.getElementById('tb').remove();},id)};
await buy('second');await buy('binder');await buy('hint');
console.log('after buy',JSON.stringify(await D()));
await p.evaluate(()=>window.__rxDbg().S.set.topics=Object.fromEntries(Object.keys(window.__rxDbg().S.set.topics).map(k=>[k,true])));
// get a fresh single-answer card
for(let i=0;i<12;i++){const r=await p.evaluate(()=>{const d=window.__rxDbg();if(!d.cur||!d.cur.q){const n=document.querySelector('#nextbtn');n&&n.click();return 0}if(window.__first&&d.cur&&!d.cur.done&&!d.cur.q.ms)return 1;window.__first=1;if(d.cur.done){document.querySelector('#nextbtn').click();return 0}if(d.cur.q.ms){return 2}const i=d.cur.opts.findIndex(o=>o.ok&&!o.gone);document.querySelector('.opt[data-i="'+i+'"]').click();return 0});if(r===1)break;if(r===2){await p.evaluate(()=>{const d=window.__rxDbg();d.cur.opts.forEach((o,i)=>{if(o.ok)d.cur.sel[i]=true});document.querySelector('#msgo')&&(document.querySelector('#msgo').disabled=false);document.querySelector('#msgo').click()});}await p.waitForTimeout(400)}
console.log('state',JSON.stringify(await p.evaluate(()=>{const d=window.__rxDbg();return {done:d.cur.done,ms:!!d.cur.q.ms,pw:d.S.pw,btn:document.querySelector('#bindbtn').outerHTML}})));
// binder
await p.click('#bindbtn');console.log('binder box',await p.$$eval('.binderbox',e=>e.map(x=>x.innerText.replace(/\n/g,' | '))));
// hint
await p.click('#hintbtn');console.log('options left',await p.$$eval('.opt:not(.gone)',e=>e.length));
// second chance: arm then answer wrong
await p.evaluate(()=>{const d=window.__rxDbg();d.S.pw.second=1;});
await p.evaluate(()=>{document.querySelector('#secbtn').disabled=false});
await p.click('#secbtn');
const st0=await p.evaluate(()=>{const d=window.__rxDbg();return {streak:d.S.streak,rep:d.S.rep,wrong:d.S.wrong,ms:!!d.cur.q.ms}});
const wi=await p.evaluate(()=>{const d=window.__rxDbg();return d.cur.opts.findIndex(o=>!o.ok&&!o.gone)});
if(!st0.ms){await p.click('.opt[data-i="'+wi+'"]');await p.waitForTimeout(300);
console.log('after wrong with 2nd chance',JSON.stringify(await p.evaluate(()=>{const d=window.__rxDbg();return {done:d.cur.done,secUsed:d.cur.secUsed,second:d.S.pw.second,streak:d.S.streak,wrong:d.S.wrong}})),JSON.stringify(st0));
const ri=await p.evaluate(()=>{const d=window.__rxDbg();return d.cur.opts.findIndex(o=>o.ok)});
await p.click('.opt[data-i="'+ri+'"]');await p.waitForTimeout(300);
console.log('final',JSON.stringify(await p.evaluate(()=>{const d=window.__rxDbg();return {done:d.cur.done,ok:d.cur.ok,streak:d.S.streak,wrong:d.S.wrong,missedHas:d.S.missed.indexOf(d.cur.q.k)>=0}})),await p.$$eval('.pay span',e=>e.map(x=>x.innerText).join(' ; ')));}
else console.log('ms question, skip');
console.log('errs',errs);await b.close()})();
