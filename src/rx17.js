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
const names=['Medical_Models_03','Medical_Models_02_Part_01','Medical_Models_02_Part_02','Medical_Models_02_Part_03','Medical_Models_02_Part_04','Medical_Models_02_Part_05','Medical_Models_04','Medical_Models_05','Medical_Models_06','Medical_Models_07'];
await p.evaluate((nm)=>{World.devHideCust(true);nm.forEach((n,i)=>{const g=RXM.make(n,1);const bb=new THREE.Box3().setFromObject(g);const h=Math.max(bb.max.y-bb.min.y,bb.max.x-bb.min.x,bb.max.z-bb.min.z);const s=1.6/h;g.scale.setScalar(s);const c=bb.getCenter(new THREE.Vector3());g.position.set((i%5-2)*2.3-c.x*s,41.3+(1-Math.floor(i/5))*2.3-c.y*s,-c.z*s);g.rotation.y=0;World.devAdd(g)});World.devCam(0,41.3,0,0,1.5,12)},names);
await p.waitForTimeout(1500);await p.screenshot({path:process.argv[2]+'/parts.png',clip:{x:0,y:60,width:760,height:620}});
console.log('errs',JSON.stringify(errs));await b.close();srv.close()})();
