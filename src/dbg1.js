const {chromium}=require('playwright');const S=process.argv[2];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1100,height:800}});
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({cash:100000,me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,set:{ahead:true,ahead3:true}}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html');await p.waitForTimeout(1200);
await p.evaluate(()=>{document.querySelector('[data-act="create"]').click()});await p.waitForTimeout(300);
await p.evaluate(()=>{document.querySelector('[data-act="ctab"][data-v="shop"]').click()});await p.waitForTimeout(300);
console.log(await p.evaluate(()=>{const e=document.querySelector('.cpane');const cs=getComputedStyle(e);return JSON.stringify({d:cs.display,gtc:cs.gridTemplateColumns,gaf:cs.gridAutoFlow,w:e.clientWidth,kids:[...e.children].map(c=>c.className+':'+Math.round(c.getBoundingClientRect().left)+','+Math.round(c.getBoundingClientRect().width))})}));
await b.close()})();
