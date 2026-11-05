const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h] of [[390,844],[1000,700]]){for(const s of [9,10,22,40]){const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(s=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:25,tutDone:true,playSec:999,streak:s,best:s}))},s);
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(1500);
await p.screenshot({path:'../g'+w+'_'+s+'.png',clip:{x:0,y:0,width:w,height:110}});await ctx.close();}}
console.log('errs',errs);await b.close()})();
