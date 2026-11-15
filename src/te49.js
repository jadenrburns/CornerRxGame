const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:420,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{if(!localStorage.getItem('cornerRx.v1'))localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:40,correct:25,tutDone:true,playSec:999}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?noconf=1');await p.waitForTimeout(900);
await p.evaluate(()=>document.querySelectorAll('.tour').forEach(e=>e.remove()));
await p.evaluate(()=>{[...document.querySelectorAll('#menu button')].find(b=>/Topics/.test(b.textContent)).click()});await p.waitForTimeout(300);await p.evaluate(()=>document.querySelector('[data-act=tab-studies]').click());await p.waitForTimeout(300);
const set=async(id,v)=>p.evaluate(([id,v])=>{document.querySelector(id).value=v},[id,v]);
// too few cards
await set('#qztext','a\tb\nc\td');await p.evaluate(()=>document.querySelector('[data-act=qz-add]').click());
console.log('few:',await p.$eval('#qzprev',e=>e.textContent));
// bad link
await set('#qzurl','http://evil.com/x');await set('#qztext','a\tb\nc\td\ne\tf\ng\th');await p.evaluate(()=>document.querySelector('[data-act=qz-add]').click());
console.log('badurl:',await p.$eval('#qzprev',e=>e.textContent));
// good, definition->term, multiline def
const txt='Omeprazole\tPPI\nFamotidine\tH2 blocker\nSucralfate\tProtects ulcer base\nMisoprostol\tProstaglandin analog\n that prevents NSAID ulcers\nCalcium carbonate\tAntacid';
await p.evaluate(()=>document.querySelector('[data-act=qz-dir][data-v=dt]').click());await p.waitForTimeout(100);
await set('#qzname','Quizlet test');await set('#qzurl','https://quizlet.com/123/ppi-flash-cards/');await set('#qztext',txt);
await p.evaluate(()=>document.querySelector('[data-act=qz-add]').click());await p.waitForTimeout(300);
console.log('deck:',await p.evaluate(()=>{const d=window.__rxDbg().S.decks[0];return JSON.stringify({n:d.name,url:d.url,c:d.items.length,q0:d.items[3].q,a0:d.items[3].a,w:d.items[3].w})}));
console.log('link:',await p.$$eval('.deckrow a',e=>e.map(x=>x.textContent+' '+x.rel+' '+x.target)));
console.log('msg:',await p.$eval('.prev.good',e=>e.textContent).catch(()=>'none'));
await b.close();console.log('errs',JSON.stringify(errs));})();
