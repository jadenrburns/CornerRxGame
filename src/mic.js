  /* ---- Microbe lab (the trash can). Spliced into game.js at the MIC marker so it shares the game's scope. Data and matching helpers live in micdata.js.
     Two ways to study each group: drag from the petri dish (word bank) into slots, or type the blanks. A perfect round with no hints earns a star for that mode. ---- */
  const micS = () => { const m = S.mic = S.mic || { st: {}, mode: 'drag', set: 'body', rounds: 0 }; m.st = m.st || {}; return m; };
  const micSet = (id) => MICSETS.find(s => s.id === id) || MICSETS[0];
  const micGrp = (set, gid) => set.groups.find(g => g.id === gid);
  const micRec = (gid) => { const r = micS().st[gid]; return r || { d: 0, f: 0, n: 0 }; };
  const micStars = (g) => { const r = micRec(g.id); return (r.d ? 1 : 0) + (r.f ? 1 : 0); };
  let micR = null, micSelG = null, micDrag = null, micIn = false, micSig = '', micNonce = 0;
  const MICSORTS = {
    res: [
      { id: 'sort-iv', name: 'Sort the IV drugs', n: 10, dishes: [['pa', 'Pseudomonas', ['paiv']], ['mrsa', 'MRSA', ['mrsaiv']], ['vre', 'VRE', ['vreiv']], ['ana', 'Anaerobes', ['anaiv']], ['aty', 'Atypicals', ['atyd']]] },
      { id: 'sort-po', name: 'Sort the PO drugs', n: 10, dishes: [['pa', 'Pseudomonas', ['papo']], ['mrsa', 'MRSA', ['mrsapo']], ['vre', 'VRE', ['vrepo']], ['ana', 'Anaerobes', ['anapo']], ['aty', 'Atypicals', ['atyd']]] },
      { id: 'sort-all', name: 'Sort IV and PO together', n: 12, dishes: [['pa', 'Pseudomonas', ['paiv', 'papo']], ['mrsa', 'MRSA', ['mrsaiv', 'mrsapo']], ['vre', 'VRE', ['vreiv', 'vrepo']], ['ana', 'Anaerobes', ['anaiv', 'anapo']], ['aty', 'Atypicals', ['atyd']]] }
    ],
    pk: [{ id: 'sort-pk', name: 'Sort by killing pattern', n: 8, dishes: [['time', 'Time-dependent', ['time']], ['conc', 'Concentration-dependent', ['conc']]] }]
  };
  const micSortsFor = (sid) => (World.ok && World.setMic) ? (MICSORTS[sid] || []) : [];
  const micAllSorts = () => [].concat(MICSORTS.res, MICSORTS.pk);
  const micClean = (t) => String(t).replace(/ \((UTI only|only with other antibiotics)\)$/, '');
  /* the 3D lab room: entered whenever the Microbe lab view is open, left when it closes */
  function micSync() {
    const want = view === 'mic' && !!World.ok && !!World.setMic;
    if (want && !micIn) { micIn = true; micSig = ''; try { World.setMic(true); } catch (e) { micIn = false; } }
    else if (!want && micIn) { micIn = false; micSig = ''; try { World.setMic(false); } catch (e) { /* decor */ } if (view !== 'mic') micR = null; return; }
    if (!micIn) return;
    const m = micS(), body = MICSETS[0], sig = micR && micR.sort ? micR.sid + ':' + micR.nonce : '';
    try {
      if (sig !== micSig) { micSig = sig; World.micDishes(micR && micR.sort ? micR.dishes.map(d => ({ id: d.id, label: d.label })) : []); }
      World.micMan(m.set === 'body');
      World.micPins(body.groups.filter(g => !g.fam).map(g => ({ id: g.id, st: micStars(g), ster: !!g.sterile, name: g.name })));
      World.micSelect(micSelG && micGrp(body, micSelG) ? micSelG : null);
    } catch (e) { /* decor */ }
  }
  function micStartSort(sid) {
    const def = micAllSorts().find(x => x.id === sid); if (!def) return false;
    const m = micS(); m.set = MICSORTS.res.indexOf(def) >= 0 ? 'res' : 'pk'; const set = micSet(m.set);
    const dishes = def.dishes.map(d => { const names = []; d[2].forEach(gid => { const g = micGrp(set, gid); if (g) g.items.forEach(t => names.push(t)); }); return { id: d[0], label: d[1], keys: new Set(names.map(micNorm)), names }; });
    const rnd = () => Math.random(), pick = [], seen = new Set(), per = Math.ceil(def.n / dishes.length);
    const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; } return a; };
    const take = (t) => { const k = micNorm(t); if (seen.has(k)) return false; seen.add(k); pick.push({ t: micClean(t), k, valid: dishes.filter(d => d.keys.has(k)).map(d => d.id) }); return true; };
    dishes.forEach(d => { let c = 0; shuf(d.names).forEach(t => { if (c < per && pick.length < def.n && take(t)) c++; }); });
    shuf([].concat.apply([], dishes.map(d => d.names))).forEach(t => { if (pick.length < def.n) take(t); });
    const chips = shuf(pick); chips.forEach((c, i) => { c.id = i; c.used = false; });
    micR = { sort: true, sid, name: def.name, set: set.id, mode: 'drag', dishes: dishes.map(d => ({ id: d.id, label: d.label })), chips, placed: {}, mist: 0, hint: false, done: false, msg: '', sel: null, nonce: ++micNonce };
    renderPanel(); return true;
  }
  function micDrop(chipId, dishId) {
    const R = micR; if (!R || !R.sort || R.done || !dishId) return; const ch = R.chips[chipId]; if (!ch || ch.used) return; R.sel = null; R.shake = null;
    const dish = R.dishes.find(d => d.id === dishId); if (!dish) return;
    if (ch.valid.indexOf(dishId) >= 0) { ch.used = true; R.placed[dishId] = (R.placed[dishId] || 0) + 1; R.msg = ''; try { World.micDishFill(dishId, true); } catch (e) { /* decor */ } SFX.play('ok'); if (R.chips.every(c => c.used)) { micFinish(false); return; } }
    else { R.mist++; R.shake = chipId; R.msg = ch.t + ' does not belong in the ' + dish.label + ' dish.'; try { World.micDishFill(dishId, false); } catch (e) { /* decor */ } SFX.play('bad'); }
    renderPanel();
  }
  function micDishClick(id) { if (micR && micR.sort && !micR.done && micR.sel !== null && micR.sel !== undefined) micDrop(micR.sel, id); }
  function micSortHTML() {
    const R = micR, head = `<h3>${esc(R.name)}</h3><p class="sub">Look at the lab: each petri dish is labeled with a bug. Drag each drug from the word bank below onto the dish it treats, or tap a drug and then tap a dish.</p>`;
    const count = `<div class="micdishes" aria-label="Dishes">${R.dishes.map(d => `<span class="${R.hot === d.id ? 'hot' : ''}">${esc(d.label)} \u00B7 ${R.placed[d.id] || 0}</span>`).join('')}</div>`;
    if (R.done) {
      const r = R.res;
      return `<div class="pane micpane round">${head}${count}<div class="result ${r.stars ? 'good' : 'fail'}"><h3>${R.mist === 0 ? 'Perfect round!' : 'Round complete'}</h3>
        <div class="pay"><span class="big">+${money(r.pay)}</span><span>${R.mist} miss${R.mist === 1 ? '' : 'es'}</span>${r.bug ? '<span>trash can cleaned x2</span>' : ''}${r.stars ? '<span>\u2605 star earned</span>' : ''}</div>
        <div class="btnrow"><button type="button" class="btn go" data-act="mic-again" data-v="${R.sid}">Again</button><button type="button" class="btn" data-act="mic-menu">Back to the lab</button></div></div></div>`;
    }
    const dishes = R.chips.map(c => `<button type="button" class="petri ${c.used ? 'used' : ''} ${R.sel === c.id ? 'sel' : ''} ${R.shake === c.id ? 'shake' : ''}" data-chip="${c.id}" ${c.used ? 'disabled' : ''}>${micDish(c.t, 'drug', c.id * 7 + c.t.length)}<span>${esc(c.t)}</span></button>`).join('');
    return `<div class="pane micpane round">${head}${count}<p class="micmsg" aria-live="polite">${esc(R.msg || (R.sel !== null ? 'Drug picked. Tap the right dish.' : ''))}</p><div class="mdishes" aria-label="Petri dish word bank">${dishes}</div><p class="note">Misses: <b>${R.mist}</b></p>
      <div class="btnrow"><button type="button" class="btn" data-act="mic-menu">Back to the lab</button></div></div>`;
  }
  const micAl = (g, i) => (g.al && g.al[i]) || [];
  const micItalic = (set) => set.id === 'body' || (set.id === 'res' && set.groups[0]);

  /* a low-poly man (fan-triangulated facets) with the brain and a leg bone popping out; the other sites are pins */
  function micShade(hex, f) { const n = parseInt(hex.slice(1), 16); let r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255; const k = f >= 0 ? 255 : 0, a = Math.abs(f); r = Math.round(r + (k - r) * a); g = Math.round(g + (k - g) * a); b = Math.round(b + (k - b) * a); return 'rgb(' + r + ',' + g + ',' + b + ')'; }
  function micFacets(pts, base, seed, str) {
    let cx = 0, cy = 0; pts.forEach(p => { cx += p[0]; cy += p[1]; }); cx /= pts.length; cy /= pts.length; let o = '';
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], mx = (a[0] + b[0] + cx) / 3, my = (a[1] + b[1] + cy) / 3, light = (-(mx - cx) * 0.6 - (my - cy) * 0.8) / 60;
      const f = Math.max(-0.2, Math.min(0.2, light * 0.12 + (((seed * 31 + i * 17) % 11) / 11 - 0.5) * (str || 0.16)));
      o += '<polygon points="' + a.join(',') + ' ' + b.join(',') + ' ' + cx.toFixed(1) + ',' + cy.toFixed(1) + '" fill="' + micShade(base, f) + '"/>';
    }
    return o;
  }
  const MIC_PINS = { cns: [121, 17], ear: [82, 56], mouth: [120, 73], upper: [120, 97], lower: [98, 133], heart: [141, 147], intra: [96, 186], gi: [144, 186], uti: [120, 215], sti: [120, 250], skin: [50, 150], bone: [199, 322] };
  function micManSVG() {
    const mir = (p) => p.map(q => [240 - q[0], q[1]]);
    let s = '', k = 1;
    const part = (pts, c, str) => { s += micFacets(pts, c, k++, str); };
    const legL = [[[80, 236], [118, 236], [116, 312], [84, 312]], [[84, 312], [116, 312], [112, 392], [88, 392]], [[84, 392], [114, 392], [120, 412], [78, 412]]];
    legL.forEach((p, i) => { part(p, i === 2 ? '#35405A' : '#3F5F8C'); part(mir(p), i === 2 ? '#35405A' : '#3F5F8C'); });
    const armU = [[72, 104], [58, 112], [44, 168], [60, 174], [74, 132]], armF = [[44, 168], [60, 174], [54, 228], [38, 224]], hand = [[38, 224], [54, 228], [54, 244], [44, 250], [36, 240]];
    [armF, hand].forEach(p => { part(p, '#F2C9A5'); part(mir(p), '#F2C9A5'); });
    part([[108, 86], [132, 86], [134, 100], [106, 100]], '#E3B68F');
    part([[76, 100], [106, 100], [120, 106], [134, 100], [164, 100], [172, 122], [164, 176], [160, 236], [80, 236], [76, 176], [68, 122]], '#2BB5A5', 0.12);
    part(armU, '#2BB5A5'); part(mir(armU), '#2BB5A5');
    part([[120, 24], [142, 30], [152, 48], [148, 70], [134, 84], [120, 88], [106, 84], [92, 70], [88, 48], [98, 30]], '#F2C9A5', 0.1);
    part([[86, 48], [79, 52], [79, 63], [88, 65]], '#E3B68F'); part([[154, 48], [161, 52], [161, 63], [152, 65]], '#E3B68F');
    s += '<polygon points="104,54 114,52 114,58 105,59" fill="#27384F"/><polygon points="126,52 136,54 135,59 126,58" fill="#27384F"/><polygon points="112,70 128,70 124,77 116,77" fill="#C4463B"/>';
    /* the brain, lifted out of the skull */
    part([[94, 36], [90, 22], [100, 10], [116, 4], [134, 5], [148, 14], [152, 26], [146, 38], [132, 33], [118, 37], [104, 33]], '#F08DB0', 0.2);
    s += '<path d="M121 6 L118 20 L124 28" fill="none" stroke="#B94E79" stroke-width="1.6" stroke-linejoin="round"/>';
    /* the leg bone, popping out of the shin with a torn patch of skin */
    part([[146, 338], [154, 333], [161, 344], [157, 357], [148, 359], [141, 348]], '#C4463B', 0.2);
    const bx0 = 150, by0 = 348, bx1 = 206, by1 = 316, dx = bx1 - bx0, dy = by1 - by0, L = Math.hypot(dx, dy), nx = -dy / L * 6, ny = dx / L * 6;
    part([[bx0 + nx, by0 + ny], [bx1 + nx, by1 + ny], [bx1 - nx, by1 - ny], [bx0 - nx, by0 - ny]], '#F2EEE0', 0.1);
    const knob = (x, y, ox, oy) => { part([[x + ox - 6, y + oy - 6], [x + ox + 3, y + oy - 9], [x + ox + 9, y + oy - 1], [x + ox + 2, y + oy + 8], [x + ox - 7, y + oy + 4]], '#E6E0CC', 0.1); };
    knob(bx1, by1, 3, -7); knob(bx1, by1, 7, 5);
    return '<svg class="micman" viewBox="40 0 160 420" aria-hidden="true" focusable="false">' + s + '</svg>';
  }
  function micPinsHTML(set, groups) {
    const W = 240, H = 420, x0 = 20, vw = 200;
    return groups.map(g => {
      const p = MIC_PINS[g.id]; if (!p) return '';
      const st = micStars(g), sel = micSelG === g.id;
      return `<button type="button" class="mpin st${st}${g.sterile ? ' ster' : ''}${sel ? ' on' : ''}" data-act="mic-sel" data-v="${g.id}" style="left:${((p[0] - x0) / vw * 100).toFixed(1)}%;top:${(p[1] / H * 100).toFixed(1)}%" aria-label="${esc(g.name)}${g.sterile ? ' (normally sterile)' : ''}, ${st} of 2 stars" title="${esc(g.name)}"><span>${st === 2 ? '✓' : ''}</span></button>`;
    }).join('');
  }
  const micStarsHTML = (g) => { const r = micRec(g.id); return `<span class="mstars" aria-label="${micStars(g)} of 2 stars"><i class="${r.d ? 'on' : ''}" title="Drag and drop">★</i><i class="${r.f ? 'on' : ''}" title="Fill in the blank">★</i></span>`; };

  /* ---- menu ---- */
  function micHTML() {
    const m = micS(), set = micSet(m.set);
    if (micR) return micR.sort ? micSortHTML() : micRoundHTML();
    const srt = World.ok && World.setMic ? micAllSorts() : [], total = MICSETS.reduce((n, s) => n + s.groups.length * 2, 0) + srt.length, got = MICSETS.reduce((n, s) => n + s.groups.reduce((a, g) => a + micStars(g), 0), 0) + srt.filter(x => micRec(x.id).d).length;
    const tabs = MICSETS.map(s => `<button type="button" class="seg-b ${s.id === set.id ? 'on' : ''}" data-act="mic-set" data-v="${s.id}" aria-pressed="${s.id === set.id}">${esc(s.name)}</button>`).join('');
    const modes = [['drag', 'Drag from the petri dish'], ['fill', 'Fill in the blank']].map(a => `<button type="button" class="seg-b ${m.mode === a[0] ? 'on' : ''}" data-act="mic-mode" data-v="${a[0]}" aria-pressed="${m.mode === a[0]}">${a[1]}</button>`).join('');
    let body = '';
    if (set.id === 'body') {
      const sites = set.groups.filter(g => !g.fam), fams = set.groups.filter(g => g.fam), sel = micSelG && micGrp(set, micSelG);
      const lab3 = micIn || (World.ok && World.setMic);
      body = `<div class="micbody ${lab3 ? 'solo' : ''}">${lab3 ? '' : `<div class="mantw">${micManSVG()}${micPinsHTML(set, sites)}</div>`}
        <div class="micside"><p class="note">${lab3 ? 'Click a marker on the man in the lab, or the brain or the leg bone, to pick a body site. Markers with a ring are normally sterile sites.' : 'Tap a pin to pick a body site. The brain (CNS) and the leg bone (bone and joint) are popping out. Dashed pins are normally sterile sites.'}</p>
        ${sel ? `<div class="micpick"><b>${esc(sel.name)}</b>${micStarsHTML(sel)}<small>${sel.items.length} usual bugs${sel.sterile ? ' · normally sterile' : ''}</small><button type="button" class="btn go" data-act="mic-go" data-v="${sel.id}">Start this site</button></div>` : '<div class="micpick empty"><small>No site picked yet.</small></div>'}
        <div class="micfam"><b>Bug families</b>${fams.map(g => `<button type="button" class="btn" data-act="mic-go" data-v="${g.id}">${esc(g.name)} ${micStarsHTML(g)}</button>`).join('')}</div>
        <p class="note small">Normally sterile (no bugs): bone, heart, lower respiratory area, the central nervous system, and the blood.</p></div></div>`;
    } else {
      const sorts = m.mode === 'drag' ? micSortsFor(set.id) : [];
      body = (sorts.length ? `<div class="grp"><b>Sort into the labeled dishes</b><ul class="miclist">${sorts.map(x => `<li><button type="button" class="microw" data-act="mic-go" data-v="${x.id}"><span class="mrn">${esc(x.name)}</span><small>${x.n} drugs</small><span class="mstars" aria-label="${micRec(x.id).d ? 1 : 0} of 1 star"><i class="${micRec(x.id).d ? 'on' : ''}">\u2605</i></span></button></li>`).join('')}</ul></div><div class="grp"><b>Or fill the slots for one list</b></div>` : '') + `<ul class="miclist">${set.groups.map(g => `<li><button type="button" class="microw" data-act="mic-go" data-v="${g.id}"><span class="mrn">${esc(g.name)}</span><small>${g.items.length} to place</small>${micStarsHTML(g)}</button></li>`).join('')}</ul>`;
    }
    const bug = S.binBug ? '<p class="micbug">🦠 The trash can is crawling with bacteria! Finish a round to clean it up and earn double.</p>' : '';
    return `<div class="pane micpane"><h3>Microbe lab</h3><p class="sub">${esc(set.sub)}. Stars: <b>${got}</b> of ${total}. One star per mode when you finish a group with no misses and no hint.</p>${bug}
      <div class="seg" role="group" aria-label="Study mode">${modes}</div><div class="seg sets" role="group" aria-label="List">${tabs}</div>${body}
      <div class="btnrow"><button type="button" class="btn go" data-act="back">Back to counter</button></div></div>`;
  }

  /* ---- a round ---- */
  const micItemLabel = (set, t) => `<i>${esc(t)}</i>`;
  function micDish(label, kind, seed) {
    const cols = kind === 'drug' ? ['#E8B04A', '#C27A1E'] : ['#BFE9D6', '#5BB89A'];
    let c = '', r = seed;
    for (let i = 0; i < 5; i++) { r = (r * 9301 + 49297) % 233280; const a = r / 233280 * 6.28, d = 6 + (r % 9); r = (r * 9301 + 49297) % 233280; c += `<polygon points="${(24 + Math.cos(a) * d).toFixed(1)},${(24 + Math.sin(a) * d).toFixed(1)} ${(27 + Math.cos(a) * d).toFixed(1)},${(22 + Math.sin(a) * d).toFixed(1)} ${(28 + Math.cos(a) * d).toFixed(1)},${(27 + Math.sin(a) * d).toFixed(1)}" fill="${cols[1]}" opacity=".85"/>`; }
    return `<svg viewBox="0 0 48 48" width="46" height="46" aria-hidden="true"><polygon points="24,3 38,8 45,21 42,36 31,45 16,45 6,36 3,21 10,8" fill="${cols[0]}" stroke="#7B9AA0" stroke-width="2"/><polygon points="24,8 35,12 40,22 37,33 29,40 18,40 11,33 8,22 13,12" fill="none" stroke="#7B9AA0" stroke-width="1" opacity=".6"/>${c}</svg>`;
  }
  function micStart(gid) {
    if (micStartSort(gid)) return;
    const m = micS(); let set = null, grp = null; [micSet(m.set)].concat(MICSETS).some(s => { const g = micGrp(s, gid); if (g) { set = s; grp = g; return true; } return false; });
    if (!grp) return; m.set = set.id;
    const mode = m.mode, n = grp.items.length;
    const R = { set: set.id, gid, mode, mist: 0, hint: false, done: false, msg: '', sel: null };
    if (mode === 'drag') {
      const decoys = micDecoys(set, grp, Math.max(2, Math.min(4, 8 - n)), Math.random);
      const chips = grp.items.map(t => ({ t, k: micNorm(t), ok: true })).concat(decoys.map(t => ({ t, k: micNorm(t), ok: false })));
      for (let i = chips.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const x = chips[i]; chips[i] = chips[j]; chips[j] = x; }
      chips.forEach((c, i) => { c.id = i; c.used = false; });
      R.chips = chips; R.slots = grp.items.map(() => null);
    } else { R.vals = grp.items.map(() => ''); R.lock = grp.items.map(() => -1); R.bad = grp.items.map(() => false); }
    micR = R; renderPanel();
  }
  function micRoundHTML() {
    const R = micR, set = micSet(R.set), g = micGrp(set, R.gid), n = g.items.length, drug = set.id !== 'body' && g.bug && g.bug !== 'rp' || set.id === 'pk';
    const head = `<h3>${esc(g.name)}</h3><p class="sub">${R.mode === 'drag' ? 'Drag the right ' + (drug ? 'drugs' : 'microbes') + ' from the petri dish into the slots. You can also tap a dish, then tap a slot. Some dishes are wrong.' : 'Fill in the blanks: type the ' + (drug ? 'drugs' : 'microbes') + ' for this ' + (set.id === 'body' ? 'body site' : 'list') + '. Order does not matter.'}${g.sterile ? ' This site is normally sterile.' : ''}</p>`;
    let body = '';
    if (R.done) {
      const r = R.res, next = micNextGroup(set, g);
      body = `<div class="result ${r.stars ? 'good' : 'fail'}"><h3>${r.gaveUp ? 'Answers shown' : R.mist === 0 && !R.hint ? 'Perfect round!' : 'Round complete'}</h3>
        ${r.gaveUp ? '<p>No payout when you show the answers. Try again to earn a star.</p>' : `<div class="pay"><span class="big">+${money(r.pay)}</span><span>${R.mist} miss${R.mist === 1 ? '' : 'es'}</span>${R.hint ? '<span>hint x0.7</span>' : ''}${r.bug ? '<span>trash can cleaned x2</span>' : ''}${r.stars ? '<span>★ star earned</span>' : ''}</div>`}
        <p class="micans"><b>${esc(g.name)}:</b> ${g.items.map(t => esc(t)).join(' · ')}</p>
        <div class="btnrow"><button type="button" class="btn go" data-act="mic-again" data-v="${g.id}">Again</button>${next ? `<button type="button" class="btn" data-act="mic-go" data-v="${next.id}">Next: ${esc(next.name)}</button>` : ''}<button type="button" class="btn" data-act="mic-menu">Back to the lab</button></div></div>`;
    } else if (R.mode === 'drag') {
      const slots = R.slots.map((c, i) => { const ch = c === null ? null : R.chips[c]; return `<button type="button" class="mslot ${ch ? 'full' : ''}" data-slot="${i}" aria-label="Slot ${i + 1}${ch ? ': ' + esc(ch.t) : ', empty'}" ${ch ? 'disabled' : ''}>${ch ? `<i>${esc(ch.t.replace(/ \((UTI only|only with other antibiotics)\)$/, ''))}</i>` : '<em>' + (i + 1) + '</em>'}</button>`; }).join('');
      const dishes = R.chips.map(c => `<button type="button" class="petri ${c.used ? 'used' : ''} ${R.sel === c.id ? 'sel' : ''} ${R.shake === c.id ? 'shake' : ''}" data-chip="${c.id}" ${c.used ? 'disabled' : ''}>${micDish(c.t, drug ? 'drug' : 'bug', c.id * 7 + c.t.length)}<span>${esc(c.t)}</span></button>`).join('');
      body = `<div class="mslots" aria-label="Slots">${slots}</div><p class="micmsg" aria-live="polite">${esc(R.msg || (R.sel !== null ? 'Dish picked. Tap an empty slot.' : ''))}</p><div class="mdishes" aria-label="Petri dish word bank">${dishes}</div><p class="note">Misses: <b>${R.mist}</b></p>
        <div class="btnrow"><button type="button" class="btn" data-act="mic-menu">Back to the lab</button></div>`;
    } else {
      const rows = g.items.map((t, i) => { const lk = R.lock[i] >= 0; const ph = R.hint ? (() => { const w = lk ? '' : (g.items.find((x, j) => R.lock.indexOf(j) < 0 && j >= 0) || ''); return ''; })() : ''; return `<label class="mfill ${lk ? 'ok' : R.bad[i] ? 'bad' : ''}"><span>${i + 1}</span><input type="text" data-fill="${i}" value="${esc(lk ? g.items[R.lock[i]].replace(/ \((UTI only|only with other antibiotics)\)$/, '') : R.vals[i])}" ${lk ? 'readonly' : ''} placeholder="${R.hint && !lk ? esc(micHintFor(g, R, i)) : 'Type here'}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Blank ${i + 1}"></label>`; }).join('');
      body = `<div class="mfills">${rows}</div><p class="micmsg" aria-live="polite">${esc(R.msg)}</p><p class="note">Misses: <b>${R.mist}</b>. Spelling does not need to be perfect, and short forms like <i>E. coli</i> or <i>MRSA</i> are fine.</p>
        <div class="btnrow"><button type="button" class="btn go" data-act="mic-check">Check</button><button type="button" class="btn" data-act="mic-hint" ${R.hint ? 'disabled' : ''}>Hint (first letters)</button><button type="button" class="btn" data-act="mic-reveal">Show answers</button><button type="button" class="btn" data-act="mic-menu">Back to the lab</button></div>`;
    }
    return `<div class="pane micpane round">${head}${body}</div>`;
  }
  function micHintFor(g, R, i) { const left = g.items.filter((t, j) => R.lock.indexOf(j) < 0); const t = left[R.hintMap ? R.hintMap[i] : 0] || ''; return ''; }
  function micNextGroup(set, g) { const i = set.groups.findIndex(x => x.id === g.id); for (let k = 1; k <= set.groups.length; k++) { const o = set.groups[(i + k) % set.groups.length]; if (o.id !== g.id && !!o.fam === !!g.fam) return o; } return null; }
  /* chips: the player drops a dish on a slot, either by dragging or by tap, tap */
  function micPlace(chipId, slot) {
    const R = micR; if (!R || R.done || R.mode !== 'drag') return; const set = micSet(R.set), g = micGrp(set, R.gid), ch = R.chips[chipId]; if (!ch || ch.used || R.slots[slot] !== null) return;
    const okKeys = g.items.map(micNorm), placed = R.slots.filter(c => c !== null).map(c => R.chips[c].k);
    R.sel = null; R.shake = null;
    if (okKeys.indexOf(ch.k) >= 0 && placed.indexOf(ch.k) < 0) { ch.used = true; R.slots[slot] = chipId; R.msg = ''; SFX.play('ok'); if (R.slots.every(c => c !== null)) { micFinish(false); return; } }
    else { R.mist++; R.shake = chipId; R.msg = ch.t.replace(/ \((UTI only|only with other antibiotics)\)$/, '') + ' is not on this list. It goes back in the dish.'; SFX.play('bad'); }
    renderPanel();
  }
  function micCheck() {
    const R = micR; if (!R || R.done || R.mode !== 'fill') return; const set = micSet(R.set), g = micGrp(set, R.gid); let wrong = 0, empty = 0, added = 0;
    R.bad = R.bad.map(() => false);
    R.vals.forEach((v, i) => {
      if (R.lock[i] >= 0) return; if (!v.trim()) { empty++; return; }
      const j = g.items.findIndex((t, jj) => R.lock.indexOf(jj) < 0 && micMatch(v, t, micAl(g, jj)));
      if (j >= 0) { R.lock[i] = j; added++; } else { R.bad[i] = true; wrong++; }
    });
    R.mist += wrong;
    if (R.lock.every(x => x >= 0)) { micFinish(false); return; }
    R.msg = (added ? added + ' right. ' : '') + (wrong ? wrong + ' not on this list' + (wrong === 1 ? '' : ' (each counts as a miss)') + '. ' : '') + (empty ? empty + ' blank' + (empty === 1 ? '' : 's') + ' still empty.' : '');
    SFX.play(wrong ? 'bad' : 'ok'); renderPanel();
  }
  function micFinish(gaveUp) {
    const R = micR, set = micSet(R.set), g = R.sort ? { id: R.sid, items: R.chips } : micGrp(set, R.gid), n = g.items.length, m = micS(); const rec = m.st[g.id] = m.st[g.id] || { d: 0, f: 0, n: 0 };
    let pay = 0, stars = false, bug = false;
    if (!gaveUp) {
      const acc = R.mist === 0 ? 1.5 : R.mist <= 2 ? 1 : 0.6; bug = !!S.binBug;
      pay = Math.max(1, Math.round(6 * n * (R.mode === 'fill' ? 1.5 : 1) * acc * (R.hint ? 0.7 : 1) * (bug ? 2 : 1) * buffPay() * franchiseMult()));
      S.cash += pay; S.earned += pay; rec.n++; m.rounds = (m.rounds || 0) + 1;
      if (R.mist === 0 && !R.hint) { const key = R.mode === 'fill' ? 'f' : 'd'; if (!rec[key]) { rec[key] = 1; stars = true; } }
      if (bug) { S.binBug = false; try { World.setBin(false); } catch (e) { /* decor */ } }
      SFX.play('ok'); SFX.play('coin'); boardPushSoon();
    } else if (R.lock) { R.lock = g.items.map((t, i) => i); }
    R.done = true; R.res = { pay, stars, bug, gaveUp: !!gaveUp };
    save(); renderStats(); renderPanel();
  }
  function micAct(a, v) {
    const m = micS();
    switch (a) {
      case 'mic': micR = null; openView(view === 'mic' ? 'q' : 'mic'); if (view === 'q') { resumeTimers(); renderPanel(); } return;
      case 'mic-mode': m.mode = v === 'fill' ? 'fill' : 'drag'; save(); renderPanel(); return;
      case 'mic-set': m.set = v; micSelG = null; save(); renderPanel(); return;
      case 'mic-sel': micSelG = v; renderPanel(); return;
      case 'mic-go': case 'mic-again': micStart(v); return;
      case 'mic-menu': micR = null; renderPanel(); return;
      case 'mic-check': micCheck(); return;
      case 'mic-hint': if (micR && !micR.hint && micR.mode === 'fill') { micR.hint = true; const g = micGrp(micSet(micR.set), micR.gid); micR.msg = 'Hint: the answers start with ' + g.items.filter((t, j) => micR.lock.indexOf(j) < 0).map(t => t.replace(/^[^A-Za-z]*/, '').charAt(0).toUpperCase()).sort().join(', ') + '.'; renderPanel(); } return;
      case 'mic-reveal': if (micR && !micR.done) { const g = micGrp(micSet(micR.set), micR.gid); micR.mist += micR.lock.filter(x => x < 0).length; micFinish(true); } return;
    }
  }
  /* keep typed text when the panel redraws, and use Enter to check */
  document.addEventListener('input', (e) => { const i = e.target && e.target.dataset && e.target.dataset.fill; if (i === undefined || !micR) return; micR.vals[+i] = e.target.value; micR.bad[+i] = false; const lab = e.target.closest('.mfill'); if (lab) lab.classList.remove('bad'); });
  document.addEventListener('keydown', (e) => {
    if (!micR || view !== 'mic' || micR.mode !== 'fill' || micR.done) return;
    const t = e.target; if (!t || !t.dataset || t.dataset.fill === undefined || e.key !== 'Enter') return; e.preventDefault();
    const all = [...document.querySelectorAll('.mfill input:not([readonly])')], i = all.indexOf(t); if (i >= 0 && i < all.length - 1 && !all[i + 1].value) all[i + 1].focus(); else micCheck();
  });
  /* drag a petri dish onto a slot (pointer events: mouse, touch and pen). A short press-and-release selects the dish instead. */
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest && e.target.closest('.petri'); if (!b || !micR || micR.done || b.disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
    micDrag = { id: +b.dataset.chip, x: e.clientX, y: e.clientY, on: false, el: b, ghost: null, pid: e.pointerId };
  });
  document.addEventListener('pointermove', (e) => {
    const d = micDrag; if (!d || d.pid !== e.pointerId) return;
    if (!d.on && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 7) { d.on = true; d.el.classList.add('drag'); const g = document.createElement('div'); g.className = 'pghost'; g.innerHTML = d.el.innerHTML; document.body.appendChild(g); d.ghost = g; }
    if (d.on) { e.preventDefault(); d.ghost.style.left = e.clientX + 'px'; d.ghost.style.top = e.clientY + 'px'; const s = document.elementFromPoint(e.clientX, e.clientY), sl = s && s.closest && s.closest('.mslot:not(.full)'); document.querySelectorAll('.mslot.over').forEach(x => x !== sl && x.classList.remove('over')); if (sl) sl.classList.add('over'); if (micR && micR.sort && World.micDishHot) { const hd = World.micDishAt(e.clientX, e.clientY); World.micDishHot(hd); } }
  }, { passive: false });
  const micDragEnd = (e) => {
    const d = micDrag; if (!d || d.pid !== e.pointerId) return; micDrag = null;
    if (d.ghost) d.ghost.remove(); d.el.classList.remove('drag'); document.querySelectorAll('.mslot.over').forEach(x => x.classList.remove('over'));
    if (e.type === 'pointercancel' || !micR) return;
    if (micR.sort && World.micDishHot) World.micDishHot(null);
    if (d.on && micR.sort) { const hd = World.micDishAt(e.clientX, e.clientY); if (hd) micDrop(d.id, hd); else renderPanel(); }
    else if (d.on) { const s = document.elementFromPoint(e.clientX, e.clientY), sl = s && s.closest && s.closest('.mslot'); if (sl && !sl.disabled) micPlace(d.id, +sl.dataset.slot); }
    else { micR.sel = micR.sel === d.id ? null : d.id; micR.msg = ''; renderPanel(); }
  };
  document.addEventListener('pointerup', micDragEnd); document.addEventListener('pointercancel', micDragEnd);
  document.addEventListener('click', (e) => {
    if (!micR || view !== 'mic') return; const sl = e.target.closest && e.target.closest('.mslot'), ch = e.target.closest && e.target.closest('.petri');
    if (ch && e.detail === 0 && !ch.disabled) { micR.sel = micR.sel === +ch.dataset.chip ? null : +ch.dataset.chip; renderPanel(); return; }
    if (sl && !sl.disabled && micR.sel !== null && micR.sel !== undefined) micPlace(micR.sel, +sl.dataset.slot);
  });
  /* the trash can gets crawling with bacteria now and then; the player does not have to act, but a round while it is dirty pays double */
  function micTick() {
    if (!World.ok || S.binBug || !S.tutDone || (S.served || 0) < 5 || document.hidden || view === 'create') return;
    if (Math.random() < 0.2) { S.binBug = true; try { World.setBin(true); } catch (e) { /* decor */ } save(); toast('Something is crawling on the trash can. Click it!'); }
  }
  setInterval(micTick, 25000);
