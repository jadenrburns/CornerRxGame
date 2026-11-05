const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:12,tutDone:true,playSec:999,cash:50,up:{shelf:1,tech:0,counsel:0,library:0,robot:0}}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(600);
console.log('dev btns', await p.$$eval('#menu [data-act^="dev-"]',e=>e.length));
await p.$eval('[data-act="menu"]',e=>e.click());await p.$eval('[data-act="dev-elder"]',e=>e.click());await p.waitForTimeout(200);
await p.$eval('[data-act="menu"]',e=>e.click());await p.$eval('[data-act="dev-next"]',e=>e.click());await p.waitForTimeout(400);
console.log('elder', await p.evaluate(()=>{const c=__rxDbg;return null}), await p.$('.rx.elder')!==null);
await p.screenshot({path:'e1.png'});
await p.$eval('[data-elder="1"]',e=>e.click());await p.waitForTimeout(500);
console.log('confused', await p.$eval('.rx.elder .bubble p',e=>e.textContent), await p.$('.cmarks')!==null);
await p.screenshot({path:'e2.png'});
await p.waitForTimeout(2300);
console.log('stage2', await p.$eval('.rx .bubble em',e=>e.textContent), await p.$$eval('.opt',e=>e.length));
await p.screenshot({path:'e3.png'});
for(const mode of ['right','wrong']){
if(mode==='wrong'){await p.$eval('[data-act="menu"]',e=>e.click());await p.$eval('[data-act="dev-elder"]',e=>e.click());await p.$eval('[data-act="menu"]',e=>e.click());await p.$eval('[data-act="dev-next"]',e=>e.click());await p.waitForTimeout(300);await p.$eval('[data-elder="0"]',e=>e.click());await p.waitForTimeout(2800);}
const before=await p.evaluate(()=>JSON.stringify(__rxDbg().S.up));
const idx=await p.evaluate(m=>{const c=__rxDbg().cur;return c.opts.findIndex(o=>m==='right'?o.ok:!o.ok)},mode);
await p.$eval('[data-i="'+idx+'"]',e=>e.click());await p.waitForTimeout(500);
console.log(mode,before,await p.evaluate(()=>JSON.stringify(__rxDbg().S.up)),await p.$eval('.gift',e=>e.textContent).catch(()=>'nogift'));
await p.screenshot({path:'e4'+mode+'.png'});}
console.log(errs);await b.close()})();
