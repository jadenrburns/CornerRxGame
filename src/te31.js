const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:900}});
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.goto('file://'+process.cwd()+'/corner-rx.html');await p.waitForTimeout(1200);
await p.evaluate(()=>{const b=document.querySelector('[data-act=settings]');b&&b.click()});await p.waitForTimeout(500);
console.log(await p.evaluate(()=>[...document.querySelectorAll('.subgrp')].map(g=>g.querySelector('.subh').textContent+': '+[...g.querySelectorAll('.cn')].map(x=>x.textContent.trim()).join(' | '))));
await p.screenshot({path:'th.png'});await b.close()})();
