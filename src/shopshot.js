const {chromium}=require('playwright');const S=process.argv[2];
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1100,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:S+'/real/three.min.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({cash:100000,me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,set:{ahead:true,ahead3:true},up:{shelf:0,tech:3,train:0,counsel:0,library:0,robot:0}}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html');await p.waitForTimeout(3000);
await p.evaluate(()=>document.querySelectorAll('.tour,.unlock').forEach(e=>e.remove()));
const click=sel=>p.evaluate(s=>{const e=document.querySelector(s);if(e)e.click();return !!e},sel);
console.log('create',await click('[data-act="create"]'));await p.waitForTimeout(500);
console.log('tab',await click('[data-act="ctab"][data-v="shop"]'));await p.waitForTimeout(400);
await p.screenshot({path:S+'/shots/shop_00.png'});
let n=1;
for(const [cat,ids] of [['walls',['w1','w7']],['floors',['f1','f5']],['uni',['u6']],['deco',['rug','bell','cactus','lava','fish','cooler','neon','vend']],['hair',['hmo','hsb']],['cyber',['cykit']]]){
  await click('[data-act="shopcat"][data-v="'+cat+'"]');await p.waitForTimeout(300);
  for(const id of ids){const ok=await click('[data-act="shop-buy"][data-id="'+id+'"]');await p.waitForTimeout(500);if(!ok)console.log('no buy btn',id)}
  await p.screenshot({path:S+'/shots/shop_'+String(n++).padStart(2,'0')+'.png'});
}
console.log('own',await p.evaluate(()=>JSON.stringify(window.__rxDbg().S.store)),'cash',await p.evaluate(()=>window.__rxDbg().S.cash));
await click('[data-act="ctab"][data-v="me"]');await p.waitForTimeout(400);await p.screenshot({path:S+'/shots/shop_07.png'});
await click('[data-act="me-done"]');await p.waitForTimeout(1500);
await p.evaluate(()=>document.querySelectorAll('.tour,.unlock').forEach(e=>e.remove()));
await p.screenshot({path:S+'/shots/shop_08.png'});
console.log('errs',errs);await b.close()})();
