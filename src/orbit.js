const {chromium}=require('playwright');const S=process.argv[2];
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1100,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:S+'/real/three.min.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,set:{ahead:true,ahead3:true}}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html');await p.waitForTimeout(3000);
await p.evaluate(()=>document.querySelectorAll('.tour,.unlock').forEach(e=>e.remove()));
// hide the question panel to see full stage
await p.evaluate(()=>{const q=document.querySelector('#qpanel');if(q)q.style.display='none'});
const steps=[['drag',0,0],['drag',140,0],['drag',140,0],['drag',140,0],['drag',140,0],['drag',140,0],['drag',140,0],['drag',140,0],['zoomin'],['zoomin'],['zoomout'],['zoomout'],['zoomout'],['zoomout']];
let i=0;for(const s of steps){
 if(s[0]==='drag'){await p.mouse.move(400,500);await p.mouse.down();await p.mouse.move(400+s[1],500+s[2],{steps:6});await p.mouse.up()}
 else{await p.mouse.move(400,400);await p.mouse.wheel(0,s[0]==='zoomin'?-400:400)}
 await p.waitForTimeout(900);await p.screenshot({path:S+'/shots/orb_'+String(i++).padStart(2,'0')+'.png'})}
console.log('errs',errs);await b.close()})();
