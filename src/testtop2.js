const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const p = await b.newPage({ viewport:{width:1200,height:900} });
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:2,set:{topics:{TOP:true,BG:false,CL:false,MOA:false,AE:false,DDI:false,CN:false,AD:false,SIG:false,CALC:false},diffs:[1,2,3],mode:'mixed',timer:false,wkOnly:true}})); });
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.waitForTimeout(600);
  const t = await p.evaluate(()=>document.body.innerText.match(/Week \d+[^\n]*/g));
  console.log(t&&t.slice(0,3)); console.log(await p.evaluate(()=>{const S=__rxDbg().S;return JSON.stringify(S.cur||Object.keys(S).slice(0,40))}));
  console.log((await p.evaluate(()=>document.querySelector('.qtext, .q, h2, h3')?.parentElement.innerText)).slice(0,500));
  console.log('ERR',errs); await b.close();
})();
