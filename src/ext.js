  /* ======================================================================
     v42 extras (spliced into game.js by build.sh at the @EXT marker):
     sound, streak rewards, shift review, "why not" notes, memory checks,
     flashcards + medals + goldfish, share card, and the new visitors
     ====================================================================== */

  /* ---- sound: tiny synthesized effects, no files ---- */
  const SFX = (function () {
    let ctx = null;
    const SND = {
      ok: [[660, 0, .09, 'triangle', .2], [990, .08, .16, 'triangle', .2]],
      bad: [[190, 0, .22, 'sawtooth', .12], [140, .16, .3, 'sawtooth', .12]],
      coin: [[1200, .12, .05, 'square', .05], [1600, .17, .12, 'square', .05]],
      streak: [[523, 0, .1, 'triangle', .18], [659, .09, .1, 'triangle', .18], [784, .18, .1, 'triangle', .18], [1047, .27, .25, 'triangle', .2]],
      unlock: [[784, 0, .12, 'sine', .22], [988, .12, .12, 'sine', .22], [1319, .24, .12, 'sine', .22], [1568, .36, .4, 'sine', .22]],
      bell: [[1320, 0, .08, 'sine', .1], [990, .1, .2, 'sine', .1]],
      ring: [[880, 0, .12, 'square', .05], [660, .14, .12, 'square', .05], [880, .4, .12, 'square', .05], [660, .54, .12, 'square', .05]],
      huh: [[420, 0, .12, 'sine', .18], [360, .1, .14, 'sine', .18], [300, .22, .22, 'sine', .18]],
      flip: [[500, 0, .05, 'triangle', .13], [750, .04, .07, 'triangle', .13]],
      got: [[600, 0, .08, 'triangle', .18], [900, .08, .14, 'triangle', .18]],
      shift: [[523, 0, .12, 'triangle', .2], [659, .12, .12, 'triangle', .2], [784, .24, .12, 'triangle', .2], [659, .36, .1, 'triangle', .2], [784, .46, .1, 'triangle', .2], [1047, .56, .4, 'triangle', .22]],
      siren: [[700, 0, .18, 'square', .05], [900, .18, .18, 'square', .05], [700, .36, .18, 'square', .05]],
      thud: [[110, 0, .14, 'sine', .3], [80, .1, .2, 'sine', .25]]
    };
    function ac() {
      if (ctx === null) { try { const C = window.AudioContext || window.webkitAudioContext; ctx = C ? new C() : false; } catch (e) { ctx = false; } }
      if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* ignore */ } }
      return ctx;
    }
    return {
      play: function (n) {
        if (S.sfx === false) return;
        try {
          const a = ac(); if (!a) return; const t = a.currentTime;
          (SND[n] || []).forEach(function (s) {
            const o = a.createOscillator(), g = a.createGain(), t0 = t + s[1];
            o.type = s[3]; o.frequency.value = s[0];
            g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(s[4], t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + s[2]);
            o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + s[2] + 0.03);
          });
        } catch (e) { /* ignore */ }
      }
    };
  })();

  /* ---- streak coin: a round badge with the number; from a streak of 10 it turns gold with an orange rim and a flame crown that grows with every right answer ---- */
  const SFX_ST = { cv: null, ctx: null, n: 0, shown: -1, pulse: 0, sparks: [], acc: 0, last: 0, run: false };
  function streakFx(n) {
    const S2 = SFX_ST, st = document.getElementById('streakstat');
    if (!SFX_ST.cv) { SFX_ST.cv = document.createElement('canvas'); SFX_ST.cv.className = 'sfxcv'; SFX_ST.cv.setAttribute('aria-hidden', 'true'); SFX_ST.ctx = SFX_ST.cv.getContext('2d'); }
    // renderStats rebuilds the badge each time, so the canvas moves into the fresh one
    if (st) { if (n >= 10) { if (SFX_ST.cv.parentNode !== st) st.insertBefore(SFX_ST.cv, st.firstChild); st.classList.add('lit'); } else { st.classList.remove('lit'); st.style.boxShadow = ''; if (SFX_ST.cv.parentNode) SFX_ST.cv.parentNode.removeChild(SFX_ST.cv); } }
    if (n > S2.n && S2.shown >= 0) S2.pulse = 1;
    S2.n = n; S2.shown = n;
    if (n >= 10 && !S2.run) { S2.run = true; S2.last = performance.now(); requestAnimationFrame(sfxFrame); }
  }
  function sfxFl(t, i) { return 0.5 + 0.5 * (Math.sin(t * 3.1 + i * 12.9898) * 0.5 + Math.sin(t * 5.3 + i * 78.233) * 0.3 + Math.sin(t * 8.7 + i * 37.719) * 0.2); }
  function sfxLobe(ctx, x, y, ang, w, h, curl) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    const bx = -Math.sin(ang) * 0.85 * h, by = (1 - Math.cos(ang)) * 0.85 * h, tipx = curl * h * 0.3 + bx, tw = w * 0.55, tyo = by;
    ctx.beginPath(); ctx.moveTo(-w, w * 1.6); ctx.lineTo(-w, 0);
    ctx.bezierCurveTo(-w * 1.1 + bx * 0.25, -h * 0.45 + by * 0.35, -tw + tipx * 0.55, -h * 0.7 + tyo * 0.75, tipx - tw * 0.3, -h * 0.92 + tyo);
    ctx.quadraticCurveTo(tipx, -h * 1.05 + tyo, tipx + tw * 0.3, -h * 0.92 + tyo);
    ctx.bezierCurveTo(tw + tipx * 0.55, -h * 0.7 + tyo * 0.75, w * 1.1 + bx * 0.25, -h * 0.45 + by * 0.35, w, 0);
    ctx.lineTo(w, w * 1.6); ctx.closePath(); ctx.restore();
  }
  function sfxCrown(ctx, b, n, baseH, baseW, tm, scale, fill, stroke, lw, seed, k) {
    const items = [];
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0.5 : i / (n - 1), a = -Math.PI * 0.5 + (u - 0.5) * 2.15, mid = 1 - Math.abs(u - 0.5) * 1.35;
      const f1 = sfxFl(tm * 1.4, i + 1 + seed), h = baseH * (0.42 + 0.78 * mid) * (0.72 + 0.4 * f1) * scale, w = baseW * (0.8 + 0.3 * sfxFl(tm * 1.9, i + 9 + seed)) * (0.75 + 0.25 * scale);
      const px = b.cx + Math.cos(a) * (b.r - 5 * k), py = b.cy + Math.sin(a) * (b.r - 5 * k), curl = (Math.sin(tm * 2.4 + i * 1.9) + (u - 0.5) * 1.2) * 0.5;
      items.push([px, py, a + Math.PI / 2 + curl * 0.06, w, h, curl]);
    }
    if (stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = stroke; items.forEach(o => { sfxLobe(ctx, o[0], o[1], o[2], o[3], o[4], o[5]); ctx.stroke(); }); }
    items.forEach(o => { const g = ctx.createLinearGradient(o[0], o[1], o[0] + Math.cos(o[2] - Math.PI / 2) * o[4], o[1] + Math.sin(o[2] - Math.PI / 2) * o[4]); g.addColorStop(0, fill[1]); g.addColorStop(1, fill[0]); ctx.fillStyle = g; sfxLobe(ctx, o[0], o[1], o[2], o[3], o[4], o[5]); ctx.fill(); });
  }
  function sfxFrame(now) {
    const S2 = SFX_ST, cv = S2.cv, st = document.getElementById('streakstat');
    if (S2.n < 10 || !st || cv.parentNode !== st) { S2.run = false; S2.sparks.length = 0; return; }
    requestAnimationFrame(sfxFrame);
    const dt = Math.min(0.05, (now - S2.last) / 1000 || 0.016); S2.last = now;
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, tm = now / 1000 * (reduce ? 0.35 : 1);
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const ctx = S2.ctx; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const sr = st.getBoundingClientRect(), cr = cv.getBoundingClientRect(), r = sr.width / 2, k = r / 32;
    const b = { cx: sr.left - cr.left + r, cy: sr.top - cr.top + sr.height / 2, r: r };
    const t = Math.min(1, (S2.n - 10) / 30); S2.pulse = Math.max(0, S2.pulse - dt * 2.2);
    const nn = Math.round(3 + 2 * t) | 1, grow = 1 + S2.pulse * 0.3, baseH = (26 + 74 * Math.pow(t, 0.85)) * grow * k, baseW = (15 + 6 * t) * k;
    const gl = ctx.createRadialGradient(b.cx, b.cy - r * 0.4, 4 * k, b.cx, b.cy - r * 0.4, r * 2.2 + baseH * 0.8);
    gl.addColorStop(0, 'rgba(255,150,40,' + (0.22 + 0.28 * t) + ')'); gl.addColorStop(1, 'rgba(255,100,0,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.beginPath();
    const ty = b.cy - r * 0.55;
    ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, ty); ctx.lineTo(b.cx + r + 10 * k, ty); ctx.lineTo(b.cx + r + k, b.cy); ctx.lineTo(b.cx - r - k, b.cy); ctx.lineTo(b.cx - r - 10 * k, ty); ctx.lineTo(0, ty); ctx.closePath();
    ctx.moveTo(b.cx + r + k, b.cy); ctx.arc(b.cx, b.cy, r + k, 0, Math.PI * 2); ctx.clip();
    sfxCrown(ctx, b, nn, baseH, baseW, tm, 1, ['#F0501A', '#F58A2E'], '#F58A2E', 7 * k, 0, k);
    sfxCrown(ctx, b, nn, baseH, baseW, tm + 3, 0.68, ['#FF9F2A', '#FFB74A'], null, 0, 20, k);
    sfxCrown(ctx, b, Math.max(1, nn - 2), baseH, baseW, tm + 6, 0.36, ['#FFC933', '#FFE27A'], null, 0, 40, k);
    ctx.restore();
    S2.acc += (0.3 + 1.8 * t) * dt * (reduce ? 0.4 : 1) * (1 + S2.pulse * 2);
    while (S2.acc >= 1) { S2.acc -= 1; const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6; S2.sparks.push({ x: b.cx + Math.cos(a) * r * 0.9, y: b.cy - baseH * 0.7 * (0.6 + Math.random() * 0.6) - r * 0.4, vx: (Math.random() - 0.5) * 26 * k, vy: -(45 + 70 * t) * (0.7 + Math.random() * 0.6) * k, age: 0, life: 0.8 + Math.random() * 0.8, s: (2.2 + 2.2 * t + Math.random() * 1.3) * k, ph: Math.random() * 6.28 }); }
    for (let i = S2.sparks.length - 1; i >= 0; i--) {
      const sp = S2.sparks[i]; sp.age += dt; if (sp.age >= sp.life || sp.y < -10) { S2.sparks.splice(i, 1); continue; }
      sp.x += (sp.vx + Math.sin(sp.age * 7 + sp.ph) * 20 * k) * dt; sp.y += sp.vy * dt; sp.vy *= (1 - dt * 0.35);
      const q = sp.age / sp.life, s = sp.s * (1 - q * 0.55);
      ctx.save(); ctx.translate(sp.x, sp.y); ctx.rotate(Math.atan2(sp.vx, -sp.vy) * 0.8); ctx.globalAlpha = Math.min(1, (1 - q) * 1.6);
      ctx.beginPath(); ctx.moveTo(0, -2.1 * s); ctx.bezierCurveTo(0.35 * s, -1.1 * s, s, -0.6 * s, s, 0.25 * s); ctx.bezierCurveTo(s, 0.95 * s, 0.5 * s, 1.25 * s, 0, 1.25 * s); ctx.bezierCurveTo(-0.5 * s, 1.25 * s, -s, 0.95 * s, -s, 0.25 * s); ctx.bezierCurveTo(-s, -0.6 * s, -0.35 * s, -1.1 * s, 0, -2.1 * s); ctx.closePath();
      const g = ctx.createLinearGradient(0, -2.1 * s, 0, 1.25 * s); g.addColorStop(0, '#FF8A2B'); g.addColorStop(0.55, '#FFB02E'); g.addColorStop(1, '#FFE27A'); ctx.fillStyle = g; ctx.fill(); ctx.restore();
    }
    st.style.boxShadow = '0 0 ' + (8 + 22 * t + S2.pulse * 8).toFixed(0) + 'px rgba(255,138,43,.7)';
  }
  function sfxLabel() {
    const on = S.sfx !== false, l = $('#sfxlab'), b = $('#sfxbtn');
    if (l) l.textContent = 'Sound: ' + (on ? 'on' : 'off');
    if (b) b.setAttribute('aria-pressed', String(on));
  }

  /* ---- streak rewards: a bonus every 5 in a row, a hint every 10 ---- */
  function streakGift(pay) {
    if (S.streak < 5 || S.streak % 5) return '';
    const big = S.streak % 10 === 0, bonus = Math.max(15, Math.round(pay * (big ? 5 : 3)));
    S.cash += bonus; S.earned += bonus;
    if (big) S.hintsLeft++;
    SFX.play('streak');
    return '<p class="gift streak"><b>' + S.streak + ' in a row!</b> Streak bonus ' + money(bonus) + (big ? ' plus 1 pharmacist hint' : '') + '.</p>';
  }

  /* ---- "why not": explain the wrong answer that was picked ---- */
  let DRUGIDX = null;
  function drugIndex() {
    if (DRUGIDX) return DRUGIDX;
    const m = {}, add = (k, d) => { k = String(k || '').toLowerCase().replace(/\s+/g, ' ').trim(); if (k && !m[k]) m[k] = d; };
    DRUGS.forEach(d => { String(d.g).split(/,\s*/).forEach(x => add(x, d)); add(d.g, d); brandList(d.b).forEach(x => add(x, d)); });
    DRUGIDX = m; return m;
  }
  function whyNot(text) {
    const t = String(text || '').toLowerCase().replace(/\s+/g, ' ').trim(); if (!t) return '';
    const ix = drugIndex(); let d = ix[t];
    if (!d) { const w = t.split(' ')[0]; if (w.length > 4) d = ix[w]; }
    const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); if (s.length <= n) return s; const c = s.slice(0, n), sp = c.lastIndexOf(' '); return c.slice(0, sp > n * 0.6 ? sp : n) + '…'; };
    if (d) {
      const bl = brandList(d.b), cls = clip(String(d.c || '').replace(/\n/g, ' '), 80);
      const same = t === d.g.toLowerCase() ? '' : ' (' + d.g + ')';
      const first = (String(d.m || '').match(/^.*?[.;](?=\s|$)/) || [''])[0];
      return esc(text) + same + ' is ' + (cls ? (/^[aeiou]/i.test(cls) ? 'an ' : 'a ') + esc(cls) : 'a different drug') + (bl.length && t === d.g.toLowerCase() ? ', brand ' + esc(bl[bl.length - 1]) : '') + '. ' + (first.length >= 40 ? esc(clip(first, 170)) : '');
    }
    const cl = DRUGS.filter(x => String(x.c || '').replace(/\s+/g, ' ').trim().toLowerCase() === t);
    if (cl.length) return esc(text) + ' is the class of ' + esc(cl.slice(0, 3).map(x => x.g).join(', ')) + '.';
    return '';
  }

  /* ---- memory checks (spaced repetition that never blocks early mastery) ---- */
  const IV = [1, 3, 7, 14, 30]; // days until a mastered question is worth asking again
  function reviewDue(m) { return !!(m && m.box >= 2 && m.t && (Date.now() - m.t) >= IV[Math.min(IV.length - 1, m.iv || 0)] * 864e5); }
  function dueCount() { let n = 0; for (const k in S.mastery) if (BYKEY[k] && reviewDue(S.mastery[k])) n++; return n; }

  /* ---- shifts: every 10 patients you get a report with what you missed ---- */
  const SHIFT_LEN = 10;
  let shiftLog = [], shiftRes = null;
  function shiftState() { if (!S.shift) S.shift = { n: 0, ok: 0, earned: 0, best: 0 }; return S.shift; }
  function shiftNote(q, ok, pay, picked) {
    const sh = shiftState(); sh.n++; if (ok) sh.ok++; sh.earned += pay; sh.best = Math.max(sh.best, S.streak);
    if (!ok) shiftLog.push({ q: q, picked: picked });
  }
  const shiftDue = () => shiftState().n >= SHIFT_LEN;
  function openShift() {
    const sh = shiftState(), acc = sh.n ? sh.ok / sh.n : 0;
    let bonus = 0;
    if (acc >= 0.8) { bonus = Math.round(sh.earned * 0.25); S.cash += bonus; S.earned += bonus; S.rep = Math.min(100, S.rep + 3); }
    S.shifts = (S.shifts || 0) + 1;
    shiftRes = { n: sh.n, ok: sh.ok, earned: sh.earned, best: sh.best, bonus: bonus, acc: acc, miss: shiftLog.slice(), num: S.shifts };
    S.shift = { n: 0, ok: 0, earned: 0, best: 0 }; shiftLog = [];
    save(); renderStats(); SFX.play('shift');
    qExpand(); view = 'shift'; renderPanel(); const p = $('#qpanel'); if (p) p.scrollTop = 0;
  }
  function shiftHTML() {
    const r = shiftRes; if (!r) return '';
    const pct = Math.round(r.acc * 100), grade = pct === 100 ? 'Perfect shift!' : pct >= 80 ? 'Great shift!' : pct >= 60 ? 'Solid shift' : 'Rough shift. Review time!';
    const miss = r.miss.map(x => {
      const q = x.q, right = q.ms ? q.as.join(' · ') : q.a;
      const why = x.picked ? whyNot(x.picked) : '';
      return '<li><b>' + esc(q.q) + '</b><span class="shans">Answer: ' + esc(right) + '</span>' + (x.picked ? '<span class="shwr">You picked: ' + esc(x.picked) + '</span>' : '<span class="shwr">Time ran out</span>') + (why ? '<span class="shwhy">' + why + '</span>' : '') + (q.rows ? '' : q.e ? '<span class="shwhy"><b>Why:</b> ' + esc(q.e) + '</span>' : '') + '</li>';
    }).join('');
    const nonGen = r.miss.filter(x => !x.q.gen).length;
    return '<div class="pane shiftpane"><h3>Shift ' + r.num + ' report</h3><p class="sub">' + esc(grade) + '</p>' +
      '<div class="shgrid"><div><b>' + r.ok + '/' + r.n + '</b><small>correct</small></div><div><b>' + pct + '%</b><small>accuracy</small></div><div><b>' + money(r.earned) + '</b><small>earned</small></div><div><b>' + r.best + '</b><small>best streak</small></div></div>' +
      (r.bonus ? '<p class="gift"><b>Shift bonus:</b> +' + money(r.bonus) + ' for 80%+ accuracy, and reputation +3.</p>' : '<p class="gift sad">Score 80% or better next shift for a bonus.</p>') +
      (r.miss.length ? '<h4 class="shh">Missed this shift</h4><ol class="shmiss">' + miss + '</ol>' : '<p class="note">Nothing missed. Keep it up!</p>') +
      '<div class="btnrow">' + (nonGen ? '<button type="button" class="btn" data-act="shift-retry">Quiz me on these soon</button>' : '') + '<button type="button" class="btn go" data-act="shift-next">Start next shift</button></div></div>';
  }
  function shiftNext(retryMissed) {
    if (retryMissed && shiftRes) shiftRes.miss.forEach((x, i) => { if (!x.q.gen) { const j = retry.findIndex(r => r.k === x.q.k); if (j >= 0) retry.splice(j, 1); retry.push({ k: x.q.k, due: S.served + 1 + i }); } });
    shiftRes = null; view = 'q'; newCard();
  }

  /* ---- flashcards: flip, rate yourself, earn medals and a goldfish ---- */
  const FC_CATS = [['fb', 'Brand & generic', '🏷️'], ['fc', 'Drug classes', '🧪'], ['fm', 'How drugs work', '⚙️'], ['fi', 'What they treat', '🎯'], ['fn', 'Counseling', '💬']];
  const FC_GOALS = [10, 30, 60], FC_NAME = {}; FC_CATS.forEach(c => { FC_NAME[c[0]] = c[1]; });
  let FCDECK = null; const fcs = { cat: 'all', card: null, flip: false };
  function fcDeck() {
    if (FCDECK) return FCDECK;
    const out = [], clean = (t) => String(t || '').replace(/\s+/g, ' ').trim();
    const cutS = (t, n) => { t = clean(t); if (t.length <= n) return t; const c = t.slice(0, n), sp = c.lastIndexOf(' '); return c.slice(0, sp > n * 0.6 ? sp : n) + '…'; };
    DRUGS.forEach(d => {
      const name = clean(d.g), bl = brandList(d.b), br = brandPick(d), mk = (c, f, b) => out.push({ c: c, k: 'fc|' + c + '|' + d.id, w: d.w, f: f, b: b });
      if (br && br.toLowerCase() !== name.toLowerCase()) { if (d.id % 2 === 0) mk('fb', 'Which brand names go with ' + name + '?', bl.join(', ')); else mk('fb', 'Brand: ' + br + '. Which drug is it?', name); }
      if (clean(d.c)) mk('fc', 'What class is ' + name + '?', cutS(d.c, 120));
      if (clean(d.m).length >= 40 && !/^n\/a/i.test(d.m)) mk('fm', 'How does ' + name + ' work?', cutS(d.m, 280));
      if (d.i && d.i.length) mk('fi', 'What is ' + name + ' used for?', d.i.slice(0, 5).map(clean).join(' • '));
      if (clean(d.cn).length >= 20) mk('fn', 'What should you tell a patient starting ' + name + '?', cutS(d.cn, 320));
      if (clean(d.lo)) mk('fd', 'Starting dose of ' + name + '?', cutS(d.lo, 100) + (clean(d.ty) ? ' · typical: ' + cutS(d.ty, 80) : ''));
    });
    FCDECK = out; return out;
  }
  function fcPool(cat) {
    const t = todayStr(), deck = fcDeck();
    const open = (c) => { const wk = WK[c.w]; return !wk || wk.from <= t || S.set.ahead; };
    let pool = deck.filter(c => (cat === 'all' || c.c === cat) && open(c));
    if (!pool.length) { const w0 = WEEKS.length ? WEEKS[0].n : 0; pool = deck.filter(c => (cat === 'all' || c.c === cat) && c.w === w0); }
    return pool;
  }
  const fcState = () => { if (!S.flash) S.flash = {}; if (!S.flashAw) S.flashAw = []; return S.flash; };
  function fcMastered(cat) { const f = fcState(); let n = 0; fcDeck().forEach(c => { if (c.c === cat && f[c.k] && f[c.k].b >= 2) n++; }); return n; }
  function fcNext() {
    const pool = fcPool(fcs.cat), f = fcState();
    if (!pool.length) { fcs.card = null; return; }
    const items = pool.map(c => { const m = f[c.k], b = m ? m.b : -1; return [c, c === fcs.card && pool.length > 1 ? 0 : (b < 0 ? 4 : [7, 3.5, 0.5, 0.1][b])]; });
    let r = Math.random() * items.reduce((a, x) => a + x[1], 0) || 0, ch = items[0][0];
    for (const it of items) { r -= it[1]; if (r <= 0 && it[1] > 0) { ch = it[0]; break; } }
    fcs.card = ch; fcs.flip = false;
  }
  function fcRate(got) {
    const c = fcs.card; if (!c || !fcs.flip) return;
    const f = fcState(), m = f[c.k] || { b: 0, s: 0, t: 0 };
    m.s++; m.b = got ? Math.min(3, m.b + 1) : 0; m.t = Date.now(); f[c.k] = m;
    S.flashN = (S.flashN || 0) + 1; SFX.play(got ? 'got' : 'bad');
    save(); fcCheck(false); fcNext(); renderPanel();
  }
  const FC_PET = { id: 'fish', name: 'Goldfish', emoji: '🐠', n: 3 };
  const fcPetProgress = () => FC_CATS.filter(c => (S.flashAw || []).indexOf(c[0] + ':0') >= 0).length;
  function fcCheck(silent) {
    fcState(); const fresh = [];
    FC_CATS.forEach(c => { const n = fcMastered(c[0]); FC_GOALS.forEach((g, t) => { const id = c[0] + ':' + t; if (n >= g && S.flashAw.indexOf(id) < 0) { S.flashAw.push(id); fresh.push({ c: c, t: t, g: g }); } }); });
    let pet = false;
    if (S.awards.pets.indexOf('fish') < 0 && fcPetProgress() >= FC_PET.n) { S.awards.pets.push('fish'); pet = true; }
    if (!fresh.length && !pet) return;
    save();
    if (silent) { World.setAwards(worldAwards()); return; }
    fresh.forEach(f => showUnlock({ emoji: MEDAL[f.t], title: f.c[1] + ' flashcard medal', sub: TIER[f.t] + ' · ' + f.g + ' cards mastered' }));
    if (pet) {
      pend.pets.add('fish'); World.setAwards(worldAwards());
      showUnlock({ emoji: FC_PET.emoji, title: 'New pet: Goldfish', sub: 'Its tank sits by the left wall', target: { kind: 'fish' }, land: () => { pend.pets.delete('fish'); World.setAwards(worldAwards()); World.unlockPet('fish'); if (view === 'awards' || view === 'flash') renderPanel(); } });
    }
  }
  function fcHTML() {
    if (!fcs.card) fcNext();
    const c = fcs.card, chips = [['all', 'All']].concat(FC_CATS.map(x => [x[0], x[1]])).map(x => '<button type="button" class="chip' + (fcs.cat === x[0] ? ' on' : '') + '" data-act="fc-cat" data-v="' + x[0] + '" aria-pressed="' + (fcs.cat === x[0]) + '">' + esc(x[1]) + '</button>').join('');
    const card = c ? '<button type="button" class="fcard' + (fcs.flip ? ' flipped' : '') + '" data-act="fc-flip" aria-label="' + (fcs.flip ? 'Answer shown' : 'Tap to flip') + '"><small>' + esc(FC_NAME[c.c]) + '</small><b>' + esc(c.f) + '</b>' + (fcs.flip ? '<span class="fcans">' + esc(c.b) + '</span>' : '<em>Tap to flip</em>') + '</button>' +
      (fcs.flip ? '<div class="btnrow fcrate"><button type="button" class="btn" data-act="fc-no">Not yet</button><button type="button" class="btn go" data-act="fc-got">Got it</button></div>' : '') : '<p class="note">No cards are open yet.</p>';
    const rows = FC_CATS.map(cat => {
      const n = fcMastered(cat[0]), next = FC_GOALS.find(g => n < g), top = FC_GOALS[FC_GOALS.length - 1];
      const tiers = FC_GOALS.map((g, t) => (S.flashAw || []).indexOf(cat[0] + ':' + t) >= 0 ? '<span class="tier on">' + MEDAL[t] + ' ' + TIER[t] + '</span>' : '<span class="tier">🔒 ' + g + ' cards</span>').join('');
      return '<div class="aw"><div class="awh"><b>' + cat[2] + ' ' + esc(cat[1]) + '</b><span>' + n + ' mastered</span></div><div class="awbar"><i style="width:' + Math.min(100, Math.round(100 * n / (next || top))) + '%"></i></div><div class="awt">' + tiers + '</div></div>';
    }).join('');
    const have = S.awards.pets.indexOf('fish') >= 0;
    return '<div class="pane"><h3>Flashcards</h3><p class="sub">Flip a card, then rate yourself. Two "Got it" in a row masters a card. Medals are earned for each kind of card, and medals in three kinds bring home a goldfish.</p>' +
      '<div class="chips fcchips">' + chips + '</div>' + card +
      '<div class="aw"><div class="awh"><b>' + FC_PET.emoji + ' Goldfish</b><span>' + (have ? 'swimming in its tank' : fcPetProgress() + '/' + FC_PET.n + ' kinds with a medal') + '</span></div><div class="awbar"><i style="width:' + (have ? 100 : Math.round(100 * fcPetProgress() / FC_PET.n)) + '%"></i></div></div>' + rows + '</div>';
  }

  /* ---- share card: a picture of your results ---- */
  let shareURL = '', shareBlob = null;
  function countMastered() { let n = 0; for (const k in S.mastery) if (BYKEY[k] && S.mastery[k].box >= 2) n++; return n; }
  function shareCanvas() {
    const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d'), F = 'system-ui, -apple-system, "Segoe UI", sans-serif';
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0E9A8E'); bg.addColorStop(1, '#073F3B'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.07)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(120 + i * 190, 80 + (i % 2) * 40, 90, 0, 7); g.fill(); }
    const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    g.textBaseline = 'alphabetic'; g.textAlign = 'center';
    g.fillStyle = '#FFFFFF'; g.font = '800 70px ' + F; let name = shopName(), fs = 70; while (g.measureText(name).width > 900 && fs > 30) { fs -= 4; g.font = '800 ' + fs + 'px ' + F; } g.fillText(name, W / 2, 130);
    g.fillStyle = '#F1A20E'; g.font = '700 38px ' + F; g.fillText(RANKS[rankIdx()][1] + ' · ' + tierName(), W / 2, 190);
    const tot = S.correct + S.wrong, acc = tot ? Math.round(100 * S.correct / tot) : 0;
    const stats = [[S.served, 'patients served'], [acc + '%', 'accuracy'], [S.best, 'best streak'], [countMastered(), 'questions mastered'], [weeksMastered(), 'weeks mastered'], [(S.flashN || 0), 'flashcards flipped']];
    stats.forEach((s, i) => {
      const x = 60 + (i % 3) * 330, y = 240 + Math.floor(i / 3) * 190;
      g.fillStyle = 'rgba(255,255,255,.12)'; rr(x, y, 300, 160, 24); g.fill();
      g.fillStyle = '#FFFFFF'; g.font = '800 62px ' + F; g.fillText(String(s[0]), x + 150, y + 90);
      g.fillStyle = '#BFE9E3'; g.font = '600 26px ' + F; g.fillText(s[1], x + 150, y + 130);
    });
    g.textAlign = 'left'; g.fillStyle = '#FFFFFF'; g.font = '800 40px ' + F; g.fillText('Mastery by topic', 60, 680);
    AW_CATS.forEach((c, i) => {
      const m = catMastery(c), pct = m.total ? Math.min(1, m.done / m.total) : 0, y = 720 + i * 52;
      g.fillStyle = '#E3F7F4'; g.font = '600 26px ' + F; g.fillText(CATNAME[c], 60, y + 28);
      g.fillStyle = 'rgba(255,255,255,.18)'; rr(360, y + 8, 540, 26, 13); g.fill();
      if (pct > 0) { g.fillStyle = '#2CCDBB'; rr(360, y + 8, Math.max(26, 540 * pct), 26, 13); g.fill(); }
      g.fillStyle = '#FFFFFF'; g.font = '700 24px ' + F; g.fillText(Math.round(pct * 100) + '%', 920, y + 29);
    });
    g.textAlign = 'center';
    const acc2 = ACCS.slice(0, S.acc || 0).map(a => a[1]).join(' '), pets = S.awards.pets.map(k => { const d = PET_DEFS.find(p => p.id === k); return d ? d.emoji : k === 'fish' ? FC_PET.emoji : ''; }).join(' ');
    const medals = (S.awards.frames.length + (S.flashAw || []).length);
    g.fillStyle = '#F1A20E'; g.font = '700 32px ' + F; g.fillText('Medals and frames earned: ' + medals, W / 2, 1230);
    g.font = '52px ' + F; g.fillStyle = '#FFFFFF'; g.fillText((pets || '') + (pets && acc2 ? '   ' : '') + (acc2 || ''), W / 2, 1295);
    g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '600 24px ' + F; g.fillText('Corner Rx study game · ' + new Date().toLocaleDateString(), W / 2, 1335);
    return cv;
  }
  function makeShare() {
    const cv = shareCanvas();
    cv.toBlob(function (b) {
      if (!b) { toast('Could not make the picture on this device.'); return; }
      if (shareURL) { try { URL.revokeObjectURL(shareURL); } catch (e) { /* ignore */ } }
      shareBlob = b; shareURL = URL.createObjectURL(b);
      if (view === 'awards') renderPanel();
      setTimeout(() => { const el = $('#sharepv'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 60);
    }, 'image/png');
  }
  function shareSend() {
    try {
      const f = new File([shareBlob], 'corner-rx-results.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: 'My Corner Rx results' }).catch(() => { }); return; }
    } catch (e) { /* fall through */ }
    toast('Sharing is not available here. Use Save image instead.');
  }
  function shareHTML() {
    return '<div class="aw sharebox" id="sharebox"><div class="awh"><b>📸 Share my results</b></div><p class="note">Make a picture of your pharmacy stats to send to classmates.</p>' +
      '<div class="btnrow"><button type="button" class="btn go" data-act="share">' + (shareURL ? 'Refresh picture' : 'Make results card') + '</button>' +
      (shareURL ? (navigator.canShare ? '<button type="button" class="btn" data-act="share-send">Share</button>' : '') + '<a class="btn" href="' + shareURL + '" download="corner-rx-results.png">Save image</a>' : '') + '</div>' +
      (shareURL ? '<img id="sharepv" class="sharepv" src="' + shareURL + '" alt="Your Corner Rx results card">' : '') + '</div>';
  }

  /* ---- new visitors: health inspector, mumbling patient, wholesaler delivery ---- */
  const EV_NAME = { inspector: ['Inspector Hale', 'Ms. Brandt (State Board)', 'Mr. Voss, Inspector'], driver: ['Dale (wholesaler)', 'Rosa (driver)', 'Tomás (delivery)'] };
  let forceEvt = null;
  function eventRoll() {
    if (forceEvt) { const k = forceEvt; forceEvt = null; return k; }
    if (focusOn() || learning()) return null;
    if (S.evCd > 0) { S.evCd--; return null; }
    if (S.served < 10) return null;
    if (Math.random() < 0.15) { S.evCd = 8; save(); return pick(['inspector', 'driver']); }
    return null;
  }
  function evQ(o) { o.k = hash('EV|' + o.q); o.c = 'SIG'; BYKEY[o.k] = o; return o; }
  const LAWQS = () => BANK.filter(q => q.c === 'SIG' && !/^(What does|Interpret)/.test(q.q));
  const LASA = [
    ['Hydro-something, for my allergies and itching.', 'Hydroxyzine', ['Hydralazine', 'Hydroxyurea', 'Hydrocodone'], 'Hydroxyzine is an antihistamine used for itching and anxiety. Hydralazine treats blood pressure, hydroxyurea is for cancer or sickle cell disease, and hydrocodone is for pain. Tall man lettering: hydrOXYzine and hydrALAzine.'],
    ['Cel-something. My doctor wants me off the pain pills, it is for my arthritis.', 'Celebrex', ['Celexa', 'Cerebyx', 'Zyprexa'], 'Celebrex (celecoxib) is an NSAID for arthritis pain. Celexa is an SSRI, Cerebyx is an IV seizure drug, and Zyprexa is an antipsychotic.'],
    ['Clon-something, to calm my blood pressure.', 'Clonidine', ['Clonazepam', 'Clomiphene', 'Clozapine'], 'Clonidine is an alpha-2 agonist for blood pressure. Clonazepam is a benzodiazepine, clomiphene is a fertility drug, and clozapine is an antipsychotic.'],
    ['It is the Lam-something for my seizures.', 'Lamictal', ['Lamisil', 'Lomotil', 'Lanoxin'], 'Lamictal (lamotrigine) treats seizures and bipolar disorder. Lamisil is for fungal infections, Lomotil for diarrhea, and Lanoxin for heart failure and atrial fibrillation.'],
    ['My toenail fungus pill, the Lam-something.', 'Lamisil', ['Lamictal', 'Lomotil', 'Lanoxin'], 'Lamisil (terbinafine) treats fungal nail infections. Lamictal is an anticonvulsant, so mixing them up is a real safety risk.'],
    ['Metf-something? For my sugar.', 'Metformin', ['Metronidazole', 'Methotrexate', 'Metoprolol'], 'Metformin treats type 2 diabetes. Metronidazole is an antibiotic, methotrexate is for cancer and autoimmune disease, and metoprolol is a beta blocker.'],
    ['Pred-something. A short burst for my asthma flare, tablets.', 'Prednisone', ['Prednisolone', 'Pravastatin', 'Prazosin'], 'Prednisone is the oral steroid tablet. Prednisolone is the active form, often a liquid. Tall man lettering: predniSONE and prednisoLONE.'],
    ['Bup-something. To help me quit smoking.', 'Bupropion', ['Buspirone', 'Buprenorphine', 'Bumetanide'], 'Bupropion (Zyban) helps with smoking cessation. Buspirone treats anxiety, buprenorphine treats opioid dependence, and bumetanide is a diuretic.'],
    ['Gli-something, it is the sugar pill I take with breakfast.', 'Glipizide', ['Glyburide', 'Glimepiride', 'Glycopyrrolate'], 'Careful: glipizide and glyburide are both sulfonylureas with similar names. Check the dose and the prescriber note. Glycopyrrolate is an anticholinergic.'],
    ['It is Xan-something, for my anxiety.', 'Xanax', ['Zantac', 'Zyrtec', 'Zocor'], 'Xanax (alprazolam) is a benzodiazepine. Zantac was ranitidine, Zyrtec is an antihistamine, and Zocor is a statin.'],
    ['Zyr-something, for my seasonal allergies.', 'Zyrtec', ['Zyprexa', 'Zantac', 'Xanax'], 'Zyrtec (cetirizine) treats allergies. Zyprexa (olanzapine) is an antipsychotic, a classic look-alike mix-up.'],
    ['Lorazepam or alprazolam... I take the one that starts with A, for panic.', 'Alprazolam', ['Lorazepam', 'Clonazepam', 'Diazepam'], 'This one is by the first letter A. Alprazolam (Xanax) is a C-IV benzodiazepine, like lorazepam (Ativan), clonazepam (Klonopin) and diazepam (Valium). Always confirm the strength.'],
    ['Tol-something for my overactive bladder.', 'Tolterodine', ['Tolazamide', 'Tolmetin', 'Tolvaptan'], 'Tolterodine (Detrol) is an antimuscarinic for overactive bladder. Tolazamide is a sulfonylurea, tolmetin an NSAID, and tolvaptan treats hyponatremia.'],
    ['Nor-something for blood pressure, the Nor-vask.', 'Norvasc', ['Navane', 'Nolvadex', 'Noroxin'], 'Norvasc (amlodipine) is a calcium channel blocker. Navane is an antipsychotic, Nolvadex is tamoxifen, and Noroxin is an antibiotic.']
  ];
  const DELIV_STORE = ['Refrigerator (36 to 46 °F)', 'Freezer (-13 to 5 °F)', 'Room temperature (68 to 77 °F)', 'Locked controlled-substance cabinet'];
  const DELIV = [
    ['unopened Lantus (insulin glargine) pens', 0, 'Unopened insulin is refrigerated. In-use pens can stay at room temperature for up to 28 days.'],
    ['oxycodone 5 mg tablets (C-II)', 3, 'C-II drugs go in a securely locked cabinet or safe (or dispersed among stock), and each C-II order is checked against the DEA Form 222 or CSOS record.'],
    ['Varivax (varicella vaccine)', 1, 'Varivax is stored frozen. MMR, flu and Tdap vaccines go in the refrigerator.'],
    ['Humira (adalimumab) pens', 0, 'Biologic pens are refrigerated. Patients can keep them at room temperature for a short, limited time.'],
    ['amoxicillin powder for oral suspension, before mixing', 2, 'The dry powder is stored at room temperature. After it is mixed, the suspension is refrigerated and discarded after 14 days.'],
    ['latanoprost eye drops, unopened bottles', 0, 'Unopened latanoprost is refrigerated. Once open, patients can keep the bottle at room temperature for about 6 weeks.'],
    ['nitroglycerin sublingual tablets', 2, 'Nitroglycerin SL stays at room temperature in its original glass bottle, tightly closed.'],
    ['hydrocodone/acetaminophen tablets (C-II)', 3, 'Hydrocodone combinations are C-II, so they need locked storage and a Form 222 or CSOS record when received.'],
    ['EpiPen (epinephrine) auto-injectors', 2, 'Epinephrine auto-injectors are kept at room temperature, away from light. Do not refrigerate.'],
    ['Victoza (liraglutide) pens, unopened', 0, 'Unopened GLP-1 pens are refrigerated. After first use they can be kept at room temperature or the fridge for a limited time.'],
    ['Tdap vaccine syringes', 0, 'Most vaccines are refrigerated at 2 to 8 °C, with temperature logs checked every day.'],
    ['methylphenidate (Ritalin) tablets (C-II)', 3, 'Stimulants such as methylphenidate are C-II and go in the locked cabinet.'],
    ['Fluzone flu vaccine', 0, 'Flu vaccines are refrigerated, and never frozen.'],
    ['metformin tablets', 2, 'Most oral tablets, like metformin, are kept at controlled room temperature in a dry place.'],
    ['insulin lispro (Humalog) vials, unopened', 0, 'Unopened insulin vials are refrigerated.']
  ];
  /* build the question for a visitor */
  function evQuestion(kind, carry) {
    if (kind === 'inspector') {
      const pool = LAWQS().filter(q => !carry || carry.used.indexOf(q.k) < 0); return pick(pool.length ? pool : LAWQS());
    }
    const x = pick(DELIV), a = DELIV_STORE[x[1]];
    return evQ({ d: 1, q: 'The wholesaler tote holds ' + x[0] + '. Where does it go?', a: a, w: DELIV_STORE.filter((s, i) => i !== x[1]), e: x[2], t: 'Delivery check' });
  }
  const EV_FLAVOR = {
    inspector: ['*clicks pen* Let us look at your records.', '*peers over the clipboard* Routine inspection.', 'State Board. Please answer the following.'],
    driver: ['*sets a tote on the counter* Delivery! Sign here.', 'Wholesaler delivery. Where should I leave these?', '*wheels in a cart* Cold chain items too.']
  };
  const EV_LABEL = { inspector: 'HEALTH INSPECTOR', driver: 'WHOLESALER DELIVERY · where does it go?' };
  function inspVerdict() {
    const i = cur.insp, passed = i.ok >= 2;
    if (passed) { const b = Math.round(60 * (1 + S.up.counsel * 0.1) * franchiseMult()); S.cash += b; S.earned += b; S.rep = Math.min(100, S.rep + 5); S.inspOK = (S.inspOK || 0) + 1; SFX.play('streak'); return '<p class="gift"><b>Inspection passed (' + i.ok + '/' + i.of + ').</b> The inspector leaves a glowing report. +' + money(b) + ' and reputation +5.</p>'; }
    const fine = Math.min(S.cash, 60); S.cash -= fine; S.rep = Math.max(0, S.rep - 5);
    return '<p class="gift sad"><b>Citation issued (' + i.ok + '/' + i.of + ').</b> You need 2 of 3. ' + (fine ? 'Fine: ' + money(fine) + ', ' : '') + 'reputation -5. The law and safety questions will come back in your mix.</p>';
  }
  function evAfter(ok) {
    if (cur.evt === 'driver') {
      if (ok) { S.hintsLeft++; return '<p class="gift"><b>Delivery stored correctly.</b> Dale leaves you a free pharmacist hint.</p>'; }
      const loss = Math.min(S.cash, 40); S.cash -= loss; return '<p class="gift sad"><b>Spoiled stock.</b> ' + (loss ? 'You lose ' + money(loss) + ' of product. ' : '') + 'Check the label and the DEA schedule next time.</p>';
    }
    return '';
  }
  /* continue an inspection with the next question, same inspector */
  function inspContinue() {
    const prev = cur, q = evQuestion('inspector', prev.insp), opts = shuffle([q.a, ...q.w].map((t, i) => ({ t, ok: i === 0 })));
    cur = Object.assign({}, prev, { q: q, wasMissed: S.missed.indexOf(q.k) >= 0, opts: opts, t0: Date.now(), done: false, hint: false, picked: undefined, ok: undefined, resHTML: '', pausedAt: 0, num: Math.floor(Math.random() * 90000) + 1000, flavor: pick(EV_FLAVOR.inspector), interrupt: null });
    cur.insp = { n: prev.insp.n + 1, of: prev.insp.of, ok: prev.insp.ok, used: prev.insp.used.concat([q.k]) };
    view = 'q'; SFX.play('bell'); renderPanel();
  }
  function fcPetRow() {
    const have = S.awards.pets.indexOf('fish') >= 0;
    return '<div class="awp ' + (have ? 'on' : '') + '"><span aria-hidden="true">' + FC_PET.emoji + '</span><div><b>' + FC_PET.name + '</b><small>' + (have ? 'Swimming in its tank by the left wall.' : fcPetProgress() + '/' + FC_PET.n + ' flashcard kinds with a medal') + '</small><span class="awbar pbar"><i style="width:' + (have ? 100 : Math.round(100 * fcPetProgress() / FC_PET.n)) + '%"></i></span></div></div>';
  }

  /* inspector and driver wait behind the counter. Click them to start; the patient at the counter waits (frozen) until you are done. */
  let visitSaved = null;
  function visitArrive(kind) {
    toast(kind === 'inspector' ? 'The health inspector is waiting behind the counter. Click them!' : 'A delivery driver is waiting behind the counter. Click them!');
    SFX.play(kind === 'inspector' ? 'siren' : 'thud');
  }
  function visitClick() {
    if (!World.ok || !World.visitorInfo) return;
    const v = World.visitorInfo(); if (!v) return;
    if (v.state !== 'wait') { toast(v.state === 'in' ? 'They are still walking in.' : 'They are leaving.'); return; }
    if (cur && cur.visit) return;
    if (view !== 'q' || !cur) { toast('Finish what you are doing first, then click them.'); return; }
    if (cur.elder && cur.elderStage < 2) { toast('Finish saying hello to the patient first.'); return; }
    visitSaved = cur;
    if (!cur.done && !cur.empty && !cur.pausedAt) cur.pausedAt = Date.now();
    endInterrupt();
    const q = evQuestion(v.kind), opts = shuffle([q.a, ...q.w].map((t, i) => ({ t, ok: i === 0 })));
    cur = { q: q, wasMissed: S.missed.indexOf(q.k) >= 0, opts: opts, t0: Date.now(), done: false, hint: false, karen: false, sweaty: false, elder: false, elderStage: 2, ask: '', caller: false, name: pick(EV_NAME[v.kind]), flavor: pick(EV_FLAVOR[v.kind]), seed: v.seed, num: S.served + 1, picked: -1, ok: false, resHTML: '', interrupt: null, evt: v.kind, insp: v.kind === 'inspector' ? { n: 1, of: 3, ok: 0, used: [q.k] } : null, review: false, visit: true };
    SFX.play('bell'); qExpand(); renderPanel();
  }
  function endVisit() {
    if (World.ok) { if (cur && cur.hero) World.himFinish(); else if (World.visitorLeave) World.visitorLeave(); }
    const s = visitSaved; visitSaved = null;
    if (s) { cur = s; resumeTimers(); view = 'q'; renderPanel(); } else newCard();
  }


  /* ---------------- Himothy (heart failure event character) ---------------- */
  let forceHim = false, himPending = false;
  const BLESS_MS = 120000, BLESS_MULT = 1.5; // placeholder blessing: money x1.5 for 2 minutes
  const blessOn = () => Date.now() < (S.blessUntil || 0);
  const blessMult = () => blessOn() ? BLESS_MULT : 1;
  const HIM_LINES = ['*lands in a cloud of dust* Heart failure emergency!', 'Citizens! I need one quick pharmacology answer!', 'Never fear, Himothy is here. One question!'];
  const himQs = () => BANK.filter(x => x.c === 'HIM');
  const himAllMastered = () => { const a = himQs(); return a.length > 0 && a.every(x => (S.mastery[x.k] || {}).box >= 2); };
  function himPick() {
    const all = himQs(); if (!all.length) return null;
    let pool = all.filter(x => ((S.mastery[x.k] || {}).box || 0) < 2); if (!pool.length) pool = all;
    if (pool.length > 1) pool = pool.filter(x => x.k !== lastKey);
    return pick(pool);
  }
  // his questions are mastered: the panel closes, he says goodbye and a golden light carries him up
  function himFarewell(dev) {
    if (!dev) { S.himDone = true; save(); }
    if (!(World.ok && World.himAscend && World.himAtCounter && World.himAtCounter())) { toast('Himothy’s work here is done. He will pass over in the clouds now and then.'); return; }
    view = 'him'; renderPanel();
    setTimeout(() => { World.himAscend(() => { newCard(); }); }, 1100);
  }
  const himOk = () => !!S.himDone && !focusOn() && !labOn() && !learning() && view === 'q' && !document.querySelector('.vdlg');
  function onHimSpawn() { toast('✨ An angel is passing over the pharmacy. Click him!'); SFX.play('streak'); }
  function himAngelOk() {
    if (focusOn() || labOn()) return false;
    if (view !== 'q' || !cur || cur.empty) { toast('Finish what you are doing first, then click him.'); return false; }
    if (cur.elder && cur.elderStage < 2) { toast('Finish saying hello to the patient first.'); return false; }
    if (cur.visit) return false;
    return true;
  }
  // he has landed behind the dust: hand him the counter and ask a question
  function himLand() {
    if (view !== 'q' || !cur || cur.visit) return false;
    const q = himPick(); if (!q) return false;
    visitSaved = cur; if (!cur.done && !cur.empty && !cur.pausedAt) cur.pausedAt = Date.now();
    endInterrupt();
    const opts = shuffle([q.a, ...q.w].map((t, i) => ({ t, ok: i === 0 })));
    cur = { q: q, wasMissed: S.missed.indexOf(q.k) >= 0, opts: opts, t0: Date.now(), done: false, hint: false, karen: false, sweaty: false, elder: false, elderStage: 2, ask: '', caller: false, name: 'Himothy', flavor: pick(HIM_LINES), seed: 4242, num: S.served + 1, picked: -1, ok: false, resHTML: '', interrupt: null, evt: null, insp: null, review: false, visit: true, hero: true };
    SFX.play('thud'); qExpand(); renderPanel(); return true;
  }
  let blessEl = null, blessTimer = null;
  function blessTick() {
    const left = (S.blessUntil || 0) - Date.now();
    if (left <= 0) { clearInterval(blessTimer); blessTimer = null; if (blessEl) { blessEl.remove(); blessEl = null; } toast('Himothy’s blessing fades.'); return; }
    const s = Math.ceil(left / 1000);
    if (blessEl) blessEl.textContent = '✨ Himothy’s blessing ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + ' · money x' + BLESS_MULT.toFixed(2);
  }
  function blessStart(fresh) {
    if (fresh !== false) { S.blessUntil = Date.now() + BLESS_MS; save(); }
    if (!blessEl) { blessEl = document.createElement('div'); blessEl.className = 'buffpill bless'; blessEl.setAttribute('role', 'status'); document.body.appendChild(blessEl); }
    clearInterval(blessTimer); blessTimer = setInterval(blessTick, 500); blessTick();
  }
  function onHimBless() { blessStart(true); SFX.play('streak'); toast('✨ Blessed! Money earned x' + BLESS_MULT.toFixed(1) + ' for ' + Math.round(BLESS_MS / 60000) + ' minutes.'); }

  /* ---------------- compounding pharmacy ---------------- */
  const LAB_FLAVOR = {
    comp: ['A prescriber called in a custom compound.', 'The hospital needs this batch made before noon.', 'No commercial product exists, so we make it here.', 'Check the math before anything touches the hood.', 'A pediatric order that needs a special strength.'],
    pk: ['The ICU wants a dosing recommendation.', 'A pharmacokinetic consult just came in.', 'Level is back. What should we change?', 'The team wants to know when it will reach steady state.', 'Pharmacy rounds: show your work.']
  };
  const LAB_NAMES = ['Dr. Kim (oncology)', 'ICU pharmacist', 'Peds nurse Ana', 'Dr. Okoye', 'Hospital pharmacy', 'NICU team', 'Dr. Larsen', 'Clinic RN Mo'];
  const labKinds = () => { const k = S.labK || {}; const a = ['comp', 'pk'].filter(x => k[x] !== false); return a.length ? a : ['comp', 'pk']; };
  const LABCALC = { expr: '', notes: '', ans: 0, out: '', open: true };
  function labResult() {
    const src = LABCALC.expr.trim();
    if (!src) return '';
    try { const v = labEval(src, LABCALC.ans); LABCALC.val = v; return '= ' + fmtS(v) + (Math.abs(v) < 1e-3 || Math.abs(v) >= 1e7 ? '' : ''); }
    catch (e) { LABCALC.val = null; return 'keep typing…'; }
  }
  function labCard() {
    const q = genLab(labKinds(), S.set.diffs);
    view = 'q';
    const opts = shuffle([q.a, ...q.w].map((t, i) => ({ t, ok: i === 0 })));
    cur = { q, lab: q.lab, wasMissed: false, opts, t0: Date.now(), done: false, hint: false, karen: false, sweaty: false, elder: false, elderStage: 2, ask: '', caller: false,
      name: pick(LAB_NAMES), flavor: pick(LAB_FLAVOR[q.lab]), seed: Math.floor(Math.random() * 100000), num: S.served + 1, picked: -1, ok: false, resHTML: '', interrupt: null, evt: null, insp: null, review: false };
    LABCALC.expr = ''; LABCALC.notes = ''; LABCALC.out = '';
    renderPanel();
  }
  function labToolsHTML() {
    if (!cur || !cur.lab) return '';
    const btn = (v, t) => `<button type="button" class="lbtn" data-act="lab-ins" data-v="${esc(v)}">${t}</button>`;
    return `<details class="labtools" ${LABCALC.open ? 'open' : ''}><summary>Bench calculator &amp; scratchpad <small>no timer, take your time</small></summary>
      <div class="labcalc"><div class="lrow"><input id="labexpr" class="field" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="e.g. 100*e^(-0.1*8)" aria-label="Calculator expression" value="${esc(LABCALC.expr)}"><output id="labout" class="lout" aria-live="polite">${esc(labResult())}</output></div>
        <div class="lkeys">${btn('ln(', 'ln')}${btn('log(', 'log')}${btn('exp(', 'e^x')}${btn('sqrt(', '√')}${btn('^', 'x^y')}${btn('(', '(')}${btn(')', ')')}${btn('/', '÷')}${btn('*', '×')}${btn('ans', 'ans')}${btn('0.693', '0.693')}<button type="button" class="lbtn" data-act="lab-ans">= store</button><button type="button" class="lbtn" data-act="lab-clr">clear</button></div>
        <textarea id="labnotes" class="field" rows="3" placeholder="Scratchpad: write your set-up here (not graded)." aria-label="Scratchpad">${esc(LABCALC.notes)}</textarea></div></details>`;
  }
  function labTick() { const o = $('#labout'); if (o) o.textContent = labResult(); }
  function syncLab() {
    const on = !!S.lab, l = $('#lablab'), b = $('#labbtn');
    if (l) l.textContent = on ? 'Back to the pharmacy' : 'Switch to compounding';
    if (b) b.setAttribute('aria-pressed', String(on));
    document.body.classList.toggle('lab', on);
  }
  function toggleLab() {
    clearTasks();
    S.lab = !S.lab; save();
    if (World.ok && World.setLab) World.setLab(S.lab);
    syncLab(); SFX.play('bell');
    toast(S.lab ? 'Welcome to the compounding pharmacy. No timer. Tap the equipment to play with it.' : 'Back at your pharmacy.');
    document.body.classList.remove('drawer');
    newCard();
  }
  document.addEventListener('input', (e) => {
    const t = e.target; if (!t || !t.id) return;
    if (t.id === 'labexpr') { LABCALC.expr = t.value; labTick(); }
    else if (t.id === 'labnotes') LABCALC.notes = t.value;
  });
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.id === 'labexpr' && e.key === 'Enter') { e.preventDefault(); labTick(); if (LABCALC.val != null) LABCALC.ans = LABCALC.val; }
  });
  document.addEventListener('toggle', (e) => { if (e.target && e.target.classList && e.target.classList.contains('labtools')) LABCALC.open = e.target.open; }, true);

  /* ---------------- secret capsules ---------------- */
  const CAPS = [
    { n: 'Ruby capsule', e: '🔴', p: 'Grapefruit juice blocks CYP3A4 in the gut wall, so drugs like simvastatin and felodipine reach higher levels.' },
    { n: 'Sapphire capsule', e: '🔵', p: 'Steady state takes about 4 to 5 half-lives, no matter how big the dose is.' },
    { n: 'Emerald capsule', e: '🟢', p: 'Do not crush extended-release or enteric-coated tablets. It dumps the whole dose at once or destroys the coating.' },
    { n: 'Amber capsule', e: '🟠', p: 'Vitamin K reverses warfarin slowly. 4-factor PCC reverses it fast when bleeding is serious.' },
    { n: 'Violet capsule', e: '🟣', p: 'Narrow therapeutic index drugs need level monitoring: digoxin, lithium, phenytoin, warfarin, vancomycin.' }
  ];
  const CAPC = ['#E04F3A', '#3E72D9', '#2FAE66', '#F2A516', '#8A63C9'];
  const capSvg = (i, s) => '<svg viewBox="0 0 40 40" width="' + (s || 26) + '" height="' + (s || 26) + '" aria-hidden="true"><g transform="rotate(-40 20 20)"><rect x="4" y="12" width="32" height="16" rx="8" fill="#fff" stroke="#1d2b2e" stroke-width="2.2"/><path d="M20 12H12a8 8 0 0 0 0 16h8z" fill="' + CAPC[i % 5] + '" stroke="#1d2b2e" stroke-width="2.2" stroke-linejoin="round"/><path d="M9 16.5h6" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/></g></svg>';
  const capsLeft = () => CAPS.map((c, i) => i).filter(i => !(S.caps || []).includes(i));
  const capsuleOk = () => !focusOn() && !labOn() && capsLeft().length > 0 && !learning() && view === 'q';
  function onCapsule(src) {
    const left = capsLeft(); if (!left.length) return;
    const id = pick(left); S.caps = (S.caps || []).concat([id]);
    const n = S.caps.length, bonus = 40 * n * Math.max(1, 1 + S.up.shelf * 0.25), c = CAPS[id];
    S.cash += bonus; S.earned += bonus;
    let sub = c.p + ' (+' + money(bonus) + ')';
    if (n === CAPS.length) { S.hintsLeft = Math.min(hintCap() + 3, S.hintsLeft + 3); S.cash += 500; S.earned += 500; sub += ' All five found: +' + money(500) + ' and 3 hints!'; }
    save(); SFX.play('unlock');
    showUnlock({ emoji: capSvg(id, 54), title: 'Secret capsule ' + n + ' of ' + CAPS.length + ' (' + (src === 'plant' ? 'from the plant' : 'from the sky') + ')', sub });
    renderStats(); if (view === 'awards') renderPanel();
  }
  /* ---------------- lost pills: vial, tablet buff, capsule cosmetics ---------------- */
  const COSM = [
    ['face', 'mustache', 'Mustache', '🥸'], ['face', 'handlebar', 'Handlebar mustache', '🤵'], ['face', 'goatee', 'Goatee', '🧔'], ['face', 'beard', 'Full beard', '🧔‍♂️'], ['face', 'soulpatch', 'Soul patch', '😏'], ['face', 'chops', 'Mutton chops', '🤠'],
    ['hat', 'beanie', 'Beanie', '🧶'], ['hat', 'tophat', 'Top hat', '🎩'], ['hat', 'cowboy', 'Cowboy hat', '🤠'], ['hat', 'party', 'Party hat', '🥳'], ['hat', 'crown', 'Gold crown', '👑'], ['hat', 'chef', 'Chef hat', '👨‍🍳'], ['hat', 'propeller', 'Propeller cap', '🚁'], ['hat', 'wizard', 'Wizard hat', '🧙'],
    ['eyes', 'monocle', 'Monocle', '🧐'], ['eyes', 'eyepatch', 'Eyepatch', '🏴‍☠️'], ['extra', 'bowtie', 'Bow tie', '🎀'], ['extra', 'clownnose', 'Clown nose', '🤡'], ['extra', 'headphones', 'Headphones', '🎧'], ['extra', 'earring', 'Gold earrings', '💎'], ['eyes', 'goggles', 'Goggles', '🥽']
  ];
  const COSM_SLOT = { face: 'Facial hair', eyes: 'Glasses', hat: 'Hats', extra: 'Extras' };
  const STD_EYES = [['eyes', 'round', 'Round glasses'], ['eyes', 'square', 'Square glasses']];
  const cosmById = id => COSM.find(c => c[1] === id) || STD_EYES.find(c => c[1] === id);
  const cosmHave = id => (S.cosm || []).indexOf(id) >= 0 || STD_EYES.some(c => c[1] === id);
  function cosmSpec() { const on = S.cosmOn || {}, o = { face: '', eyes: '', hat: '', extra: '' }; Object.keys(on).forEach(k => { const id = on[k], c = id && cosmHave(id) ? cosmById(id) : null; if (c) o[c[0]] = id; }); return o; }
  const PNAME = { '#F4F4F0': 'white', '#F2A516': 'orange', '#E04F3A': 'red', '#4C7BD9': 'blue', '#2FAE66': 'green', '#F29BC1': 'pink', '#8A63C9': 'purple', '#7FD6E8': 'sky blue', '#F6E27A': 'yellow' };
  const PSHAPE = { disc: 'round tablet', oval: 'oval tablet', caplet: 'caplet tablet', sq: 'square tablet', two: 'two-tone capsule', band: 'banded capsule', gel: 'softgel capsule' };
  function pillName(p) { const c = PNAME[p.c] || 'colorful'; return (p.k === 'c' && p.s !== 'gel' && p.c2 && p.c2 !== p.c ? c + ' and ' + (PNAME[p.c2] || 'white') + ' ' : c + ' ') + (PSHAPE[p.s] || (p.k === 't' ? 'tablet' : 'capsule')); }
  function pillSvg(p, s) {
    const ink = '#1d2b2e', st = 'stroke="' + ink + '" stroke-width="2"', c = p.c, c2 = p.c2 || p.c; let b;
    if (p.k === 't') {
      if (p.s === 'disc') b = '<circle cx="20" cy="20" r="13" fill="' + c + '" ' + st + '/><path d="M9 20h22" stroke="' + ink + '" stroke-width="1.6" opacity=".45"/>';
      else if (p.s === 'oval') b = '<ellipse cx="20" cy="20" rx="16" ry="10" fill="' + c + '" ' + st + ' transform="rotate(-30 20 20)"/>';
      else if (p.s === 'caplet') b = '<g transform="rotate(-30 20 20)"><rect x="4" y="13" width="32" height="14" rx="7" fill="' + c + '" ' + st + '/><path d="M20 13v14" stroke="' + ink + '" stroke-width="1.6" opacity=".45"/></g>';
      else b = '<rect x="8" y="8" width="24" height="24" rx="5" fill="' + c + '" ' + st + ' transform="rotate(-15 20 20)"/>';
    } else if (p.s === 'gel') b = '<ellipse cx="20" cy="20" rx="16" ry="10" fill="' + c + '" ' + st + ' transform="rotate(-35 20 20)"/><ellipse cx="14" cy="15" rx="4" ry="2" fill="#fff" opacity=".7" transform="rotate(-35 14 15)"/>';
    else b = '<g transform="rotate(-40 20 20)"><rect x="4" y="12" width="32" height="16" rx="8" fill="' + c2 + '"/><path d="M20 12H12a8 8 0 0 0 0 16h8z" fill="' + c + '"/>' + (p.s === 'band' ? '<rect x="16" y="12" width="8" height="16" fill="#F4F4F0"/>' : '') + '<rect x="4" y="12" width="32" height="16" rx="8" fill="none" ' + st + '/></g>';
    return '<svg viewBox="0 0 40 40" width="' + (s || 34) + '" height="' + (s || 34) + '" aria-hidden="true">' + b + '</svg>';
  }
  const vialBtnSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3h8M9 3v3M15 3v3M7 6h10v13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z"/><path d="M7 11h10"/></svg>';
  function vialSync() {
    const b = $('#vialbtn'); if (!b) return; const n = (S.vial || []).length, c = b.querySelector('.vcount');
    if (c) { c.textContent = n; c.hidden = !n; }
    b.setAttribute('aria-label', 'Lost pills vial, ' + n + (n === 1 ? ' pill' : ' pills'));
  }
  const pillOk = () => !focusOn() && !labOn() && !learning() && view === 'q' && !document.querySelector('.vdlg');
  function onPill(sp) {
    S.vial = S.vial || []; S.vial.push({ k: sp.k, c: sp.c, c2: sp.c2 || '', s: sp.s }); if (S.vial.length > 24) S.vial.shift();
    S.pillN = (S.pillN || 0) + 1; save(); vialSync(); SFX.play('ok');
    toast('Added to the lost pills vial: ' + pillName(sp) + '.');
  }
  /* tablet buff */
  const BUFF_MS = 90000; let buffUntil = 0, buffSlips = 0, buffTimer = null, buffEl = null;
  const buffOn = () => Date.now() < buffUntil;
  const buffPay = () => (buffOn() ? 2 : 1) * blessMult();
  function buffKeep() { if (buffOn() && buffSlips > 0) { buffSlips--; return true; } return false; }
  function buffTick() {
    const left = buffUntil - Date.now();
    if (left <= 0) { endBuff(); return; }
    if (buffEl) buffEl.textContent = '⚡ Tablet buff ' + Math.ceil(left / 1000) + 's · money ×2 · streak bonus ×3' + (buffSlips ? ' · ' + buffSlips + ' free slip' + (buffSlips > 1 ? 's' : '') : '');
  }
  function endBuff() {
    clearInterval(buffTimer); buffTimer = null; buffUntil = 0; buffSlips = 0;
    document.body.classList.remove('trip'); try { World.setBuff(false); } catch (e) { /* ignore */ }
    if (buffEl) { buffEl.remove(); buffEl = null; }
    toast('The tablet wears off. Back to normal.');
  }
  function tabletTake() {
    buffUntil = Date.now() + BUFF_MS; buffSlips = 2;
    if (!document.querySelector('.tripfx')) { const f = document.createElement('div'); f.className = 'tripfx'; f.setAttribute('aria-hidden', 'true'); document.body.appendChild(f); }
    document.body.classList.add('trip');
    if (!buffEl) { buffEl = document.createElement('div'); buffEl.className = 'buffpill'; buffEl.setAttribute('role', 'status'); document.body.appendChild(buffEl); }
    try { World.setBuff(true); } catch (e) { /* ignore */ }
    SFX.play('streak'); toast('⚡ You feel energized and sharp! Your pharmacist is buzzing.');
    clearInterval(buffTimer); buffTimer = setInterval(buffTick, 250); buffTick();
  }
  /* the vial window */
  let vdlg = null, vOpenAt = 0, vSel = -1, vBack = null;
  function vdlgClose() {
    if (!vdlg) return; vdlg.remove(); vdlg = null; document.removeEventListener('keydown', vdlgKey, true);
    if (cur && !cur.done && !cur.empty && vOpenAt) cur.t0 += Date.now() - vOpenAt; vOpenAt = 0;
    if (vBack && vBack.focus) try { vBack.focus(); } catch (e) { /* ignore */ }
  }
  function vdlgKey(e) { if (e.key === 'Escape' && vdlg) { e.stopPropagation(); vdlgClose(); } }
  function openVial() {
    if (vdlg) return; vBack = document.activeElement; vOpenAt = Date.now(); vSel = -1;
    vdlg = document.createElement('div'); vdlg.className = 'tour vdlg'; document.body.appendChild(vdlg);
    document.addEventListener('keydown', vdlgKey, true);
    vdlg.addEventListener('click', ev => {
      const t = ev.target.closest('button'); if (!t) { if (ev.target === vdlg) vdlgClose(); return; }
      if (t.dataset.close !== undefined) { vdlgClose(); return; }
      if (t.dataset.i !== undefined) { vSel = +t.dataset.i; vdraw(); const nb = vdlg && vdlg.querySelector('[data-take]'); if (nb) nb.focus(); return; }
      if (t.dataset.take !== undefined) {
        const p = (S.vial || [])[vSel]; if (!p) return; S.vial.splice(vSel, 1); save(); vialSync(); vdlgClose();
        if (p.k === 't') tabletTake(p); else capsuleOpen(p); return;
      }
    });
    vdraw(); const f = vdlg.querySelector('button'); if (f) f.focus();
  }
  function vdraw() {
    if (!vdlg) return; const v = S.vial || [], sel = v[vSel];
    vdlg.innerHTML = '<div class="tourcard vcard" role="dialog" aria-modal="true" aria-labelledby="vtitle"><h3 id="vtitle">Lost pills vial</h3>' +
      (v.length ? '<p>Pills that popped out of bottles around the pharmacy. Pick one to take.</p><div class="vgrid">' + v.map((p, i) => '<button type="button" class="vpill" data-i="' + i + '" aria-pressed="' + (i === vSel) + '" aria-label="' + esc(pillName(p)) + '">' + pillSvg(p, 40) + '</button>').join('') + '</div>' : '<p>Empty. Watch the shelves and other spots around the pharmacy for pills that pop out, then tap them to collect.</p>') +
      (sel ? '<p class="vdesc"><b>' + esc(pillName(sel)) + '.</b> ' + (sel.k === 't' ? 'Tablets are rare and strong. For 90 seconds the screen warps and your pharmacist feels sharp: money ×2, streak bonus ×3, and two free slips that keep your streak.' : 'Capsules pop open to reveal a cosmetic: facial hair, a hat, or an accessory.') + '</p>' : '') +
      '<div class="tourbtns">' + (sel ? '<button type="button" class="btn go" data-take>Take it</button>' : '') + '<button type="button" class="btn" data-close>Close</button></div></div>';
  }
  /* capsule reveal */
  function capsuleOpen(p) {
    const left = COSM.filter(c => !cosmHave(c[1])), res = left.length ? pick(left) : null;
    vOpenAt = Date.now(); vBack = document.activeElement;
    const el = document.createElement('div'); el.className = 'tour vdlg capdlg'; document.body.appendChild(el); vdlg = el;
    document.addEventListener('keydown', vdlgKey, true);
    const c1 = p.c, c2 = p.c2 || p.c, st = 'stroke="#1d2b2e" stroke-width="2.4"';
    el.innerHTML = '<div class="tourcard vcard" role="dialog" aria-modal="true" aria-labelledby="ctitle"><h3 id="ctitle">The capsule is opening...</h3><div class="capstage"><svg viewBox="0 0 120 60" class="capbig" aria-hidden="true"><g class="chalf l"><path d="M60 14H30a16 16 0 0 0 0 32h30z" fill="' + c1 + '" ' + st + '/></g><g class="chalf r"><path d="M60 14h30a16 16 0 0 1 0 32H60z" fill="' + c2 + '" ' + st + '/></g></svg><div class="reel" id="creel" aria-hidden="true">?</div></div><p class="rname" id="cname" aria-live="polite"></p><div id="cprev"></div><div class="tourbtns"><button type="button" class="btn go" data-close disabled id="cdone">Nice</button></div></div>';
    el.addEventListener('click', ev => { const t = ev.target.closest('button'); if (t && t.dataset.close !== undefined && !t.disabled) vdlgClose(); });
    const reel = el.querySelector('#creel'), nm = el.querySelector('#cname'), title = el.querySelector('#ctitle'), done = el.querySelector('#cdone');
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const icons = {}; COSM.forEach(c => { icons[c[1]] = World.ok && World.cosmIcon ? World.cosmIcon(c[0], c[1]) : null; });
    const showIt = (it) => { const u = icons[it[1]]; reel.innerHTML = u ? '<img alt="" src="' + u + '">' : it[3]; };
    let ticks = reduce ? 4 : 22, i = 0, last = -1; const t0 = reduce ? 200 : 900;
    setTimeout(() => { el.querySelector('.capstage').classList.add('open'); SFX.play('unlock'); step(); }, t0);
    function step() {
      if (!vdlg || vdlg !== el) return;
      i++; let k; do { k = Math.floor(Math.random() * COSM.length); } while (k === last && COSM.length > 1); last = k;
      const fin = i >= ticks; const it = fin ? (res || COSM[k]) : COSM[k];
      showIt(it); reel.classList.toggle('land', fin);
      if (!fin) { setTimeout(step, 70 + Math.pow(i / ticks, 2.4) * 380); return; }
      let msg = '';
      if (res) {
        S.cosm = (S.cosm || []).concat([res[1]]); S.cosmOn = S.cosmOn || {}; S.cosmOn[res[0]] = res[1];
        msg = 'New ' + COSM_SLOT[res[0]].toLowerCase().replace(/s$/, '') + ': ' + res[2] + '! It is on your pharmacist now (change it any time in Character). ' + S.cosm.length + '/' + COSM.length + ' found.';
        if (S.cosm.length === COSM.length) { S.cash += 1000; S.earned += 1000; S.hintsLeft = Math.min(hintCap() + 3, S.hintsLeft + 3); msg += ' Every cosmetic found: +' + money(1000) + ' and 3 hints!'; }
      } else { const b = Math.round(250 * franchiseMult()); S.cash += b; S.earned += b; msg = 'You found every cosmetic already, so the capsule held ' + money(b) + ' instead.'; }
      save(); try { World.setPharmacist(meSpec()); } catch (e) { /* ignore */ }
      title.textContent = res ? 'Unlocked: ' + res[2] : 'Cash capsule'; nm.textContent = msg; done.disabled = false; done.focus(); SFX.play('streak'); renderStats();
      if (res && World.ok && World.pharmPortrait) { const u = World.pharmPortrait(meSpec()); if (u) el.querySelector('#cprev').innerHTML = '<img class="mepv-img capprev" alt="Your pharmacist wearing the new item" src="' + u + '">'; }
      if (view === 'create') renderPanel();
    }
  }
  /* ---------------- seasonal events ---------------- */
  const HOLS = {
    halloween: { name: 'Halloween', emoji: '\uD83C\uDF83', start: [10, 24], end: [10, 31], deco: ['Pumpkins on the counter', 'Jack-o-lantern', 'Witch cauldron', 'Friendly ghost', 'Bat swarm', 'Spider web', 'Witch hat', 'Candy bowl'], intro: 'Halloween week! The pharmacy glows orange. Answer questions to unlock decorations, and watch for costumed patients.' },
    christmas: { name: 'Christmas', emoji: '\uD83C\uDF84', start: [12, 18], end: [12, 25], deco: ['Christmas tree', 'Gifts under the tree', 'Counter gift', 'Present pile', 'Wreath', 'Candy canes', 'Snowman', 'Giant gift stack'], intro: 'Christmas week! Snow is falling. Answer questions to put more gifts under the tree.' }
  };
  const DECO_EVERY = 4;
  function holNow() {
    let q = null; try { q = new URLSearchParams(location.search).get('holiday'); } catch (e) { /* no params */ }
    if (q) return HOLS[q] ? q : null;
    const d = new Date(), m = d.getMonth() + 1, day = d.getDate();
    for (const k in HOLS) { const h = HOLS[k]; if (m === h.start[0] && day >= h.start[1] && day <= h.end[1]) return k; }
    return null;
  }
  const holProg = (k) => { S.hol = S.hol && typeof S.hol === 'object' ? S.hol : {}; return S.hol[k] || 0; };
  const holCount = () => { const k = holNow(); return k ? Math.min(8, 1 + Math.floor(holProg(k) / DECO_EVERY)) : 0; };
  let holCur = undefined;
  function holSync() {
    const k = holNow(); if (k === holCur || !World.ok || !World.setHoliday) return;
    holCur = k; World.setHoliday(k, holCount());
    if (k && !S['holSeen' + k + new Date().getFullYear()]) { S['holSeen' + k + new Date().getFullYear()] = 1; save(); setTimeout(() => toast(HOLS[k].emoji + ' ' + HOLS[k].intro), 1500); }
  }
  function holCorrect() {
    const k = holNow(); if (!k || !HOLS[k]) return;
    const before = holCount(); S.hol[k] = holProg(k) + 1; const after = holCount();
    if (after > before && World.ok && World.setHoliday) {
      World.setHoliday(k, after);
      showUnlock({ emoji: HOLS[k].emoji, title: HOLS[k].deco[after - 1], sub: HOLS[k].name + ' decoration ' + after + ' of 8 unlocked', target: null });
    }
  }
  function seasonHTML() {
    return '<div class="grp"><b>Seasonal events</b>' + Object.keys(HOLS).map(k => { const h = HOLS[k], n = Math.min(8, 1 + Math.floor(holProg(k) / DECO_EVERY)), seen = holProg(k) > 0;
      return '<p class="note"><b>' + h.emoji + ' ' + h.name + '</b> (the week before ' + h.name + '): ' + (seen ? n + '/8 decorations unlocked.' : 'answer questions that week to unlock 8 decorations.') + (holNow() === k ? ' <b>Happening now.</b>' : '') + '</p>'; }).join('') + '</div>';
  }
  function capsHTML() {
    const have = S.caps || [];
    return '<div class="grp capsrow"><b>Secret capsules ' + have.length + '/' + CAPS.length + '</b><div class="capdots">' + CAPS.map((c, i) => '<span class="capdot ' + (have.includes(i) ? 'on' : '') + '" title="' + (have.includes(i) ? esc(c.n) : 'Not found yet') + '">' + (have.includes(i) ? capSvg(i, 24) : '?') + '</span>').join('') + '</div>' +
      (have.length ? '<ul class="note capnotes">' + have.map(i => '<li><b>' + esc(CAPS[i].n) + ':</b> ' + esc(CAPS[i].p) + '</li>').join('') + '</ul>' : '<p class="note">Watch the sky at cloud height, and the plant by the counseling room. One will show up now and then. Tap it!</p>') + '</div>';
  }

  /* ---------------- synapse lab ---------------- */
  const SYN_CATS = [['epi', 'Epilepsy targets'], ['ad', 'Antidepressants + NMDA'], ['cbd', 'CBD pathways']];
  const SYN_SITES = {
    kcnq: { n: 'KCNQ (Kv7) K⁺ channel', c: ['epi'], i: 'Neuronal K⁺ channel that carries the M-current. Opening it lets K⁺ leave, which hyperpolarizes the neuron and makes it harder to fire.' },
    nav: { n: 'Voltage-gated Na⁺ channel', c: ['epi'], i: 'Fires the action potential down the axon. Fast, repetitive firing is what many seizures need.' },
    cavt: { n: 'T-type Ca²⁺ channel', c: ['epi'], i: 'Low-threshold channel that drives the 3 Hz thalamic rhythm of absence seizures.' },
    vgcc: { n: 'Voltage-gated Ca²⁺ channel (P/Q, N)', c: ['epi', 'cbd'], i: 'Ca²⁺ entry here triggers vesicles to fuse and release transmitter.' },
    a2d: { n: 'α2δ subunit of the Ca²⁺ channel', c: ['epi'], i: 'Auxiliary subunit that helps channels reach the membrane. Gabapentinoids bind it and cut Ca²⁺-driven release.' },
    gat1: { n: 'GAT-1 (GABA transporter)', c: ['epi'], i: 'Takes GABA back up from the cleft, ending its signal.' },
    gabat: { n: 'GABA transaminase (GABA-T)', c: ['epi'], i: 'Enzyme that breaks GABA down inside the neuron and glia.' },
    sv2a: { n: 'SV2A (synaptic vesicle protein 2A)', c: ['epi'], i: 'Vesicle protein that helps vesicles get ready for release.' },
    gabaa: { n: 'GABA-A receptor (Cl⁻ channel)', c: ['epi', 'cbd'], i: 'Ligand-gated Cl⁻ channel. More Cl⁻ in makes the neuron less likely to fire.' },
    ampa: { n: 'AMPA receptor', c: ['epi'], i: 'Fast glutamate-gated Na⁺ channel that carries most excitatory current.' },
    sert: { n: 'SERT (serotonin transporter)', c: ['ad'], i: 'Pumps serotonin back into the presynaptic neuron.' },
    net: { n: 'NET (norepinephrine transporter)', c: ['ad'], i: 'Pumps norepinephrine back into the presynaptic neuron.' },
    dat: { n: 'DAT (dopamine transporter)', c: ['ad'], i: 'Pumps dopamine back into the presynaptic neuron.' },
    mao: { n: 'MAO (monoamine oxidase, on mitochondria)', c: ['ad'], i: 'Breaks down serotonin, norepinephrine and dopamine inside the terminal.' },
    a2auto: { n: 'α2 autoreceptor (presynaptic)', c: ['ad'], i: 'Feedback brake: norepinephrine here reduces further NE release.' },
    ht2a: { n: '5-HT2A receptor (postsynaptic)', c: ['ad'], i: 'Excitatory Gq receptor linked to anxiety, insomnia and sexual side effects.' },
    ht1a: { n: '5-HT1A receptor', c: ['ad', 'cbd'], i: 'Gi receptor. Activation calms firing and is linked to anxiolytic effects.' },
    nmda: { n: 'NMDA receptor (postsynaptic)', c: ['ad', 'epi'], i: 'Glutamate-gated Ca²⁺ channel, blocked by Mg²⁺ at rest. Ketamine plugs the pore.' },
    cb1: { n: 'CB1 receptor (presynaptic, Gi/o)', c: ['cbd'], i: 'Retrograde endocannabinoids (2-AG, anandamide) bind here and reduce transmitter release.' },
    faah: { n: 'FAAH (breaks down anandamide)', c: ['cbd'], i: 'Postsynaptic enzyme that clears anandamide.' },
    magl: { n: 'MAGL (breaks down 2-AG)', c: ['cbd'], i: 'Presynaptic enzyme that clears 2-AG.' },
    dagl: { n: 'DAGL (makes 2-AG)', c: ['cbd'], i: 'Postsynaptic enzyme that makes 2-AG on demand. It travels backward across the cleft to CB1.' },
    trpv1: { n: 'TRPV1 channel', c: ['cbd'], i: 'Ion channel for heat and capsaicin. Also modulated by cannabinoids.' },
    gpr55: { n: 'GPR55 receptor', c: ['cbd'], i: 'Orphan GPCR that can increase excitability. CBD is thought to block it.' },
    ent1: { n: 'ENT1 (adenosine transporter)', c: ['cbd'], i: 'Clears adenosine from the cleft. Less uptake means more adenosine, which is calming.' }
  };
  const SD = (cat, name, ctx, act, sites, note) => ({ cat, name, ctx, act, sites, note });
  const SM = (cat, name, ctx, rows, note) => { const acts = {}, lab = {}; rows.forEach(r => { acts[r[0]] = r[1]; lab[r[0]] = r[2]; }); return { cat, name, ctx, act: null, acts, lab, sites: Object.keys(acts), note, multi: true }; };
  const SYN_DRUGS = [
    SM('epi', 'Vigabatrin', 'set the arrow for its target', [['gabat', 'inh', 'GABA degradation (GABA-T)']], 'Irreversible GABA-T inhibitor, so less GABA is broken down and levels rise. Watch for visual field loss.'),
    SM('epi', 'Felbamate', 'set the arrow for each target', [['nav', 'inh', 'Na⁺ channels'], ['gabaa', 'act', 'GABA-A receptors'], ['nmda', 'inh', 'NMDA receptors']], 'Multiple targets: blocks Na⁺ channels, enhances GABA-A, and blocks NMDA receptors. Reserved for refractory cases because of aplastic anemia and liver failure risk.'),
    SM('epi', 'Valproate', 'set the arrow for each target', [['gabat', 'act', 'GABA turnover (GABA-T)'], ['nav', 'inh', 'Na⁺ channels'], ['nmda', 'inh', 'NMDA receptors']], 'Broad spectrum: blocks Na⁺ channels, raises GABA turnover and levels (it inhibits GABA-T), and dampens NMDA-mediated excitation. (It also blocks T-type Ca²⁺ channels, which helps in absence seizures.)'),
    SM('epi', 'Topiramate', 'set the arrow for each target', [['nav', 'inh', 'Na⁺ channels'], ['ampa', 'inh', 'AMPA / kainate receptors'], ['gabaa', 'act', 'GABA-A receptors']], 'Multiple targets: blocks Na⁺ channels, antagonizes AMPA receptors, and enhances GABA-A. It also weakly inhibits carbonic anhydrase.'),
    SD('epi', 'Phenytoin', '', 'inh', ['nav'], 'Blocks Na⁺ channels in the inactivated state, so fast repetitive firing stops.'),
    SD('epi', 'Carbamazepine', '', 'inh', ['nav'], 'Use-dependent Na⁺ channel block.'),
    SD('epi', 'Lamotrigine', '', 'inh', ['nav'], 'Na⁺ channel block, which also reduces glutamate release.'),
    SD('epi', 'Oxcarbazepine', 'prodrug of the active MHD metabolite', 'inh', ['nav'], 'Use-dependent Na⁺ channel block, a keto analog of carbamazepine.'),
    SD('epi', 'Eslicarbazepine', '', 'inh', ['nav'], 'Prodrug of the same active metabolite as oxcarbazepine. Blocks Na⁺ channels, favoring the inactivated state.'),
    SD('epi', 'Lacosamide', '', 'inh', ['nav'], 'Enhances slow inactivation of Na⁺ channels.'),
    SD('epi', 'Ethosuximide', 'absence seizures', 'inh', ['cavt'], 'Blocks T-type Ca²⁺ channels in thalamic neurons.'),
    SD('epi', 'Gabapentin', '', 'inh', ['a2d'], 'Binds the α2δ subunit and lowers Ca²⁺-dependent release. It does not act on GABA receptors.'),
    SD('epi', 'Pregabalin', '', 'inh', ['a2d'], 'Same target as gabapentin, with better absorption.'),
    SD('epi', 'Retigabine (ezogabine)', '', 'act', ['kcnq'], 'Opens KCNQ2-5 (Kv7) K⁺ channels, which stabilizes the resting membrane. Withdrawn for retinal and skin discoloration.'),
    SD('epi', 'Tiagabine', '', 'inh', ['gat1'], 'Blocks GABA reuptake through GAT-1, so more GABA stays in the cleft.'),
    SD('epi', 'Perampanel', '', 'inh', ['ampa'], 'Non-competitive AMPA receptor antagonist.'),
    SD('epi', 'Levetiracetam', '', 'inh', ['sv2a'], 'Binds SV2A and reduces neurotransmitter release.'),
    SD('epi', 'Benzodiazepines', 'e.g. diazepam, clonazepam, lorazepam', 'act', ['gabaa'], 'Positive allosteric modulators: they increase how often the GABA-A Cl⁻ channel opens (barbiturates lengthen the opening instead).'),
    SD('epi', 'Phenobarbital', '', 'act', ['gabaa'], 'Barbiturate: lengthens GABA-A channel opening time.'),
    SD('ad', 'Fluoxetine', 'SSRI', 'inh', ['sert'], 'Blocks serotonin reuptake. Long half-life, with an active metabolite.'),
    SD('ad', 'Sertraline', 'SSRI', 'inh', ['sert'], 'Blocks serotonin reuptake.'),
    SD('ad', 'Escitalopram', 'SSRI', 'inh', ['sert'], 'The S-enantiomer of citalopram, very selective for SERT.'),
    SD('ad', 'Venlafaxine', 'SNRI', 'inh', ['sert', 'net'], 'Blocks SERT at low doses and NET at higher doses.'),
    SD('ad', 'Duloxetine', 'SNRI', 'inh', ['sert', 'net'], 'Dual reuptake block. Also used for neuropathic pain.'),
    SD('ad', 'Atomoxetine', 'ADHD, non-stimulant', 'inh', ['net'], 'Selective norepinephrine reuptake inhibitor.'),
    SD('ad', 'Nortriptyline', 'TCA', 'inh', ['net', 'sert'], 'Secondary-amine TCA that favors NET.'),
    SD('ad', 'Amitriptyline', 'TCA', 'inh', ['sert', 'net'], 'Tertiary-amine TCA that blocks SERT and NET.'),
    SD('ad', 'Bupropion', 'NDRI', 'inh', ['dat', 'net'], 'Blocks dopamine and norepinephrine reuptake.'),
    SD('ad', 'Phenelzine', 'MAOI', 'inh', ['mao'], 'Irreversible MAO inhibitor. Needs a tyramine-restricted diet.'),
    SD('ad', 'Tranylcypromine', 'MAOI', 'inh', ['mao'], 'Irreversible MAO inhibitor. Hypertensive crisis risk with tyramine.'),
    SD('ad', 'Mirtazapine', '', 'inh', ['a2auto'], 'Blocks α2 autoreceptors, which releases the brake on NE and 5-HT release.'),
    SD('ad', 'Trazodone', '', 'inh', ['ht2a'], 'Blocks 5-HT2A. Often used at low doses for sleep.'),
    SD('ad', 'Buspirone', 'anxiety', 'act', ['ht1a'], 'Partial agonist at 5-HT1A.'),
    SD('ad', 'Ketamine', 'rapid-acting', 'inh', ['nmda'], 'Non-competitive NMDA pore blocker.'),
    SD('ad', 'Esketamine (Spravato)', 'nasal spray', 'inh', ['nmda'], 'The S-enantiomer of ketamine, an NMDA antagonist.'),
    SD('ad', 'Memantine', 'Alzheimer disease', 'inh', ['nmda'], 'Low-affinity uncompetitive NMDA channel blocker.'),
    SD('ad', 'Dextromethorphan', 'in Auvelity with bupropion', 'inh', ['nmda'], 'NMDA antagonist (also a sigma-1 agonist).'),
    SD('cbd', 'Dronabinol (THC)', '', 'act', ['cb1'], 'CB1 agonist.'),
    SD('cbd', 'Nabilone', '', 'act', ['cb1'], 'Synthetic THC analog, a CB1 agonist.'),
    SD('cbd', 'Rimonabant', 'withdrawn', 'inh', ['cb1'], 'CB1 inverse agonist, withdrawn for depression and suicidality.'),
    SD('cbd', 'Cannabidiol', 'negative allosteric modulator', 'inh', ['cb1'], 'CBD weakly modulates CB1 and lowers THC effects.'),
    SD('cbd', 'Cannabidiol', 'raises adenosine levels', 'inh', ['ent1'], 'Blocks ENT1, so adenosine builds up in the cleft.'),
    SD('cbd', 'Cannabidiol', 'raises anandamide', 'inh', ['faah'], 'Slows anandamide breakdown by FAAH (and its transport).'),
    SD('cbd', 'Cannabidiol', 'calming effect, serotonin pathway', 'act', ['ht1a'], 'Agonist activity at 5-HT1A is linked to anxiolytic effects.'),
    SD('cbd', 'Cannabidiol', 'heat and pain channel', 'act', ['trpv1'], 'CBD activates, then desensitizes, TRPV1.'),
    SD('cbd', 'Cannabidiol', 'orphan receptor linked to excitability', 'inh', ['gpr55'], 'CBD is a GPR55 antagonist.'),
    SD('cbd', 'Cannabidiol', 'also enhances inhibition (with clobazam)', 'act', ['gabaa'], 'Positive allosteric modulation of GABA-A.'),
    SD('cbd', 'Capsaicin', 'chili pepper', 'act', ['trpv1'], 'TRPV1 agonist, which gives heat and then desensitization.'),
    SD('cbd', 'URB597', 'experimental', 'inh', ['faah'], 'FAAH inhibitor that raises anandamide.'),
    SD('cbd', 'JZL184', 'experimental', 'inh', ['magl'], 'MAGL inhibitor that raises 2-AG.')
  ];
  const SYN = { cat: 'epi', labels: true, q: null, last: '', sel: null };
  function synSitesFor(cat) { return Object.keys(SYN_SITES).filter(id => SYN_SITES[id].c.indexOf(cat) >= 0); }
  function synNewQ() {
    const pool = SYN_DRUGS.filter(d => d.cat === SYN.cat && (d.name + d.ctx) !== SYN.last), d = pick(pool.length ? pool : SYN_DRUGS.filter(x => x.cat === SYN.cat));
    SYN.last = d.name + d.ctx;
    const others = shuffle(synSitesFor(SYN.cat).filter(id => d.sites.indexOf(id) < 0)).slice(0, 3);
    SYN.q = { d, act: null, site: null, done: false, picks: [], opts: d.multi ? shuffle(synSitesFor(SYN.cat)) : shuffle([d.sites[0]].concat(others)), stage: d.multi ? 'dir' : null, dirs: {} };
    if (World.ok && World.synHighlight) World.synHighlight(d.multi ? d.sites.slice() : null);
    if (World.ok && World.synDrug) World.synDrug({ name: d.name, act: d.act, acts: d.acts, sites: d.sites });
  }
  function synSet() {
    if (World.ok && World.synCat) { World.synCat(SYN.cat); World.synLabels(SYN.labels); if (World.synInfo) { const m = {}; Object.keys(SYN_SITES).forEach(k => { m[k] = { n: SYN_SITES[k].n, i: SYN_SITES[k].i }; }); World.synInfo(m); } }
  }
  function clearTasks() {
    if (fp && fp.on && !fp.done) { fp.done = true; fpExit(); }
    if (phone) { if (phone.ringing) { phone.ringing = false; if (World.ok) World.phoneRing(false); updatePhoneBtn(); } if (phone.open || phone.call) { phone.open = false; phone.call = null; scheduleNext(100, 80); } phone.pending = false; }
    if (rush.on) { rush.on = false; if (World.ok) World.setRush(false); rushBadge(); }
    visitSaved = null; if (World.ok && World.visitorLeave) World.visitorLeave();
  }
  function synEnter() {
    if (view === 'syn') return;
    clearTasks(); document.body.classList.remove('drawer');
    openView('syn');
    if (World.ok && !focusOn() && World.setSyn) World.setSyn(true);
    if (!SYN.q) synNewQ();
    synSet(); renderPanel(); SFX.play('bell');
  }
  function synExit() { if (World.ok && World.synOn && World.synOn()) World.setSyn(false); }
  function onSynSite(id) {
    const q = SYN.q;
    if (q && !q.done && !q.d.multi && synSitesFor(SYN.cat).indexOf(id) >= 0) { if (!q.act) { SYN.sel = id; if (World.ok) World.synHighlight([id]); toast('Choose inhibitor or activator first, then tap the site.'); if (view === 'syn') renderPanel(); return; } return synAnswerSite(id); }
    SYN.sel = id; if (World.ok) World.synHighlight([id]); if (view === 'syn') renderPanel();
  }
  function synPick(id) {
    const q = SYN.q; if (!q || q.done) return; const i = q.picks.indexOf(id); if (i >= 0) q.picks.splice(i, 1); else q.picks.push(id);
    if (World.ok) World.synHighlight(q.picks.length ? q.picks.slice() : null); renderPanel();
  }
  function synFinish() {
    const q = SYN.q; q.done = true; q.stage = null;
    S.synN = (S.synN || 0) + 1;
    if (q.ok) { S.synOK = (S.synOK || 0) + 1; S.synStreak = (S.synStreak || 0) + 1; q.pay = Math.round(14 * 2 * (1 + 0.25 * S.up.shelf) * (1 + Math.min(S.synStreak, 10) * 0.05) * franchiseMult()); S.cash += q.pay; S.earned += q.pay; SFX.play('ok'); SFX.play('coin'); } else { S.synStreak = 0; SFX.play('bad'); }
    save(); if (World.ok) { World.synHighlight(q.d.sites); if (World.synReveal) World.synReveal(); } renderStats(); renderPanel();
  }
  function synSubmit() {
    const q = SYN.q; if (!q || q.done || !q.d.multi || q.stage) return;
    if (!q.picks.length) { toast('Select every site it acts on first, then submit.'); return; }
    q.right = q.picks.filter(x => q.d.sites.indexOf(x) >= 0); q.extra = q.picks.filter(x => q.d.sites.indexOf(x) < 0); q.miss = q.d.sites.filter(x => q.picks.indexOf(x) < 0);
    q.sitesOK = !q.extra.length && !q.miss.length; q.actOK = q.siteOK = q.sitesOK;
    if (q.sitesOK) { q.stage = 'dir'; q.dirs = {}; SFX.play('ok'); if (World.ok) World.synHighlight(q.d.sites.slice()); toast('Sites correct. Now set each one: is it turned up or down by the drug?'); renderPanel(); return; }
    q.ok = false; synFinish();
  }
  function synDir(id) {
    const q = SYN.q; if (!q || q.done || q.stage !== 'dir' || q.d.sites.indexOf(id) < 0) return;
    q.dirs[id] = q.dirs[id] === 'up' ? 'down' : 'up'; renderPanel();
  }
  function synDirSubmit() {
    const q = SYN.q; if (!q || q.done || q.stage !== 'dir') return;
    if (q.d.sites.some(id => !q.dirs[id])) { toast('Tap each arrow to set up or down first.'); return; }
    q.dirOK = q.d.sites.filter(id => q.dirs[id] === (q.d.acts[id] === 'inh' ? 'down' : 'up'));
    q.ok = q.dirOK.length === q.d.sites.length; synFinish();
  }
  function synAnswerAct(v) { const q = SYN.q; if (!q || q.done) return; q.act = v; renderPanel(); }
  function synAnswerSite(id) {
    const q = SYN.q; if (!q || !q.act || q.done) return;
    q.site = id; q.done = true; q.actOK = q.act === q.d.act; q.siteOK = q.d.sites.indexOf(id) >= 0; q.ok = q.actOK && q.siteOK;
    S.synN = (S.synN || 0) + 1;
    if (q.ok) { S.synOK = (S.synOK || 0) + 1; S.synStreak = (S.synStreak || 0) + 1; q.pay = Math.round(14 * (1 + 0.25 * S.up.shelf) * (1 + Math.min(S.synStreak, 10) * 0.05) * franchiseMult()); S.cash += q.pay; S.earned += q.pay; SFX.play('ok'); SFX.play('coin'); } else { S.synStreak = 0; SFX.play('bad'); }
    save(); if (World.ok) { World.synHighlight(q.d.sites); if (World.synReveal) World.synReveal(); } renderStats(); renderPanel();
  }
  function synHTML() {
    const q = SYN.q || (synNewQ(), SYN.q), cat = SYN.cat;
    const tabs = SYN_CATS.map(c => `<button type="button" class="chip" data-act="syn-cat" data-v="${c[0]}" aria-pressed="${cat === c[0]}">${c[1]}</button>`).join('');
    const lab = `<button type="button" class="chip" data-act="syn-labels" aria-pressed="${SYN.labels}">Labels ${SYN.labels ? 'on' : 'off'}</button>`;
    const actB = '<div class="syntoggle" role="group" aria-label="Does it inhibit or activate?">' + [['inh', 'Inhibitor / blocker'], ['act', 'Activator / agonist']].map(a => { let c = ''; if (q.done) { if (a[0] === q.d.act) c = 'ok'; else if (a[0] === q.act) c = 'bad'; } else if (a[0] === q.act) c = 'sel'; return `<button type="button" class="${c}" data-act="syn-act" data-v="${a[0]}" aria-pressed="${a[0] === q.act}" ${q.done ? 'disabled' : ''}>${a[1]}</button>`; }).join('') + '</div>';
    const in3d = !!(World.ok && World.synOn && World.synOn());
    const multi = !!q.d.multi;
    const dirB = multi && q.stage === 'dir' && !q.done ? '<div class="syndirs"><p class="note">Tap each arrow to cycle it: ▲ = the drug turns this target up (enhances / activates), ▼ = turns it down (blocks / inhibits).</p>' + q.d.sites.map(id => { const v = q.dirs[id]; return `<div class="syndir"><span>${esc(q.d.lab[id] || SYN_SITES[id].n)}</span><button type="button" class="dirbtn ${v || ''}" data-act="syn-dir" data-v="${id}" aria-label="${esc(q.d.lab[id])}: ${v || 'not set'}">${v === 'up' ? '▲ up' : v === 'down' ? '▼ down' : '? tap'}</button></div>`; }).join('') + '<div><button class="btn go" type="button" data-act="syn-dirsubmit">Submit</button></div></div>' : '';
    const siteB = multi && q.stage === 'dir' ? dirB : multi && !q.done ? '<div class="opts syn-opts">' + (in3d ? '' : q.opts.map(id => `<button type="button" class="opt${q.picks.indexOf(id) >= 0 ? ' sel' : ''}" data-act="syn-site" data-v="${id}" aria-pressed="${q.picks.indexOf(id) >= 0}"><span>${esc(SYN_SITES[id].n)}</span></button>`).join('')) + '</div><div><button class="btn go" type="button" data-act="syn-submit">Submit (' + q.picks.length + ' selected)</button></div>' : !in3d && !q.done ? '<div class="opts syn-opts">' + q.opts.map((id, i) => `<button type="button" class="opt" data-act="syn-site" data-v="${id}"><kbd>${'ABCD'[i]}</kbd><span>${esc(SYN_SITES[id].n)}</span></button>`).join('') + '</div>' : '';
    const mres = q.done && multi ? `<div class="result ${q.ok ? 'good' : 'fail'}"><h3>${q.ok ? 'Correct!' : 'Not quite.'}</h3><p><b>${esc(q.d.name)}</b>: ${Object.keys(q.d.acts).map(k => (q.d.acts[k] === 'inh' ? 'turns down ' : 'turns up ') + '<b>' + esc(q.d.lab[k]) + '</b>').join('; ')}.</p>${!q.ok ? '<p class="why">Check: ' + esc(q.d.sites.filter(k => q.dirs[k] !== (q.d.acts[k] === 'inh' ? 'down' : 'up')).map(k => q.d.lab[k] + ' should be ' + (q.d.acts[k] === 'inh' ? 'down' : 'up')).join('; ')) + '.</p>' : ''}${q.miss && q.miss.length ? '<p class="why">Missed: ' + esc(q.miss.map(k => SYN_SITES[k].n).join(', ')) + '.</p>' : ''}${q.extra && q.extra.length ? '<p class="why">Not a target: ' + esc(q.extra.map(k => SYN_SITES[k].n).join(', ')) + '.</p>' : ''}<p class="why">${esc(q.d.note)}</p>${q.ok ? '<div class="pay"><span class="big">+' + money(q.pay) + '</span><span>streak ' + S.synStreak + '</span></div>' : ''}<div><button class="btn go" type="button" data-act="syn-next">Next drug</button></div></div>` : '';
    const res = q.done && multi ? mres : q.done ? `<div class="result ${q.ok ? 'good' : 'fail'}"><h3>${q.ok ? 'Correct!' : q.actOK ? 'Right action, wrong site.' : q.siteOK ? 'Right site, wrong action.' : 'Not quite.'}</h3><p><b>${esc(q.d.name)}</b> ${q.d.act === 'inh' ? 'inhibits / blocks' : 'activates / enhances'} <b>${esc(SYN_SITES[q.d.sites[0]].n)}</b>${q.d.sites.length > 1 ? ' (also ' + esc(q.d.sites.slice(1).map(s => SYN_SITES[s].n).join(', ')) + ')' : ''}.</p><p class="why">${esc(q.d.note)}</p>${q.ok ? '<div class="pay"><span class="big">+' + money(q.pay) + '</span><span>streak ' + S.synStreak + '</span></div>' : ''}<div><button class="btn go" type="button" data-act="syn-next">Next drug</button></div></div>` : '';
    const guide = synSitesFor(cat).map(id => `<li class="${SYN.sel === id ? 'sel' : ''}"><button type="button" class="linkbtn" data-act="syn-info" data-v="${id}"><b>${esc(SYN_SITES[id].n)}</b></button>${SYN.sel === id ? '<br><span>' + esc(SYN_SITES[id].i) + '</span>' : ''}</li>`).join('');
    return `<div class="pane syn"><div class="synhead"><h3>Synapse lab</h3><span class="note">${S.synN ? 'Solved ' + (S.synOK || 0) + ' of ' + S.synN : 'Tap the glowing parts of the synapse, or play the drug quiz.'}</span></div>
      <div class="chips">${tabs}${lab}</div>
      <div class="syncard"><div class="synq"><b>${esc(q.d.name)}</b>${q.d.ctx ? '<small> (' + esc(q.d.ctx) + ')</small>' : ''}</div>
        ${multi ? '' : actB}${q.done ? '' : '<p class="note">' + (multi ? (q.stage ? '' : in3d ? 'Tap EVERY site it acts on in the 3D view (tap again to undo), then submit.' : 'Select EVERY site it acts on, then submit.') : in3d ? 'Then tap the site of action in the 3D view.' : 'Then choose the site of action.') + '</p>'}${siteB}${res}</div>
      <details class="grp"><summary><b>Site guide</b> <small>tap a name to see what it does</small></summary><ul class="synguide">${guide}</ul></details>
      <div class="btnrow"><button type="button" class="btn go" data-act="back">Back to the pharmacy</button></div></div>`;
  }
