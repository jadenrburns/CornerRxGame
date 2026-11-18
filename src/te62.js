// te62: GABA-A demo in the Synapse lab (IPSP vs shunting): buttons, canvas trace, 3D mode hook, clean exit
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1000, height: 760 } }); const p = await ctx.newPage(); const errs = [], fail = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(process.env.THREE_JS || 'three-stub2.js', 'utf8') }));
  await p.addInitScript(() => { if (!localStorage.getItem('cornerRx.v1')) localStorage.setItem('cornerRx.v1', JSON.stringify({ me: { done: true, body: 'normal', gender: 'n', hair: 0, hairColor: 0, skin: 1, scrub: 0 }, served: 30, correct: 12, tutDone: true, playSec: 999, boardAsked: true })); });
  await p.goto('file://' + process.cwd() + '/corner-rx.html?dev=1&noconf=1'); await p.waitForTimeout(800);
  await p.evaluate(() => document.querySelector('.brainTag').click()); await p.waitForTimeout(600);
  for (const m of ['ipsp', 'shunt']) {
    await p.evaluate(v => document.querySelector('[data-act=syn-gaba][data-v=' + v + ']').click(), m); await p.waitForTimeout(700);
    const r = await p.evaluate(() => ({ cv: !!document.getElementById('gabacv'), txt: (document.getElementById('gabard') || {}).textContent || '', pressed: [...document.querySelectorAll('[data-act=syn-gaba]')].map(x => x.getAttribute('aria-pressed')).join() }));
    console.log(m, r); if (!r.cv || !r.txt) fail.push(m + ' no canvas/text');
    if (process.env.SHOT_DIR) { await p.waitForTimeout(4200); await p.screenshot({ path: process.env.SHOT_DIR + '/gaba-' + m + '.png' }); }
  }
  await p.evaluate(() => document.querySelector('[data-act=syn-gaba][data-v=shunt]').click()); await p.waitForTimeout(300);
  if (await p.evaluate(() => !!document.getElementById('gabacv'))) fail.push('toggle off did not stop');
  await p.evaluate(() => document.querySelector('[data-act=syn-gaba][data-v=ipsp]').click()); await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('[data-act=back]').click()); await p.waitForTimeout(500);
  if (await p.evaluate(() => World.synOn())) fail.push('still in synapse');
  console.log('errs', errs); console.log(fail.length || errs.length ? 'FAIL ' + fail : 'PASS te62'); await b.close();
})();
