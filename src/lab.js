/* ---------- Compounding pharmacy: calculation + kinetics generators ---------- */
function fmtS(n) { return String(Number(Number(n).toPrecision(3))); }
function mkL(kind, d, q, correct, cands, unit, steps) {
  const cs = fmtS(correct), out = [];
  cands.forEach(c => { if (!(c > 0) || !isFinite(c) || c > correct * 40 || c < correct / 40) return; const s = fmtS(c); if (s !== cs && out.indexOf(s) < 0) out.push(s); });
  const spare = [2, 0.5, 10, 0.1, 1.5, 0.75, 4, 0.25, 3];
  for (let i = 0; out.length < 3 && i < spare.length; i++) { const s = fmtS(correct * spare[i]); if (s !== cs && out.indexOf(s) < 0) out.push(s); }
  const u = unit ? ' ' + unit : '';
  const round = Number(cs) !== correct && Math.abs(Number(cs) - correct) > 1e-9 * Math.max(1, Math.abs(correct)) ? ' Round to 3 significant figures.' : '';
  return { c: 'CALC', lab: kind, d, q: q + round, a: cs + u, w: out.slice(0, 3).map(s => s + u), e: steps, gen: true };
}
const LAB_GENS = {
  comp: [
    function alligation() {
      let H, L, W, Z, g;
      do { H = pick([10, 20, 5, 50, 25]); L = pick([0, 1, 2, 5]); W = pick([2, 2.5, 3, 4, 5, 8, 10, 12.5, 15]); Z = pick([100, 120, 200, 240, 300, 400]); g = Z * (W - L) / (H - L); } while (!(W > L && W < H) || Math.abs(g * 4 - Math.round(g * 4)) > 1e-9);
      const gl = Z - g, base = L === 0 ? 'petrolatum base' : L + '% ointment';
      return mkL('comp', 2, `How many grams of ${H}% ointment and how many of ${base} are needed to make ${Z} g of ${W}% ointment? Give the grams of the ${H}% ointment.`, g,
        [gl, Z * W / H, Z / 2, Z * (H - W) / (H - L) * 1.0],
        'g', `Alligation: parts of ${H}% = ${W} - ${L} = ${fmtS(W - L)}; parts of ${base} = ${H} - ${W} = ${fmtS(H - W)}. Total parts = ${fmtS(H - L)}. ${H}% ointment = ${Z} g x ${fmtS(W - L)}/${fmtS(H - L)} = ${fmtS(g)} g (the other ${fmtS(gl)} g is ${base}).`);
    },
    function weightedAvg() {
      const a = pick([100, 150, 200, 250]), b = pick([200, 300, 400, 150]), pa = pick([1, 2, 5, 10]), pb = pick([10, 15, 20, 25]);
      const f = (a * pa + b * pb) / (a + b);
      return mkL('comp', 2, `You mix ${a} g of a ${pa}% cream with ${b} g of a ${pb}% cream. What is the final percentage strength?`, f,
        [(pa + pb) / 2, (pa + pb), f * 2, pb - pa], '%', `Total drug = ${a} x ${pa}% + ${b} x ${pb}% = ${fmtS(a * pa / 100)} + ${fmtS(b * pb / 100)} = ${fmtS((a * pa + b * pb) / 100)} g in ${a + b} g. ${fmtS((a * pa + b * pb) / 100)} / ${a + b} x 100 = ${fmtS(f)}%. It is not the plain average because the amounts differ.`);
    },
    function stockDilution() {
      const t = pick([[70, 20, 500], [95, 70, 400], [50, 25, 200], [90, 30, 300], [20, 5, 400], [10, 0.5, 600]]);
      const v1 = t[1] * t[2] / t[0], dil = t[2] - v1;
      const askDil = Math.random() < 0.5;
      return mkL('comp', 2, `You have ${t[0]}% stock. How many mL of ${askDil ? 'diluent (water)' : 'stock'} are needed to compound ${t[2]} mL of ${t[1]}% solution?`, askDil ? dil : v1,
        [askDil ? v1 : dil, t[0] * t[2] / t[1], t[2] * t[1] / 100, askDil ? t[2] : v1 * 2], 'mL', `C1V1 = C2V2, so V1 = (${t[1]} x ${t[2]}) / ${t[0]} = ${fmtS(v1)} mL of stock. Diluent = ${t[2]} - ${fmtS(v1)} = ${fmtS(dil)} mL.`);
    },
    function weighMg() {
      const t = pick([[60, 0.25], [120, 0.5], [30, 2], [250, 0.1], [90, 1.5], [480, 0.05]]), mg = t[0] * t[1] / 100 * 1000;
      return mkL('comp', 2, `The order is ${t[0]} mL of a ${t[1]}% w/v solution. How many mg of drug do you weigh out?`, mg,
        [mg / 1000, mg * 10, mg / 10, t[0] * t[1]], 'mg', `${t[1]}% w/v = ${t[1]} g in 100 mL. ${t[0]} mL x ${t[1]} g / 100 mL = ${fmtS(mg / 1000)} g = ${fmtS(mg)} mg.`);
    },
    function ratioStrength() {
      const r = pick([1000, 2000, 5000, 10000, 500, 250]), v = pick([100, 250, 500, 1000]), mgml = 1000 / r, g = v / r;
      const askC = Math.random() < 0.5;
      return mkL('comp', 1, askC ? `A solution is labeled 1:${r}. How many mg of drug per mL?` : `How many grams of drug are in ${v} mL of a 1:${r} w/v solution?`, askC ? mgml : g,
        askC ? [mgml * 10, mgml / 10, r / 1000 * 100, 100 / r] : [g * 10, g / 10, v / 100, v * r], askC ? 'mg/mL' : 'g',
        `1:${r} w/v means 1 g in ${r} mL. ${askC ? '1000 mg / ' + r + ' mL = ' + fmtS(mgml) + ' mg/mL.' : v + ' mL / ' + r + ' = ' + fmtS(g) + ' g.'}`);
    },
    function pctFromMgml() {
      const c = pick([5, 10, 12.5, 20, 25, 40, 50, 2.5]);
      return mkL('comp', 1, `A solution contains ${c} mg of drug per mL. What is its % w/v strength?`, c / 10,
        [c, c * 10, c / 100, c / 1000], '%', `${c} mg/mL = ${fmtS(c / 1000)} g/mL = ${fmtS(c / 10)} g per 100 mL = ${fmtS(c / 10)}% w/v.`);
    },
    function triturate() {
      const r = pick([10, 100, 1000]), tot = pick([10, 20, 50, 100]), need = pick([0.5, 1, 2, 5]);
      const askMg = Math.random() < 0.5;
      if (askMg) { const mg = need * r; return mkL('comp', 3, `A 1:${r} (w/w) trituration of a potent drug is made in lactose. How many mg of the trituration provide ${need} mg of the drug?`, mg, [need / r, mg * 10, mg / 10, need * r / 10], 'mg', `1:${r} means 1 part drug in ${r} parts mix, so ${need} mg drug needs ${need} x ${r} = ${mg} mg of trituration.`); }
      const g = tot / r;
      return mkL('comp', 2, `How many grams of drug are needed to make ${tot} g of a 1:${r} trituration (w/w) in lactose?`, g, [g * 10, g / 10, tot * r, tot - g], 'g', `${tot} g / ${r} = ${fmtS(g)} g of drug. The rest (${fmtS(tot - g)} g) is lactose, added by geometric dilution.`);
    },
    function capsules() {
      const n = pick([24, 30, 36, 40, 60]), dose = pick([25, 50, 75, 125, 150, 250]), over = pick([10, 15, 20]);
      const mg = n * dose * (1 + over / 100);
      return mkL('comp', 2, `Compound ${n} capsules, ${dose} mg drug each, and weigh out ${over}% overage to cover losses. How many mg of drug do you weigh out in total?`, mg, [n * dose, n * dose * over / 100, n * dose * (1 - over / 100), n * (dose + over)], 'mg', `${n} x ${dose} mg = ${n * dose} mg. Add ${over}%: ${n * dose} x ${(1 + over / 100).toFixed(2)} = ${fmtS(mg)} mg.`);
    },
    function suppository() {
      let n, dose, df, cb;
      do { n = pick([6, 12, 24]); dose = pick([0.15, 0.2, 0.3, 0.45, 0.6]); df = pick([1.5, 2, 3]); cb = n * (2 - dose / df); } while (cb <= 0);
      return mkL('comp', 3, `A suppository mold holds 2 g of cocoa butter. You are making ${n} suppositories with ${dose} g of drug each (density factor ${df}). How many grams of cocoa butter do you need?`, cb,
        [n * 2, n * (2 - dose), n * (2 - dose * df), n * dose / df], 'g', `Displacement = ${dose} / ${df} = ${fmtS(dose / df)} g of cocoa butter per suppository. Each needs ${fmtS(2 - dose / df)} g. ${n} x ${fmtS(2 - dose / df)} = ${fmtS(cb)} g.`);
    },
    function isotonic() {
      const v = pick([30, 60, 100, 15]), c = pick([0.5, 1, 2]), E = pick([0.14, 0.18, 0.22, 0.3, 0.12]);
      const mg = (0.9 * v / 100 - c / 100 * v * E) * 1000;
      if (mg <= 0) return LAB_GENS.comp[9]();
      return mkL('comp', 3, `Make ${v} mL of ${c}% drug solution isotonic with NaCl. The drug's sodium chloride equivalent is ${E}. How many mg of NaCl must be added?`, mg,
        [0.9 * v * 10, c / 100 * v * E * 1000, mg / 10, (0.9 * v / 100 + c / 100 * v * E) * 1000], 'mg', `Isotonic needs 0.9% NaCl: ${v} x 0.009 = ${fmtS(v * 9)} mg NaCl equivalent. Drug supplies ${v} mL x ${c}% = ${fmtS(c * v * 10)} mg, x ${E} = ${fmtS(c * v * 10 * E)} mg. NaCl to add = ${fmtS(v * 9)} - ${fmtS(c * v * 10 * E)} = ${fmtS(mg)} mg.`);
    },
    function meq() {
      const s = pick([['KCl', 74.5, 1], ['NaCl', 58.5, 1], ['CaCl2 (anhydrous, MW 111)', 111, 2], ['MgSO4 (anhydrous, MW 120)', 120, 2]]), k = pick([1, 2, 4]);
      const mg = s[1] * k * 10 / s[2], meq = mg * s[2] / s[1];
      return mkL('comp', 3, `How many mEq are in ${fmtS(mg)} mg of ${s[0]}? (MW ${s[1]}, valence ${s[2]})`, meq,
        [mg / s[1], mg * s[1] / s[2], meq * s[2], mg / s[1] / s[2]], 'mEq', `mEq = (mg x valence) / MW = (${fmtS(mg)} x ${s[2]}) / ${s[1]} = ${fmtS(meq)} mEq.`);
    },
    function specificGravity() {
      const sg = pick([1.2, 1.25, 0.9, 1.1, 0.8, 1.5]), v = pick([50, 100, 200, 250]);
      if (Math.random() < 0.5) return mkL('comp', 1, `A liquid has a specific gravity of ${sg}. What is the weight of ${v} mL?`, v * sg, [v / sg, v * sg * 10, v + sg, v - sg], 'g', `Weight = volume x SG = ${v} x ${sg} = ${fmtS(v * sg)} g.`);
      const g = pick([30, 50, 60, 75, 120]);
      return mkL('comp', 2, `The formula needs ${g} g of a liquid with specific gravity ${sg}. How many mL do you measure?`, g / sg, [g * sg, g / sg / 10, g + sg, g - sg], 'mL', `Volume = weight / SG = ${g} / ${sg} = ${fmtS(g / sg)} mL.`);
    },
    function pctWW() {
      const g = pick([30, 60, 90, 120, 240]), p = pick([0.5, 1, 2, 2.5, 5, 10]);
      return mkL('comp', 1, `How many grams of hydrocortisone powder are needed to compound ${g} g of a ${p}% (w/w) ointment?`, g * p / 100,
        [g * p / 10, g * p, g / p, g * p / 1000], 'g', `${p}% w/w = ${p} g per 100 g. ${g} g x ${p} / 100 = ${fmtS(g * p / 100)} g of drug; fill the rest with base to ${g} g total.`);
    },
    function reconstitute() {
      const mgml = pick([[125, 5], [250, 5], [400, 5], [200, 5]]), vol = pick([60, 100, 150, 200]), tot = mgml[0] / mgml[1] * vol;
      const dose = pick([200, 300, 400, 500, 600]).valueOf();
      if (Math.random() < 0.5) return mkL('comp', 2, `A powder reconstitutes to ${mgml[0]} mg/${mgml[1]} mL. The ${vol} mL bottle holds how many mg of drug?`, tot, [tot / 1000, tot * 5, mgml[0] * vol, mgml[0] / mgml[1]], 'mg', `${mgml[0]} mg / ${mgml[1]} mL = ${fmtS(mgml[0] / mgml[1])} mg/mL x ${vol} mL = ${fmtS(tot)} mg.`);
      const ml = dose / (mgml[0] / mgml[1]);
      return mkL('comp', 2, `A suspension is ${mgml[0]} mg per ${mgml[1]} mL. How many mL give a ${dose} mg dose?`, ml, [dose * mgml[0] / mgml[1], ml / 10, dose / mgml[0], ml * 2], 'mL', `Concentration = ${fmtS(mgml[0] / mgml[1])} mg/mL. ${dose} mg / ${fmtS(mgml[0] / mgml[1])} mg/mL = ${fmtS(ml)} mL.`);
    },
    function serialDilution() {
      const f = pick([10, 5, 2]), n = pick([3, 4, 5]), conc = pick([100, 1000, 500]);
      const tot = Math.pow(f, n);
      return mkL('comp', 3, `A ${conc} mg/mL stock is diluted 1:${f} in each of ${n} serial steps. What is the final concentration in mg/mL?`, conc / tot,
        [conc / f / n, conc / (f * n), conc * tot, conc / (f * (n - 1))], 'mg/mL', `Total dilution factor = ${f}^${n} = ${tot}. ${conc} / ${tot} = ${fmtS(conc / tot)} mg/mL.`);
    }
  ],
  pk: [
    function halfLifeFromK() {
      const t = pick([[10, 0.0693], [6, 0.1155], [8, 0.0866], [4, 0.173], [12, 0.0578], [3, 0.231], [24, 0.0289]]);
      return mkL('pk', 1, `A drug follows first-order elimination with k = ${t[1]} per hour. What is the half-life in hours? (t1/2 = 0.693 / k)`, 0.693 / t[1],
        [t[1] / 0.693, 0.693 * t[1], 1 / t[1], 0.693 / t[1] * 2], 'h', `t1/2 = 0.693 / k = 0.693 / ${t[1]} = ${fmtS(0.693 / t[1])} h.`);
    },
    function kFromHalfLife() {
      const t = pick([2, 3, 4, 6, 8, 12, 24, 36]);
      return mkL('pk', 1, `A drug has a half-life of ${t} hours. What is its elimination rate constant k in h^-1?`, 0.693 / t,
        [t / 0.693, 0.693 * t, 1 / t, 0.693 / t / 2], 'h^-1', `k = 0.693 / t1/2 = 0.693 / ${t} = ${fmtS(0.693 / t)} h^-1.`);
    },
    function halfLifeFromLevels() {
      const n = pick([1, 2, 3, 4]), dt = pick([4, 6, 8, 12]) * n, c1 = pick([80, 100, 160, 200]), c2 = c1 / Math.pow(2, n);
      return mkL('pk', 2, `A serum level falls from ${c1} mg/L to ${fmtS(c2)} mg/L over ${dt} hours (first-order). What is the half-life in hours?`, dt / n,
        [dt, dt * n, dt / (n + 1), dt / n * 2], 'h', `${c1} to ${fmtS(c2)} is a ${Math.pow(2, n)}-fold fall = ${n} half-life${n > 1 ? 's' : ''}. ${dt} h / ${n} = ${fmtS(dt / n)} h.`);
    },
    function kFromLevels() {
      const c1 = pick([40, 60, 80, 100]), r = pick([2, 4, 5, 10]), dt = pick([4, 6, 8]), c2 = c1 / r, k = Math.log(r) / dt;
      return mkL('pk', 3, `Two levels: ${c1} mg/L at the start and ${fmtS(c2)} mg/L ${dt} hours later (first-order elimination). Calculate k in h^-1.`, k,
        [Math.log10(r) / dt, r / dt, Math.log(r) * dt, (c1 - c2) / c1 / dt], 'h^-1', `k = ln(C1/C2) / t = ln(${r}) / ${dt} = ${fmtS(Math.log(r))} / ${dt} = ${fmtS(k)} h^-1.`);
    },
    function concAfterHalfLives() {
      const n = pick([2, 3, 4, 5]), t = pick([4, 6, 8, 12]), c0 = pick([64, 80, 96, 160, 200]), c = c0 / Math.pow(2, n);
      return mkL('pk', 1, `A drug with a half-life of ${t} h starts at ${c0} mg/L. What is the concentration after ${n * t} hours?`, c,
        [c0 / n, c0 / (n * t), c0 / Math.pow(2, n + 1), c0 / Math.pow(2, n - 1)], 'mg/L', `${n * t} h / ${t} h = ${n} half-lives. ${c0} x (1/2)^${n} = ${fmtS(c)} mg/L.`);
    },
    function concExp() {
      const c0 = pick([50, 80, 100, 120]), k = pick([0.1, 0.2, 0.15, 0.05]), t = pick([4, 6, 8, 10]), c = c0 * Math.exp(-k * t);
      return mkL('pk', 3, `C0 = ${c0} mg/L and k = ${k} h^-1 (IV bolus, one compartment). What is the concentration at ${t} hours? (C = C0 x e^(-kt))`, c,
        [c0 * Math.exp(-k) , c0 * (1 - k * t), c0 * Math.exp(k * t) / 10, c0 - k * t], 'mg/L', `C = ${c0} x e^(-${k} x ${t}) = ${c0} x e^(-${fmtS(k * t)}) = ${c0} x ${fmtS(Math.exp(-k * t))} = ${fmtS(c)} mg/L.`);
    },
    function pctEliminated() {
      const n = pick([1, 2, 3, 4, 5]), p = 100 * (1 - Math.pow(0.5, n));
      return mkL('pk', 2, `What percent of a dose has been eliminated after ${n} half-life${n > 1 ? 's' : ''}?`, p, [100 / Math.pow(2, n), 100 - p / 2, 100 / n, 100 * (1 - Math.pow(0.5, n + 1))], '%', `After ${n} half-life${n > 1 ? 's' : ''}, ${fmtS(100 / Math.pow(2, n))}% remains, so ${fmtS(p)}% is eliminated.`);
    },
    function vdBolus() {
      const t = pick([[500, 10], [300, 6], [250, 5], [1000, 20], [600, 15], [400, 8]]);
      return mkL('pk', 1, `An IV bolus of ${t[0]} mg gives an extrapolated initial concentration (C0) of ${t[1]} mg/L. What is the volume of distribution in L?`, t[0] / t[1],
        [t[0] * t[1], t[1] / t[0], t[0] / t[1] * 70, t[0] / t[1] / 70], 'L', `Vd = Dose / C0 = ${t[0]} / ${t[1]} = ${fmtS(t[0] / t[1])} L.`);
    },
    function c0FromVd() {
      const w = pick([60, 70, 80, 100]), vd = pick([0.25, 0.5, 0.7, 1.0]), dose = pick([2, 4, 5, 10]) * w, c0 = dose / (vd * w);
      return mkL('pk', 2, `A ${w} kg patient receives ${dose} mg IV. Vd = ${vd} L/kg. What is the initial concentration C0 in mg/L?`, c0,
        [dose / vd, dose * vd / w, vd * w / dose, dose / w], 'mg/L', `Vd = ${vd} x ${w} = ${fmtS(vd * w)} L. C0 = ${dose} / ${fmtS(vd * w)} = ${fmtS(c0)} mg/L.`);
    },
    function clFromKVd() {
      const k = pick([0.05, 0.1, 0.2, 0.15, 0.08]), vd = pick([20, 40, 50, 70, 100]);
      return mkL('pk', 2, `A drug has k = ${k} h^-1 and Vd = ${vd} L. What is its clearance in L/h?`, k * vd, [vd / k, k / vd, 0.693 * vd / k, k * vd * 60 / 1000 * 10], 'L/h', `CL = k x Vd = ${k} x ${vd} = ${fmtS(k * vd)} L/h.`);
    },
    function halfLifeFromClVd() {
      const cl = pick([3, 4, 5, 7, 10]), vd = pick([40, 50, 70, 100, 140]);
      return mkL('pk', 3, `A drug has clearance ${cl} L/h and Vd ${vd} L. What is its half-life in hours?`, 0.693 * vd / cl, [cl / vd, 0.693 * cl / vd, vd / cl, 0.693 * cl * vd], 'h', `k = CL / Vd = ${cl} / ${vd} = ${fmtS(cl / vd)} h^-1. t1/2 = 0.693 / k = 0.693 x ${vd} / ${cl} = ${fmtS(0.693 * vd / cl)} h.`);
    },
    function loadingDose() {
      const cp = pick([5, 10, 15, 20, 25]), vd = pick([20, 32, 40, 50, 70]), F = pick([1, 1, 0.8, 0.75, 0.5]);
      return mkL('pk', 2, `Target a plasma concentration of ${cp} mg/L. Vd = ${vd} L, bioavailability F = ${F}. What loading dose (mg) is needed?`, cp * vd / F,
        [cp * vd, cp * vd * F, cp / vd / F, cp * vd / F / 2], 'mg', `Loading dose = (Cp x Vd) / F = (${cp} x ${vd}) / ${F} = ${fmtS(cp * vd / F)} mg.`);
    },
    function maintenanceDose() {
      const cl = pick([2, 3, 4, 5, 6]), css = pick([5, 10, 15, 20]), tau = pick([6, 8, 12, 24]), F = pick([1, 1, 0.8, 0.5]);
      return mkL('pk', 3, `Clearance is ${cl} L/h, F = ${F}. To hit Css avg ${css} mg/L, what dose (mg) is given every ${tau} hours?`, cl * css * tau / F,
        [cl * css / F, cl * css * tau, cl * css * tau * F, cl * css * tau / F / 2], 'mg', `Dose = (CL x Css x tau) / F = (${cl} x ${css} x ${tau}) / ${F} = ${fmtS(cl * css * tau / F)} mg every ${tau} h.`);
    },
    function cssAvg() {
      const dose = pick([200, 300, 400, 500, 600]), tau = pick([6, 8, 12]), cl = pick([2, 4, 5, 8]), F = pick([1, 0.8, 0.5]);
      return mkL('pk', 3, `${dose} mg is given every ${tau} h (F = ${F}) and CL = ${cl} L/h. What is the average steady-state concentration in mg/L?`, F * dose / (cl * tau),
        [dose / (cl * tau), F * dose / cl, F * dose * tau / cl, F * dose / (cl * tau) * 2], 'mg/L', `Css avg = (F x Dose) / (CL x tau) = (${F} x ${dose}) / (${cl} x ${tau}) = ${fmtS(F * dose / (cl * tau))} mg/L.`);
    },
    function timeToSS() {
      const t = pick([2, 3, 4, 6, 8, 12, 24]);
      return mkL('pk', 1, `A drug has a half-life of ${t} h. About how many hours until steady state is reached (roughly 5 half-lives, about 97%)?`, 5 * t, [t, 2 * t, 3 * t, 10 * t], 'h', `Steady state is reached in about 4 to 5 half-lives. 5 x ${t} h = ${5 * t} h.`);
    },
    function aucCalc() {
      const dose = pick([100, 200, 300, 500, 800]), F = pick([1, 0.8, 0.5, 0.25]), cl = pick([5, 10, 20, 4, 8]);
      return mkL('pk', 2, `A ${dose} mg dose (F = ${F}) is given. CL = ${cl} L/h. What is the AUC in mg*h/L?`, F * dose / cl, [dose / cl, F * dose * cl, cl / (F * dose), F * dose / cl * 2], 'mg*h/L', `AUC = (F x Dose) / CL = (${F} x ${dose}) / ${cl} = ${fmtS(F * dose / cl)} mg*h/L.`);
    },
    function bioavail() {
      const f = pick([0.8, 0.5, 0.6, 0.25, 0.4]), aiv = pick([50, 80, 100, 120]), div = pick([100, 200]), dpo = pick([100, 200, 400]);
      const apo = f * aiv * dpo / div;
      return mkL('pk', 3, `AUC after ${div} mg IV is ${aiv} mg*h/L. AUC after ${dpo} mg orally is ${fmtS(apo)} mg*h/L. What is the oral bioavailability as a percent?`, f * 100,
        [apo / aiv * 100, apo / aiv * 100 * dpo / div, (1 - f) * 100, f * 10], '%', `F = (AUCpo / Dosepo) / (AUCiv / Doseiv) = (${fmtS(apo)}/${dpo}) / (${aiv}/${div}) = ${fmtS(f)} = ${fmtS(f * 100)}%.`);
    },
    function infusionCss() {
      const k0 = pick([20, 30, 40, 50, 60, 100]), cl = pick([2, 4, 5, 10]);
      if (Math.random() < 0.5) return mkL('pk', 2, `A drug is infused continuously at ${k0} mg/h. CL = ${cl} L/h. What is the steady-state concentration in mg/L?`, k0 / cl, [k0 * cl, cl / k0, k0 / cl * 2, k0 / cl / 2], 'mg/L', `At steady state, rate in = rate out. Css = k0 / CL = ${k0} / ${cl} = ${fmtS(k0 / cl)} mg/L.`);
      const css = pick([5, 10, 15, 20]);
      return mkL('pk', 2, `You want Css = ${css} mg/L with an infusion. CL = ${cl} L/h. What infusion rate (mg/h) is needed?`, css * cl, [css / cl, css * cl * 24, css * cl / 2, css + cl], 'mg/h', `k0 = CL x Css = ${cl} x ${css} = ${css * cl} mg/h.`);
    },
    function doseInterval() {
      const t = pick([[4, 20, 5], [6, 16, 4], [8, 8, 2], [3, 12, 3], [12, 40, 10]]), k = 0.693 / t[0], tau = Math.log(t[1] / t[2]) / k;
      return mkL('pk', 3, `A drug has t1/2 = ${t[0]} h. You want the peak ${t[1]} mg/L to fall to a trough of ${t[2]} mg/L before the next dose. What is the dosing interval in hours? (tau = ln(Cpeak/Ctrough) / k, k = 0.693/t1/2)`, tau,
        [Math.log10(t[1] / t[2]) / k, t[1] / t[2] / k, tau * 2, tau / 2], 'h', `k = 0.693 / ${t[0]} = ${fmtS(k)} h^-1. tau = ln(${t[1]}/${t[2]}) / k = ${fmtS(Math.log(t[1] / t[2]))} / ${fmtS(k)} = ${fmtS(tau)} h.`);
    },
    function aminoglycosideDose() {
      const w = pick([60, 70, 80, 90]), vd = 0.25, rise = pick([6, 8, 10, 12]);
      return mkL('pk', 2, `Gentamicin Vd is ${vd} L/kg. A ${w} kg patient needs the peak raised by ${rise} mg/L. What dose in mg?`, rise * vd * w, [rise * w / vd, rise * vd, w * vd, rise / vd / w], 'mg', `Vd = ${vd} x ${w} = ${fmtS(vd * w)} L. Dose = rise x Vd = ${rise} x ${fmtS(vd * w)} = ${fmtS(rise * vd * w)} mg.`);
    },
    function renalProportion() {
      const d = pick([600, 800, 1200, 2000]), n = pick([100, 120]), p = pick([20, 30, 40, 60]), ad = d * p / n;
      return mkL('pk', 2, `A drug cleared mostly by the kidney: usual dose ${d} mg/day at CrCl ${n} mL/min. A patient has CrCl ${p} mL/min. Using a simple CrCl ratio, what is the adjusted daily dose in mg?`, ad, [d * n / p, d * (1 - p / n), d - p, ad * 2], 'mg/day', `Adjusted = usual x (patient CrCl / normal CrCl) = ${d} x ${p}/${n} = ${fmtS(ad)} mg/day. (Real drugs need their own renal dosing table; this tests the proportion.)`);
    },
    function michaelisMenten() {
      const km = pick([4, 5, 6, 10]), vmax = pick([400, 500, 600]), R = pick([300, 350, 400, 450].filter(r => r < vmax)), css = km * R / (vmax - R);
      return mkL('pk', 3, `Phenytoin-style saturable elimination: Km = ${km} mg/L, Vmax = ${vmax} mg/day. At a daily dose of ${R} mg (F = 1), what is Css in mg/L? (Css = Km x R / (Vmax - R))`, css,
        [km * R / vmax, R / (vmax - R), km * (vmax - R) / R, (km + R) / vmax], 'mg/L', `Css = ${km} x ${R} / (${vmax} - ${R}) = ${km * R} / ${vmax - R} = ${fmtS(css)} mg/L. Small dose changes cause big Css changes when you are near Vmax.`);
    }
  ]
};
function genLab(kinds, diffs) {
  const ks = (kinds && kinds.length ? kinds : ['comp', 'pk']);
  for (let i = 0; i < 40; i++) {
    const k = pick(ks), q = pick(LAB_GENS[k])();
    if (!diffs || diffs.indexOf(q.d) >= 0 || i > 25) return q;
  }
  return pick(LAB_GENS[ks[0]])();
}
/* safe calculator (no eval): + - * / ^ ( ), ln log exp sqrt abs, pi, e, ans */
function labEval(src, ans) {
  const s = String(src).replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi').replace(/,/g, '').toLowerCase();
  let i = 0;
  const ws = () => { while (s[i] === ' ') i++; };
  const fail = () => { throw new Error('bad'); };
  function expr() { let v = term(); for (;;) { ws(); if (s[i] === '+') { i++; v += term(); } else if (s[i] === '-') { i++; v -= term(); } else return v; } }
  function term() { let v = unary(); for (;;) { ws(); if (s[i] === '*') { i++; v *= unary(); } else if (s[i] === '/') { i++; v /= unary(); } else return v; } }
  function unary() { ws(); if (s[i] === '-') { i++; return -unary(); } if (s[i] === '+') { i++; return unary(); } return pow(); }
  function pow() { const b = atom(); ws(); if (s[i] === '^') { i++; return Math.pow(b, unary()); } return b; }
  function atom() {
    ws();
    if (s[i] === '(') { i++; const v = expr(); ws(); if (s[i] !== ')') fail(); i++; return v; }
    let m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/.exec(s.slice(i));
    if (m) { i += m[0].length; return parseFloat(m[0]); }
    m = /^[a-z]+/.exec(s.slice(i));
    if (!m) fail();
    i += m[0].length; const id = m[0];
    if (id === 'pi') return Math.PI;
    if (id === 'e') return Math.E;
    if (id === 'ans') return ans || 0;
    const fn = { ln: Math.log, log: Math.log10, exp: Math.exp, sqrt: Math.sqrt, abs: Math.abs }[id];
    if (!fn) fail();
    ws(); if (s[i] !== '(') fail(); i++; const v = expr(); ws(); if (s[i] !== ')') fail(); i++; return fn(v);
  }
  const r = expr(); ws(); if (i < s.length) fail();
  if (!isFinite(r)) fail();
  return r;
}
if (typeof module !== 'undefined') module.exports = { LAB_GENS, genLab, labEval };
