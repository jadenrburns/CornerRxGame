const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1000,height:760}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:process.env.THREE_JS,contentType:'text/javascript'}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,boardAsked:true,set:{topics:{}}}));localStorage.setItem('rxNet','{"off":1}')});
await p.goto('file://'+process.cwd()+'/corner-rx.html?noconf=1');await p.waitForTimeout(4000);
await p.evaluate(()=>document.querySelectorAll('.tour,.unlock').forEach(e=>e.remove()));
await p.screenshot({path:process.argv[2]+'/c0.png'});
for (const [n,a] of [['c1',[-1.5,1.15,-1.85,0.8,1.35,2.2]],['c2',[-1.5,1.15,-1.85,0.2,1.4,2.2]],['c3',[-1.5,1.15,-1.85,1.6,1.4,2.2]]]){await p.evaluate(a=>World.devCam(...a),a);await p.waitForTimeout(1300);await p.screenshot({path:process.argv[2]+'/'+n+'.png'});}
console.log('errs',JSON.stringify(errs));await b.close()})();
