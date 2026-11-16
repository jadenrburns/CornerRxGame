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
await p.evaluate(()=>{World.devHideCust(true);const grp=new THREE.Group();['Medical_Models_02','Medical_Models_03','Medical_Models_02_Part_01','Medical_Models_02_Part_02','Medical_Models_02_Part_03','Medical_Models_02_Part_04','Medical_Models_02_Part_05'].forEach(n=>{const g=RXM.make(n,1);if(n==='Medical_Models_02')g.traverse(m=>{if(!m.isMesh)return;const g0=m.geometry,ix=g0.index.array,P=g0.attributes.position,keep=[];for(let t=0;t<ix.length;t+=3){const a=ix[t],b=ix[t+1],c=ix[t+2];const inb=v=>Math.abs(P.getX(v))<0.17&&P.getY(v)>0.1&&P.getY(v)<0.68&&P.getZ(v)>0.04;if(inb(a)&&inb(b)&&inb(c))continue;keep.push(a,b,c)}g0.setIndex(keep)});if(n!=='Medical_Models_02')g.position.z=0.0;grp.add(g)});grp.scale.setScalar(3);grp.position.set(0,41.3,0);World.devAdd(grp);World.devCam(0,41.3+1.5,0,0,1.3,6)});
await p.waitForTimeout(1500);await p.screenshot({path:process.argv[2]+'/asm.png',clip:{x:0,y:60,width:760,height:620}});
console.log('errs',JSON.stringify(errs));await b.close();srv.close()})();
