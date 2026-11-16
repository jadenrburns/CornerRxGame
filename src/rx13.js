// pose test: THREE_JS=... node rx3.js <outdir>
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const srv=http.createServer((q,r)=>{let f=q.url.split('?')[0];f=f==='/'?'/src/corner-rx.html':f;const p=path.join(root,f);if(!fs.existsSync(p)){r.statusCode=404;return r.end()}r.setHeader('content-type',/html/.test(p)?'text/html':/png/.test(p)?'image/png':'application/octet-stream');r.end(fs.readFileSync(p))}).listen(0);
(async()=>{const port=srv.address().port;const b=await chromium.launch({args:['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1100,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:process.env.THREE_JS,contentType:'text/javascript'}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,up:{shelf:12,tech:3,train:0,counsel:0,robot:0},money:99999,playSec:999,boardAsked:true,set:{topics:{}}}));localStorage.setItem('rxNet','{"off":1}')});
await p.goto('http://localhost:'+port+'/?noconf=1&dev=1');await p.waitForTimeout(5000);
await p.evaluate(()=>{document.querySelectorAll('.tour,.unlock').forEach(e=>e.remove());const m=document.getElementById('panel');if(m)m.style.display='none'});
await p.evaluate(()=>{const S=__rxDbg&&__rxDbg();});
for(const [n,cam] of [['ctr',[2,1.5,0,0.5,1.25,9]],['shf',[0,2.4,-0.4,0.15,1.35,13]]]){await p.evaluate(c=>World.devCam(...c),cam);await p.waitForTimeout(1500);await p.screenshot({path:process.argv[2]+'/lv_'+n+'.png',clip:{x:0,y:60,width:760,height:620}});}
console.log('errs',JSON.stringify(errs));await b.close();srv.close()})();
