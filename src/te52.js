// te52: hiding and showing the tab must not start a second render loop (that doubled the game speed)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.route(/cdnjs.*three/, r => r.fulfill({ path: require('path').join(__dirname, 'three-stub2.js'), contentType: 'application/javascript' }));
  await p.goto('file://' + require('path').join(__dirname, 'corner-rx.html') + '?noconf=1'); await p.waitForTimeout(1500);
  const rate = async () => p.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else res(n); }; requestAnimationFrame(f); }));
  // count world frames by wrapping rAF callbacks that are not ours
  await p.evaluate(() => { window.__fr = 0; window.__q = new Map(); window.__hid = false; let id = 1e6; const o = window.requestAnimationFrame.bind(window), oc = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = cb => { const my = ++id; const run = tt => { window.__q.delete(my); if (cb.name === 'frame') window.__fr++; cb(tt); }; window.__q.set(my, run); o(t => { if (!window.__hid && window.__q.has(my)) run(t); }); return my; };
    window.cancelAnimationFrame = h => { window.__q.delete(h); };
  });
  const count = async () => { await p.evaluate(() => { window.__fr = 0; }); await p.waitForTimeout(1000); return p.evaluate(() => window.__fr); };
  const base = await count();
  for (let i = 0; i < 4; i++) {
    await p.evaluate(() => { window.__hid = true; Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    await p.waitForTimeout(200);
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); window.__hid = false; document.dispatchEvent(new Event('visibilitychange')); const q = [...window.__q.values()]; q.forEach(f => f(performance.now())); });
    await p.waitForTimeout(200);
  }
  const after = await count();
  console.log('frames/s before', base, 'after 4 hide-show cycles', after, after <= base * 1.3 + 3 ? 'OK' : 'DOUBLED');
  console.log('errs', errs); await b.close();
})();
