const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1200,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:process.env.THREE_JS,contentType:'text/javascript'}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,boardAsked:true,set:{topics:{}},mic:{st:{},mode:'drag',set:'body'}}));localStorage.setItem('rxNet','{"off":1}')});
await p.goto('file://'+process.cwd()+'/corner-rx.html?noconf=1');await p.waitForTimeout(3500);
await p.evaluate(()=>document.querySelectorAll('.tour,.unlock').forEach(e=>e.remove()));
await p.evaluate(()=>{document.querySelector('#menu [data-act="mic"]').click()});await p.waitForTimeout(1500);
const D=process.argv[2], ids=(process.argv[3]||'').split(',').filter(Boolean);
if(!ids.length){await p.evaluate(()=>{World.devCam(0.2,3.0,0.2,0.0,1.0,11)});await p.waitForTimeout(1200);await p.screenshot({path:D+'/man.png'});}
for(const id of ids){await p.evaluate(i=>{window.__rxDbg().micDbg().part(i)},id);await p.waitForTimeout(6000);await p.screenshot({path:D+'/p-'+id+'.png'});}
console.log('errs',JSON.stringify(errs));await b.close()})();
