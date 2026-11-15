// te56: online flags + leaderboard (v123) against a fake backend that mimics net/supabase.sql
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [], fail = [];
  process.on('unhandledRejection', e => { console.log('CRASH', e.message.split('\n')[0], 'fail so far:', JSON.stringify(fail), 'db:', JSON.stringify({ f: db.flags.length, s: Object.keys(db.scores), c: db.calls }), 'errs', JSON.stringify(errs)); process.exit(1); });
  const URL = 'https://fake.supabase.test', KEY = 'anon-test-key', ADMIN = 'a-long-test-admin-key';
  const db = { flags: [], scores: {}, calls: [] };
  const week = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
  const rpc = {
    submit_flag: ({ p }) => { if (!p.pid || p.pid.length < 8) return false; if (db.flags.filter(f => f.pid === p.pid).length >= 12) return false; db.flags.push(Object.assign({ id: db.flags.length + 1, created_at: new Date().toISOString(), resolved: false }, p, { cat: p.cat })); return true; },
    push_score: (a) => { if (!week(a.p_week) || (a.p_tok || '').length < 16) return false; const r = db.scores[a.p_pid]; if (r && r.tok !== a.p_tok) return false; db.scores[a.p_pid] = { pid: a.p_pid, tok: a.p_tok, name: a.p_name, mastered: a.p_mastered, best: a.p_best, correct: a.p_correct, week_key: a.p_week, week_xp: Math.min(5000, a.p_week_xp) }; return true; },
    leave_board: (a) => { const r = db.scores[a.p_pid]; if (r && r.tok === a.p_tok) delete db.scores[a.p_pid]; return true; },
    get_board: (a) => Object.values(db.scores).map(r => ({ pid: r.pid, name: r.name, mastered: r.mastered, best: r.best, correct: r.correct, week_key: r.week_key, week_xp: r.week_key === a.p_week ? r.week_xp : 0 })),
    admin_flags: (a) => a.k === ADMIN ? db.flags.slice().reverse() : [],
    resolve_flag: (a) => { if (a.k !== ADMIN) return false; const f = db.flags.find(x => x.id === a.fid); if (f) f.resolved = a.done; return true; }
  };
  async function mk(net, seed) {
    const p = await b.newPage({ viewport: { width: 400, height: 900 } });
    p.on('pageerror', e => errs.push(e.message));
    await p.route('**/three.min.js', r => r.fulfill({ path: 'three-stub2.js', contentType: 'text/javascript' }));
    await p.route(URL + '/**', r => r.request().method() === 'OPTIONS' ? r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } }) : r.continue());
    await p.route(URL + '/rest/v1/rpc/*', async r => {
      const fn = r.request().url().split('/rpc/')[1], body = JSON.parse(r.request().postData() || '{}'), h = r.request().headers();
      if (h.apikey !== KEY) return r.fulfill({ status: 401, body: '{}' });
      db.calls.push(fn); const out = rpc[fn] ? rpc[fn](body) : null;
      r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(out) });
    });
    const SEED = JSON.stringify(Object.assign({ me: { done: true, name: 'T', look: {} }, served: 30, correct: 25, tutDone: true, playSec: 999, boardAsked: true }, seed || {}));
    await p.goto('file://' + process.cwd() + '/corner-rx.html?noconf=1');
    await p.evaluate(([s, n]) => { localStorage.setItem('cornerRx.v1', s); if (n) localStorage.setItem('rxNet', n); }, [SEED, net ? JSON.stringify({ url: URL, key: KEY }) : '']);
    await p.goto('file://' + process.cwd() + '/corner-rx.html?noconf=1'); await p.waitForTimeout(800);
    await p.evaluate(() => document.querySelectorAll('.tour,.unlock').forEach(e => e.remove()));
    return p;
  }
  const act = (p, a) => p.evaluate(a => { const el = document.querySelector('[data-act="' + a + '"]'); if (!el) throw new Error('no ' + a); el.click(); }, a);
  const answer = async (p) => { for (let i = 0; i < 6; i++) { if (!(await p.$('.opt'))) { await p.waitForTimeout(400); continue; } await p.click('.opt >> nth=0'); await p.waitForTimeout(250); const g = await p.$('#msgo'); if (g) { await g.click(); await p.waitForTimeout(250); } if (await p.$('[data-act="flag-open"], a.flaglink')) return true; const nx = await p.$('#nextbtn'); if (nx) { await nx.click(); await p.waitForTimeout(400); } } return false; };

  // 1. offline: no board button, flag stays a GitHub link
  let p = await mk(false);
  if (!(await p.evaluate(() => document.querySelector('#menu [data-act="board"]').hidden))) fail.push('board button should hide when offline');
  if (!(await answer(p))) fail.push('could not answer (offline)');
  if (!(await p.$('a.flaglink[href*="github.com"]'))) fail.push('offline flag should be the github link');
  await p.close();

  // 2. online: flag form, board, flags page
  p = await mk(true);
  if (await p.evaluate(() => document.querySelector('#menu [data-act="board"]').hidden)) fail.push('board button should show online');
  if (!(await answer(p))) fail.push('could not answer (online)');
  await act(p, 'flag-open'); await p.waitForTimeout(150);
  if (!(await p.$('form.flagform'))) fail.push('flag form missing');
  await p.check('input[name=freason][value=two]'); await p.fill('textarea[name=fnote]', 'Both B and C work');
  await p.click('form.flagform button[type=submit]'); await p.waitForTimeout(500);
  if (db.flags.length !== 1 || db.flags[0].reason !== 'two' || db.flags[0].note !== 'Both B and C work' || !db.flags[0].pid || !db.flags[0].q) fail.push('flag not stored right ' + JSON.stringify(db.flags));
  if (!(await p.$('.flagdone'))) fail.push('flag confirmation missing');
  await p.waitForTimeout(600); const sv = await p.evaluate(() => JSON.parse(localStorage.getItem('cornerRx.v1')));
  if (!sv.pid || (sv.flagged || []).length !== 1) fail.push('save missing pid/flagged');

  // leaderboard: join, shows me, token saved, row stored
  await act(p, 'board'); await p.waitForTimeout(400);
  await p.fill('#nickbox', 'RxRanger'); await act(p, 'board-join'); await p.waitForTimeout(700);
  const me = await p.evaluate(() => [...document.querySelectorAll('table.board tr.me td')].map(e => e.textContent));
  if (me[1] !== 'RxRanger') fail.push('board row for me ' + me);
  const row = Object.values(db.scores)[0];
  if (!row || row.name !== 'RxRanger' || row.tok.length < 16) fail.push('score row ' + JSON.stringify(row));
  await p.waitForTimeout(600); const sv2 = await p.evaluate(() => JSON.parse(localStorage.getItem('cornerRx.v1')));
  if (!sv2.tok || sv2.boardOn !== true || sv2.nick !== 'RxRanger') fail.push('save fields ' + JSON.stringify({ t: !!sv2.tok, b: sv2.boardOn, n: sv2.nick }));
  // another player's row appears, and a stolen id cannot overwrite mine
  db.scores.other = { pid: 'other', tok: 'x'.repeat(20), name: 'Zed', mastered: 3, best: 4, correct: 9, week_key: await p.evaluate(() => Net.weekKey()), week_xp: 99 };
  await act(p, 'board-refresh'); await p.waitForTimeout(500);
  const names = await p.evaluate(() => [...document.querySelectorAll('table.board tbody tr')].map(r => r.children[1].textContent));
  if (names[0] !== 'Zed' || names[1] !== 'RxRanger') fail.push('board order ' + names);
  const stolen = await p.evaluate(async ([pid]) => Net.rpc('push_score', { p_pid: pid, p_tok: 'wrong-token-wrong-token', p_name: 'Hax', p_mastered: 1, p_best: 1, p_correct: 1, p_week: Net.weekKey(), p_week_xp: 1, p_v: 1 }), [row.pid]);
  if (stolen !== false || db.scores[row.pid].name !== 'RxRanger') fail.push('stolen id overwrote a row');
  await act(p, 'board-leave'); await p.waitForTimeout(500);
  if (db.scores[row.pid]) fail.push('leave did not delete');

  // flags page (author view): needs the key, lists live, resolves
  await p.waitForTimeout(600); await p.goto('file://' + process.cwd() + '/corner-rx.html?noconf=1&flags=1'); await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelectorAll('.tour,.unlock').forEach(e => e.remove()));
  if (!(await p.evaluate(() => /admin key/i.test(document.querySelector('.flagspane').textContent)))) fail.push('flags page missing');
  if (await p.$('.flagcard')) fail.push('flags visible without key');
  await p.fill('#adminkey', 'wrong-key-wrong-key'); await act(p, 'flag-key'); await act(p, 'flag-refresh'); await p.waitForTimeout(500);
  if (await p.$('.flagcard')) fail.push('flags visible with wrong key');
  await p.fill('#adminkey', ADMIN); await act(p, 'flag-key'); await act(p, 'flag-refresh'); await p.waitForTimeout(600);
  if ((await p.$$('.flagcard')).length !== 1) fail.push('flag card count');
  // a second player flags while the page is open: it arrives by itself (poll is 8s)
  db.flags.push({ id: 2, created_at: new Date().toISOString(), resolved: false, reason: 'typo', cat: 'BG', topic: 'x', q: 'Live one?', a: 'Yes', picked: '', note: '', pid: 'other-player', nick: 'Zed', v: 123 });
  await p.waitForTimeout(8800);
  if ((await p.$$('.flagcard')).length !== 2) fail.push('live flag did not arrive');
  await p.click('.flagcard:not(.done) [data-act="flag-resolve"] >> nth=0'); await p.waitForTimeout(600);
  if (!db.flags.some(f => f.resolved)) fail.push('resolve did not reach backend');
  await p.close();

  // 3. same save code on a second device keeps the same identity
  console.log('calls', [...new Set(db.calls)].join());
  console.log('errs', JSON.stringify(errs.filter(e => !/Failed to load resource|ERR_TUNNEL/.test(e))));
  console.log(fail.length ? 'FAIL ' + fail.join(' | ') : 'PASS te56');
  await b.close(); process.exit(fail.length ? 1 : 0);
})();
