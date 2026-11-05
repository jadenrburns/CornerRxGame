const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const p = await b.newPage({ viewport:{width:1200,height:900} });
  p.on('pageerror', e => errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
  p.on('console', m => { if(m.type()==='error') errs.push('console: '+m.text()); });
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},cash:0,correct:30,served:20,karenCd:999,sweatyCd:999,up:{shelf:3,tech:2,counsel:0,library:0,robot:0},rep:60})); });
  await p.clock.install();
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.clock.runFor(500);
  const view=()=>p.textContent('.rx-meta b');
  let t=0; while(t<200000){ await p.clock.runFor(1000); t+=1000; if((await view()).includes('BOTTLE')) break; }
  console.log('bottle after s', t/1000, await view());
  console.log(await p.textContent('.bubble'));
  console.log('opts', await p.$$eval('.opt',e=>e.map(x=>x.textContent)));
  await p.clock.runFor(2000);
  console.log('dbg fp', await p.evaluate(()=>{const d=World._dbg();return {fpK:d.fpK,fpT:d.fpT,pv:d.pharmVis,bot:d.bottles,q:d.queue.length}}));
  // pick wrong: read the correct one from result after answering 1; if right, we try again later
  async function answerWrong(){
    // find which is correct by hidden text: IND lookup by prompt
    const ind = await p.textContent('.bubble p');
    const m = ind.match(/prescription is for (.*)\. Which/); const cond=m[1];
    const ans = await p.evaluate((c)=>IND.find(x=>x.i===c).d, cond);
    const opts = await p.$$eval('.opt',e=>e.map(x=>x.textContent));
    const wrongIdx = opts.findIndex(o=>!o.includes(ans)); return {wrongIdx, ans, cond};
  }
  const w = await answerWrong(); console.log('correct', w.ans, 'for', w.cond);
  await p.click(`.opt[data-bt="${w.wrongIdx}"]`);
  console.log('result', (await p.textContent('.result')).slice(0,140));
  await p.clock.runFor(2000);
  console.log('after', await view());
  await p.clock.runFor(1500);
  let d = await p.evaluate(()=>{const d=World._dbg();return {bodies:d.bodies.map(b=>({ph:b.phase,y:b.g.position.y,x:b.g.position.x,z:b.g.position.z})),q:d.queue.length,job:d.copJob&&d.copJob.phase,fpT:d.fpT}});
  console.log('ragdoll', JSON.stringify(d));
  console.log('toast', await p.textContent('#toast3d'));
  for (let i=0;i<30;i++){ await p.clock.runFor(1000); d = await p.evaluate(()=>{const d=World._dbg();return {job:d.copJob&&d.copJob.phase,cops:d.cops.map(c=>[+c.g.position.x.toFixed(1),+c.g.position.z.toFixed(1)]),b:d.bodies.length}}); console.log(i, JSON.stringify(d)); if(!d.job) break; }
  await p.clock.runFor(6000);
  const S = await p.evaluate(()=>JSON.parse(localStorage.getItem('cornerRx.v1')));
  console.log('rep', S.rep, 'shelf', S.up.shelf, 'bad', S.bottleBad, 'pol', S.polLoss);
  console.log('toast', await p.textContent('#toast3d'));
  console.log('ERR', errs);
  await b.close();
})();
