// real-three lineup of pack customers: THREE_JS=... node rx1.js <outdir> [count] [cols]
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const srv=http.createServer((q,r)=>{let f=q.url.split('?')[0];f=f==='/'?'/src/corner-rx.html':f;const p=path.join(root,f);if(!fs.existsSync(p)){r.statusCode=404;return r.end()}r.setHeader('content-type',/html/.test(p)?'text/html':/png/.test(p)?'image/png':'application/octet-stream');r.end(fs.readFileSync(p))}).listen(0);
(async()=>{const port=srv.address().port;const b=await chromium.launch({args:['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1500,height:760}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:process.env.THREE_JS,contentType:'text/javascript'}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,boardAsked:true,set:{topics:{}}}))});
await p.goto('http://localhost:'+port+'/?noconf=1');await p.waitForTimeout(4000);
await p.evaluate(()=>{document.querySelectorAll('.tour,.unlock').forEach(e=>e.remove());const m=document.getElementById('panel');if(m)m.style.display='none'});
const n=+(process.argv[3]||24),cols=+(process.argv[4]||8);
const list=[];for(let i=0;i<n;i++)list.push({seed:i*97+11,gender:i%2?'f':'m',body:i%9===4?'obese':i%11===6?'jacked':'normal'});
console.log('ready',await p.evaluate(()=>RXC.ready()));
await p.evaluate(([l,c])=>World.devLineup(l,c),[list,cols]);
await p.evaluate(([c,r])=>World.devCam(0,41.3,0,0,1.42,Math.max(12,c*1.7)),[cols,Math.ceil(n/cols)]);await p.waitForTimeout(2000);
await p.screenshot({path:process.argv[2]+'/rx_line.png',clip:{x:0,y:60,width:1100,height:640}});
console.log('errs',JSON.stringify(errs));await b.close();srv.close()})();
