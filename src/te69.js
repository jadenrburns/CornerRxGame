// te69: the quick tour has a "What mastered means" step and still ends cleanly
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{localStorage.rxNet='{"off":1}';if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({cash:100,me:{done:true,name:'T',look:{}},served:0,tutDone:false,set:{}}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?noconf=1');await p.waitForTimeout(1200);
const fail=[];const titles=[];
for(let i=0;i<8;i++){const t=await p.evaluate(()=>{const e=document.querySelector('.tourcard h3');return e?e.textContent:null});if(!t)break;titles.push(t);await p.evaluate(()=>{const b=document.querySelector('[data-act="tour-next"]');b&&b.click()});await p.waitForTimeout(150)}
console.log(titles.join(' | '));
if(titles.indexOf('What mastered means')<0)fail.push('no mastery step');
if(titles[titles.length-1]!=='Your progress')fail.push('last step '+titles[titles.length-1]);
const done=await p.evaluate(()=>window.__rxDbg().S.tutDone);if(!done)fail.push('tour not finished');
console.log('fail',fail,'errs',errs);await b.close()})();
