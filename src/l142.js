const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1500,height:900},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:process.env.THREE_JS,contentType:'text/javascript'}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,boardAsked:true,set:{topics:{}}}));localStorage.setItem('rxNet','{"off":1}')});
await p.goto('file://'+process.cwd()+'/corner-rx.html?noconf=1');await p.waitForTimeout(2500);
await p.evaluate(()=>{document.querySelectorAll('.tour,.unlock').forEach(e=>e.remove());const m=document.getElementById('panel');if(m)m.style.display='none'});
const H=['Default','Afro','Bob','Bun','FlatTop','LongSwept','Mohawk','Ponytail','Quiff','ShortPart','Spiky'];
const th=+process.argv[3]||0;let k=1;
const B=(process.argv[4]||'Skinny').split(',');
for(const bd of B){for(let g=0;g<3;g++){
 const list=H.slice(g*4,g*4+4).map(h=>({seed:(k++)*53+7,body:bd==='Muscular'?'jacked':bd==='Overweight'?'obese':'normal',gsel:{build:bd,torso:'TShirt',arms:'ShortSleeve',legs:'Jeans',hair:h,sex:process.argv[5]||undefined}}));
 await p.evaluate(([l])=>World.devLineup(l,4),[list]);
 await p.evaluate(([t])=>World.devCam(0,41.75,0,t,1.52,3.6),[th]);await p.waitForTimeout(1200);
 await p.screenshot({path:process.argv[2]+'/head_'+bd+'_'+g+'_'+th+'.png',clip:{x:100,y:250,width:800,height:350}});}}
console.log('errs',JSON.stringify(errs));await b.close()})();
