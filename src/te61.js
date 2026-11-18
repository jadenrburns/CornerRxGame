// te61: Exam 3 cram category (EX3): copies keep their own mastery key, no excluded drugs, chip in the PHAR 421 card
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 400, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ path: 'three-stub2.js', contentType: 'text/javascript' }));
  const SEED = JSON.stringify({ me: { done: true, name: 'T', look: {} }, served: 30, correct: 25, tutDone: true, playSec: 999, boardAsked: true });
  await p.goto('file://' + process.cwd() + '/corner-rx.html?noconf=1'); await p.evaluate(s => localStorage.setItem('cornerRx.v1', s), SEED);
  await p.goto('file://' + process.cwd() + '/corner-rx.html?noconf=1'); await p.waitForTimeout(800);
  const fail = [];
  const r = await p.evaluate(() => {
    const ex = BANK.filter(q => q.c === 'EX3'), keys = new Set(BANK.map(q => q.k));
    return { n: ex.length, uniq: new Set(BANK.filter(q => q.c === 'EX3').map(q => q.k)).size === BANK.filter(q => q.c === 'EX3').length && BANK.filter(q => q.c === 'EX3' && q.kx).every(q => !BANK.some(o => o !== q && o.k === q.k)), bad: ex.filter(q => /zonisamide|felbamate/i.test(q.q + q.a + q.w.join() + q.e)).length, opts: ex.filter(q => new Set([q.a].concat(q.w)).size !== 4).length, meta: ex.filter(q => q.meta).length, cat: BANK.some(q => q.c === 'EX3') };
  });
  console.log(r);
  if (r.n < 120 || !r.uniq || r.bad || r.opts || r.meta < 5 || !r.cat) fail.push('bank ' + JSON.stringify(r));
  await p.evaluate(() => document.querySelectorAll('.tour,.unlock').forEach(e => e.remove()));
  await p.evaluate(() => { const el = document.querySelector('[data-act="settings"]'); if (el) el.click(); }); await p.waitForTimeout(400);
  const chip = await p.evaluate(() => { const c = document.querySelector('[data-crs="p421"]'); return c ? c.textContent.includes('Exam 3 cram') : false; });
  if (!chip) fail.push('no cram chip');
  console.log('errs', errs); console.log(fail.length || errs.length ? 'FAIL ' + fail : 'PASS'); await b.close();
})();
