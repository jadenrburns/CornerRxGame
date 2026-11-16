// pose test: THREE_JS=... node rx3.js <outdir>
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const srv=http.createServer((q,r)=>{let f=q.url.split('?')[0];f=f==='/'?'/src/corner-rx.html':f;const p=path.join(root,f);if(!fs.existsSync(p)){r.statusCode=404;return r.end()}r.setHeader('content-type',/html/.test(p)?'text/html':/png/.test(p)?'image/png':'application/octet-stream');r.end(fs.readFileSync(p))}).listen(0);
(async()=>{const port=srv.address().port;const b=await chromium.launch({args:['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1100,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:process.env.THREE_JS,contentType:'text/javascript'}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,boardAsked:true,set:{topics:{}}}));localStorage.setItem('rxNet','{"off":1}')});
await p.goto('http://localhost:'+port+'/?noconf=1&dev=1');await p.waitForTimeout(5000);
await p.evaluate(()=>{document.querySelectorAll('.tour,.unlock').forEach(e=>e.remove());const m=document.getElementById('panel');if(m)m.style.display='none'});
await p.evaluate(()=>{const c=document.createElement('div');World.devHideCust&&0});
for(const [n,cam] of [['evt',[5.3,1.2,-4.9,0.4,1.1,9]],['plant',[7.5,0.8,4.5,-0.3,1.1,11]]]){await p.evaluate(c=>World.devCam(...c),cam);await p.waitForTimeout(1500);await p.screenshot({path:process.argv[2]+'/misc_'+n+'.png',clip:{x:0,y:60,width:760,height:620}});}
await p.evaluate(()=>{World.devHideCust(true);const g=RXA.make('cat',true);g.position.set(0,41.3,0);World.devAdd(g);const d=RXA.make('cat',false);d.position.set(1.2,41.3,0);World.devAdd(d);World.devCam(0.6,41.3+0.3,0,0.3,1.2,3.5)});await p.waitForTimeout(1500);await p.screenshot({path:process.argv[2]+'/misc_cat.png',clip:{x:0,y:60,width:760,height:620}});
console.log('errs',JSON.stringify(errs));await b.close();srv.close()})();
