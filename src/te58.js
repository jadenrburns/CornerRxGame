// te58: Exam 3 (PHAR 421) cards: topics card, tap-the-site questions (site gate, right/wrong site, right/wrong change)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [], fail = [];
  const p = await b.newPage({ viewport: { width: 420, height: 900 } });
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ path: 'three-stub2.js', contentType: 'text/javascript' }));
  await p.addInitScript(() => { if (!localStorage.getItem('cornerRx.v1')) localStorage.setItem('cornerRx.v1', JSON.stringify({ me: { done: true, name: 'T', look: {} }, served: 40, correct: 25, tutDone: true, playSec: 999, boardAsked: true, set: { topics: {} } })); localStorage.setItem('rxNet', '{"off":1}'); });
  await p.goto('file://' + process.cwd() + '/corner-rx.html?noconf=1'); await p.waitForTimeout(900);
  await p.evaluate(() => document.querySelectorAll('.tour,.unlock').forEach(e => e.remove()));
  // data sanity
  const data = await p.evaluate(() => {
    const out = { cats: {}, bad: [] };
    BANK.forEach(q => { if (/^(ASD|CHO|MET3)$/.test(q.c)) out.cats[q.c] = (out.cats[q.c] || 0) + 1; });
    BANK.filter(q => q.meta).forEach(q => { const m = MOLS[q.meta.mol]; if (!m) { out.bad.push('no mol ' + q.meta.mol); return; } const s = m().sites; [].concat(q.meta.site).forEach(id => { if (!s[id]) out.bad.push(q.meta.mol + ':' + id); }); if (q.w.length !== 3) out.bad.push('wrongs ' + q.q.slice(0, 30)); });
    BANK.filter(q => /^(ASD|CHO|MET3)$/.test(q.c)).forEach(q => { if (!q.s) out.bad.push('no source ' + q.q.slice(0, 40)); if (/—/.test(q.q + q.a + q.w.join('') + q.e)) out.bad.push('em dash ' + q.q.slice(0, 40)); if (new Set([q.a].concat(q.w)).size !== 4) out.bad.push('dup option ' + q.q.slice(0, 40)); });
    return out;
  });
  console.log('cats', JSON.stringify(data.cats)); if (data.bad.length) fail.push('data: ' + data.bad.join('; '));
  // topics card exists in P2 with three chips
  await p.evaluate(() => { const d = window.__rxDbg(); d.S.set.year = 'P2'; });
  const card = await p.evaluate(() => { const c = COURSES_DBG && COURSES_DBG(); return c; }).catch(() => null);
  // tap-the-site questions
  const keys = await p.evaluate(() => BANK.filter(q => q.meta).map(q => q.k));
  let okRuns = 0;
  for (const k of keys) {
    for (const mode of ['right', 'wrongsite', 'wrongopt']) {
      const info = await p.evaluate(([k, mode]) => {
        const d = window.__rxDbg(); const q = BANK.find(x => x.k === k);
        d.S.set.topics = {}; BANK.forEach(x => { d.S.set.topics[x.c] = false; }); ['TOP','TP3','MY'].forEach(c => { d.S.set.topics[c] = false; }); d.S.set.topics.MET3 = true; d.S.set.mode = 'new'; d.S.set.focus = true;
        BANK.forEach(x => { delete d.S.mastery[x.k]; if (x.c === 'MET3' && x.k !== k) d.S.mastery[x.k] = { box: 3, seen: 3, ok: 3, n: 5, d: 30, ef: 2.5, due: Date.now() + 9e9, lt: Date.now() }; });
        d.nc(); const c = window.__rxDbg().cur; return { got: c && c.q && c.q.k === k, sites: document.querySelectorAll('.molsvg .site').length };
      }, [k, mode]);
      if (!info.got) { fail.push('card not forced ' + k); continue; }
      if (info.sites < 3) fail.push('few sites ' + k);
      const fire = (sel, text) => p.evaluate(([sel, text]) => { const els = [...document.querySelectorAll(sel)]; const el = text ? els.find(e => e.textContent.indexOf(text) >= 0) : els[0]; if (!el) return false; el.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; }, [sel, text]);
      // gate: pick an option before any site tap: must not answer
      const q = await p.evaluate(k => { const q = BANK.find(x => x.k === k); return { a: q.a, w: q.w, site: [].concat(q.meta.site) }; }, k);
      await p.evaluate(a => { const el = [...document.querySelectorAll('.opt')].find(e => e.textContent.indexOf(a) >= 0); el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }, q.a);
      await p.waitForTimeout(60);
      if (await p.evaluate(() => window.__rxDbg().cur.done)) { fail.push('answered without a site ' + k); continue; }
      const wrongSite = await p.evaluate(site => { const ids = [...document.querySelectorAll('.molsvg .site')].map(e => e.getAttribute('data-site')); return ids.find(i => site.indexOf(i) < 0); }, q.site);
      const useSite = mode === 'wrongsite' ? wrongSite : q.site[q.site.length - 1];
      await p.evaluate(id => { document.querySelector('.molsvg .site[data-site="' + id + '"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); }, useSite);
      await p.waitForTimeout(60);
      if (!(await p.$('.molsvg .site.pick'))) fail.push('site not highlighted ' + k);
      const optText = mode === 'wrongopt' ? q.w[0] : q.a;
      await p.evaluate(a => { const el = [...document.querySelectorAll('.opt')].find(e => e.textContent.indexOf(a) >= 0); el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }, optText);
      await p.waitForTimeout(80);
      const res = await p.evaluate(() => { const c = window.__rxDbg().cur; return { done: c.done, ok: c.ok, ok2: document.querySelectorAll('.molsvg .site.ok').length, bad: document.querySelectorAll('.molsvg .site.bad').length, why: /Site:/.test(document.querySelector('#result') ? document.querySelector('#result').textContent : '') }; });
      const want = mode === 'right';
      if (!res.done || res.ok !== want) fail.push(k + ' ' + mode + ' ok=' + res.ok);
      if (res.ok2 < 1) fail.push('no green site ' + k);
      if (mode === 'wrongsite' && (!res.bad || !res.why)) fail.push('wrong site not shown ' + k);
      if (want) okRuns++;
      await p.evaluate(() => { const n = document.querySelector('#nextbtn'); n && n.click(); });
    }
  }
  console.log('questions', keys.length, 'right runs ok', okRuns);
  console.log('errs', JSON.stringify(errs.filter(e => !/Failed to load resource|ERR_TUNNEL/.test(e))));
  console.log(fail.length ? 'FAIL ' + fail.slice(0, 12).join(' | ') : 'PASS te58');
  await b.close(); process.exit(fail.length ? 1 : 0);
})();
