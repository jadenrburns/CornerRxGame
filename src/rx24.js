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
const out=await p.evaluate(()=>['Сloset_01','Сloset_02','Сloset_03','Reception_Desk_01','Reception_Desk_02','Reception_Desk_03','Wall_Panel_01','Table_02','Utility_Cart_12','Screen_01','Bench_02','Chair_02','Packaging_Machine_01'].map(n=>{const g=RXM.make(n,1),e=RXM.info(n);return n+' '+g.children.map((m,i)=>{const b=new THREE.Box3().setFromObject(m);return e.parts[i].mat+'['+[b.min.x,b.min.y,b.min.z,b.max.x,b.max.y,b.max.z].map(x=>x.toFixed(2)).join(',')+']'}).join(' ')}));
console.log(out.join('\n'));
console.log('errs',JSON.stringify(errs));await b.close();srv.close()})();
