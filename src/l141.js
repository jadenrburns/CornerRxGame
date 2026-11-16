const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1500,height:760}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:process.env.THREE_JS,contentType:'text/javascript'}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,boardAsked:true,set:{topics:{}}}));localStorage.setItem('rxNet','{"off":1}')});
await p.goto('file://'+process.cwd()+'/corner-rx.html?noconf=1');await p.waitForTimeout(2500);
await p.evaluate(()=>{document.querySelectorAll('.tour,.unlock').forEach(e=>e.remove());const m=document.getElementById('panel');if(m)m.style.display='none'});
const G={Default:['Default','TShirt','Hoodie','Jacket','Sweater','Tank'],Skinny:['Default','TShirt','Hoodie','Jacket'],Muscular:['Tank','TShirt','BigTee'],Overweight:['BigTee','Sweater','Hoodie']};
const A={Default:'Default',TShirt:'ShortSleeve',BigTee:'ShortSleeve',Tank:'Bare',Hoodie:'Default',Sweater:'Default',Jacket:'Default'};
const sets={
 torsos:[],legs:[],hair:[]};
let k=1;for(const bd of Object.keys(G))for(const t of G[bd])sets.torsos.push({seed:(k++)*53+7,body:bd==='Muscular'?'jacked':bd==='Overweight'?'obese':'normal',gsel:{build:bd,torso:t,arms:bd==='Muscular'&&t!=='Hoodie'?'Muscular':A[t],legs:'Jeans',hair:'ShortPart'}});
for(const bd of ['Default','Skinny'])for(const l of ['Default','Jeans','Cargo','Joggers','Shorts'])sets.legs.push({seed:(k++)*53+7,gsel:{build:bd,torso:'TShirt',arms:'ShortSleeve',legs:l,hair:'Quiff'}});
for(const bd of ['Default','Skinny','Muscular','Overweight'])for(const h of ['Default','Afro','Bob','Bun','FlatTop','LongSwept','Mohawk','Ponytail','Quiff','ShortPart','Spiky'])sets.hair.push({seed:(k++)*53+7,gsel:{build:bd,torso:'Default',arms:'Default',legs:'Jeans',hair:h}});
for(const [name,list,cols] of [['torsos',sets.torsos,8],['legs',sets.legs,5],['hair',sets.hair,11]]){
  const n=await p.evaluate(([l,c])=>World.devLineup(l,c),[list,cols]);
  const rows=Math.ceil(list.length/cols);
  await p.evaluate(([c,r])=>World.devCam(0,41.3,0,0,1.42,Math.max(12,c*1.55)),[cols,rows]);await p.waitForTimeout(1800);
  await p.screenshot({path:process.argv[2]+'/'+name+'.png',clip:{x:0,y:60,width:1010,height:640}});console.log(name,n)}
console.log('errs',JSON.stringify(errs));await b.close()})();
