// te54: Topics menu v120 (course cards, quick picks, find box, Settings tab)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 400, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ path: 'three-stub2.js', contentType: 'text/javascript' }));
  const SEED = JSON.stringify({ me: { done: true, name: 'T', look: {} }, served: 30, correct: 25, tutDone: true, playSec: 999, set: { topics: { PT4: false } } });
  // seed the save from the page itself, not an init script: init scripts re-run on reload and a file:// quirk sometimes makes localStorage read empty there, which would wipe the save under test
  await p.goto('file://' + process.cwd() + '/corner-rx.html?noconf=1'); await p.evaluate(s => localStorage.setItem('cornerRx.v1', s), SEED);
  await p.goto('file://' + process.cwd() + '/corner-rx.html?noconf=1'); await p.waitForTimeout(800);
  await p.evaluate(() => document.querySelectorAll('.tour,.unlock').forEach(e => e.remove()));
  const act = async (a, v) => { await p.evaluate(([a, v]) => { const el = [...document.querySelectorAll('[data-act="' + a + '"]')].find(e => v === undefined || e.dataset.v === v); if (!el) throw new Error('no ' + a + ' ' + v); el.click(); }, [a, v]); await p.waitForTimeout(250); };
  const chips = async () => { await p.waitForTimeout(450); return p.evaluate(() => JSON.parse(localStorage.getItem('cornerRx.v1')).set.topics); };
  const fail = [];
  await act('settings');
  const tabs = await p.evaluate(() => [...document.querySelectorAll('.hubtabs [role=tab]')].map(e => e.textContent.trim()));
  if (tabs.join() !== 'Topics,Settings,My studies') fail.push('tabs ' + tabs);
  const cards = await p.evaluate(() => [...document.querySelectorAll('.crs')].map(e => e.dataset.crs + ':' + e.querySelector('.crsst').textContent));
  console.log('cards', cards);
  if (cards.length !== 3 || !/p443:3 of 4 on/.test(cards.join()) || !/core:all 10 on/.test(cards.join())) fail.push('P2 cards ' + cards);
  let c;
  // year tabs
  await act('year', 'P3');
  const p3 = await p.evaluate(() => [...document.querySelectorAll('.crs')].map(e => e.dataset.crs));
  if (p3.join() !== 'p3top,p553,core') fail.push('P3 cards ' + p3);
  const qp3 = await p.evaluate(() => [...document.querySelectorAll('.grp .chip[data-act]')].filter(e => /only/.test(e.dataset.act)).map(e => e.dataset.act + ':' + (e.dataset.v || '')));
  if (qp3.join() !== 'year-only:P3,week-only:p3,course-only:p3top,course-only:p553') fail.push('P3 quick picks ' + qp3);
  await act('year-only', 'P3'); c = await chips();
  if (!(c.TP3 && c.T553 && c.BG && !c.TOP && !c.TH3)) fail.push('year-only P3 ' + JSON.stringify(c));
  await act('year-only', 'P3'); c = await chips(); if (!(c.TOP && c.TH3 && !c.PT4)) fail.push('year-only undo ' + JSON.stringify(c));
  await act('year', 'P1');
  if (!(await p.evaluate(() => /Nothing is filed under P1/.test(document.querySelector('.crsl').textContent)))) fail.push('P1 empty note');
  await act('year', 'P2');
  // Only this course, then undo
  await act('course-only', 'p451'); c = await chips();
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
  await act('week-only', 'p2'); c = await chips();
  const wk = await p.evaluate(() => ({ only: document.querySelector('[data-act=week-only]').getAttribute('aria-pressed'), on: [...document.querySelectorAll('.p3sched li:not(.off):not([hidden])')].length }));
  if (!(c.TOP && !c.BG && !c.TH3 && wk.only === 'true')) fail.push('week-only ' + JSON.stringify([c, wk]));
  await act('week-only', 'p2'); c = await chips(); if (!(c.BG && c.TH3)) fail.push('week-only undo');
  // find box
  await p.fill('#tfind', 'week 9'); await p.waitForTimeout(200);
  const f = await p.evaluate(() => ({ cards: [...document.querySelectorAll('.crs:not([hidden])')].map(e => e.dataset.crs), rows: [...document.querySelectorAll('.p3sched li:not([hidden])')].map(e => e.querySelector('b').textContent), open: document.querySelector('.crs[data-crs=p443]').open, wkbody: !document.querySelector('.crs[data-crs=p443] .wkbody').hidden }));
  console.log('find', f);
  if (!(f.cards.join() === 'p443' && f.rows.length === 1 && /9/.test(f.rows[0]) && f.open && f.wkbody)) fail.push('find week 9 ' + JSON.stringify(f));
  await p.fill('#tfind', 'ibs'); await p.waitForTimeout(200);
  const f2 = await p.evaluate(() => ({ cards: [...document.querySelectorAll('.crs:not([hidden])')].map(e => e.dataset.crs), chips: [...document.querySelectorAll('.chip.tp:not([hidden])')].map(e => e.dataset.v) }));
  if (!(f2.cards.join() === 'p451' && f2.chips.join() === 'TH3F')) fail.push('find ibs ' + JSON.stringify(f2));
  await p.fill('#tfind', ''); await p.waitForTimeout(200);
  const f3 = await p.evaluate(() => ({ cards: document.querySelectorAll('.crs:not([hidden])').length, wkbody: document.querySelector('.crs[data-crs=p443] .wkbody').hidden }));
  if (!(f3.cards === 3 && f3.wkbody === true)) fail.push('find clear ' + JSON.stringify(f3));
  // collapse persists across a re-render and reload
  await p.evaluate(() => { document.querySelector('.crs[data-crs=core]').open = false; }); await p.waitForTimeout(100);
  await act('topic', 'BG');
  if (await p.evaluate(() => document.querySelector('.crs[data-crs=core]').open)) fail.push('collapse lost on re-render');
  await p.waitForTimeout(500); await p.reload(); await p.waitForTimeout(800); await p.evaluate(() => document.querySelectorAll('.tour,.unlock').forEach(e => e.remove())); await act('settings');
  if (await p.evaluate(() => document.querySelector('.crs[data-crs=core]').open)) fail.push('collapse lost on reload');
  await act('year', 'P3'); await p.waitForTimeout(500); await p.reload(); await p.waitForTimeout(800); await p.evaluate(() => document.querySelectorAll('.tour,.unlock').forEach(e => e.remove())); await act('settings');
  if ((await p.evaluate(() => document.querySelector('.ftab[aria-selected=true]').textContent.trim())) !== 'P3') fail.push('year lost on reload');
  await act('year', 'P2');
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
