const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  for (const vp of [{width:390,height:664},{width:360,height:640}]) {
  const ctx = await b.newContext({ viewport:vp, hasTouch:true, isMobile:true });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:2,set:{topics:{TOP:true,BG:false,CL:false,MOA:false,AE:false,DDI:false,CN:false,AD:false,SIG:false,CALC:false,MY:false},diffs:[1,2,3],mode:'mixed',timer:true}})); });
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.waitForTimeout(700);
  // force long indication-like content
  await p.evaluate(()=>{ document.querySelector('.bubble p').textContent='Carvedilol is indicated for:'; const L=['Heart failure with reduced ejection fraction, left ventricular dysfunction following myocardial infarction','Ear, nose, and throat infection, infection of skin and/or subcutaneous tissue, infection of genitourinary','Hypercholesterolemia, primary and mixed dyslipidemia, adjunct to diet to reduce LDL cholesterol','Prevention of stent thromboembolism after PCI and reduction of stroke risk in atrial fibrillation']; document.querySelectorAll('.opt').forEach((o,i)=>o.lastElementChild.textContent=L[i]); });
  await p.evaluate(()=>window.dispatchEvent(new Event('resize'))); await p.waitForTimeout(150);
  console.log(JSON.stringify(vp), JSON.stringify(await p.evaluate(()=>{const q=document.querySelector('#qpanel'),c=document.querySelector('#counter');const last=[...document.querySelectorAll('.opt')].pop().getBoundingClientRect(), pr=q.getBoundingClientRect();
    const parts={}; ['.qbar','.rx-head','.patient','.opts','.hintrow','.rx-foot','.rx-body'].forEach(s=>{const e=document.querySelector(s); if(e) parts[s]=Math.round(e.getBoundingClientRect().height)});
    return {zoom:c.style.zoom||1,scroll:q.scrollHeight>q.clientHeight+1,panelH:Math.round(pr.height),lastOptBottom:Math.round(last.bottom),panelBottom:Math.round(pr.bottom),vh:innerHeight,parts}})));
  await p.addStyleTag({content:'.opt span{font-size:19px !important}'}); await p.waitForTimeout(300);
  console.log('  after late font growth:', JSON.stringify(await p.evaluate(()=>{const q=document.querySelector('#qpanel'),c=document.querySelector('#counter');return {zoom:c.style.zoom||1,scroll:q.scrollHeight>q.clientHeight+1}})));
  await p.waitForTimeout(500); console.log('  stable:', await p.evaluate(()=>document.querySelector('#counter').style.zoom||1));
  await p.screenshot({path:`worst_${vp.width}.png`});
  await ctx.close(); }
  console.log('ERR',errs); await b.close();
})();
