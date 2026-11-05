const { chromium, devices } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  for (const [name,vp,touch] of [['phone',{width:390,height:844},true],['land',{width:844,height:390},true],['desk',{width:1280,height:800},false]]) {
    const ctx = await b.newContext({ viewport:vp, hasTouch:touch, isMobile:touch, deviceScaleFactor:2 });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name+': '+e.message));
    await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
    await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:2,cash:500})); });
    await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.waitForTimeout(700);
    const m = await p.evaluate(()=>({fx:document.body.classList.contains('fx'),sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,sh:document.documentElement.scrollHeight,ch:document.documentElement.clientHeight,stage:document.querySelector('#stage').getBoundingClientRect().toJSON()}));
    console.log(name, JSON.stringify({fx:m.fx,hscroll:m.sw>m.cw,vscroll:m.sh>m.ch,stage:[m.stage.width,m.stage.height]}));
    await p.screenshot({path:`fx_${name}.png`});
    await p.$eval('[data-act="drawer"]',e=>e.click()); await p.waitForTimeout(450); await p.screenshot({path:`fx_${name}_drawer.png`});
    await p.$eval('[data-act="drawer-close"]',e=>e.click()); await p.waitForTimeout(400);
    if (name==='phone') { await p.$eval('#qgrab',e=>e.click()); await p.waitForTimeout(200); console.log('min', await p.$eval('#qpanel',e=>e.className+' h='+Math.round(e.getBoundingClientRect().height))); await p.screenshot({path:'fx_phone_min.png'}); }
    await ctx.close();
  }
  console.log('ERR',errs); await b.close();
})();
