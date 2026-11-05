const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const p = await b.newPage({ viewport:{width:1000,height:700} }); p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"normal",gender:"n",hair:0,hairColor:0,skin:1,scrub:0},served:2})); });
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.waitForTimeout(500);
  const g0=await p.evaluate(()=>World._dbg());
  await p.mouse.move(300,300); await p.mouse.down(); await p.mouse.move(380,340,{steps:6}); await p.mouse.up();
  const g1=await p.evaluate(()=>World._dbg());
  console.log('drag: gth',g0.gth.toFixed(3),'->',g1.gth.toFixed(3),' gph',g0.gph.toFixed(3),'->',g1.gph.toFixed(3));
  // tap (no movement) should not be treated as a drag
  await p.waitForTimeout(400);
  await p.mouse.click(300,300); const g2=await p.evaluate(()=>World._dbg());
  console.log('tap leaves view:',g2.gth===g1.gth);
  // wheel zoom
  await p.mouse.wheel(0,300); await p.waitForTimeout(50); console.log('zoom', g1.grad, '->', (await p.evaluate(()=>World._dbg())).grad);
  // touch pinch via CDP
  const c=await p.context().newCDPSession(p);
  const tp=(t,pts)=>c.send('Input.dispatchTouchEvent',{type:t,touchPoints:pts.map((q,i)=>({x:q[0],y:q[1],id:i}))});
  const z0=(await p.evaluate(()=>World._dbg())).grad;
  await tp('touchStart',[[400,300],[500,300]]); await tp('touchMove',[[350,300],[550,300]]); await tp('touchEnd',[]);
  console.log('pinch out grad', z0.toFixed(2),'->',(await p.evaluate(()=>World._dbg())).grad.toFixed(2));
  const t0=await p.evaluate(()=>World._dbg().gth);
  await tp('touchStart',[[300,300]]); await tp('touchMove',[[360,330]]); await tp('touchEnd',[]);
  console.log('touch drag gth', t0.toFixed(3),'->',(await p.evaluate(()=>World._dbg().gth)).toFixed(3));
  console.log('ERR',errs); await b.close();
})();
