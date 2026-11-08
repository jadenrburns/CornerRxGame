const {chromium}=require('playwright');
const CASES=[['P2 week (60 q)','TOP',5],['P3 week (185 q)','TP3',107]];
const MODES=['mixed','even','newmissed'];
(async()=>{const b=await chromium.launch();const out={};
for(const [label,cat,wk] of CASES){ for(const mode of MODES){ const runs=[];
 for(let seed=1;seed<=5;seed++){
  const ctx=await b.newContext();const p=await ctx.newPage();
  await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
  await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,cash:100}))});
  await p.goto('file://'+process.cwd()+'/corner-rx.html');await p.waitForTimeout(500);
  await p.evaluate(()=>document.querySelectorAll('.tour').forEach(e=>e.remove()));
  const res=await p.evaluate(({cat,wk,mode,seed})=>{
    let a=seed*2654435761>>>0;const rng=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
    Math.random=rng;
    let now=Date.now();Date.now=()=>now;
    const d0=window.__rxDbg();const S=d0.S;
    S.set.focus=true;S.set.timer=false;S.set.topics=Object.fromEntries(Object.keys(S.set.topics).map(k=>[k,k===cat]));
    S.set[cat==='TOP'?'p2sel':'p3sel']={[wk]:true};
    const keys=d0.TOPQ.filter(q=>q.c===cat&&q.wk===wk&&!q.ms).map(q=>q.k);
    const known={},learned={};keys.forEach(k=>{known[k]=rng()<0.85});
    let n=0,secs=0,confTaps=0;const T0=now;
    const mastered=()=>keys.every(k=>S.mastery[k]&&S.mastery[k].box>=2);
    function answerOne(reviewDays){
      const d=window.__rxDbg();d.nc();const c=window.__rxDbg().cur;if(!c||c.empty)return false;
      const k=c.q.k;if(keys.indexOf(k)<0||c.q.ms){return 'skip'}
      const kn=known[k];let pOk,conf;
      if(kn){ let p=0.97; if(learned[k]){const m=S.mastery[k]; const iv=(m&&m.d)||0; p=Math.max(0.5,0.9-0.012*iv)+Math.min(0.07,0.02*((m&&m.n)||0)); p=Math.min(p,0.97);} pOk=p; }
      else pOk=0.25;
      const ok=rng()<pOk;
      conf=kn&&ok?(rng()<0.65?'certain':'sure'):(!kn?(rng()<0.85?'guess':'sure'):'sure');
      if(kn&&!ok&&rng()<0.3)conf='certain';
      const idx=c.opts.findIndex(o=>ok?o.ok:(!o.ok&&!o.gone));
      document.querySelector('.opt[data-i="'+idx+'"]').click();
      if(document.querySelector('.confbar')){document.querySelector('.confbtn[data-conf="'+conf+'"]').click();confTaps++}
      n++; secs+= (kn&&ok)?(9+3):(kn?18:(ok?30:34)); if(document.querySelector('.confbtn')||true){}
      if(window.__cm)secs+=1.5;
      now+=1000*((kn&&ok)?12:30);
      if(!kn||!ok){ if(!kn){ if(rng()<0.6){known[k]=true;learned[k]=true} } else {learned[k]=true} }
      return true;
    }
    const confMode=(m)=>m==='mixed'||m==='review';
    // phase 1: reach mastery
    let phases=[];
    if(mode==='newmissed'){
      S.set.mode='new';window.__cm=false;let g=0;while(g++<2000){const r=answerOne();if(r===false)break}
      const newN=n;
      S.set.mode='missed';let g2=0;while(g2++<5000&&S.missed.some(k=>keys.indexOf(k)>=0)){const r=answerOne();if(r===false)break}
      return {mode,n,mins:Math.round(secs/60),mastered:mastered(),newN,nk:keys.length};
    }
    S.set.mode=mode;window.__cm=confMode(mode);
    let guard=0;while(!mastered()&&guard++<8000){answerOne()}
    const base={nk:keys.length,mode,n,mins:Math.round((secs+confTaps*1.5)/60),mastered:mastered()};
    if(mode==='mixed'){
      // 30 days of Individual review
      const days=[];S.set.mode='review';window.__cm=true;
      for(let day=1;day<=30;day++){now+=864e5;let cnt=0,s0=secs,t0=confTaps,g=0;while(window.__rxDbg().pool().length>0&&g++<600){const r=answerOne();if(r===false)break;if(r===true)cnt++}days.push([cnt,Math.round((secs-s0+(confTaps-t0)*1.5)/60*10)/10])}
      base.days=days;
    }
    return base;
  },{cat,wk,mode,seed});
  runs.push(res);await ctx.close();
 }
 out[label+' | '+mode]=runs;
}}
await b.close();
const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
for(const k in out){const r=out[k];console.log(k,'| questions',Math.round(avg(r.map(x=>x.n))),'| minutes',Math.round(avg(r.map(x=>x.mins))),'| of',r[0].nk,'q | runs mastered',r.filter(x=>x.mastered).length+'/5',r[0].newN?'| first pass '+r[0].newN:'');
 if(r[0].days){const D=r.map(x=>x.days);const q=(i)=>Math.round(avg(D.map(d=>d[i][0])));const m=(i)=>Math.round(avg(D.map(d=>d[i][1]))*10)/10;
  console.log('  review days (questions/min): d1',q(0),'/',m(0),' d2',q(1),'/',m(1),' d3',q(2),'/',m(2),' d7',q(6),'/',m(6),' d14',q(13),'/',m(13),' d30',q(29),'/',m(29));
  console.log('  30-day review total questions',Math.round(avg(D.map(d=>d.reduce((s,x)=>s+x[0],0)))),' minutes',Math.round(avg(D.map(d=>d.reduce((s,x)=>s+x[1],0)))));}
}
})();
