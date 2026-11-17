// te55: wardrobe v122 (gear table, sliders, shop sections, pets tab, capsule rarity, save migration, buffs)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 420, height: 900 } }); const errs = [], fail = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.emulateMedia({ reducedMotion: 'reduce' });
  await p.route('**/three.min.js', r => r.fulfill({ path: 'three-stub2.js', contentType: 'text/javascript' }));
  const SEED = JSON.stringify({ me: { done: true, body: 'normal', gender: 'n', hair: 0, hairColor: 0, skin: 1, scrub: 0 }, served: 60, correct: 130, tutDone: true, playSec: 999, cash: 5000, acc: 3, accEarned: 3, accOff: [2], cosm: ['bowtie', 'tophat'], cosmOn: { extra: 'bowtie' }, awards: { frames: [], pets: ['bunny'] } });
  await p.goto('file://' + process.cwd() + '/corner-rx.html?noconf=1'); await p.evaluate(s => localStorage.setItem('cornerRx.v1', s), SEED);
  await p.goto('file://' + process.cwd() + '/corner-rx.html?noconf=1&dev=1'); await p.waitForTimeout(900);
  await p.evaluate(() => document.querySelectorAll('.tour,.unlock').forEach(e => e.remove()));
  const S = () => p.evaluate(() => JSON.parse(JSON.stringify(__rxDbg().S)));
  const act = async (a, v) => { await p.evaluate(([a, v]) => { const el = [...document.querySelectorAll('[data-act="' + a + '"]')].find(e => v === undefined || e.dataset.v === v || e.dataset.id === v); if (!el) throw new Error('no ' + a + ' ' + v); el.click(); }, [a, v]); await p.waitForTimeout(250); };
  // 1. migration: rank gear lands in slots, switched-off shades stay off, bow tie moved out of extras
  let s = await S();
  if (!(s.gearV === 1 && s.cosmOn.neck === 'chain' && s.cosmOn.hands === 'knuckles' && !s.cosmOn.eyes && !s.cosmOn.extra && s.accOff === undefined)) fail.push('migration ' + JSON.stringify(s.cosmOn));
  const gb = await p.evaluate(() => __rxDbg().gearBuff());
  if (!(Math.abs(gb.pay - 0.02) < 1e-9 && gb.streak === 1 && gb.tech === 0)) fail.push('gearBuff ' + JSON.stringify(gb));
  // 2. character screen
  await p.evaluate(() => document.querySelector('#menu [data-act=create]').click()); await p.waitForTimeout(300);
  const rows = await p.$$eval('.crow', e => e.map(r => r.dataset.k));
  if (rows.join() !== 'gender,body,skin,hair,hairColor,face,eyes,hat,neck,coat,scrub,shoes,hands,extra,cyber') fail.push('rows ' + rows);
  if (await p.$$eval('.cpane .chips', e => e.length)) fail.push('chips still on the character screen');
  const neck = await p.$eval('.crow[data-k=neck] .cval', e => e.textContent);
  if (!/Gold chain/.test(neck) || !/\+2% pay/.test(neck)) fail.push('neck row ' + neck);
  const hatLock = await p.$eval('.crow[data-k=hat] .clock', e => ({ sum: e.querySelector('summary').textContent, n: e.querySelectorAll('li').length, txt: e.textContent }));
  if (!(hatLock.n >= 10 && /Legendary capsule|Golden halo/.test(hatLock.txt) && /Shop, \$150/.test(hatLock.txt) && /Rank: /.test(hatLock.txt))) fail.push('hat locked list ' + JSON.stringify(hatLock));
  const tabs = await p.$$eval('.cpane .hubtabs [role=tab]', e => e.map(x => x.textContent));
  if (tabs.join() !== 'Wardrobe,Shop,Pets') fail.push('tabs ' + tabs);
  if (!/Outfit bonus: \+2% pay, \+1 streak cap/.test(await p.$eval('.outfit', e => e.textContent))) fail.push('outfit summary');
  // cycle the coat row through colors into gear and back
  await p.evaluate(() => { for (let i = 0; i < 7; i++) document.querySelector('.crow[data-k=coat] .carr[data-d="1"]').click(); }); await p.waitForTimeout(200);
  s = await S(); const coatTxt = await p.$eval('.crow[data-k=coat] .cval', e => e.textContent);
  if (!(s.cosmOn.coat === 'furcoat' || /coat/i.test(coatTxt))) fail.push('coat cycle ' + coatTxt + ' ' + JSON.stringify(s.cosmOn));
  // 3. shop: sections, buy a scrub cap, it lands in the hat slider
  await act('ctab', 'shop');
  const secs = await p.$$eval('.crs[data-shop]', e => e.map(x => x.dataset.shop));
  if (secs.join() !== 'walls,floors,uni,deco,wear,pow,rug') fail.push('shop sections ' + secs);
  if (await p.$$eval('.cpane .chips', e => e.length)) fail.push('chips in shop');
  await p.evaluate(() => { document.querySelector('.crs[data-shop=wear]').open = true; });
  await act('shop-buy', 'surgcap'); s = await S();
  if (!(s.store.own.indexOf('surgcap') >= 0 && s.cosmOn.hat === 'surgcap' && s.cash === 5000 - 150)) fail.push('buy surgcap ' + JSON.stringify([s.store.own, s.cosmOn.hat, s.cash]));
  await act('ctab', 'me');
  if (!/Scrub cap/.test(await p.$eval('.crow[data-k=hat] .cval', e => e.textContent))) fail.push('scrub cap not in hat slider');
  // 4. pets tab
  await act('ctab', 'pets');
  const pets = await p.$$eval('.awp', e => e.map(x => (x.classList.contains('on') ? '+' : '-') + x.querySelector('b').textContent.trim()));
  if (!(pets.length === 7 && pets[0] === '+Bunny' && pets.some(x => /Orange cat/.test(x)) && pets.some(x => /Chubby/.test(x)))) fail.push('pets ' + pets);
  await act('me-done'); await p.waitForTimeout(400);
  // 5. a legendary capsule from the dev menu grants a legendary item (or pet) and marks the vial
  await p.evaluate(() => document.querySelector('[data-act=dev-legcap]').click()); await p.waitForTimeout(200);
  s = await S(); if (!(s.vial.length && s.vial[s.vial.length - 1].r === 'legendary')) fail.push('legendary capsule not in vial');
  await p.evaluate(() => document.querySelector('#vialbtn').click()); await p.waitForTimeout(300);
  if (!(await p.$('.vpill.rar-legendary'))) fail.push('vial does not mark the legendary capsule');
  await p.evaluate(() => { const v = [...document.querySelectorAll('.vpill')]; v[v.length - 1].click(); }); await p.waitForTimeout(200);
  await p.evaluate(() => document.querySelector('[data-take]').click()); await p.waitForTimeout(2500);
  const cap = await p.evaluate(() => ({ cls: document.querySelector('.capdlg') && document.querySelector('.capdlg').className, title: document.querySelector('#ctitle') && document.querySelector('#ctitle').textContent, band: document.querySelector('.rarband') && document.querySelector('.rarband').textContent }));
  s = await S();
  const legIds = ['halo', 'mortar'], gotLeg = legIds.some(id => (s.cosm || []).indexOf(id) >= 0) || (s.awards.pets || []).indexOf('orange') >= 0;
  if (!(cap.cls && /rar-legendary/.test(cap.cls) && /Legendary!/.test(cap.title) && /Legendary capsule/.test(cap.band) && gotLeg)) fail.push('legendary reveal ' + JSON.stringify([cap, s.cosm, s.awards.pets]));
  await p.evaluate(() => document.querySelector('#cdone').click()); await p.waitForTimeout(200);
  // every GEAR item has a slot, rarity, source and buff; ids unique
  const gearOk = await p.evaluate(() => { const G = __rxDbg().GEAR, ids = new Set(); return G.every(g => g.id && g.slot && RAR[g.r] && g.src && g.buff && !ids.has(g.id) && ids.add(g.id)); });
  if (!gearOk) fail.push('gear table');
  console.log('fail', fail); console.log('errs', errs);
  await b.close();
})();
