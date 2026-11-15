// te59: Microbe lab (trash can): data sanity, drag/tap placement, fill in the blank, stars, bin cleaning bonus
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [], fail = [];
  const p = await b.newPage({ viewport: { width: 420, height: 900 } });
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ path: 'three-stub2.js', contentType: 'text/javascript' }));
  await p.addInitScript(() => { if (!localStorage.getItem('cornerRx.v1')) localStorage.setItem('cornerRx.v1', JSON.stringify({ me: { done: true, name: 'T', look: {} }, served: 40, correct: 25, tutDone: true, playSec: 999, boardAsked: true, set: { topics: {} } })); localStorage.setItem('rxNet', '{"off":1}'); });
  await p.goto('file://' + process.cwd() + '/corner-rx.html?noconf=1'); await p.waitForTimeout(900);
  await p.evaluate(() => document.querySelectorAll('.tour,.unlock').forEach(e => e.remove()));
  // data
  const data = await p.evaluate(() => {
    const bad = []; let groups = 0;
    MICSETS.forEach(s => s.groups.forEach(g => {
      groups++; if (!g.items.length) bad.push('empty ' + g.id);
      if (new Set(g.items.map(micNorm)).size !== g.items.length) bad.push('dup ' + g.id);
      for (let i = 0; i < 5; i++) { const d = micDecoys(s, g, 3, Math.random); const keys = g.items.map(micNorm); d.forEach(x => { if (keys.indexOf(micNorm(x)) >= 0) bad.push('decoy in list ' + g.id + ': ' + x); }); if (d.length < 2 && !g.decoyFree) bad.push('few decoys ' + g.id); }
      g.items.forEach((t, j) => { if (!micMatch(t, t, (g.al && g.al[j]) || [])) bad.push('self match ' + t); });
    }));
    return { bad, groups, ec: micMatch('e coli', 'Escherichia coli', []), tp: micMatch('staphylococus aureus', 'Staphylococcus aureus', []), no: micMatch('klebsiella', 'Escherichia coli', []) };
  });
  console.log('groups', data.groups, 'ecoli', data.ec, 'typo', data.tp, 'neg', data.no);
  if (data.bad.length) fail.push('data: ' + data.bad.slice(0, 8).join('; '));
  if (!data.ec) fail.push('E. coli alias'); if (data.no) fail.push('false match');
  // man svg + menu
  await p.evaluate(() => document.querySelector('#menu [data-act="mic"]').click());
  await p.waitForTimeout(100);
  let r = await p.evaluate(() => ({ view: window.__rxDbg().view, solo: !!document.querySelector('.micbody.solo'), man: !!document.querySelector('.micman'), pins: document.querySelectorAll('.mpin').length, lab: window.__rxDbg().micDbg().inLab, ok: World.ok }));
  console.log('menu', JSON.stringify(r)); if (r.view !== 'mic' || (r.ok ? (!r.solo || !r.lab) : (!r.man || r.pins < 12))) fail.push('menu ' + JSON.stringify(r));
  const clickSel = (sel, txt) => p.evaluate(([s, t]) => { const els = [...document.querySelectorAll(s)]; const el = t ? els.find(e => e.textContent.indexOf(t) >= 0) : els[0]; if (!el) return false; el.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; }, [sel, txt]);
  // drag mode with tap, tap on the CNS site, one wrong dish first
  await p.evaluate(() => { window.__rxDbg().micDbg().sel('cns'); });
  await clickSel('[data-act="mic-go"][data-v="cns"]');
  await p.waitForTimeout(80);
  const cns = await p.evaluate(() => { const g = MICSETS[0].groups.find(x => x.id === 'cns'); return { items: g.items.map(micNorm), slots: document.querySelectorAll('.mslot').length, dishes: [...document.querySelectorAll('.petri')].map(e => ({ id: +e.dataset.chip, k: micNorm(e.querySelector('span').textContent) })) }; });
  if (cns.slots !== cns.items.length) fail.push('slots ' + cns.slots);
  const wrong = cns.dishes.find(d => cns.items.indexOf(d.k) < 0), right = cns.dishes.filter(d => cns.items.indexOf(d.k) >= 0);
  if (!wrong) fail.push('no wrong dish'); if (right.length !== cns.items.length) fail.push('right dishes');
  await clickSel('.petri[data-chip="' + wrong.id + '"]'); await clickSel('.mslot[data-slot="0"]');
  let mist = await p.evaluate(() => document.querySelector('.note b').textContent); if (mist !== '1') fail.push('miss not counted ' + mist);
  // a real mouse drag for the first right dish, then taps for the rest
  const box = async sel => p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
  const a = await box('.petri[data-chip="' + right[0].id + '"]'), s0 = await box('.mslot[data-slot="0"]');
  await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move((a.x + s0.x) / 2, (a.y + s0.y) / 2, { steps: 4 }); await p.mouse.move(s0.x, s0.y, { steps: 4 }); await p.mouse.up();
  await p.waitForTimeout(80);
  const filled = await p.evaluate(() => document.querySelectorAll('.mslot.full').length); if (filled !== 1) fail.push('drag did not fill slot (' + filled + ')');
  const cash0 = await p.evaluate(() => window.__rxDbg().S.cash);
  await p.evaluate(() => { const d = window.__rxDbg(); d.S.binBug = true; });
  for (let i = 1; i < right.length; i++) { await clickSel('.petri[data-chip="' + right[i].id + '"]'); await clickSel('.mslot:not(.full)'); }
  await p.waitForTimeout(100);
  r = await p.evaluate(() => ({ done: !!document.querySelector('.result'), txt: (document.querySelector('.result') || {}).textContent || '', cash: window.__rxDbg().S.cash, bug: window.__rxDbg().S.binBug, st: window.__rxDbg().S.mic.st.cns }));
  console.log('drag round', JSON.stringify({ done: r.done, cash: r.cash - cash0, bug: r.bug, st: r.st }));
  if (!r.done || r.cash <= cash0) fail.push('drag round not paid'); if (r.bug) fail.push('bin not cleaned'); if (!/cleaned/.test(r.txt)) fail.push('no cleaned note');
  if (r.st && r.st.d) fail.push('star given with a miss');
  // perfect fill round earns star
  await clickSel('[data-act="mic-menu"]'); await clickSel('[data-act="mic-mode"][data-v="fill"]');
  await clickSel('[data-act="mic-go"][data-v="cns"]'); await p.waitForTimeout(80);
  const n = await p.evaluate(() => document.querySelectorAll('.mfill input').length);
  const items = await p.evaluate(() => MICSETS[0].groups.find(x => x.id === 'cns').items);
  if (n !== items.length) fail.push('inputs ' + n);
  await p.fill('.mfill input[data-fill="0"]', 'zzz not a bug'); await clickSel('[data-act="mic-check"]');
  mist = await p.evaluate(() => document.querySelector('.note b').textContent); if (mist !== '1') fail.push('fill miss ' + mist);
  for (let i = 0; i < n; i++) { await p.fill('.mfill input[data-fill="' + i + '"]', items[i].replace(/ \(.*\)$/, '').replace(/^(\w)\w+ /, '$1. ').toLowerCase()); }
  await clickSel('[data-act="mic-check"]'); await p.waitForTimeout(80);
  r = await p.evaluate(() => ({ done: !!document.querySelector('.result'), st: window.__rxDbg().S.mic.st.cns }));
  console.log('fill (with a miss)', JSON.stringify(r)); if (!r.done) fail.push('fill not finished');
  if (r.st.f) fail.push('fill star with a miss');
  await clickSel('[data-act="mic-again"]'); await p.waitForTimeout(80);
  for (let i = 0; i < n; i++) await p.fill('.mfill input[data-fill="' + i + '"]', items[i].replace(/ \(.*\)$/, '').toLowerCase());
  await clickSel('[data-act="mic-check"]'); await p.waitForTimeout(80);
  r = await p.evaluate(() => ({ done: !!document.querySelector('.result'), st: window.__rxDbg().S.mic.st.cns, txt: document.querySelector('.result h3').textContent }));
  console.log('perfect fill', JSON.stringify(r)); if (!r.done || !r.st.f) fail.push('perfect fill star'); 
  // resistant set + give up pays nothing
  await clickSel('[data-act="mic-menu"]'); await clickSel('[data-act="mic-set"][data-v="res"]');
  await clickSel('.microw'); await p.waitForTimeout(80);
  const c1 = await p.evaluate(() => window.__rxDbg().S.cash); await clickSel('[data-act="mic-reveal"]'); await p.waitForTimeout(80);
  const c2 = await p.evaluate(() => window.__rxDbg().S.cash); if (c2 !== c1) fail.push('give up paid');
  // back to counter, bin hook
  await clickSel('[data-act="back"]'); await p.waitForTimeout(80);
  const v = await p.evaluate(() => window.__rxDbg().view); if (v !== 'q') fail.push('back view ' + v);
  // old save without S.mic loads
  await p.evaluate(() => { const d = window.__rxDbg(); delete d.S.mic; });
  await clickSel('#menu [data-act="mic"]'); await p.waitForTimeout(80);
  if (!(await p.evaluate(() => !!document.querySelector('.micpane')))) fail.push('menu without S.mic');
  // sort rounds (labeled dishes): every drug has a valid dish; wrong drops are misses; all right earns a star
  await clickSel('[data-act="mic-menu"]'); await clickSel('[data-act="mic-mode"][data-v="drag"]');
  for (const sid of ['sort-man', 'sort-dis', 'sort-iv', 'sort-po', 'sort-all', 'sort-pk', 'sort-fam']) {
    const info = await p.evaluate(sid => { const d = window.__rxDbg().micDbg(); d.startSort(sid); const R = d.R; const wrongDish = R.dishes.find(x => R.chips[0].valid.indexOf(x.id) < 0); return { n: R.chips.length, noValid: R.chips.filter(c => !c.valid.length).length, dishes: R.dishes.length, wrong: wrongDish && wrongDish.id }; }, sid);
    if (info.noValid || info.n < 6) fail.push('sort chips ' + sid + ' ' + JSON.stringify(info));
    if (info.wrong) { await p.evaluate(w => { const d = window.__rxDbg().micDbg(); d.drop(0, w); }, info.wrong); const mm = await p.evaluate(() => window.__rxDbg().micDbg().R.mist); if (mm !== 1) fail.push('sort miss ' + sid); }
    await p.evaluate(() => { const d = window.__rxDbg().micDbg(); d.R.chips.forEach(c => { if (!c.used) d.drop(c.id, c.valid[0]); }); });
    const res = await p.evaluate(sid => ({ done: !!document.querySelector('.result'), st: window.__rxDbg().S.mic.st[sid] }), sid);
    if (!res.done) fail.push('sort not finished ' + sid); if (res.st && res.st.d) fail.push('sort star with a miss ' + sid);
    await p.evaluate(sid => { const d = window.__rxDbg().micDbg(); d.startSort(sid); d.R.chips.forEach(c => d.drop(c.id, c.valid[0])); }, sid);
    const res2 = await p.evaluate(sid => window.__rxDbg().S.mic.st[sid], sid); console.log('sort', sid, JSON.stringify(res2)); if (!res2 || !res2.d) fail.push('sort star ' + sid);
  }
  await clickSel('[data-act="mic-menu"]');
  // every group starts in both modes
  await clickSel('[data-act="back"]'); await clickSel('#menu [data-act="mic"]');
  const ids = await p.evaluate(() => MICSETS.reduce((a, s) => a.concat(s.groups.map(g => [s.id, g.id, g.items.length])), []));
  for (const mode of ['drag', 'fill']) {
    await clickSel('[data-act="mic-menu"]'); await clickSel('[data-act="mic-mode"][data-v="' + mode + '"]');
    for (const [sid, gid, cnt] of ids) {
      await clickSel('[data-act="mic-menu"]'); await clickSel('[data-act="mic-set"][data-v="' + sid + '"]'); if (sid === 'body') await p.evaluate(g => { window.__rxDbg().micDbg().sel(g); }, gid); await clickSel('[data-act="mic-go"][data-v="' + gid + '"]');
      const got = await p.evaluate(m => m === 'drag' ? [document.querySelectorAll('.mslot').length, document.querySelectorAll('.petri').length] : [document.querySelectorAll('.mfill input').length, 0], mode);
      if (got[0] !== cnt) fail.push(mode + ' ' + gid + ' count ' + got[0] + '/' + cnt);
      if (mode === 'drag' && got[1] < cnt) fail.push('dishes ' + gid);
    }
  }
  console.log('errs', JSON.stringify(errs)); console.log(fail.length ? 'FAIL ' + fail.join(' | ') : 'PASS te59');
  await b.close();
})();
