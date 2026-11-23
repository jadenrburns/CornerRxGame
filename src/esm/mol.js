import { P } from './pt3b.js';
import { Q } from './bank.js';
/* Skeletal structures for the "tap the metabolism site" questions (Exam 3, PHAR 421).
   Tiny builder: atoms with coordinates, bonds, regular rings, fused rings, substituents. MOLS[id]() returns
   {atoms, bonds, sites:{id:{x,y,r,t}}}; molSVG(id, state) draws it. Drawn by hand to match the lecture slides. */
const MOLS = (function () {
  const L = 30, D = Math.PI / 180;
  function MB() {
    const M = { at: [], bd: {}, sites: {}, names: {} };
    M.atom = (x, y, l) => { M.at.push([x, y, l || '']); return M.at.length - 1; };
    M.bond = (i, j, o, ref) => { M.bd[Math.min(i, j) + '-' + Math.max(i, j)] = { i, j, o: o || 1, ref: ref || null }; };
    M.out = (i, ang, l, o, len) => { const p = M.at[i], k = M.atom(p[0] + (len || L) * Math.cos(ang * D), p[1] + (len || L) * Math.sin(ang * D), l); M.bond(i, k, o || 1); return k; };
    M.cen = (ids) => { let x = 0, y = 0; ids.forEach(i => { x += M.at[i][0]; y += M.at[i][1]; }); return [x / ids.length, y / ids.length]; };
    M.away = (i, ids) => { const c = M.cen(ids), p = M.at[i]; return Math.atan2(p[1] - c[1], p[0] - c[0]) / D; };
    M.ring = (ids) => { for (let k = 0; k < ids.length; k++) { const a = ids[k], b = ids[(k + 1) % ids.length], key = Math.min(a, b) + '-' + Math.max(a, b); if (!M.bd[key]) M.bond(a, b, 1); } };
    M.arom = (ids, start) => { const c = M.cen(ids); [0, 2, 4].forEach(k => { const a = ids[(start + k) % ids.length], b = ids[(start + k + 1) % ids.length]; M.bond(a, b, 2, c); }); };
    M.poly = (n, cx, cy, rot) => { const R = L / (2 * Math.sin(Math.PI / n)), ids = []; for (let k = 0; k < n; k++) ids.push(M.atom(cx + R * Math.cos((rot + 360 / n * k) * D), cy + R * Math.sin((rot + 360 / n * k) * D))); M.ring(ids); return ids; };
    M.fuse = (i, j, n, from) => {
      const p = M.at[i], q = M.at[j], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, dx = q[0] - p[0], dy = q[1] - p[1], s = Math.hypot(dx, dy);
      let nx = -dy / s, ny = dx / s; if ((from[0] - mx) * nx + (from[1] - my) * ny > 0) { nx = -nx; ny = -ny; }
      const a = s / (2 * Math.tan(Math.PI / n)), R = s / (2 * Math.sin(Math.PI / n)), cx = mx + nx * a, cy = my + ny * a;
      const tp = Math.atan2(p[1] - cy, p[0] - cx), tq = Math.atan2(q[1] - cy, q[0] - cx); let d = tq - tp;
      while (d > Math.PI) d -= 2 * Math.PI; while (d <= -Math.PI) d += 2 * Math.PI;
      const sg = d > 0 ? 1 : -1, ids = [i];
      for (let k = 1; k <= n - 2; k++) ids.push(M.atom(cx + R * Math.cos(tp - sg * k * 2 * Math.PI / n), cy + R * Math.sin(tp - sg * k * 2 * Math.PI / n)));
      ids.push(j); M.ring(ids); return ids;
    };
    /* a phenyl hung on atom i in direction ang: returns the 6 ring ids, [0] is the attached carbon, [3] is para */
    M.phenyl = (i, ang) => {
      const p = M.at[i], cx = p[0] + 2 * L * Math.cos(ang * D), cy = p[1] + 2 * L * Math.sin(ang * D), ids = M.poly(6, cx, cy, ang + 180);
      M.bond(i, ids[0], 1); M.arom(ids, 1); return ids;
    };
    M.site = (id, i, t, r) => { const p = Array.isArray(i) ? i : M.at[i]; M.sites[id] = { x: p[0], y: p[1], r: r || 17, t }; };
    M.mid = (i, j) => [(M.at[i][0] + M.at[j][0]) / 2, (M.at[i][1] + M.at[j][1]) / 2];
    return M;
  }
  /* zigzag chain from atom i: first angle, alternate +/- 60 degrees; labels list, returns ids */
  function chain(M, i, first, labels, orders) { const ids = []; let a = first, cur = i; labels.forEach((l, k) => { cur = M.out(cur, a, l, orders && orders[k]); ids.push(cur); a = (k % 2 === 0) ? a - 60 : a + 60; }); return ids; }

  /* benzodiazepine core shared by clonazepam and 7-amino-clonazepam. 7-ring order: C9a, N1, C2, C3, N4, C5, C5a */
  function clon(nitroLabel) {
    const M = MB(), b = M.poly(6, 0, 0, 0); M.arom(b, 0);
    const r7 = M.fuse(b[1], b[0], 7, M.cen(b)); const [c9a, n1, c2, c3, n4, c5, c5a] = r7;
    M.at[n1][2] = 'NH'; M.at[n4][2] = 'N'; M.bond(n4, c5, 2); M.out(c2, M.away(c2, r7), 'O', 2);
    const ph = M.phenyl(c5, M.away(c5, r7)); M.out(ph[1], M.away(ph[1], ph), 'Cl');
    const nit = M.out(b[4], M.away(b[4], b), nitroLabel);
    M.site('nitro', nit, nitroLabel === 'NO₂' ? 'nitro group' : 'amino group'); M.site('lactam', c2, 'lactam C=O'); M.site('chlorophenyl', M.cen(ph), 'chlorophenyl ring', 22); M.site('c3', c3, 'C3 CH₂'); M.site('ring', M.cen(b), 'benzo ring', 20);
    return M;
  }
  /* 1,5-benzodiazepine-2,4-dione. 7-ring order: C9a, N1, C2, C3, C4, N5, C5a */
  function clob(nMethyl) {
    const M = MB(), b = M.poly(6, 0, 0, 0); M.arom(b, 0);
    const r7 = M.fuse(b[1], b[0], 7, M.cen(b)); const [c9a, n1, c2, c3, c4, n5, c5a] = r7;
    M.at[n1][2] = 'N'; M.at[n5][2] = 'N'; M.out(c2, M.away(c2, r7), 'O', 2); M.out(c4, M.away(c4, r7), 'O', 2);
    let me = null; if (nMethyl) me = M.out(n1, M.away(n1, r7), 'CH₃'); else M.at[n1][2] = 'NH';
    const ph = M.phenyl(n5, M.away(n5, r7)); const cl = M.out(b[4], M.away(b[4], b), 'Cl');
    if (me !== null) M.site('nme', me, 'N-methyl'); else M.site('nh', n1, 'N–H');
    M.site('para', ph[3], 'para position of the N-phenyl ring'); M.site('co2', c2, 'C2 carbonyl'); M.site('c3', c3, 'C3 CH₂'); M.site('cl', cl, 'chloro-benzo ring', 17); M.site('c4', c4, 'C4 carbonyl');
    return M;
  }
  /* hydantoin core: C5 at the top, phenyls up and out */
  function hyd(withPhos) {
    const M = MB(), h = M.poly(5, 0, 0, -90); const [c5, c4, n3, c2, n1] = h;
    M.at[n3][2] = withPhos ? 'N' : 'NH'; M.at[n1][2] = 'NH'; M.out(c4, M.away(c4, h) - 10, 'O', 2); M.out(c2, 90, 'O', 2);
    const pa = M.phenyl(c5, -145), pb = M.phenyl(c5, -35);
    M.site('para1', pa[3], 'para position of one phenyl ring'); M.site('para2', pb[3], 'para position of the other phenyl ring'); M.site('imide', c4, 'hydantoin C=O'); M.site('nh', n1, 'ring N–H');
    if (withPhos) {
      const c = M.out(n3, 25, 'CH₂'), o = M.out(c, -35, 'O'), p = M.out(o, 25, 'P');
      M.out(p, -90, 'O', 2); M.out(p, 25, 'OH'); M.out(p, 90, 'OH');
      M.site('ester', M.mid(o, p), 'phosphate ester O–P bond', 20); M.site('nch2o', M.mid(n3, c), 'N–CH₂ carbon', 14);
      M.sites.ester.x += 4;
    }
    return M;
  }
  /* dibenzazepine core. v0 = N5 at the bottom, v3,v4 = C10,C11 on top. */
  function cbz(kind) {
    const M = MB(), v = M.poly(7, 0, 0, 90), [n, a1, a2, c10, c11, a5, a6] = v;
    M.at[n][2] = 'N'; const c = M.cen(v);
    const lf = M.fuse(a1, a2, 6, c), rt = M.fuse(a6, a5, 6, c); M.arom(lf, lf.length - 1); M.arom(rt, rt.length - 1);
    const cc = M.out(n, 90, ''), amC = cc; M.out(amC, 150, 'O', 2); M.out(amC, 30, 'NH₂');
    if (kind === 'cbz') M.bond(c10, c11, 2);
    if (kind === 'epox') { const m = M.mid(c10, c11), o = M.atom(m[0], m[1] - 24, 'O'); M.bond(c10, o, 1); M.bond(c11, o, 1); M.site('epox', [m[0], m[1] - 10], 'epoxide', 19); }
    if (kind === 'oxc') { M.out(c10, M.away(c10, v), 'O', 2); }
    if (kind === 'cbz') M.site('alkene', M.mid(c10, c11), '10,11 double bond', 19);
    if (kind === 'oxc') { M.site('keto', c10, '10-keto group', 18); M.site('ch2', c11, '11-CH₂', 15); }
    M.site('amide', amC, 'carboxamide', 19); M.site('ringL', M.cen(lf), 'left benzo ring', 22); M.site('ringR', M.cen(rt), 'right benzo ring', 22);
    return M;
  }
  /* tolterodine family: phenol ring with CH3 (or CH2OH), CH(Ph)CH2CH2N(iPr)2 */
  function tol(kind) {
    const M = MB(), a = M.poly(6, 0, 0, 0); M.arom(a, 0);
    const ang = M.away(a[0], a), ch = M.out(a[0], ang, ''), ph = M.phenyl(ch, ang - 60);
    const oh = M.out(a[1], M.away(a[1], a), kind === 'feso' ? 'O' : 'OH'), me = M.out(a[4], M.away(a[4], a), kind === 'feso' ? 'CH₂OH' : 'CH₃');
    let est = null; if (kind === 'feso') { est = M.out(oh, 120, ''); M.out(est, 60, 'O', 2); const ib = M.out(est, 180, ''); M.out(ib, 120, ''); M.out(ib, 240, ''); }
    const c2 = M.out(ch, ang + 60, ''), c3 = M.out(c2, ang - 0, ''), n = M.out(c3, ang + 60, 'N');
    const i1 = M.out(n, ang + 20, ''), i2 = M.out(n, ang + 100, ''); M.out(i1, ang - 40, ''); M.out(i1, ang + 70, ''); M.out(i2, ang + 150, ''); M.out(i2, ang + 40, '');
    M.site('methyl', me, kind === 'feso' ? 'hydroxymethyl group' : 'ring methyl group', 17); M.site('iprop', i1, 'N-isopropyl group', 17); M.site('phenyl', M.cen(ph), 'unsubstituted phenyl ring', 22);
    if (kind === 'feso') M.site('ester', est, 'isobutyrate ester', 19); else M.site('phenol', oh, 'phenol OH', 15);
    M.site('amine', n, 'tertiary amine N', 14);
    return M;
  }
  const defs = {
    clonazepam: () => clon('NO₂'), aminoclon: () => clon('NH₂'), clobazam: () => clob(true), norclob: () => clob(false),
    phenytoin: () => hyd(false), fosphen: () => hyd(true), cbz: () => cbz('cbz'), cbzep: () => cbz('epox'), oxc: () => cbz('oxc'),
    tolterodine: () => tol('tol'), fesoterodine: () => tol('feso'),
    ethosux: () => {
      const M = MB(), h = M.poly(5, 0, 0, -90), [n1, c2, c3, c4, c5] = h; M.at[n1][2] = 'NH'; M.out(c2, M.away(c2, h) - 10, 'O', 2); M.out(c5, M.away(c5, h) + 10, 'O', 2);
      const me = M.out(c3, 10, 'CH₃'), e1 = M.out(c3, 100, ''), e2 = M.out(e1, 40, '');
      M.site('ethylA', e1, 'ethyl CH₂ (next to the ring)', 16); M.site('ethylW', e2, 'ethyl CH₃ (end of the chain)', 16); M.site('ringCH2', c4, 'ring CH₂', 16); M.site('methyl', me, 'methyl on the ring', 16); M.site('imide', c2, 'imide C=O', 16);
      return M;
    },
    lamotrigine: () => {
      const M = MB(), t = M.poly(6, 0, 0, 0), [c6, n1, n2, c3, n4, c5] = t; M.arom(t, 1);
      M.at[n1][2] = 'N'; M.at[n2][2] = 'N'; M.at[n4][2] = 'N';
      const a3 = M.out(c3, 180, 'NH₂'), a5 = M.out(c5, -60, 'NH₂'); const ph = M.phenyl(c6, 0); M.out(ph[1], M.away(ph[1], ph), 'Cl'); M.out(ph[2], M.away(ph[2], ph), 'Cl');
      M.site('n2', n2, 'triazine N2', 15); M.site('n1', n1, 'triazine N1', 15); M.site('am3', a3, '3-amino group', 17); M.site('am5', a5, '5-amino group', 17); M.site('aryl', M.cen(ph), 'dichlorophenyl ring', 22);
      return M;
    },
    valproate: () => {
      const M = MB(), c2 = M.atom(0, 0, ''), c1 = M.out(c2, -90, ''); M.out(c1, -150, 'O', 2); const oh = M.out(c1, -30, 'OH');
      const L1 = chain(M, c2, 150, ['', '', ''].map((x, k) => ''), null), R1 = chain(M, c2, 30, ['', '', ''], null);
      M.site('acid', c1, 'carboxylic acid', 20); M.site('c3', L1[0], 'C3 (first chain carbon)', 14); M.site('c3b', R1[0], 'C3 (first chain carbon, other propyl)', 14);
      M.site('c4', L1[1], 'C4', 14); M.site('c5', L1[2], 'C5 (chain end)', 14);
      return M;
    },
    acetylcholine: () => {
      const M = MB(), n = M.atom(0, 0, 'N⁺'); M.out(n, -90, ''); M.out(n, 90, ''); M.out(n, 180, '');
      const c1 = M.out(n, 30, ''), c2 = M.out(c1, -30, ''), o = M.out(c2, 30, 'O'), cc = M.out(o, -30, ''); M.out(cc, -90, 'O', 2); const me = M.out(cc, 30, '');
      M.site('ester', M.mid(o, cc), 'ester C–O bond', 20); M.site('quat', n, 'quaternary N⁺', 20); M.site('eth', M.mid(c1, c2), 'ethylene CH₂CH₂', 18); M.site('acetyl', me, 'acetyl CH₃', 16);
      return M;
    },
    succinylcholine: () => {
      const M = MB(), n = M.atom(0, 0, 'N⁺'); M.out(n, -90, ''); M.out(n, 90, ''); M.out(n, 180, '');
      const c1 = M.out(n, 30, ''), c2 = M.out(c1, -30, ''), o = M.out(c2, 30, 'O'), cc = M.out(o, -30, ''); M.out(cc, -90, 'O', 2);
      const s1 = M.out(cc, 30, ''), s2 = M.out(s1, -30, ''), cd = M.out(s2, 30, ''); M.out(cd, 90, 'O', 2);
      const o2 = M.out(cd, -30, 'O'), d1 = M.out(o2, 30, ''), d2 = M.out(d1, -30, ''), n2 = M.out(d2, 30, 'N⁺'); M.out(n2, -90, ''); M.out(n2, 90, ''); M.out(n2, 0, '');
      M.site('ester1', M.mid(o, cc), 'first ester C–O bond', 18); M.site('ester2', M.mid(cd, o2), 'second ester C–O bond', 18); M.site('mid', M.mid(s1, s2), 'central CH₂CH₂', 16); M.site('quat1', n, 'N⁺(CH₃)₃ end', 18); M.site('quat2', n2, 'N⁺(CH₃)₃ end (right)', 18);
      return M;
    },
    parathion: () => {
      const M = MB(), b = M.poly(6, 0, 0, 0); M.arom(b, 0);
      const no = M.out(b[0], 0, 'NO₂'), o = M.out(b[3], 180, 'O'), p = M.out(o, 180 + 30 - 30, 'P'); const s = M.out(p, -90, 'S', 2); const e1 = M.out(p, 150, 'O'), e2 = M.out(p, 90, 'O'); const x1 = M.out(e1, 210, ''); M.out(x1, 150, ''); const x2 = M.out(e2, 150, ''); M.out(x2, 210, '');
      M.site('ps', p, 'P=S group', 16); M.site('nitro', no, 'nitro group', 19); M.site('poaryl', M.mid(o, p), 'P–O–aryl bond', 14); M.site('oet', e2, 'ethoxy group', 13);
      return M;
    }
  };
  return defs;
})();

/* draw one molecule. st = { picked, correct, done } ; clickable sites get data-site */
function molSVG(id, st) {
  st = st || {}; const M = MOLS[id](), pad = 26;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; M.at.forEach(p => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
  Object.keys(M.sites).forEach(k => { const s = M.sites[k]; x0 = Math.min(x0, s.x - s.r); y0 = Math.min(y0, s.y - s.r); x1 = Math.max(x1, s.x + s.r); y1 = Math.max(y1, s.y + s.r); });
  x0 -= pad; y0 -= pad; x1 += pad; y1 += pad; const w = x1 - x0, h = y1 - y0;
  const lab = i => M.at[i][2], cut = (p, q, i) => { if (!lab(i)) return p; const d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, k = 9 / d; return [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]; };
  let g = '';
  Object.keys(M.bd).forEach(k => {
    const b = M.bd[k], P = M.at[b.i], Q = M.at[b.j], p = cut(P, Q, b.i), q = cut(Q, P, b.j), dx = q[0] - p[0], dy = q[1] - p[1], s = Math.hypot(dx, dy) || 1, nx = -dy / s, ny = dx / s;
    const ln = (a, c) => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${c[0].toFixed(1)}" y2="${c[1].toFixed(1)}"/>`;
    if (b.o === 1) g += ln(p, q);
    else if (b.ref) { const sg = ((b.ref[0] - (p[0] + q[0]) / 2) * nx + (b.ref[1] - (p[1] + q[1]) / 2) * ny) > 0 ? 1 : -1, o = 4.2 * sg, sh = 0.14; g += ln(p, q) + ln([p[0] + nx * o + dx * sh, p[1] + ny * o + dy * sh], [q[0] + nx * o - dx * sh, q[1] + ny * o - dy * sh]); }
    else g += ln([p[0] + nx * 2.5, p[1] + ny * 2.5], [q[0] + nx * 2.5, q[1] + ny * 2.5]) + ln([p[0] - nx * 2.5, p[1] - ny * 2.5], [q[0] - nx * 2.5, q[1] - ny * 2.5]);
  });
  let t = ''; M.at.forEach(p => { if (p[2]) t += `<text x="${p[0].toFixed(1)}" y="${(p[1] + 5).toFixed(1)}" text-anchor="middle">${p[2]}</text>`; });
  const hit = st.correct instanceof Array ? st.correct : [st.correct];
  let s = ''; Object.keys(M.sites).forEach(k => {
    const z = M.sites[k]; let c = 'site';
    if (st.done) { if (hit.indexOf(k) >= 0) c += ' ok'; else if (st.picked === k) c += ' bad'; } else if (st.picked === k) c += ' pick';
    s += `<g class="${c}" data-site="${k}" ${st.done ? '' : 'tabindex="0" role="button"'} aria-label="${z.t}"><circle cx="${z.x.toFixed(1)}" cy="${z.y.toFixed(1)}" r="${z.r}"/><title>${z.t}</title></g>`;
  });
  return `<svg class="molsvg" viewBox="${x0.toFixed(0)} ${y0.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}" style="max-width:${Math.min(430, Math.round(w * 1.25))}px" role="group" aria-label="Structure"><g class="bonds">${g}</g><g class="lbls">${t}</g>${s}</svg>`;
}

export { MOLS, molSVG };
