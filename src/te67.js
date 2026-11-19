// te67: P1 Biochemistry Exam 4: data checks and every drag-and-place card (right, wrong, empty, drag)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [], fail = [];
  const p = await b.newPage({ viewport: { width: 420, height: 900 } });
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ path: 'three-stub2.js', contentType: 'text/javascript' }));
  await p.addInitScript(() => { if (!localStorage.getItem('cornerRx.v1')) localStorage.setItem('cornerRx.v1', JSON.stringify({ me: { done: true, name: 'T', look: {} }, served: 40, correct: 25, tutDone: true, playSec: 999, boardAsked: true, set: { topics: {} } })); localStorage.setItem('rxNet', '{"off":1}'); });
  await p.goto('file://' + process.cwd() + '/corner-rx.html?noconf=1'); await p.waitForTimeout(900);
  await p.evaluate(() => document.querySelectorAll('.tour,.unlock').forEach(e => e.remove()));
  const data = await p.evaluate(() => {
    const cats = ['B4D', 'B4C', 'B4E', 'B4G', 'B4PD', 'B4PC', 'B4PE', 'B4PG'], out = { n: {}, longest: {}, bad: [] };
    BANK.filter(q => cats.indexOf(q.c) >= 0).forEach(q => {
      out.n[q.c] = (out.n[q.c] || 0) + 1;
      if (!q.s) out.bad.push('no source ' + q.q.slice(0, 40));
      if (/—/.test(q.q + q.a + q.w.join('') + q.e)) out.bad.push('em dash ' + q.q.slice(0, 40));
      if (!q.place) { if (new Set([q.a].concat(q.w)).size !== 4) out.bad.push('dup ' + q.q.slice(0, 40)); if (q.a.length > Math.max.apply(null, q.w.map(x => x.length))) out.longest[q.c] = (out.longest[q.c] || 0) + 1; }
    });
    return out;
  });
  const pct = {}; Object.keys(data.n).forEach(c => { if (!/^B4P/.test(c)) pct[c] = Math.round(100 * (data.longest[c] || 0) / data.n[c]) + '% of ' + data.n[c]; });
  const gsrc = require('fs').readFileSync('game.js', 'utf8'); ['B4D','B4C','B4E','B4G','B4PD','B4PC','B4PE','B4PG'].forEach(c => { if (gsrc.indexOf("['" + c + "', ") < 0 || gsrc.indexOf(c + ": '") < 0 || gsrc.indexOf(c + ": ['") < 0) fail.push('game.js meta missing for ' + c); });
  console.log('counts', JSON.stringify(data.n)); console.log('correct longest', JSON.stringify(pct));
  if (data.bad.length) fail.push('data: ' + data.bad.join('; '));
  const keys = await p.evaluate(() => BANK.filter(q => q.place).map(q => q.k));
  const force = (k) => p.evaluate(k => {
    const d = window.__rxDbg(); const q = BANK.find(x => x.k === k);
    d.S.set.topics = {}; BANK.forEach(x => { d.S.set.topics[x.c] = false; }); ['TOP', 'TP3', 'TP1', 'MY'].forEach(c => { d.S.set.topics[c] = false; }); d.S.set.topics[q.c] = true; d.S.set.mode = 'new'; d.S.set.focus = true;
    BANK.forEach(x => { delete d.S.mastery[x.k]; if (x.c === q.c && x.k !== k) d.S.mastery[x.k] = { box: 3, seen: 3, ok: 3, n: 5, d: 30, ef: 2.5, due: Date.now() + 9e9, lt: Date.now() }; });
    d.nc(); const c = window.__rxDbg().cur; return !!(c && c.q && c.q.k === k);
  }, k);
  const click = (sel, attr, val) => p.evaluate(([sel, attr, val]) => { const els = [...document.querySelectorAll(sel)]; const el = attr ? els.find(e => e.dataset[attr] === val) : els[0]; if (!el) return false; el.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; }, [sel, attr, val]);
  let rightOk = 0, wrongOk = 0;
  for (const k of keys) {
    for (const mode of ['right', 'wrong', 'empty']) {
      if (!(await force(k))) { fail.push('not forced ' + k); continue; }
      const q = await p.evaluate(k => { const q = BANK.find(x => x.k === k); const s = []; q.place.rows.forEach((r, ri) => r.forEach((x, pi) => { if (typeof x !== 'string') s.push({ id: ri + '.' + pi, a: x.a }); })); return { s, opts: document.querySelectorAll('.opt').length, hint: document.getElementById('hintbtn').disabled, chips: document.querySelectorAll('.pchip').length, slots: document.querySelectorAll('.pslot').length, conf: !!document.querySelector('.confbar') }; }, k);
      if (q.opts !== 0 || !q.hint || q.chips < 2 || q.slots !== q.s.length || q.conf) fail.push('card shape ' + k + ' ' + JSON.stringify({ o: q.opts, h: q.hint, c: q.chips, s: q.slots }));
      const fillN = mode === 'empty' ? q.s.length - 1 : q.s.length;
      for (let i = 0; i < fillN; i++) {
        let text = q.s[i].a;
        if (mode === 'wrong' && i === 0) text = await p.evaluate(a => { const c = [...document.querySelectorAll('.pchip')].find(e => e.dataset.chip !== a); return c.dataset.chip; }, text);
        await click('.pchip', 'chip', text);
        await click('.pslot', 'sid', q.s[i].id);
      }
      const go = await p.evaluate(() => document.getElementById('plgo').disabled);
      if (mode === 'empty') { if (!go) fail.push('Check enabled with a blank ' + k); await p.evaluate(() => { const n = document.querySelector('#nextbtn'); n && n.click(); }); continue; }
      if (go) { fail.push('Check disabled when full ' + k); continue; }
      await click('#plgo'); await p.waitForTimeout(60);
      const res = await p.evaluate(() => { const c = window.__rxDbg().cur; return { done: c.done, ok: c.ok, right: document.querySelectorAll('.pslot.right').length, wrong: document.querySelectorAll('.pslot.wrong').length }; });
      const want = mode === 'right';
      if (!res.done || res.ok !== want) fail.push(k + ' ' + mode + ' ok=' + res.ok);
      if (want && res.wrong) fail.push('red slot on a right card ' + k);
      if (!want && res.wrong < 1) fail.push('no red slot on a wrong card ' + k);
      if (want) rightOk++; else wrongOk++;
      await p.evaluate(() => { const n = document.querySelector('#nextbtn'); n && n.click(); });
    }
  }
  // clear a filled slot by tapping it, and a real pointer drag
  await force(keys[0]);
  await click('.pchip'); await click('.pslot');
  let st = await p.evaluate(() => document.querySelectorAll('.pslot.full').length);
  await click('.pslot.full'); const st2 = await p.evaluate(() => document.querySelectorAll('.pslot.full').length);
  if (st !== 1 || st2 !== 0) fail.push('tap fill/clear ' + st + ' ' + st2);
  const cb = await (await p.$('.pchip')).boundingBox(), sb = await (await p.$('.pslot')).boundingBox();
  await p.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2); await p.mouse.down(); await p.mouse.move(cb.x + 30, cb.y - 30, { steps: 4 }); await p.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(100);
  const dr = await p.evaluate(() => ({ full: document.querySelectorAll('.pslot.full').length, ghost: document.querySelectorAll('.pghost').length }));
  if (dr.full !== 1 || dr.ghost) fail.push('drag did not fill: ' + JSON.stringify(dr));
  console.log('place cards', keys.length, 'right ok', rightOk, 'wrong ok', wrongOk);
  await p.screenshot({ path: process.env.SHOT_DIR ? process.env.SHOT_DIR + '/place.png' : '/tmp/place.png' });
  console.log('errs', JSON.stringify(errs.filter(e => !/Failed to load resource|ERR_TUNNEL/.test(e))));
  if (fail.length) { console.log('FAIL', fail.slice(0, 20).join('\n')); process.exitCode = 1; } else console.log('PASS');
  await b.close();
})();
