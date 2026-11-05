const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(()=>chromium.launch());
  const errs = [];
  for (const [w,h,name,scheme] of [[1200,900,'desk','light'],[390,844,'phone','dark']]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, colorScheme: scheme });
    p.on('pageerror', e => errs.push(name+': '+e.message));
    p.on('console', m => { if (m.type()==='error') errs.push(name+' console: '+m.text()); });
    await p.goto('file://'+process.cwd()+'/corner-rx.html');
    await p.waitForTimeout(500);
    for (let i=0;i<14;i++){
      const n = await p.$$('.opt:not([disabled])'); if(!n.length) break;
      await n[Math.floor(Math.random()*n.length)].click();
      await p.waitForTimeout(60);
      if (i===3) await p.click('#hintbtn').catch(()=>{});
      await p.click('#nextbtn');
    }
    // force cash and buy things
    await p.evaluate(()=>{ document.querySelectorAll('[data-buy]').forEach(b=>{b.disabled=false}); });
    await p.waitForTimeout(100);
    for (const id of ['shelf','tech','robot','library','counsel']) { await p.evaluate(()=>{}); }
    await p.click('.chip[data-cat="CALC"]');
    await p.waitForTimeout(100);
    await p.screenshot({ path: name+'.png', fullPage: true });
    const sw = await p.evaluate(()=>document.documentElement.scrollWidth - document.documentElement.clientWidth);
    console.log(name,'horizontal overflow px:',sw);
    await p.close();
  }
  // economy test via storage seed
  const p = await b.newPage({ viewport:{width:1200,height:900} });
  p.on('pageerror', e => errs.push('eco: '+e.message));
  await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({cash:99999,correct:70,franchises:1,up:{shelf:0,tech:0,counsel:0,library:0,robot:0}})); });
  await p.goto('file://'+process.cwd()+'/corner-rx.html');
  for (const id of ['shelf','tech','counsel','library','robot']) { for(let k=0;k<3;k++){ await p.click(`[data-buy="${id}"]`);} }
  await p.click('.chip[data-cat="CALC"]');
  await p.waitForTimeout(600);
  await p.screenshot({ path:'eco.png', fullPage:true });
  console.log('cash text', await p.textContent('#cashv'), 'tips', await p.textContent('#pasv'));
  await p.click('#frbtn'); await p.click('#frbtn');
  console.log('after franchise', await p.textContent('.store-name'));
  console.log('ERRORS', JSON.stringify(errs));
  await b.close();
})();
