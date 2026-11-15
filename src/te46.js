const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:420,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:40,correct:25,tutDone:true,playSec:999,set:{mode:'even'}}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?noconf=1');await p.waitForTimeout(900);
await p.evaluate(()=>document.querySelectorAll('.tour').forEach(e=>e.remove()));
const step=async(right)=>p.evaluate((right)=>{const d=window.__rxDbg();const c=d.cur;if(!c||!c.q){const n=document.querySelector('#nextbtn');n&&n.click();return 'x'}if(c.elder&&c.elderStage<2){const e=document.querySelector('[data-elder]');e&&!e.disabled&&e.click();return 'e'}if(c.done){const n=document.querySelector('#nextbtn');n&&n.click();return 'n'}if(c.q.ms){c.opts.forEach((o,i)=>{if(right===o.ok)c.sel[i]=true});const m=document.querySelector('#msgo');if(m){m.disabled=false;m.click()}return 'm'}const i=c.opts.findIndex(o=>right?o.ok:!o.ok&&!o.gone);const bt=document.querySelector('.opt[data-i="'+i+'"]');bt&&bt.click();return 'a'},right);
// 1. miss a plain question
let tries=0;while(tries++<30){const st=await p.evaluate(()=>{const d=window.__rxDbg();return d.cur&&d.cur.q&&!d.cur.done&&!d.cur.karen&&!d.cur.sweaty&&!d.cur.elder&&!d.cur.evt&&!d.cur.q.gen&&!d.cur.q.ms&&d.cur.q.c!=='HIM'});if(st)break;await step(true);await p.waitForTimeout(80)}
const missK=await p.evaluate(()=>window.__rxDbg().cur.q.k),missSeed=await p.evaluate(()=>window.__rxDbg().cur.seed);
await step(false);await p.waitForTimeout(200);
console.log('recall list',JSON.stringify(await p.evaluate(()=>window.__rxDbg().S.recall.map(r=>({k:r.k,seed:r.seed,body:r.body,name:r.name,dueInH:Math.round((r.due-Date.now())/36e5)})))),'expected',missK,missSeed);
// 2. make due and wait for the real spawn path
await p.evaluate(()=>{const d=window.__rxDbg();d.S.recall.forEach(r=>r.due=0);d.S.lastSp=0;});
let got=null;for(let i=0;i<80&&!got;i++){await step(true);await p.waitForTimeout(60);got=await p.evaluate(()=>{const d=window.__rxDbg();return d.cur&&d.cur.recall?{k:d.cur.q.k,seed:d.cur.seed,name:d.cur.name,banner:!!document.querySelector('.spbanner.recall'),cls:document.querySelector('.rx').className.includes('recall')}:null})}
console.log('recall card',JSON.stringify(got));
const cash0=await p.evaluate(()=>window.__rxDbg().S.cash);
await step(true);await p.waitForTimeout(250);
console.log('recall resolved',JSON.stringify(await p.evaluate(()=>{const d=window.__rxDbg();return {left:d.S.recall.length,ok:d.S.recallOK,chips:[...document.querySelectorAll('.pay span')].map(x=>x.innerText).filter(x=>/recall/.test(x))}})));
await p.screenshot({path:'/tmp/recall.png'});
// 3. regular: master week 1
await p.evaluate(()=>{const d=window.__rxDbg();d.TOPQ.filter(q=>q.wk===1).forEach(q=>{d.S.mastery[q.k]={box:2,seen:3,ok:3,t:Date.now(),iv:0}});});
for(let i=0;i<6;i++){await step(true);await p.waitForTimeout(80)}
console.log('regulars',JSON.stringify(await p.evaluate(()=>Object.values(window.__rxDbg().S.reg).map(g=>g.n+':'+g.name))),'popup',await p.$$eval('.unlock',e=>e.map(x=>x.innerText.replace(/\n/g,' | ').slice(0,90))));
await p.evaluate(()=>document.querySelectorAll('.unlock').forEach(e=>e.remove()));
await p.evaluate(()=>{const sn=document.querySelector('[data-act="shift-next"]');sn&&sn.click();document.querySelectorAll('.unlock').forEach(e=>e.remove());document.body.insertAdjacentHTML('beforeend','<button id="devb" data-act="dev-regular"></button>');document.getElementById('devb').click();});await p.waitForTimeout(200);
const rg=await p.evaluate(()=>{const d=window.__rxDbg();return d.cur&&d.cur.regular?{name:d.cur.name,wk:d.cur.q.wk,banner:document.querySelector('.spbanner.regular').innerText.replace(/\n/g,' '),cls:document.querySelector('.rx').className.includes('regular')}:null});
console.log('regular card',JSON.stringify(rg));
await p.screenshot({path:'/tmp/regular.png'});
await step(true);await p.waitForTimeout(200);
console.log('regular paid',JSON.stringify(await p.evaluate(()=>{const d=window.__rxDbg();return {visits:d.S.reg[1].visits,ok:d.S.reg[1].ok,chips:[...document.querySelectorAll('.pay span')].map(x=>x.innerText).filter(x=>/regular/.test(x))}})));
await p.evaluate(()=>{const sn=document.querySelector('[data-act="shift-next"]');sn&&sn.click();document.body.insertAdjacentHTML('beforeend','<button id="devc" data-act="dev-recall"></button>');document.getElementById('devc').click();});await p.waitForTimeout(200);
await p.screenshot({path:'/tmp/recall.png'});
console.log('dev recall card',JSON.stringify(await p.evaluate(()=>{const d=window.__rxDbg();return d.cur&&d.cur.recall?{name:d.cur.name,seed:d.cur.seed,banner:document.querySelector('.spbanner.recall').innerText.replace(/\n/g,' ')}:null})));

console.log('errs',errs);await b.close()})();
