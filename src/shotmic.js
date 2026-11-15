const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 1 });
  await p.route('**/three.min.js', r => r.fulfill({ path: 'three-stub2.js', contentType: 'text/javascript' }));
  await p.addInitScript(() => { localStorage.setItem('cornerRx.v1', JSON.stringify({ me: { done: true, name: 'T', look: {} }, served: 40, correct: 25, tutDone: true, playSec: 999, boardAsked: true, binBug: true, set: { topics: {} }, mic: { st: { cns: { d: 1, f: 1 }, uti: { d: 1 } }, mode: 'drag', set: 'body' } })); localStorage.setItem('rxNet', '{"off":1}'); });
  await p.goto('file://' + process.cwd() + '/corner-rx.html?noconf=1'); await p.waitForTimeout(900);
  await p.evaluate(() => { document.querySelectorAll('.tour,.unlock').forEach(e => e.remove()); document.querySelector('#menu [data-act="mic"]').click(); document.querySelector('.mpin[data-v="bone"]').click(); });
  await p.waitForTimeout(200); const d = process.argv[2];
  await p.screenshot({ path: d + '/m1.png', fullPage: false });
  const el = await p.$('#qpanel'); await el.screenshot({ path: d + '/m1p.png' });
  await p.evaluate(() => { document.querySelector('.mpin[data-v="uti"]').click(); document.querySelector('[data-act="mic-go"][data-v="uti"]').click(); }); await p.waitForTimeout(200);
  const el2 = await p.$('#qpanel'); await el2.screenshot({ path: d + '/m2p.png' });
  await b.close();
})();
