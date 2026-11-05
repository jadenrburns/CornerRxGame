const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/TUNNEL/.test(m.text()))errs.push('console:'+m.text())});
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:80,tutDone:true,playSec:999,cash:500,acc:3,accEarned:3,cosm:['tophat','monocle','beard'],cosmOn:{extra:'monocle',hat:'tophat'},vial:[{k:'c',c:'#E04F3A',c2:'#F4F4F0',s:'two'}]}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(900);
await p.evaluate(()=>document.querySelector('[data-act=menu]').click());await p.waitForTimeout(150);
await p.evaluate(()=>document.querySelector('[data-act=create]').click());await p.waitForTimeout(300);
console.log('rows',await p.$$eval('.crow',e=>e.map(r=>r.querySelector('.clab').textContent+'='+r.querySelector('.cval span').textContent)));
console.log('spec',await p.evaluate(()=>JSON.stringify(__rxDbg().S.cosmOn)));
// cycle hat forward and glasses
await p.click('.crow[data-k=eyes] [data-d="1"]');await p.click('.crow[data-k=eyes] [data-d="1"]');await p.click('.crow[data-k=shoes] [data-d="1"]');await p.click('.crow[data-k=shirt] [data-d="-1"]');
console.log('after',await p.evaluate(()=>[JSON.stringify(__rxDbg().S.cosmOn),__rxDbg().S.me.shoes,__rxDbg().S.me.shirt]), await p.$eval('.crow[data-k=eyes] .cval span',e=>e.textContent));
console.log('focus kept',await p.evaluate(()=>document.activeElement.getAttribute('data-k')+document.activeElement.getAttribute('data-d')));
await p.screenshot({path:'t29-char.png'});
// pills/capsule with icons (stub no render => emoji)
await p.evaluate(()=>document.querySelector('[data-act=back]')&&document.querySelector('[data-act=back]').click());await p.waitForTimeout(200);
console.log('cal/layout world ok',await p.evaluate(()=>World.ok));
console.log('errs',errs);await b.close()})();
