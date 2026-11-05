const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:700}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text())});
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:25,tutDone:true,playSec:999,cash:500,vial:[{k:'t',c:'#4C7BD9',c2:'',s:'disc'},{k:'c',c:'#E04F3A',c2:'#F4F4F0',s:'two'},{k:'c',c:'#F2A516',c2:'',s:'gel'},{k:'t',c:'#2FAE66',c2:'',s:'caplet'}]}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(900);
console.log('world ok',await p.evaluate(()=>typeof World!=='undefined'?World.ok:'nw'), 'vial badge',await p.$eval('#vialbtn .vcount',e=>e.textContent+'/'+e.hidden));
console.log('devPill',await p.evaluate(()=>{try{return [World.devPill('t'),World.devPill('c'),World.pillCount()]}catch(e){return String(e)}}));
await p.waitForTimeout(1600);
console.log('click pill',await p.evaluate(()=>{try{return [World._pillClick(),__rxDbg().S.vial.length,World.pillCount()]}catch(e){return String(e)}}));
await p.screenshot({path:'t28-bar.png',clip:{x:0,y:0,width:1000,height:90}});
// vial dialog
await p.click('#vialbtn');await p.waitForTimeout(200);
await p.screenshot({path:'t28-vial.png'});
await p.click('.vpill >> nth=0');await p.waitForTimeout(150);
console.log('desc',await p.$eval('.vdesc',e=>e.textContent.slice(0,60)));
await p.click('[data-take]');await p.waitForTimeout(300);
console.log('buff',await p.evaluate(()=>[__rxDbg().buffOn(),document.body.classList.contains('trip'),document.querySelector('.buffpill')&&document.querySelector('.buffpill').textContent]));
await p.screenshot({path:'t28-trip.png'});
// answer correctly during buff
await p.evaluate(()=>{const d=__rxDbg();document.querySelectorAll('.opt')[d.cur.opts.findIndex(o=>o.ok)].click()});await p.waitForTimeout(200);
console.log('pay chips',await p.$$eval('.result .chips span, .chips span',e=>e.slice(0,4).map(x=>x.textContent)));
// capsule
await p.click('#vialbtn');await p.waitForTimeout(150);
await p.click('.vpill >> nth=0');await p.click('[data-take]');
await p.waitForTimeout(500);await p.screenshot({path:'t28-cap1.png'});
await p.waitForSelector('#cdone:not([disabled])',{timeout:9000});
console.log('result',await p.$eval('#cname',e=>e.textContent));
await p.screenshot({path:'t28-cap2.png'});
console.log('state',await p.evaluate(()=>{const S=__rxDbg().S;return [S.cosm,S.cosmOn,S.vial.length]}));
await p.click('#cdone');await p.waitForTimeout(200);
// character screen
await p.evaluate(()=>document.querySelector('[data-act=menu]').click());await p.waitForTimeout(150);
await p.evaluate(()=>document.querySelector('[data-act=create]').click());await p.waitForTimeout(250);
console.log('cosm chips',await p.$$eval('[data-act=cosm]',e=>e.map(x=>x.textContent)));
await p.screenshot({path:'t28-char.png'});
// all capsule cycle test: take remaining capsule(s)
console.log('errs',errs);await b.close()})();
