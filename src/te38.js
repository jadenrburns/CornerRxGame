const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(900);
await p.evaluate(()=>document.querySelectorAll('.tour').forEach(e=>e.remove()));
const info=()=>p.evaluate(()=>{const d=window.__rxDbg();const w=World._dbg?World._dbg():null;return {ok:World.ok,view:d.view,name:d.cur&&d.cur.name,cat:d.cur&&d.cur.q&&d.cur.q.c,hero:d.cur&&d.cur.hero,q0him:w&&w.queue&&w.queue[0]&&!!w.queue[0].him,qlen:w&&w.queue&&w.queue.length,busy:World.himBusy&&World.himBusy(),done:d.S.himDone,bless:d.S.blessUntil>Date.now()}});
console.log('start',await info());
console.log('devbtns',await p.evaluate(()=>[...document.querySelectorAll('#menu [data-act^="dev-him"]')].map(e=>e.textContent.trim())));
// 1. walk
await p.evaluate(()=>{const d=window.__rxDbg();d.cur&&!d.cur.done&&document.querySelector('.opt')&&document.querySelector('.opt').click()});await p.waitForTimeout(300);
await p.evaluate(()=>document.querySelector('[data-act="dev-him-walk"]').click());await p.waitForTimeout(600);
console.log('walk',await info());
const legs=[];for(let i=0;i<8;i++){legs.push(await p.evaluate(()=>{const q=World._dbg().queue[0];const P=q.g.userData.P;return [+P.legs[0].rotation.x.toFixed(2),+(P.knees[0]&&P.knees[0].rotation.x||0).toFixed(2),+q.g.position.z.toFixed(1)]}));await p.waitForTimeout(120)}
console.log('legs',JSON.stringify(legs));
await p.waitForTimeout(3500);console.log('arrived',await p.evaluate(()=>{const q=World._dbg().queue[0];return [q.g.position.x.toFixed(2),q.g.position.z.toFixed(2),q.wp.length]}));
// 2. angel + smash
console.log('angel',await p.evaluate(()=>World.devHimAngel()));await p.waitForTimeout(1500);
console.log('toast',await p.evaluate(()=>[...document.querySelectorAll('.toast,#toast,.toasts *')].map(e=>e.textContent).join('|').slice(0,120)));
console.log('smash',await p.evaluate(()=>World.devHimSmash()));
for(let i=0;i<7;i++){await p.waitForTimeout(700);console.log(' t',i,JSON.stringify(await info()))}
await p.screenshot({path:'../shot_him_q.png'});
// answer correctly
await p.evaluate(()=>{const d=window.__rxDbg();const i=d.cur.opts.findIndex(o=>o.ok);document.querySelector('.opt[data-i="'+i+'"]').click()});await p.waitForTimeout(500);
console.log('answered',await info(),await p.evaluate(()=>({pill:!!document.querySelector('.buffpill.bless'),fx:[...document.querySelectorAll('.himfx')].map(e=>e.className)})));
await p.waitForTimeout(4000);
await p.evaluate(()=>document.querySelector('#nextbtn').click());await p.waitForTimeout(3500);
console.log('after next',await info());
// 3. mastery -> ascension
await p.evaluate(()=>{const d=window.__rxDbg();const hq=BANK.filter(q=>q.c==='HIM');hq.forEach((q,i)=>{d.S.mastery[q.k]={box:i===0?1:2,seen:3,ok:3}});d.S.himDone=false;d.S.blessUntil=0});
await p.evaluate(()=>{document.querySelector('[data-act="dev-him-walk"]').click()});await p.waitForTimeout(500);
let st=await p.evaluate(()=>{const d=window.__rxDbg();return d.cur&&d.cur.name+'|'+d.cur.q.c});console.log('card',st);
// force the unmastered one
await p.evaluate(()=>{const d=window.__rxDbg();const hq=BANK.filter(q=>q.c==='HIM');});
for(let k=0;k<30;k++){const r=await p.evaluate(()=>{const d=window.__rxDbg();return d.cur&&d.cur.q&&d.cur.q.c==='HIM'&&!d.cur.done&&(d.S.mastery[d.cur.q.k]||{}).box<2});if(r)break;
 await p.evaluate(()=>{const nb=document.querySelector('#nextbtn');if(nb)nb.click();else{const o=document.querySelector('.opt');o&&o.click()}});await p.waitForTimeout(250);
 await p.evaluate(()=>{document.querySelector('[data-act="dev-him-walk"]').click()});await p.waitForTimeout(250)}
console.log('pre-final',await info());
await p.waitForTimeout(2500);
await p.evaluate(()=>{const d=window.__rxDbg();const i=d.cur.opts.findIndex(o=>o.ok);document.querySelector('.opt[data-i="'+i+'"]').click()});await p.waitForTimeout(400);
console.log('final answered',await info(),'panel:',await p.evaluate(()=>document.querySelector('#counter').innerText.length));
await p.waitForTimeout(2000);console.log('asc running',await info());
await p.waitForTimeout(11000);console.log('after asc',await info());
console.log('errs',errs);await b.close()})();
