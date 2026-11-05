const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text())});
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:12,tutDone:true,playSec:999,cash:50,up:{shelf:1,tech:0,counsel:0,library:0,robot:0}}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(600);
const click=async(sel)=>p.$eval(sel,e=>e.click());
const menu=async()=>click('[data-act="menu"]');
const dbg=(f)=>p.evaluate(f);
async function startEvt(act){await menu();await click('[data-act="'+act+'"]');await menu();await click('[data-act="dev-next"]');await p.waitForTimeout(300);}
async function answer(ok){const i=await p.evaluate(ok=>__rxDbg().cur.opts.findIndex(o=>ok?o.ok:!o.ok),ok);await click('[data-i="'+i+'"]');await p.waitForTimeout(250);}
// inspector
await startEvt('dev-insp');
console.log('insp label',await p.$eval('.rx-meta b',e=>e.textContent), await p.$('.rx.evt-inspector')!==null);
await p.screenshot({path:'v1.png'});
await answer(true);await click('#nextbtn');await p.waitForTimeout(200);
console.log('insp 2', await p.$eval('.rx-meta b',e=>e.textContent));
await answer(false);console.log('whynot?',await p.$eval('.whynot',e=>e.textContent).catch(()=>'none'),'| why:',await p.$eval('.why',e=>e.textContent.slice(0,60)).catch(()=>'none'));
await click('#nextbtn');await p.waitForTimeout(200);
await answer(true);
console.log('verdict',await p.$$eval('.gift',e=>e.map(x=>x.textContent.slice(0,70))));
await p.screenshot({path:'v2.png'});
await click('#nextbtn');await p.waitForTimeout(200);
// mumble
await startEvt('dev-mumble');
console.log('mumble',await p.$eval('.rx-meta b',e=>e.textContent),'|',await p.$eval('.bubble p',e=>e.textContent));
await answer(false);console.log('mumble whynot',await p.$eval('.whynot',e=>e.textContent).catch(()=>'none'),await p.$$eval('.gift',e=>e.map(x=>x.textContent.slice(0,50))));
await click('#nextbtn');await p.waitForTimeout(200);
// driver
await startEvt('dev-driver');
console.log('driver',await p.$eval('.rx-meta b',e=>e.textContent),'|',await p.$eval('.bubble p',e=>e.textContent));
const h0=await dbg(()=>__rxDbg().S.hintsLeft);await answer(true);console.log('hints',h0,await dbg(()=>__rxDbg().S.hintsLeft),await p.$$eval('.gift',e=>e.map(x=>x.textContent.slice(0,50))));
await p.screenshot({path:'v3.png'});
// streak + shift
await dbg(()=>{const S=__rxDbg().S;S.streak=4;S.shift={n:9,ok:8,earned:200,best:6}});
await click('#nextbtn');await p.waitForTimeout(200);
await answer(true);
console.log('streak gift',await p.$$eval('.gift',e=>e.map(x=>x.textContent.slice(0,60))));
await click('#nextbtn');await p.waitForTimeout(300);
console.log('view',await dbg(()=>__rxDbg().view),await p.$eval('.shiftpane h3',e=>e.textContent).catch(()=>'none'));
await p.screenshot({path:'v4.png'});
await click('[data-act="shift-next"]');await p.waitForTimeout(300);
console.log('after shift view',await dbg(()=>__rxDbg().view));
// flashcards
await menu();await click('[data-act="flash"]');await p.waitForTimeout(200);
console.log('flash chips',await p.$$eval('.fcchips .chip',e=>e.length),await p.$('.fcard')!==null);
await p.screenshot({path:'v5.png'});
for(const cat of ['fb','fc','fm']){await click('[data-act="fc-cat"][data-v="'+cat+'"]');for(let i=0;i<120;i++){ if(await p.$('[data-act="fc-flip"]')) await click('[data-act="fc-flip"]').catch(()=>{}); await click('[data-act="fc-got"]').catch(()=>{});}}
console.log('pool cards seen',await dbg(()=>Object.keys(__rxDbg().S.flash).length),'mastered',await dbg(()=>Object.values(__rxDbg().S.flash).filter(m=>m.b>=2).length));
console.log('flash aw',await dbg(()=>JSON.stringify(__rxDbg().S.flashAw)),'n',await dbg(()=>__rxDbg().S.flashN),'pets',await dbg(()=>JSON.stringify(__rxDbg().S.awards.pets)));
await p.screenshot({path:'v6.png'});
// share
await menu();await click('[data-act="awards"]');await p.waitForTimeout(200);
await click('[data-act="share"]');await p.waitForTimeout(800);
console.log('share img',await p.$('#sharepv')!==null);
const src=await p.$eval('#sharepv',e=>e.src).catch(()=>null);
if(src){const buf=await p.evaluate(async u=>{const r=await fetch(u);const a=new Uint8Array(await r.arrayBuffer());let s='';a.forEach(x=>s+=String.fromCharCode(x));return btoa(s)},src);fs.writeFileSync('share.png',Buffer.from(buf,'base64'));}
// sfx
await menu();await click('#sfxbtn');console.log('sfx',await dbg(()=>__rxDbg().S.sfx),await p.$eval('#sfxlab',e=>e.textContent));
console.log(errs);await b.close()})();
