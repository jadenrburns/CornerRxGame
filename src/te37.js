const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({path:'three-stub2.js',contentType:'text/javascript'}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html');await p.waitForTimeout(800);
await p.evaluate(()=>document.querySelectorAll('.tour').forEach(e=>e.remove()));
await p.evaluate(()=>{const t=[...document.querySelectorAll('[data-act]')].find(e=>/settings|topics/i.test(e.dataset.act+e.textContent)&&e.dataset.act!=='topic');t&&t.click()});await p.waitForTimeout(300);
const st=async()=>p.evaluate(()=>({sw:[...document.querySelectorAll('.swt')].map(e=>e.getAttribute('aria-checked')),chips:[...document.querySelectorAll('.chip.tp')].map(e=>e.getAttribute('aria-pressed')).join('')}));
const tab=async n=>{await p.evaluate(n=>{[...document.querySelectorAll('.ftab')].find(e=>e.textContent.trim()===n).click()},n);await p.waitForTimeout(250)};
const sw=async()=>{await p.evaluate(()=>document.querySelector('.swt').click());await p.waitForTimeout(250)};
await tab('P3');console.log('P3 start',await st());
// deselect one P3 chip first to prove in-folder selection untouched
await p.evaluate(()=>document.querySelector('.chip.tp').click());await p.waitForTimeout(200);console.log('P3 chip off',await st());
await sw();console.log('P3 switch on',await st());await p.screenshot({path:'../shot_sw.png'});
await tab('P2');console.log('P2 view',await st());
await tab('P3');await sw();console.log('P3 switch off',await st());
await tab('P2');await sw();console.log('P2 switch on',await st());
await tab('P1');console.log('P1',await p.evaluate(()=>document.querySelector('.swt').disabled));
console.log('errs',errs);await b.close()})();
