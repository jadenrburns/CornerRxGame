// contact sheet of Medical Pack props: THREE_JS=... node rx5.js <outdir>
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const srv=http.createServer((q,r)=>{let f=q.url.split('?')[0];f=f==='/'?'/src/corner-rx.html':f;const p=path.join(root,f);if(!fs.existsSync(p)){r.statusCode=404;return r.end()}r.setHeader('content-type',/html/.test(p)?'text/html':/png/.test(p)?'image/png':'application/octet-stream');r.end(fs.readFileSync(p))}).listen(0);
(async()=>{const port=srv.address().port;const b=await chromium.launch({args:['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1100,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:process.env.THREE_JS,contentType:'text/javascript'}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,boardAsked:true,set:{topics:{}}}));localStorage.setItem('rxNet','{"off":1}')});
await p.goto('http://localhost:'+port+'/?noconf=1&dev=1');await p.waitForTimeout(5000);
await p.evaluate(()=>{document.querySelectorAll('.tour,.unlock').forEach(e=>e.remove());const m=document.getElementById('panel');if(m)m.style.display='none'});
const names=(await p.evaluate(()=>RXM.names())).filter(n=>/Medical_Models/.test(n));console.log(names.length);
const per=12;
for(let pg=0;pg*per<names.length;pg++){
 await p.evaluate(([nm,pg,per])=>{World.devHideCust(true);const cols=4;nm.slice(pg*per,pg*per+per).forEach((n,i)=>{const g=RXM.make(n,1);const bb=new THREE.Box3().setFromObject(g);const h=Math.max(bb.max.y-bb.min.y,bb.max.x-bb.min.x,bb.max.z-bb.min.z);const s=2.2/h;g.scale.setScalar(s);g.position.set((i%cols-2)*2.2,41.3+(3-Math.floor(i/cols))*2.0,0);g.rotation.y=-0.6;World.devAdd(g)});World.devCam(0,41.3+3.2,0,0,1.5,12)},[names,pg,per]);
 await p.waitForTimeout(1500);await p.screenshot({path:process.argv[2]+'/mm_'+pg+'.png',clip:{x:0,y:60,width:760,height:620}});
 await p.evaluate(()=>{World.devClear&&World.devClear()});}
console.log(JSON.stringify(names));console.log('errs',JSON.stringify(errs));await b.close();srv.close()})();
