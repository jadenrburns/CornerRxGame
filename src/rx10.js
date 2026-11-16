// character screen + shop in real 3D: THREE_JS=... node rx10.js <outdir>
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const srv=http.createServer((q,r)=>{let f=q.url.split('?')[0];f=f==='/'?'/src/corner-rx.html':f;const p=path.join(root,f);if(!fs.existsSync(p)){r.statusCode=404;return r.end()}r.setHeader('content-type',/html/.test(p)?'text/html':/png/.test(p)?'image/png':'application/octet-stream');r.end(fs.readFileSync(p))}).listen(0);
(async()=>{const port=srv.address().port;const b=await chromium.launch({args:['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1100,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:process.env.THREE_JS,contentType:'text/javascript'}));
await p.addInitScript(()=>{localStorage.setItem('rxNet','{"off":1}');localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,boardAsked:true,cash:5000,gearV:1,cosm:['o83'],cosmOn:{outfit:'o83'},set:{topics:{}}}))});
await p.addInitScript(()=>{window.__rxDev=1});p.on('console',m=>{if(/portrait/.test(m.text()))console.log(m.text())});await p.goto('http://localhost:'+port+'/?noconf=1&dev=1');await p.waitForTimeout(5000);
await p.evaluate(()=>{document.querySelectorAll('.tour,.unlock').forEach(e=>e.remove());__rxDbg().goView('create')});await p.waitForTimeout(2500);
console.log(await p.evaluate(()=>{try{const u=World.pharmPortrait({outfit:83,body:'normal',gender:'f',hair:0,skin:'#E0B48C',hairCol:'#333',scrub:'#27384F',shirtCol:'#fff'});return u?u.length:'null'}catch(e){return 'ERR '+e.message}}));await p.screenshot({path:process.argv[2]+'/cs_me.png'});
await p.evaluate(()=>__rxDbg().shopTab('shop'));await p.waitForTimeout(800);
await p.evaluate(()=>{document.querySelector('.crs[data-shop=wear]').open=true});await p.waitForTimeout(400);
await p.screenshot({path:process.argv[2]+'/cs_shop.png'});
console.log('errs',JSON.stringify(errs));await b.close();srv.close()})();
