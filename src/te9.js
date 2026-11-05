const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();
for(const [w,h] of [[390,844],[1000,700]]){
const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:w<500,isMobile:w<500});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text())});
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:12,tutDone:true,playSec:999}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html');await p.waitForTimeout(700);
const st=()=>p.evaluate(()=>{const d=__rxDbg();return {lab:!!d.S.lab,body:document.body.classList.contains('lab'),curLab:d.cur&&d.cur.lab,view:d.view,worldLab:World.labOn&&World.labOn(),btn:document.getElementById('lablab').textContent}});
console.log(w,'start',await st());
await p.evaluate(()=>document.querySelector('[data-act=lab]').click());await p.waitForTimeout(600);
console.log('after lab',await st());
console.log('has tools',!!(await p.$('#labexpr')),'timerbar',!!(await p.$('#timerbar')),'label',await p.$eval('.rx-meta b',e=>e.textContent));
console.log('q',await p.$eval('.bubble p',e=>e.textContent));
await p.fill('#labexpr','100*e^(-0.1*8)');console.log('out',await p.$eval('#labout',e=>e.textContent));
await p.click('[data-act=lab-ins][data-v="ln("]');console.log('expr after ins',await p.$eval('#labexpr',e=>e.value));
await p.click('[data-act=lab-clr]');await p.fill('#labnotes','C=C0 e^-kt');
// answer: choose a correct option via debug
const idx=await p.evaluate(()=>__rxDbg().cur.opts.findIndex(o=>o.ok));
const cash0=await p.evaluate(()=>__rxDbg().S.cash);
await p.keyboard.press('Escape');
await p.evaluate(i=>document.querySelectorAll('.opt')[i].click(),idx);await p.waitForTimeout(300);
console.log('result',await p.$eval('.result h3',e=>e.textContent),'| pay',await p.$eval('.pay',e=>e.textContent.slice(0,120)),'| cash +',(await p.evaluate(()=>__rxDbg().S.cash))-cash0);
console.log('solution',(await p.$eval('.why',e=>e.textContent)).slice(0,100),'next btn',await p.$eval('#nextbtn',e=>e.textContent));
await p.screenshot({path:'lab_q_'+w+'.png'});
await p.click('#nextbtn');await p.waitForTimeout(200);console.log('next lab q?',await p.evaluate(()=>!!__rxDbg().cur.lab));
// toggling kinds
await p.evaluate(()=>document.querySelector('[data-act=settings]').click());await p.waitForTimeout(200);
console.log('settings has labk',!!(await p.$('[data-act=labk]')));
await p.evaluate(()=>document.querySelector('[data-act=back]')&&document.querySelector('[data-act=back]').click());
await p.evaluate(()=>document.querySelector('[data-act=lab]').click());await p.waitForTimeout(500);
console.log('back',await st());
await p.evaluate(()=>document.querySelector('[data-act=lab]').click());await p.waitForTimeout(300);
await p.reload();await p.waitForTimeout(700);console.log('reload persists lab',await st());
console.log('errs',errs);await ctx.close();}
await b.close()})();
