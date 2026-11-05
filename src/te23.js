const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();
for(const s of [1,6,15,40]){const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(s=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:25,tutDone:true,playSec:999,streak:s,best:s}))},s);
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(900);
await p.screenshot({path:'../fire'+s+'.png',clip:{x:100,y:0,width:290,height:70}});await ctx.close();}
await b.close()})();
