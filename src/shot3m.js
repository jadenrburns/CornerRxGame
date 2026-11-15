const {chromium}=require('playwright');const D=process.argv[2];
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1200,height:760}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load|ERR_/.test(m.text()))errs.push(m.text())});
await p.route('**/three.min.js',r=>r.fulfill({path:process.env.THREE_JS,contentType:'text/javascript'}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,boardAsked:true,binBug:true,set:{topics:{}},mic:{st:{cns:{d:1,f:1},uti:{d:1}},mode:'drag',set:'body'}}));localStorage.setItem('rxNet','{"off":1}')});
await p.goto('file://'+process.cwd()+'/corner-rx.html?noconf=1');await p.waitForTimeout(3500);
await p.evaluate(()=>document.querySelectorAll('.tour,.unlock').forEach(e=>e.remove()));
// bin close-up
await p.evaluate(()=>{World.setBin(true);World.devCam(8.7,0.8,-2.4,0.2,1.15,4.2)});await p.waitForTimeout(1500);await p.screenshot({path:D+'/bin1.png'});await p.waitForTimeout(1500);await p.screenshot({path:D+'/bin2.png'});
await p.evaluate(()=>{World.devCam(0.5,1.8,-0.2,0.55,1.05,19)});
await p.evaluate(()=>{document.querySelector('#menu [data-act="mic"]').click()});await p.waitForTimeout(1500);
await p.screenshot({path:D+'/lab1.png'});
await p.waitForTimeout(1200);await p.screenshot({path:D+'/lab1.png'});
await p.evaluate(()=>{window.__rxDbg().micDbg().startSort('sort-iv')});await p.waitForTimeout(1800);await p.screenshot({path:D+'/sort1.png'});
await p.evaluate(()=>{const d=window.__rxDbg().micDbg();const R=d.R;const c=R.chips.find(x=>x.valid.length);d.drop(c.id,c.valid[0]);const w=R.chips.find(x=>!x.used&&x.valid.indexOf('pa')<0);d.drop(w.id,'pa')});await p.waitForTimeout(500);await p.screenshot({path:D+'/sort2.png'});
await p.evaluate(()=>{document.querySelector('[data-act="back"]').click()});await p.waitForTimeout(2500);await p.screenshot({path:D+'/back.png'});
console.log('errs',JSON.stringify(errs));await b.close()})();
