const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:420,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?noconf=1');await p.waitForTimeout(900);
await p.evaluate(()=>document.querySelectorAll('.tour').forEach(e=>e.remove()));
console.log('badge',await p.$eval('#dailybadge',e=>e.textContent));
const G=()=>p.evaluate(()=>JSON.stringify(window.__rxDbg().S.daily.g.map(g=>g.id+':'+g.n+'/'+g.need)));
console.log('goals',await G());
const ans=async()=>{await p.evaluate(()=>{const d=window.__rxDbg();const c=d.cur;if(!c||!c.q){const n=document.querySelector('#nextbtn');n&&n.click();return}if(c.elder&&c.elderStage<2){const e=document.querySelector('[data-elder]');e&&!e.disabled&&e.click();return}if(c.done){const n=document.querySelector('#nextbtn');n&&n.click();return}if(c.q.ms){c.opts.forEach((o,i)=>{if(o.ok)c.sel[i]=true});const m=document.querySelector('#msgo');if(m){m.disabled=false;m.click()}return}const i=c.opts.findIndex(o=>o.ok);const bt=document.querySelector('.opt[data-i="'+i+'"]');bt&&bt.click()});await p.waitForTimeout(120)};
for(let i=0;i<60;i++){await ans();}
console.log('after 30 answers',await G(),'cash',await p.evaluate(()=>window.__rxDbg().S.cash),'paid',await p.evaluate(()=>window.__rxDbg().S.daily.paid));
await p.evaluate(()=>{window.__rxDbg().S.daily.g.forEach(g=>{g.n=g.need-1});});
console.log('pw before',await p.evaluate(()=>JSON.stringify(window.__rxDbg().S.pw)));
await p.evaluate(()=>{const e=document.querySelector('[data-act="daily"]');e&&e.click()});await p.waitForTimeout(400);
await p.evaluate(()=>document.querySelectorAll('.unlock').forEach(e=>e.remove()));
console.log('pane',await p.$$eval('.dglist li',e=>e.map(x=>x.innerText.replace(/\n/g,' '))),await p.$eval('.dgstreak',e=>e.innerText.replace(/\n/g,' ')));
console.log('overflow',await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
await p.screenshot({path:process.env.SHOT||'/tmp/daily.png'});
// day rollover
await p.evaluate(()=>{const d=window.__rxDbg();d.S.daily.d='2000-01-01';d.S.daily.last=(function(){const x=new Date();x.setDate(x.getDate()-1);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')})();d.S.daily.streak=3;});
await p.evaluate(()=>{document.querySelector('[data-act="daily"]').click();document.querySelector('[data-act="daily"]').click()});await p.waitForTimeout(300);
console.log('rolled over',await G(),'streak kept',await p.evaluate(()=>window.__rxDbg().S.daily.streak));
console.log('errs',errs);await b.close()})();
