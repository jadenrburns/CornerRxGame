// te57: one-time "Join the leaderboard" nickname prompt (v124)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [], fail = []; const calls = [];
  async function mk(net, extra) {
    const p = await b.newPage({ viewport: { width: 400, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
    await p.route('**/three.min.js', r => r.fulfill({ path: 'three-stub2.js', contentType: 'text/javascript' }));
    await p.route('https://fake.supabase.test/**', r => { const u = r.request().url(); if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } }); calls.push(u.split('/rpc/')[1]); r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: 'true' }); });
    const SEED = JSON.stringify(Object.assign({ me: { done: true, name: 'T', look: {} }, served: 30, correct: 25, tutDone: true, playSec: 999 }, extra || {}));
    await p.goto('file://' + process.cwd() + '/corner-rx.html?noconf=1&ask=1');
    await p.evaluate(([s, n]) => { localStorage.setItem('cornerRx.v1', s); localStorage.setItem('rxNet', n); }, [SEED, net ? JSON.stringify({ url: 'https://fake.supabase.test', key: 'k' }) : JSON.stringify({ off: 1 })]);
    await p.goto('file://' + process.cwd() + '/corner-rx.html?noconf=1&ask=1'); await p.waitForTimeout(4800); return p;
  }
  let p = await mk(false); if (await p.$('.joinask')) fail.push('prompt shown offline'); await p.close();
  p = await mk(true, { boardOn: true, nick: 'X' }); if (await p.$('.joinask')) fail.push('prompt shown to member'); await p.close();
  p = await mk(true); if (!(await p.$('.joinask'))) fail.push('prompt missing online');
  await p.click('[data-act=join-go]'); await p.waitForTimeout(300); if (!(await p.$('.joinask'))) fail.push('empty nickname should keep prompt open');
  await p.fill('#joinnick', '  Rx   Ranger '); await p.click('[data-act=join-go]'); await p.waitForTimeout(900);
  if (await p.$('.joinask')) fail.push('prompt did not close');
  const s = await p.evaluate(() => { return new Promise(r => setTimeout(() => r(JSON.parse(localStorage.getItem('cornerRx.v1'))), 500)); });
  if (s.nick !== 'Rx Ranger' || !s.boardOn || !s.boardAsked) fail.push('save ' + JSON.stringify([s.nick, s.boardOn, s.boardAsked]));
  if (!calls.includes('push_score')) fail.push('score not pushed'); await p.close();
  p = await mk(true); await p.click('[data-act=join-skip]'); await p.waitForTimeout(700);
  const s2 = await p.evaluate(() => new Promise(r => setTimeout(() => r(JSON.parse(localStorage.getItem('cornerRx.v1'))), 500)));
  if (s2.boardOn || !s2.boardAsked) fail.push('skip state ' + JSON.stringify([s2.boardOn, s2.boardAsked]));
  await p.reload(); await p.waitForTimeout(4800); if (await p.$('.joinask')) fail.push('prompt came back after skip'); await p.close();
  console.log('errs', JSON.stringify(errs)); console.log(fail.length ? 'FAIL ' + fail.join(' | ') : 'PASS te57'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
