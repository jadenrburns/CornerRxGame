// te70: records the shift report animation as PNG frames (arg 1 = output folder), run from src/
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:820}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{localStorage.rxNet='{"off":1}';if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({cash:900,me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,set:{}}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?noconf=1');await p.waitForTimeout(1000);
await p.evaluate(()=>document.querySelectorAll('.tour,.unlock').forEach(e=>e.remove()));
// make mastery: pick questions from a few categories; baseline = none mastered, then master some during the "shift"
const info=await p.evaluate(()=>{const D=window.__rxDbg(),S=D.S;const pool=D.pool?D.pool():null;return {has:!!D.openShift}});console.log(info);
const out=await p.evaluate(()=>{
  const D=window.__rxDbg(),S=D.S;
  const cats=['TH3F','TH3C','GER'];const by={};
  // use BANK through masteryByCat counts by marking mastery on keys of questions found via window.BANK if exposed
  const B=(typeof BANK!=='undefined')?BANK:null; if(!B) return 'no BANK';
  S.mastery={};
  const pick=(c,n)=>B.filter(q=>q.c===c).slice(0,n);
  const base={TH3F:12,TH3C:4,GER:20};            // mastered before the shift
  const gain={TH3F:11,TH3C:9,GER:3};             // mastered during the shift
  cats.forEach(c=>pick(c,base[c]).forEach(q=>S.mastery[q.k]={box:2,seen:2,ok:2}));
  D.shiftSnap();                                 // end of last shift
  cats.forEach(c=>B.filter(q=>q.c===c).slice(base[c],base[c]+gain[c]).forEach(q=>S.mastery[q.k]={box:3,seen:3,ok:3}));
  S.shift={n:10,ok:9,earned:640,best:7,cs:{TH3F:5,TH3C:3,GER:2}};
  return 'ok';
});console.log(out);
await p.evaluate(()=>window.__rxDbg().openShift());
const fs=require('fs');const dir=process.argv[2]||'/home/claude/shiftprev/frames';fs.mkdirSync(dir,{recursive:true});
const t0=Date.now();let i=0;
while(Date.now()-t0<3600){await p.screenshot({path:dir+'/f'+String(i++).padStart(3,'0')+'.png',clip:{x:0,y:0,width:1000,height:820}});}
console.log('frames',i,'errs',errs);await b.close()})();
