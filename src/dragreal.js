const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1200,height:760}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:process.env.THREE_JS,contentType:'text/javascript'}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,boardAsked:true,set:{topics:{}},mic:{st:{},mode:'drag',set:'res'}}));localStorage.setItem('rxNet','{"off":1}')});
await p.goto('file://'+process.cwd()+'/corner-rx.html?noconf=1');await p.waitForTimeout(3500);
await p.evaluate(()=>document.querySelectorAll('.tour,.unlock').forEach(e=>e.remove()));
await p.evaluate(()=>{document.querySelector('#menu [data-act="mic"]').click()});await p.waitForTimeout(600);
await p.evaluate(()=>{window.__rxDbg().micDbg().startSort('sort-iv')});await p.waitForTimeout(2500);
// find the dish centres by sweeping the canvas with micDishAt
const pos=await p.evaluate(()=>{const o={};for(let y=100;y<700;y+=12)for(let x=20;x<700;x+=12){const id=World.micDishAt(x,y);if(id){(o[id]=o[id]||[]).push([x,y])}}return Object.keys(o).map(k=>[k,o[k].length,o[k][Math.floor(o[k].length/2)]])});
console.log('dishes found',JSON.stringify(pos));
const mr=pos.find(d=>d[0]==='mrsa');
const chip=await p.evaluate(()=>{const R=window.__rxDbg().micDbg().R;const c=R.chips.find(x=>x.valid.indexOf('mrsa')>=0);return c?c.id:-1});
const box=await p.evaluate(id=>{const r=document.querySelector('.petri[data-chip="'+id+'"]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}},chip);
await p.mouse.move(box.x,box.y);await p.mouse.down();await p.mouse.move((box.x+mr[2][0])/2,(box.y+mr[2][1])/2,{steps:5});await p.mouse.move(mr[2][0],mr[2][1],{steps:5});
const hot=await p.evaluate(()=>1);await p.screenshot({path:process.argv[2]+'/drag1.png'});await p.mouse.up();await p.waitForTimeout(400);
console.log('placed',JSON.stringify(await p.evaluate(()=>window.__rxDbg().micDbg().R.placed)),'mist',await p.evaluate(()=>window.__rxDbg().micDbg().R.mist));
// wrong dish drop
const w=await p.evaluate(()=>{const R=window.__rxDbg().micDbg().R;const c=R.chips.find(x=>!x.used&&x.valid.indexOf('pa')<0);return c.id});
const pa=pos.find(d=>d[0]==='pa');const b2=await p.evaluate(id=>{const r=document.querySelector('.petri[data-chip="'+id+'"]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}},w);
await p.mouse.move(b2.x,b2.y);await p.mouse.down();await p.mouse.move(pa[2][0],pa[2][1],{steps:8});await p.mouse.up();await p.waitForTimeout(300);
console.log('after wrong mist',await p.evaluate(()=>window.__rxDbg().micDbg().R.mist));
console.log('errs',JSON.stringify(errs));await b.close()})();
