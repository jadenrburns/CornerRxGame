const {chromium}=require('playwright');const S=process.argv[2];const which=process.argv[3];const n=+process.argv[4],gap=+process.argv[5];
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1100,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:S+'/real/three.min.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,set:{ahead:true,ahead3:true}}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(3000);
await p.evaluate(()=>document.querySelectorAll('.tour,.unlock').forEach(e=>e.remove()));
await p.evaluate(w=>document.querySelector('[data-act="'+w+'"]').click(),which);
for(let i=0;i<n;i++){
 await p.evaluate(()=>{const d=window.__rxDbg();document.querySelectorAll('.tour,.unlock').forEach(e=>e.remove());
  if(d.cur&&!d.cur.done&&d.cur.opts){const k=d.cur.opts.findIndex(o=>o.ok);const el=document.querySelector('.opt[data-i="'+k+'"]');el&&el.click()}
  else{const nb=document.querySelector('#nextbtn');nb&&nb.click()}});
 await p.waitForTimeout(gap);await p.screenshot({path:S+'/shots/'+which+'_'+String(i).padStart(2,'0')+'.png'})}
console.log('errs',errs);await b.close()})();
