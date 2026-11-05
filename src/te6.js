const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('three-stub2.js','utf8')}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:30,correct:12,tutDone:true,playSec:999,cash:50,up:{shelf:1,tech:0,counsel:0,library:0,robot:0}}))});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1');await p.waitForTimeout(600);
const click=async(sel)=>p.$eval(sel,e=>e.click());
const answer=async(ok)=>{const i=await p.evaluate(ok=>__rxDbg().cur.opts.findIndex(o=>ok?o.ok:!o.ok),ok);await click('[data-i="'+i+'"]');await p.waitForTimeout(200);};
for(const kind of ['dev-insp','dev-driver']){
 const patient=await p.evaluate(()=>__rxDbg().cur.name);
 await click('[data-act="menu"]');await click('[data-act="'+kind+'"]');
 console.log(kind,'visitor spawned',await p.evaluate(()=>JSON.stringify(World.visitorInfo())),'card still patient:',await p.evaluate(()=>!__rxDbg().cur.visit));
 // click too early
 await p.evaluate(()=>World.visitorClick());console.log('early click -> visit?',await p.evaluate(()=>!!__rxDbg().cur.visit));
 // wait to arrive
 let st='';for(let i=0;i<60;i++){await p.waitForTimeout(500);st=await p.evaluate(()=>{const v=World.visitorInfo();return v&&v.state});if(st==='wait')break;}
 const pos=await p.evaluate(()=>{const v=__rxDbg?World._dbg().visitor:null;return v&&[v.g.position.x.toFixed(1),v.g.position.z.toFixed(1)]});
 console.log('state',st,'pos',pos,'toast',await p.$eval('#toast, .toast',e=>e.textContent).catch(()=>'-'));
 await p.screenshot({path:'w_'+kind+'.png'});
 await p.evaluate(()=>World.visitorClick());await p.waitForTimeout(200);
 console.log('visit card',await p.$eval('.rx-meta b',e=>e.textContent));
 const n=kind==='dev-insp'?3:1;
 for(let k=0;k<n;k++){await answer(true);await click('#nextbtn');await p.waitForTimeout(200);}
 console.log('restored patient',await p.evaluate(()=>__rxDbg().cur.name),'visit?',await p.evaluate(()=>!!__rxDbg().cur.visit),'visitor',await p.evaluate(()=>JSON.stringify(World.visitorInfo())));
 for(let i=0;i<40;i++){await p.waitForTimeout(500);if(!(await p.evaluate(()=>World.visitorInfo())))break;}
 console.log('visitor gone',!(await p.evaluate(()=>World.visitorInfo())));
}
console.log(errs);await b.close()})();
