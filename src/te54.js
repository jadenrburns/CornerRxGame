// te54: Topics menu v120 (course cards, quick picks, find box, Settings tab)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 400, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ path: 'three-stub2.js', contentType: 'text/javascript' }));
  await p.addInitScript(() => { if (!localStorage.getItem('cornerRx.v1')) localStorage.setItem('cornerRx.v1', JSON.stringify({ me: { done: true, name: 'T', look: {} }, served: 30, correct: 25, tutDone: true, playSec: 999, set: { topics: { PT4: false } } })); });
  await p.goto('file://' + process.cwd() + '/corner-rx.html?noconf=1'); await p.waitForTimeout(800);
  await p.evaluate(() => document.querySelectorAll('.tour,.unlock').forEach(e => e.remove()));
  const act = async (a, v) => { await p.evaluate(([a, v]) => { const el = [...document.querySelectorAll('[data-act="' + a + '"]')].find(e => v === undefined || e.dataset.v === v); if (!el) throw new Error('no ' + a + ' ' + v); el.click(); }, [a, v]); await p.waitForTimeout(250); };
  const chips = () => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('.chip.tp')].map(e => [e.dataset.v, e.getAttribute('aria-pressed') === 'true'])));
  const fail = [];
  await act('settings');
  const tabs = await p.evaluate(() => [...document.querySelectorAll('.hubtabs [role=tab]')].map(e => e.textContent.trim()));
  if (tabs.join() !== 'Topics,Settings,My studies') fail.push('tabs ' + tabs);
  const cards = await p.evaluate(() => [...document.querySelectorAll('.crs')].map(e => e.dataset.crs + ':' + e.querySelector('.crsst').textContent));
  console.log('cards', cards);
  if (cards.length !== 5 || !/p443:3 of 4 on/.test(cards.join())) fail.push('cards ' + cards);
  // Only this course, then undo
  await act('course-only', 'p451'); let c = await chips();
  if (!(c.TH3 && c.GER && !c.BG && !c.TOP && !c.TP3)) fail.push('course-only p451 ' + JSON.stringify(c));
  const armed = await p.evaluate(() => [...document.querySelectorAll('[data-act=course-only][aria-pressed=true]')].map(e => e.dataset.v));
  if (armed.join() !== 'p451') fail.push('quick pick pressed ' + armed);
  await act('course-only', 'p451'); c = await chips();
  if (!(c.BG && c.TOP && c.TP3 && !c.PT4)) fail.push('undo only did not restore (PT4 should stay off) ' + JSON.stringify(c));
  // course none / all
  await act('course-none', 'core'); c = await chips(); if (c.BG || c.CALC) fail.push('course-none');
  if (!/core:off/.test((await p.evaluate(() => [...document.querySelectorAll('.crs')].map(e => e.dataset.crs + ':' + e.querySelector('.crsst').textContent))).join())) fail.push('status off');
  await act('course-all', 'core'); c = await chips(); if (!(c.BG && c.CALC)) fail.push('course-all');
  // week only
  await act('week-only'); c = await chips();
  const wk = await p.evaluate(() => ({ only: document.querySelector('[data-act=week-only]').getAttribute('aria-pressed'), on: [...document.querySelectorAll('.p3sched li:not(.off):not([hidden])')].length }));
  if (!(c.TOP && !c.BG && !c.TH3 && wk.only === 'true')) fail.push('week-only ' + JSON.stringify([c, wk]));
  await act('week-only'); c = await chips(); if (!(c.BG && c.TH3)) fail.push('week-only undo');
  // find box
  await p.fill('#tfind', 'week 9'); await p.waitForTimeout(200);
  const f = await p.evaluate(() => ({ cards: [...document.querySelectorAll('.crs:not([hidden])')].map(e => e.dataset.crs), rows: [...document.querySelectorAll('.p3sched li:not([hidden])')].map(e => e.querySelector('b').textContent), open: document.querySelector('.crs[data-crs=p443]').open, wkbody: !document.querySelector('.crs[data-crs=p443] .wkbody').hidden }));
  console.log('find', f);
  if (!(f.cards[0] === 'p443' && f.cards.indexOf('core') < 0 && f.rows.length <= 2 && /9/.test(f.rows[0]) && f.open && f.wkbody)) fail.push('find week 9 ' + JSON.stringify(f));
  await p.fill('#tfind', 'ibs'); await p.waitForTimeout(200);
  const f2 = await p.evaluate(() => ({ cards: [...document.querySelectorAll('.crs:not([hidden])')].map(e => e.dataset.crs), chips: [...document.querySelectorAll('.chip.tp:not([hidden])')].map(e => e.dataset.v) }));
  if (!(f2.cards.join() === 'p451' && f2.chips.join() === 'TH3F')) fail.push('find ibs ' + JSON.stringify(f2));
  await p.fill('#tfind', ''); await p.waitForTimeout(200);
  const f3 = await p.evaluate(() => ({ cards: document.querySelectorAll('.crs:not([hidden])').length, wkbody: document.querySelector('.crs[data-crs=p443] .wkbody').hidden }));
  if (!(f3.cards === 5 && f3.wkbody === true)) fail.push('find clear ' + JSON.stringify(f3));
  // collapse persists across a re-render and reload
  await p.evaluate(() => { document.querySelector('.crs[data-crs=core]').open = false; }); await p.waitForTimeout(100);
  await act('topic', 'BG');
  if (await p.evaluate(() => document.querySelector('.crs[data-crs=core]').open)) fail.push('collapse lost on re-render');
  await p.waitForTimeout(500); await p.reload(); await p.waitForTimeout(800); await p.evaluate(() => document.querySelectorAll('.tour,.unlock').forEach(e => e.remove())); await act('settings');
  if (await p.evaluate(() => document.querySelector('.crs[data-crs=core]').open)) fail.push('collapse lost on reload');
  // settings tab
  await act('tab-opts');
  const o = await p.evaluate(() => ({ title: document.querySelector('.nbtitle').textContent, modes: document.querySelectorAll('[data-act=mode]').length, diffs: document.querySelectorAll('[data-act=diff]').length, topics: document.querySelectorAll('.chip.tp').length }));
  if (!(o.title === 'Settings' && o.modes === 4 && o.diffs === 3 && o.topics === 0)) fail.push('opts ' + JSON.stringify(o));
  await act('mode', 'new'); if ((await p.evaluate(() => document.querySelector('[data-act=mode][aria-pressed=true]').dataset.v)) !== 'new') fail.push('mode change');
  await act('back'); await p.waitForTimeout(500);
  if (await p.evaluate(() => !!document.querySelector('.nbk'))) fail.push('notebook did not close');
  console.log('fail', fail); console.log('errs', errs.length ? errs : []);
  await b.close();
})();
