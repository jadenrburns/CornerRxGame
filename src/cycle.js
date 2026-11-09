/* ---------------- Menstrual cycle graph: draw-the-hormone question ----------------
   Curves are traced from the instructor's idealized 28-day schematic (pituitary panel: FSH dashed, LH solid;
   ovary panel: progesterone dashed, estradiol solid). Values are 0..1 within each panel; shape matters, not scale. */
const CYC = {
  FSH: { name: 'FSH', panel: 'pit', dash: true, col: '#7a5fb0', peak: 3, pts: [[1, .40], [3, .485], [5, .44], [7, .36], [9, .30], [11, .26], [12.5, .28], [13.3, .35], [14, .456], [14.7, .40], [15.5, .32], [17, .26], [19, .20], [23, .167], [25, .19], [27, .30], [28, .36]] },
  LH: { name: 'LH', panel: 'pit', dash: false, col: '#1f2547', peak: 14, pts: [[1, .186], [6, .186], [9, .19], [11, .20], [12, .26], [13, .50], [13.6, .80], [14, .926], [14.5, .80], [15, .50], [15.6, .28], [16.5, .20], [19, .185], [28, .185]] },
  E2: { name: 'Estradiol', panel: 'ov', dash: false, col: '#1d7a93', peak: 12.2, pts: [[1, .152], [4.5, .176], [7, .25], [9, .42], [10.5, .59], [11.3, .68], [12.2, .88], [13, .72], [14, .49], [15, .42], [16, .41], [18, .47], [21, .63], [23, .52], [26, .27], [28, .15]] },
  P4: { name: 'Progesterone', panel: 'ov', dash: true, col: '#c0561b', peak: 21, pts: [[1, .09], [12, .09], [14, .137], [15.5, .27], [17, .52], [18.5, .76], [20, .88], [21, .92], [22.5, .87], [24, .72], [25.5, .42], [26.5, .27], [28, .10]] }
};
const CYC_PANEL = { pit: 'Pituitary hormone (arbitrary units)', ov: 'Ovarian hormone (arbitrary units)' };

/* monotone cubic (Fritsch-Carlson) interpolation through the control points */
function cycVal(h, day) {
  const P = CYC[h].pts, n = P.length;
  if (day <= P[0][0]) return P[0][1]; if (day >= P[n - 1][0]) return P[n - 1][1];
  const d = [], m = [];
  for (let i = 0; i < n - 1; i++) d.push((P[i + 1][1] - P[i][1]) / (P[i + 1][0] - P[i][0]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  let k = 0; while (k < n - 2 && day > P[k + 1][0]) k++;
  const h0 = P[k + 1][0] - P[k][0], t = (day - P[k][0]) / h0, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * P[k][1] + (t3 - 2 * t2 + t) * h0 * m[k] + (-2 * t3 + 3 * t2) * P[k + 1][1] + (t3 - t2) * h0 * m[k + 1];
}

/* pts: [[day 1..28, value 0..1], ...] in the order drawn. Returns { ok, reason, r, mae, peak } */
function cycScore(h, pts) {
  const out = { ok: false, reason: '', r: 0, mae: 1, peak: 0 };
  if (!pts || pts.length < 8) { out.reason = 'Draw a line across the graph first.'; return out; }
  const xs = pts.map(p => p[0]), lo = Math.min.apply(null, xs), hi = Math.max.apply(null, xs);
  if (lo > 4.5 || hi < 24.5) { out.reason = 'Draw the line all the way across, from day 1 to day 28.'; return out; }
  const days = []; for (let d = 1; d <= 28; d += 0.5) days.push(d);
  const raw = days.map(d => { let s = 0, c = 0; pts.forEach(p => { if (Math.abs(p[0] - d) <= 0.6) { s += p[1]; c++; } }); return c ? s / c : null; });
  // fill gaps by linear interpolation between the nearest drawn neighbours
  const u = raw.slice();
  for (let i = 0; i < u.length; i++) {
    if (u[i] !== null) continue;
    let a = i - 1; while (a >= 0 && u[a] === null) a--;
    let b = i + 1; while (b < u.length && raw[b] === null) b++;
    if (a < 0) u[i] = raw[b]; else if (b >= u.length) u[i] = u[a]; else u[i] = u[a] + (raw[b] - u[a]) * (i - a) / (b - a);
  }
  const t = days.map(d => cycVal(h, d));
  const norm = (arr) => { const mn = Math.min.apply(null, arr), mx = Math.max.apply(null, arr); return mx - mn < 1e-6 ? null : arr.map(v => (v - mn) / (mx - mn)); };
  const sm = (a) => a.map((v, i) => { let s = 0, c = 0; for (let j = Math.max(0, i - 2); j <= Math.min(a.length - 1, i + 2); j++) { s += a[j]; c++; } return s / c; });
  const un = norm(sm(u)), tn = norm(sm(t));
  if (!un) { out.reason = 'A flat line does not show the pattern. Show how the hormone rises and falls.'; return out; }
  const n = days.length; let mu = 0, mt = 0; for (let i = 0; i < n; i++) { mu += un[i]; mt += tn[i]; } mu /= n; mt /= n;
  let sxy = 0, sxx = 0, syy = 0, ae = 0; for (let i = 0; i < n; i++) { sxy += (un[i] - mu) * (tn[i] - mt); sxx += (un[i] - mu) ** 2; syy += (tn[i] - mt) ** 2; ae += Math.abs(un[i] - tn[i]); }
  out.r = sxy / Math.sqrt(sxx * syy); out.mae = ae / n;
  let pi = 0; for (let i = 1; i < n; i++) if (un[i] > un[pi]) pi = i; out.peak = days[pi];
  const peakOK = h === 'FSH' ? true : Math.abs(out.peak - CYC[h].peak) <= 2.5;
  out.ok = out.r >= 0.72 && out.mae <= 0.2 && peakOK;
  if (!out.ok) out.reason = !peakOK ? 'The peak is in the wrong place. Your highest point was near day ' + Math.round(out.peak) + '.' : 'The shape is off. Check when the hormone rises and falls.';
  else out.reason = 'Your line follows the real pattern.';
  return out;
}

/* SVG: viewBox 360 x 222. Plot x 34..350 = day 1..28, y 12..170 = value 1..0 */
const CYC_X0 = 34, CYC_X1 = 350, CYC_Y0 = 12, CYC_Y1 = 170;
const cycX = d => CYC_X0 + (d - 1) / 27 * (CYC_X1 - CYC_X0);
const cycY = v => CYC_Y1 - v * (CYC_Y1 - CYC_Y0);
function cycPath(h) { let s = ''; for (let d = 1; d <= 28.001; d += 0.25) s += (s ? 'L' : 'M') + cycX(d).toFixed(1) + ' ' + cycY(cycVal(h, d)).toFixed(1); return s; }
function cycSVG(h, userPts, reveal, ok) {
  const c = CYC[h];
  const ticks = [1, 7, 14, 21, 28].map(d => `<text x="${cycX(d).toFixed(1)}" y="216" text-anchor="middle" class="cyt">${d === 1 ? 'Day 1' : d}</text><line x1="${cycX(d).toFixed(1)}" y1="${CYC_Y1}" x2="${cycX(d).toFixed(1)}" y2="${CYC_Y1 + 4}" class="cyl"/>`).join('');
  const bands = [[1, 5.5, 'Menses'], [5.5, 13.5, 'Follicular'], [14.5, 28, 'Luteal']].map(b => `<rect x="${cycX(b[0]).toFixed(1)}" y="178" width="${(cycX(b[1]) - cycX(b[0])).toFixed(1)}" height="22" class="cyb"/><text x="${((cycX(b[0]) + cycX(b[1])) / 2).toFixed(1)}" y="193" text-anchor="middle" class="cyt cys">${b[2]}</text>`).join('');
  const user = userPts && userPts.length ? `<polyline id="cycuser" class="cyu${reveal ? (ok ? ' good' : ' bad') : ''}" points="${userPts.map(p => cycX(p[0]).toFixed(1) + ',' + cycY(p[1]).toFixed(1)).join(' ')}"/>` : '<polyline id="cycuser" class="cyu" points=""/>';
  const truth = reveal ? `<path d="${cycPath(h)}" class="cytrue" stroke="${c.col}"${c.dash ? ' stroke-dasharray="7 5"' : ''}/>` : '';
  return `<svg id="cycsvg" class="cycsvg" viewBox="0 0 360 222" role="img" aria-label="Blank cycle graph, day 1 to day 28. Draw the line for ${c.name}.">
    <rect x="${CYC_X0}" y="${CYC_Y0}" width="${CYC_X1 - CYC_X0}" height="${CYC_Y1 - CYC_Y0}" rx="6" class="cybox"/>
    <text x="${CYC_X0 + 6}" y="${CYC_Y0 + 12}" class="cyt cys">${CYC_PANEL[c.panel]}</text>
    <text x="10" y="${(CYC_Y0 + CYC_Y1) / 2}" class="cyt cys" transform="rotate(-90 10 ${(CYC_Y0 + CYC_Y1) / 2})" text-anchor="middle">level</text>
    <line x1="${cycX(14).toFixed(1)}" y1="${CYC_Y0}" x2="${cycX(14).toFixed(1)}" y2="200" class="cy14"/>
    ${bands}${ticks}${truth}${user}</svg>`;
}

if (typeof module !== 'undefined') module.exports = { CYC, cycVal, cycScore };
