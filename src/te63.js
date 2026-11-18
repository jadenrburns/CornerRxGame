// te63: wall decorations (photo, poster, clock replace the neon sign), rotation, old neon owners refunded, pets on the counter (real three.js needed for the drag part)
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const real = !!process.env.THREE_JS;
  const b = await chromium.launch(real ? { args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] } : {});
  const p = await b.newPage({ viewport: { width: 1100, height: 800 } }); const errs = [], fail = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(process.env.THREE_JS || 'three-stub2.js', 'utf8') }));
  const save = { me: { done: true, body: 'normal', gender: 'n', hair: 0, hairColor: 0, skin: 1, scrub: 0 }, served: 30, correct: 12, tutDone: true, playSec: 999, boardAsked: true, cash: 5000, store: { own: ['neon', 'rug', 'cooler', 'photo', 'poster', 'clock'], deco: ['neon', 'rug', 'cooler', 'photo', 'poster', 'clock'] }, awards: { pets: ['cat'] } };
  await p.addInitScript(s => { if (!localStorage.getItem('cornerRx.v1')) localStorage.setItem('cornerRx.v1', s); }, JSON.stringify(save));
  await p.goto('file://' + process.cwd() + '/corner-rx.html?dev=1&noconf=1'); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => { const S = __rxDbg().S; return { neon: S.store.own.includes('neon') || S.store.deco.includes('neon'), cash: S.cash, rot: !!S.store.rot, cats: SHOP_DECOR.map(d => d[0]).join() }; });
  console.log(r); if (r.neon || r.cash < 5700 || !r.rot || /neon/.test(r.cats) || !/photo,poster,clock/.test(r.cats)) fail.push('migration ' + JSON.stringify(r));
  // rotation
  const rot = await p.evaluate(() => { document.querySelector('[data-act=deco-rot]'); return null; });
  await p.evaluate(() => { const S = __rxDbg().S; S.store.rot = {}; });
  await p.evaluate(() => { const bt = document.createElement('button'); bt.dataset.act = 'deco-rot'; bt.dataset.v = 'cooler'; bt.dataset.d = '2'; document.body.appendChild(bt); bt.click(); bt.remove(); });
  const rr = await p.evaluate(() => __rxDbg().S.store.rot.cooler); console.log('cooler rot', rr); if (Math.abs(rr - Math.PI / 2) > 0.01) fail.push('rotate act ' + rr);
  if (real) {
    await p.evaluate(() => document.querySelectorAll('.tour,.unlock').forEach(e => e.remove())); await p.waitForTimeout(1500);
    const info = await p.evaluate(() => World.petsInfo()); const cat = info.find(x => x.kind === 'cat'); console.log('cat', cat);
    const tgt = await p.evaluate(() => World.screenOf(-2, 1.4, 0.3)); console.log('counter px', tgt);
    await p.mouse.move(cat.sx, cat.sy); await p.mouse.down(); await p.mouse.move(cat.sx + 20, cat.sy - 20, { steps: 4 }); await p.mouse.move(tgt.x, tgt.y, { steps: 12 }); await p.waitForTimeout(100); await p.mouse.up(); await p.waitForTimeout(1500);
    const after = await p.evaluate(() => ({ pets: World.petsInfo(), on: __rxDbg().S.store.petOn })); console.log('after', JSON.stringify(after));
    if (!after.on || !after.on.cat) fail.push('pet not saved on counter');
    if (process.env.SHOT_DIR) await p.screenshot({ path: process.env.SHOT_DIR + '/counter-pet.png' });
  }
  console.log('errs', errs); console.log(fail.length || errs.length ? 'FAIL ' + fail : 'PASS te63'); await b.close();
})();
