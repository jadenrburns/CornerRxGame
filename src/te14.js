const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1000,height:700}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:12,tutDone:true,playSec:999}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(800);
await p.evaluate(()=>document.querySelector('[data-act=dev-rush]').click());
for(let i=0;i<24;i++){await p.waitForTimeout(1500);
 const r=await p.evaluate(()=>World._dbg().queue.map((c,i)=>i+':'+c.g.position.x.toFixed(1)+','+c.g.position.z.toFixed(1)+(c.idl?'*':'')+(c.wp.length?'>':'')).join(' '));
 if(i%3==2)console.log(r);}
console.log(errs);await b.close()})();
