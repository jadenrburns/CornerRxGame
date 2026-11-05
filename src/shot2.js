const {chromium}=require('playwright');const S=process.argv[2];const which=process.argv[3];const times=process.argv[4].split(',').map(Number);
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1100,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:S+'/real/three.min.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,set:{ahead:true,ahead3:true}}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(3000);
await p.evaluate(()=>document.querySelectorAll('.tour,.unlock').forEach(e=>e.remove()));
await p.evaluate(w=>document.querySelector('[data-act="'+w+'"]').click(),which);
let t0=0;for(const t of times){await p.waitForTimeout(t-t0);t0=t;await p.screenshot({path:S+'/shots/'+which+'_'+t+'.png'})}
console.log('errs',errs);await b.close()})();
