const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:25,tutDone:true,playSec:999,streak:20,best:20}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(900);
console.log(await p.evaluate(()=>{let e=document.querySelector('.stat.fire'),out=[];while(e&&e!==document.body){const c=getComputedStyle(e);out.push(e.className+':'+c.overflow+'/'+c.overflowX+' clip:'+c.clipPath);e=e.parentElement}const b=getComputedStyle(document.querySelector('.stat.fire'),'::before');out.push('before '+b.width+' '+b.height+' '+b.opacity+' '+b.display+' z'+b.zIndex+' bg '+b.backgroundImage.slice(0,40));return out.join('\n')}));
await b.close()})();
