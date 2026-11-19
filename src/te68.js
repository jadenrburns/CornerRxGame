const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.rxNet = '{"off":1}'; });
  await p.route('**/three*', r => r.fulfill({ path: require('path').join(__dirname, 'three-stub2.js'), contentType: 'text/javascript' }));
  await p.goto('file://' + __dirname + '/corner-rx.html?noconf=1'); await p.waitForTimeout(800);
  const r = await p.evaluate(() => { const b = document.getElementById('musbtn'); return { has: !!b, p: b && b.getAttribute('aria-pressed'), t: document.getElementById('muslab').textContent }; });
  console.log('start', JSON.stringify(r));
  await p.mouse.click(5, 5); await p.waitForTimeout(500);
  await p.evaluate(() => document.getElementById('musbtn').click()); await p.waitForTimeout(300);
  console.log('off', JSON.stringify(await p.evaluate(() => ({ p: document.getElementById('musbtn').getAttribute('aria-pressed'), t: document.getElementById('muslab').textContent, s: JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => /rx|corner/i.test(k) && k !== 'rxNet')) || '{}').music }))));
  await p.evaluate(() => document.getElementById('musbtn').click()); await p.waitForTimeout(1500);
  console.log('on', await p.evaluate(() => document.getElementById('musbtn').getAttribute('aria-pressed')));
  console.log('errs', JSON.stringify(errs)); await b.close();
})();
