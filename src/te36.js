const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:1100}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html');await p.waitForTimeout(800);
await p.evaluate(()=>document.querySelectorAll('.tour').forEach(e=>e.remove()));
for(let i=0;i<3;i++){await p.evaluate(()=>{const o=document.querySelector('.opt');o&&o.click()});await p.waitForTimeout(300);
 await p.evaluate(()=>{const s=document.querySelector('[data-act=submit],#submitbtn,.msbtn');s&&s.click()});
 const h=await p.evaluate(()=>{const a=document.querySelector('.flaglink');return a&&a.href});console.log(h&&decodeURIComponent(h).slice(0,700));
 await p.evaluate(()=>{const a=document.querySelector('.flaglink');a&&a.addEventListener('click',e=>e.preventDefault());a&&a.click();const n=document.querySelector('#nextbtn');n&&n.click()});await p.waitForTimeout(300);}
console.log(await p.evaluate(()=>localStorage.getItem('cornerRx.v1').match(/flagged":\[[^\]]*\]/)));console.log('errs',errs);await b.close()})();
