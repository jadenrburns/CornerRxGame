import { BANK, genCalc, pick } from './bank.js';
import { DRUGS, P1WEEKS, P3WEEKS, WEEKS } from './drugs.js';
import { SHOP_DECOR, SHOP_FLOORS, SHOP_TAPES, SHOP_UNI, SHOP_WALLS } from './shop.js';
import { World } from './world.js';
import { MOLS, molSVG } from './mol.js';
import { Net } from './net.js';
import { CYC, CYC_X0, CYC_X1, CYC_Y0, CYC_Y1, cycSVG, cycScore, cycX, cycY } from './cycle.js';
import { STUDY_AI_PROMPT, STUDY_HELP, STUDY_TEMPLATE, deckToText, parseStudy, quizletToJson } from './deck.js';
import { GEAR, GEAR_BY, RAR, SLOT_NAME } from './gear.js';
import { IND } from './ind.js';
import { P } from './pt3b.js';
import { fmtS, genLab, labEval } from './lab.js';
import { X } from './mc3x.js';
import { MICSETS, micCovers, micDecoys, micMatch, micNorm } from './micdata.js';
/* ---------------- Corner Rx game logic ---------------- */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const SAVE_KEY = 'cornerRx.v1';
  const CATS = [
    ['BG', 'Brand / Generic'], ['CL', 'Drug classes'], ['MOA', 'Mechanisms'], ['AE', 'Adverse effects'],
    ['DDI', 'Interactions'], ['CN', 'Counseling'], ['AD', 'Antidotes'], ['SIG', 'Sig & law'],
    ['TOP', 'Weekly drugs'], ['TP3', 'Weekly drugs \u00B7 P3'], ['TP1', 'Weekly drugs \u00B7 P1'], ['B4D', 'Exam 4 \u00B7 digestion and energy carriers'], ['B4C', 'Exam 4 \u00B7 pyruvate dehydrogenase and citric acid cycle'], ['B4E', 'Exam 4 \u00B7 electron transport'], ['B4G', 'Exam 4 \u00B7 gluconeogenesis and Cori cycle'], ['B4PD', 'Exam 4 place \u00B7 digestion and energy carriers'], ['B4PC', 'Exam 4 place \u00B7 citric acid cycle and PDH'], ['B4PE', 'Exam 4 place \u00B7 electron transport'], ['B4PG', 'Exam 4 place \u00B7 gluconeogenesis'], ['BIOG', 'Biochemistry \u00B7 transcription and translation'], ['BIO4', 'Biochemistry \u00B7 metabolism and DNA replication'], ['B4X', 'Biochemistry \u00B7 Exam 4 practice exam'], ['PT4Q', 'PharmTox \u00B7 Exam 4 question bank'], ['PT4S', 'PharmTox \u00B7 Exam 4 study guide'], ['CALC', 'Calculations'], ['PT3', 'PharmTox \u00B7 Exam 3 questions'], ['PT3G', 'PharmTox \u00B7 Exam 3 drug practice'], ['PT4', 'PharmTox \u00B7 Exam 4 drug practice'], ['TH3', 'Therapeutics \u00B7 Exam 3'], ['ASD', 'Med Chem \u00B7 Exam 3 antiseizure drugs'], ['CHO', 'Med Chem \u00B7 Exam 3 cholinergic drugs'], ['MET3', 'Med Chem \u00B7 Exam 3 metabolism (tap the site)'], ['EX3', 'Med Chem \u00B7 Exam 3 cram (professor review)'], ['TH3F', 'Therapeutics \u00B7 IBS, constipation, diarrhea'], ['TH3C', 'Therapeutics \u00B7 Contraceptives'], ['GER', 'Therapeutics \u00B7 Geriatrics'], ['T553', 'Therapeutics III \u00B7 Syllabus topics'], ['HIM', 'Andy \u00B7 Heart failure'], ['MY', 'My studies']
  ];
  const CATNAME = {}; CATS.forEach(c => CATNAME[c[0]] = c[1]);
  /* The Topics menu is built from this table. A new category needs a CATS entry above and a slot in one course here
     (or a new course). Order here is the order on screen. `sched` attaches a weekly drug schedule (WKCFG key). */
  const COURSES = [
    { id: 'core', name: 'Core skills', tag: 'Every year', year: 'all', cats: ['BG', 'CL', 'MOA', 'AE', 'DDI', 'CN', 'AD', 'SIG', 'CALC', 'HIM'], note: 'The everyday counter questions: names, classes, mechanisms, side effects, interactions, counseling, antidotes, sig and law, calculations, and Andy’s heart failure questions.' },
    { id: 'p443', name: 'PharmTox', code: 'PHAR 443', tag: 'P2', year: 'P2', cats: ['PT3', 'PT3G', 'PT4Q', 'PT4S', 'PT4'], note: 'The PharmTox exam question sets.' },
    { id: 'p451', name: 'Therapeutics', code: 'PHAR 451', tag: 'P2', year: 'P2', cats: ['TH3F', 'TH3C', 'TH3', 'GER'], note: 'Exam 3 GI and contraception topics, and geriatrics.' },
    { id: 'p421', name: 'Medicinal Chemistry', code: 'PHAR 421', tag: 'P2', year: 'P2', cats: ['EX3', 'ASD', 'CHO', 'MET3'], note: 'Exam 3: start with the cram tab (built from the professor\u2019s study guide), then antiseizure, cholinergic and tap-the-site metabolism.' },
    { id: 'p2top', name: 'Weekly drugs', code: 'PHAR 443', tag: 'P2', year: 'P2', cats: ['TOP'], sched: 'p2', note: 'Weekly drug sheets for PharmTox, one set per week.' },
    { id: 'p1bio', name: 'Biochemistry', tag: 'P1', year: 'P1', cats: ['B4X', 'B4D', 'B4C', 'B4E', 'B4G', 'B4PD', 'B4PC', 'B4PE', 'B4PG', 'BIOG', 'BIO4'], note: 'Exam 4: digestion, citric acid cycle, electron transport and gluconeogenesis (questions, plus drag-and-place pathway cards). Then the older gene expression and metabolism tests.' },
    { id: 'p1top', name: 'Top 300 weekly drugs', short: 'Top 300', tag: 'P1', year: 'P1', cats: ['TP1'], sched: 'p1', note: 'Brand, generic and indication for the Top 300, most prescribed first. Starts Jan 12: top 20, 35, 50, 65, 80, 90, 100 and on to 300. Each week adds new drugs and the earlier weeks stay on for review.' },
    { id: 'p3top', name: 'Top 300 weekly drugs', short: 'Top 300', tag: 'P3', year: 'P3', cats: ['TP3'], sched: 'p3', note: 'Drug list sheets by system, one set per week.' },
    { id: 'p553', name: 'Therapeutics III', code: 'PHAR 553', tag: 'P3', year: 'P3', cats: ['T553'], note: 'Syllabus topics: asthma, COPD, renal, diabetes, gout, migraine, RA and SLE, thyroid, liver, hepatitis, blood pressure, lipids, pain, nutrition, fluids and electrolytes.' },
    { id: 'my', name: 'My studies', tag: 'Yours', year: 'all', cats: ['MY'], note: 'Decks you wrote or imported from Quizlet. Add and manage them on the My studies tab.' }
  ];
  const CHIP = { B4X: 'Exam 4: practice exam (all 40 questions)', B4D: 'Exam 4: digestion and energy carriers', B4C: 'Exam 4: pyruvate dehydrogenase and citric acid cycle', B4E: 'Exam 4: electron transport', B4G: 'Exam 4: gluconeogenesis and Cori cycle', B4PD: 'Exam 4 drag and place: digestion and energy carriers', B4PC: 'Exam 4 drag and place: citric acid cycle and PDH', B4PE: 'Exam 4 drag and place: electron transport', B4PG: 'Exam 4 drag and place: gluconeogenesis', EX3: 'Exam 3 cram: professor\u2019s review (all three topics)', ASD: 'Exam 3: antiseizure drugs', CHO: 'Exam 3: cholinergic drugs', MET3: 'Exam 3: metabolism (tap the site)', TOP: 'Weekly drugs', PT3: 'Exam 3: your exam questions', PT3G: 'Exam 3: drug-list practice', BIOG: 'Biochem: transcription and translation', BIO4: 'Biochem: metabolism and DNA replication', PT4Q: 'Exam 4: PharmTox question bank', PT4S: 'Exam 4: study guide (mania, serotonin, antidepressants, opioids)', PT4: 'Exam 4: mania and psychosis drugs', TP1: 'Top 300: brand, generic, indication', TH3: 'Exam 3: IBD, ulcers, hemorrhoids and the rest', TH3F: 'Exam 3: IBS, constipation, diarrhea', TH3C: 'Exam 3: contraceptives', GER: 'Geriatrics: aging, polypharmacy, deprescribing', HIM: 'Heart failure: Andy’s questions', T553: 'Therapeutics III topics', TP3: 'Top 300 weekly drugs', MY: 'My studies' };
  const courseCats = (c) => c.cats.filter(k => k !== 'MY' || S.decks.length);
  const YEARS = ['P1', 'P2', 'P3'];
  const curYear = () => YEARS.indexOf(S.set.year) >= 0 ? S.set.year : 'P2';
  const inYear = (c, y) => c.year === 'all' || c.year === y;
  const yearCats = (y) => { const o = []; COURSES.forEach(c => { if (inYear(c, y)) o.push.apply(o, courseCats(c)); }); return o; };
  const FLAVOR = {
    EX3: ['I have a test coming up on my medicines. Can you quiz me?', 'Can you help me understand how my sleep and seizure medicines work?', 'Quick question about how this drug acts.'],
    ASD: ['My neurologist changed my seizure medicine, can you explain it?', 'I want to understand how my seizure drug is handled by the body.', 'Quick question about my antiseizure prescription.'],
    CHO: ['My doctor said this one acts on acetylcholine. What does that mean?', 'Can you explain how this nerve and muscle drug works?', 'I keep hearing about cholinergic drugs. Help?'],
    MET3: ['Can you show me where my medicine is broken down?', 'I was told my liver changes this drug. Where on the molecule?', 'Show me what the liver does to it.'],
    BG: ['Doc wrote the brand name, can you match it?', 'My insurance wants the generic.', 'The label on my bottle looks different.'],
    CL: ['What type of medicine is this one?', 'I want to understand what I am taking.', 'The last pharmacist called it a class, which one?'],
    MOA: ['How does this actually work in the body?', 'My doctor said it blocks something, what?', 'Quick one about how it works.'],
    AE: ['Is this side effect normal?', 'What should I watch out for?', 'I read something scary online.'],
    DDI: ['Can I take this with my other pills?', 'Is this combo safe?', 'My other doctor added a new one.'],
    CN: ['How should I take this exactly?', 'Any tips before I leave?', 'What do I tell my family about this?'],
    AD: ['Poison control wants a quick answer.', 'The ER is on the phone, what is the antidote?', 'We need a reversal agent, fast.'],
    SIG: ['I cannot read the doctor handwriting.', 'The prescription is confusing, can you check?', 'The auditor stopped by, quick question.'],
    CALC: ['The nurse needs this calculation checked.', 'Please double-check this dose.', 'Compounding order just came in.'],
    TOP: ['This one is on this week\'s drug list.', 'Quiz week! Do you know this one?', 'Straight off the Top 300 sheet.'],
    B4D: ['Biochem Exam 4: how food is digested.', 'Digestion and energy carriers.', 'Enzymes, hormones and vitamins.'],
    B4C: ['Biochem Exam 4: the citric acid cycle.', 'Pyruvate to CO2: what is made?', 'Around the cycle.'],
    B4E: ['Biochem Exam 4: electron transport.', 'Complexes, carriers and protons.', 'From NADH to oxygen.'],
    B4G: ['Biochem Exam 4: making glucose.', 'Gluconeogenesis and the Cori cycle.', 'Bypass the irreversible steps.'],
    B4PD: ['Drag and place: digestion.', 'Place each enzyme, hormone and carrier.'],
    B4PC: ['Drag and place: the citric acid cycle.', 'Place molecules, enzymes and products.'],
    B4PE: ['Drag and place: electron transport.', 'Place the complexes, carriers and protons.'],
    B4PG: ['Drag and place: gluconeogenesis.', 'Place the bypass steps and the Cori cycle.'],
    BIOG: ['Biochem time: from DNA to protein.', 'Transcription or translation?', 'Gene expression check.'],
    B4X: ['Practice exam time.', 'Forty questions, the real thing.', 'Test day rehearsal.'],
    BIO4: ['Biochem time: metabolism and DNA replication.', 'Pathways and polymerases.', 'Biochem test practice.'],
    TP1: ['Top 300 time: brand, generic or what it treats?', 'Quiz week! Do you know this one?', 'Straight off the Top 300 list.'],
    TP3: ['P3 drug list: this one is on the sheet.', 'Quiz week! Do you know this one?', 'Straight off the Top 300 sheet.'],
    T553: ['My doctor changed my plan, can you explain?', 'Quick therapy question before I go.', 'Is this the right treatment for me?'],
    HIM: ['*high knees* Quick heart failure question!', 'Is my ejection fraction a problem?', 'Which pills do I take for my heart?'],
    TH3C: ['I have a question about birth control.', 'My doctor mentioned contraception, can you explain?', 'Quick question about my pill.'],
    GER: ['My mom takes a lot of pills now, can you check them?', 'My grandfather has been confused lately, is it his medicine?', 'Quick question about medicines for older adults.'],
    TH3F: ['My stomach has been off for days.', 'Is this bowel problem normal?', 'Which one should I take for my gut?'],
    TH3: ['Quick gut and stomach question.', 'My doctor mentioned this, can you explain?', 'Is this the right treatment for me?'],
    MY: ['A question from your own notes.', 'Straight from your study sheet.', 'This one is on your exam list.']
  };
  const KAREN_LINES = ['I WANT TO SPEAK TO YOUR MANAGER!', 'This is UNACCEPTABLE. Answer me right now!', 'I have been coming here for twenty years!', 'Do you even know what you are doing?!'];
  const NAMES = ['Marcus', 'Priya', 'Mrs. Alvarez', 'Devon', 'Mei', 'Mr. Okafor', 'Sofia', 'Grandpa Joe', 'Hannah', 'Luis', 'Dr. Patel', 'Aisha', 'Tom', 'Nadia', 'Ben', 'Ms. Lindqvist'];
  const RANKS = [[0, 'Pharmacy Intern'], [20, 'Pharmacy Technician'], [60, 'Staff Pharmacist'], [130, 'Clinical Pharmacist'], [250, 'Residency Preceptor'], [450, 'Chief of Pharmacy'], [700, 'Director of Pharmacy'], [1000, 'Pharmacy Legend']];
  const MODES = [
    ['mixed', 'Smart mix', 'Recommended. After each answer you rate how sure you were, and the game schedules reviews with the SM-2 spaced repetition method. New and missed questions come up most, a miss returns within 3 cards, questions you were certain about but missed return first, and mastered ones fade out.'],
    ['review', 'Individual review', 'Your daily review. Only questions whose review date has arrived, from every topic you have studied, with the same confidence rating. Skip it on days you are focusing on something else and it just waits.'],
    ['missed', 'Review misses', 'Only questions on your Review Shelf. No confidence rating or review scheduling.'],
    ['new', 'New only', 'Only questions you have never answered. No confidence rating or review scheduling.']
  ];
  const UPS = [
    { id: 'shelf', short: 'Shelves', name: 'Stocked Shelves', max: 20, cost: l => Math.round(40 * Math.pow(1.55, l)), desc: l => `Each sale pays +25% more. Now +${l * 25}%.` },
    { id: 'tech', short: 'Techs', name: 'Pharmacy Technician', max: 20, cost: l => Math.round(80 * Math.pow(1.6, l)), desc: l => `Techs earn tips on their own, about ${money(techRate())}/s each right now. Hired: ${l}.` },
    { id: 'train', short: 'Training', name: 'Tech Training', max: 10, cost: l => Math.round(150 * Math.pow(1.7, l)), desc: l => `Technicians earn +40% per level. Techs now also gain from Stocked Shelves. Now +${l * 40}%. Needs hired techs.` },
    { id: 'counsel', short: 'Counseling', name: 'Counseling Room', max: 10, cost: l => Math.round(120 * Math.pow(1.8, l)), desc: l => `Streak bonus (+5% per answer) caps at ${5 + 3 * l} in a row. ${Math.min(60, l * 10)}% chance to talk Karen down.` },
    { id: 'robot', short: 'Robot', name: 'Dispensing Robot', max: 5, cost: l => Math.round(300 * Math.pow(2, l)), desc: l => `${l * 6}% chance that a correct fill pays double.` }
  ];
  const ICON_GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>';
  const ICON_BOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M9 7h6"/></svg>';

  function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return 'q' + (h >>> 0).toString(36); }
  BANK.forEach(q => { q.k = hash((q.kx || '') + q.q); });
  let BYKEY = {};

  /* ---- state ---- */
  function defaults() {
    const topics = {}; CATS.forEach(c => topics[c[0]] = true);
    return { cash: 0, earned: 0, rep: 50, streak: 0, best: 0, correct: 0, wrong: 0, served: 0, franchises: 0,
      pw: { hint: 0, second: 0, binder: 0 }, daily: null, recall: [], reg: {}, calcOK: 0, mastery: {}, missed: [], karenCd: 0, karenWin: 0, karenLoss: 0, sweatyCd: 0, jimWin: 0, jimLoss: 0, phoneOK: 0, phoneBad: 0, phoneMiss: 0, lastShelve: 0, retired: 0, shelveOK: 0, shelveBad: 0, priorN: 0, decks: [],
      me: { done: false, body: 'normal', gender: 'n', hair: 0, hairColor: 0, skin: 1, scrub: 0, shirt: 0, shoes: 3 }, awards: { frames: [], pets: [] },
      set: { topics: topics, diffs: [1, 2, 3], mode: 'mixed', timer: true, focus: false, conf: true, p2fold: true, p3fold: true, p1fold: true },
      vial: [], cosm: [], cosmOn: {}, pillN: 0, store: { own: [], walls: 'w0', floor: 'f0', uni: '', deco: [], rug: { off: false, c: '#F2A516', p: 'solid' }, pos: {}, tape: 't1' },
      up: { shelf: 0, tech: 0, train: 0, counsel: 0, robot: 0 } };
  }
  let S = load();
  if (/[?&]noconf=1/.test(location.search)) S.set.conf = false; // tests: skip the confidence prompt
  if (S.playSec === undefined) S.playSec = S.served > 0 ? 300 : 0; // people who already play skip the slow start
  if (S.tutDone === undefined && S.served > 0) S.tutDone = true;
  function load() {
    const f = defaults();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const o = JSON.parse(raw); Object.assign(f, o);
        f.up = Object.assign(defaults().up, o.up || {});
        f.me = Object.assign(defaults().me, o.me || {});
        f.pw = Object.assign({ hint: 0, second: 0, binder: 0 }, o.pw || {});
        if (!o.pw && o.hintsLeft) f.pw.hint = Math.min(9, o.hintsLeft);
        if (f.up.library) { let r = 0; for (let l = 0; l < f.up.library; l++) r += Math.round(150 * Math.pow(1.9, l)); f.cash = (f.cash || 0) + r; f.libRefund = (f.libRefund || 0) + r; }
        delete f.up.library; delete f.hintsLeft; delete f.sinceHint;
        f.store = Object.assign(defaults().store, o.store || {}); f.store.own = (f.store.own || []).slice(); f.store.deco = (f.store.deco || []).slice(); f.store.rug = Object.assign({ off: false, c: '#F2A516', p: 'solid' }, f.store.rug || {}); f.store.pos = Object.assign({}, f.store.pos || {}); f.store.tape = f.store.tape || 't1'; f.store.rot = Object.assign({}, f.store.rot || {}); f.store.petOn = Object.assign({}, f.store.petOn || {}); if (f.store.own.indexOf('neon') >= 0) { f.store.own = f.store.own.filter(x => x !== 'neon'); f.store.deco = f.store.deco.filter(x => x !== 'neon'); f.cash = (f.cash || 0) + 700; delete f.store.pos.neon; f.neonRefund = 700; }
        f.awards = { frames: ((o.awards || {}).frames || []).slice(), pets: ((o.awards || {}).pets || []).slice(), calW: (o.awards || {}).calW || 0, wkDone: (o.awards || {}).wkDone ? o.awards.wkDone.slice() : null };
        const d = defaults().set, os = o.set || {};
        f.set = Object.assign(d, os); f.set.topics = Object.assign(defaults().set.topics, os.topics || {});
        if (os.topics && os.topics.TH3 === false) { if (os.topics.TH3F === undefined) f.set.topics.TH3F = false; if (os.topics.TH3C === undefined) f.set.topics.TH3C = false; }
        if (!Array.isArray(f.set.diffs) || !f.set.diffs.length) f.set.diffs = [1, 2, 3];
        if (!f.set.year && (os.folder === 'P1' || os.folder === 'P3')) f.set.year = os.folder; delete f.set.folder;
        if (os.p2fold === undefined) f.set.p2fold = true; if (os.p3fold === undefined) f.set.p3fold = true; if (os.p1fold === undefined) f.set.p1fold = true; // v120: schedules start collapsed inside the course cards
        if (!MODES.some(m => m[0] === f.set.mode)) f.set.mode = 'mixed'; // Even shuffle / Linear was removed
        if (!Array.isArray(f.decks)) f.decks = [];
      }
    } catch (e) { /* storage unavailable */ }
    return f;
  }
  let saveTimer = null;
  function save() {
    if (window.__rxLoading) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { if (window.__rxLoading) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }, 300);
  }

  /* ---- weekly drugs: questions built from the Top 300 alignment (drugs.js) ---- */
  const TOPQ = [];
  /* a drug can list several brands; the last listed (usually the current one) is asked, any listed brand is never a wrong option, and the card shows them all */
  const brandList = (b) => { const out = []; String(b || '').split(/[,;]/).forEach(x => { x = x.replace(/\([^)]*\)/g, '').replace(/^[^:]*:/, '').trim(); if (!x || /multiple|^n\/a$|^vitamin|^d\d$/i.test(x) || out.indexOf(x) >= 0) return; out.push(x); }); return out; };
  const brandPick = (d) => { const l = brandList(d.b); return l.length ? l[l.length - 1] : ''; };
  const WK = {}; WEEKS.forEach(w => { WK[w.n] = w; });
  /* P3 folder: its own weekly schedule (Top Drug List sheets by system). Drug copies carry p3:1 and ids offset by 100000 so their progress stays separate. */
  const WK3 = {}; P3WEEKS.forEach(w => { WK3[w.n] = w; });
  const D3 = []; P3WEEKS.forEach(w => w.ids.forEach(id => { const b = DRUGS.find(x => x.id === id); if (b) D3.push(Object.assign({}, b, { id: 100000 + id, w: w.n, p3: 1 })); }));
  /* P1 folder: Top 300 by rank (descending), brand, generic and indication only. Copies carry p1:1 and ids offset by 200000. */
  const WK1 = {}; P1WEEKS.forEach(w => { WK1[w.n] = w; });
  const D1 = []; P1WEEKS.forEach(w => w.ids.forEach(id => { const b = DRUGS.find(x => x.id === id); if (b) D1.push(Object.assign({}, b, { id: 200000 + id, w: w.n, p1: 1 })); }));
  const wkOfN = (n) => n > 200 ? WK1[n] : n > 100 ? WK3[n] : WK[n];
  const ALLD = DRUGS.concat(D3, D1), baseId = (d) => d.id % 100000;
  (function buildTop() {
    const rngOf = (str) => { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; };
    const shuf = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const nz = (x) => String(x || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const cut = (t, n) => { t = String(t || '').trim(); if (t.length <= n) return t; const c = t.slice(0, n); const sp = c.lastIndexOf(' '); return c.slice(0, sp > n * 0.6 ? sp : n).replace(/[,;:\s-]+$/, '') + '...'; };
    const firstSent = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim(); const m = t.match(/^.*?[.;](?=\s|$)/); return cut(m && m[0].length >= 40 ? m[0].replace(/[.;]$/, '') : t, n); };
        const words = (t) => (String(t).toLowerCase().match(/[a-z]{5,}/g) || []);
    // Distractor screening: reject wrong answers that could also be right for this drug.
    const GENW = new Set('treatment therapy prophylaxis infection infections disease diseases management adjunct acute chronic syndrome symptoms symptom relief other with without associated due moderate severe mild adults adult patients patient used also including include primary secondary prevention reduce reduction control disorder disorders condition conditions type types agent agents antibiotic antibiotics inhibitor inhibitors receptor receptors blocker blockers antagonist antagonists agonist agonists tract soft tissue derivative semisynthetic bacterial protein synthesis active against most organisms that inhibits binds cell wall which thus effects effect result results causing cause produces leading used deficit deficiency vaccine vaccines topical nasal transdermal patch inhaler inhaled oral ophthalmic toxoid extended release salts injection'.split(' '));
    const SYN = { uti: 'urinary tract infection', htn: 'hypertension', gerd: 'gastroesophageal reflux', bph: 'benign prostatic hyperplasia', copd: 'chronic obstructive pulmonary', adhd: 'attention deficit hyperactivity', ra: 'rheumatoid arthritis', t2dm: 'type 2 diabetes', mi: 'myocardial infarction', chf: 'heart failure', hf: 'heart failure', afib: 'atrial fibrillation', dvt: 'deep vein thrombosis', ocd: 'obsessive compulsive', ptsd: 'posttraumatic stress', genitourinary: 'urinary', cystitis: 'urinary', pyelonephritis: 'urinary' };
    const sig = (t) => { t = String(t || '').toLowerCase().replace(/\b[a-z0-9]{2,14}\b/g, w => SYN[w] || w); return (t.match(/[a-z]{4,}/g) || []).filter(w => !GENW.has(w)).map(w => w.slice(0, 6)).filter((w, i, a) => a.indexOf(w) === i); };
    const ovl = (a, b) => a.filter(w => b.indexOf(w) >= 0);
    const bare = (t) => sig(t).length === 0;
    const ABST = new Set(['and', 'the', 'for', 'with', 'not', 'use', 'due', 'any', 'off', 'its', 'all', 'may', 'can', 'are', 'who']);
    const abOvl = (a, b) => { const f = (t) => (String(t).toLowerCase().match(/\b[a-z][a-z0-9]{1,2}\b/g) || []).filter(w => !ABST.has(w)); const B = f(b); return f(a).filter(w => B.indexOf(w) >= 0); };
    const classClash = (d, x) => { const a = String(d.c || ''), b = String(x.c || ''); if (!a || !b) return false; if (nz(a) === nz(b)) return true; if ((bare(a) || bare(b)) && ovl((a.toLowerCase().match(/[a-z]{4,}/g) || []), (b.toLowerCase().match(/[a-z]{4,}/g) || [])).length) return true; return ovl(sig(a), sig(b)).length > 0; };
    // Related-use screening: an indication that sits in the same clinical neighborhood as anything the drug (or its class) is used for cannot be a wrong choice.
    const IND_CLUS = [
      ['pain', /pain|analges|headache|migraine|arthrit|osteoarth|\boa\b|\bra\b|gout|spasm|fever|dysmenorr|inflamm|neuralg|neuropath|musculoskel|spondyl|bursit|tendin|sprain|fibromyalg|cluster/],
      ['cardiac', /hypertens|\bhtn\b|heart failure|\bhf\b|\bchf\b|angina|\bcad\b|coronary|\baf\b|atrial|arrhythm|tachycard|edema|myocardial|\bmi\b|stroke|thrombo|\bdvt\b|\bvte\b|embol|clot|anticoag|pulmonary arterial|raynaud|cardiovascular|ventricular/],
      ['lipid', /lipid|cholesterol|\bhld\b|triglycer|hyperlip/],
      ['mood', /depress|anxiety|panic|\bocd\b|obsessive|\bptsd\b|posttraumatic|insomnia|sleep|smoking|bipolar|mania|manic|premenstrual|bulimia|binge|alcohol/],
      ['psychosis', /schizo|psychos|psychotic|bipolar|mania|manic|agitation|tourette|tic disorder|irritability/],
      ['attention', /adhd|attention deficit|narcolep|binge|obesity|weight/],
      ['seizure', /seizure|epilep|convuls|lennox|status epil/],
      ['neuro', /parkinson|alzheimer|dementia|restless leg|spastic|vertigo|motion sick|huntington|myasthenia|multiple sclerosis|neuropath|neuralg/],
      ['diabetes', /diabet|\bt1dm\b|\bt2dm\b|glycem|insulin|weight|obesity/],
      ['resp', /asthma|\bcopd\b|cough|rhinitis|allerg|urticaria|bronch|congestion|\bcold\b|anaphyl|hay fever|sinus|wheez|pulmonary|respiratory|hives|pruritus|itch/],
      ['gi', /gerd|reflux|ulcer|pylori|nausea|vomit|emesis|\bn\/v\b|pancreat|steatorrh|malabsorp|gastropar|diarrhea|constipat|\bibs\b|\bibd\b|crohn|colitis|hemorrhoid|dyspep|heartburn|bowel|gastr|motion sick|hepatic enceph/],
      ['immune', /psoria|arthrit|\bra\b|lupus|\bsle\b|crohn|colitis|\bibd\b|spondyl|eczema|atopic|dermatitis|transplant|rejection|multiple sclerosis|uveitis|vasculitis/],
      ['gu', /\bbph\b|prostat|\bed\b|erectile|overactive bladder|incontinence|urinary|bladder|enuresis/],
      ['hormone', /contracept|menopaus|endometri|hypogonad|testosterone|menstru|uterine bleeding|infertil|hormone|hirsut|pcos|polycystic|prostat/],
      ['thyroid', /thyroid/],
      ['bone', /osteopor|\bop\b|calcium|vitamin d|parathyroid|hypocalc|hypoparathyroid|bone|paget|rickets|hypophosph|phosphat/],
      ['lytes', /potassium|hypokal|magnesium|hypomag|electrolyte|sodium|phosph/],
      ['anemia', /anemi|iron|b12|folic|folate|cobalamin|pernicious|neural tube/],
      ['cancer', /cancer|carcinoma|leukemi|lymphoma|malignan|tumor|chemo|myeloma|oncolog/],
      ['vzv', /varicella|zoster|shingles|chickenpox|herpes zoster/],
      ['tdap', /tetanus|diphtheria|pertussis|whooping|lockjaw/],
      ['hep', /hepatitis/],
      ['eye', /glaucoma|dry eye|conjunctiv|ocular|intraocular|\beye\b|uveitis/],
      ['spasm', /spasm|spastic|cramp/],
      ['derm', /psoria|eczema|acne|dermatitis|rosacea|alopecia|hair loss|skin|pruritus|itch|hives|urticaria/]
    ];
    const CLS_BAN = [
      [/nsaid|cox|salicylate|acetaminophen|analges|paracetamol|ketorolac|ibuprofen|naproxen/, ['pain', 'immune', 'spasm']],
      [/opioid/, ['pain', 'resp', 'gi']],
      [/corticosteroid|glucocorticoid|steroid|\bics\b|prednis|dexameth|cortisone/, ['pain', 'resp', 'immune', 'gi', 'derm', 'eye', 'cancer', 'hormone']],
      [/alpha.?2|clonidine|guanfacine|tizanidine|methyldopa/, ['cardiac', 'spasm', 'attention']],
      [/erythropoie|esa\b|iron|vitamin b|folate|folic|cobalamin|supplement/, ['anemia']],
      [/vitamin d|calcitriol|bisphosphonate|calcium|parathyroid|raloxifene|estrogen|supplement/, ['bone']],
      [/cancer|antimetabolite|aromatase|antiestrogen|selective estrogen/, ['cancer']],
      [/beta.?block|\bace\b|ace inhib|angiotensin|\barb\b|diuretic|calcium channel|alpha.?block|vasodilat|nitrate|antiarrhythm/, ['cardiac', 'pain', 'eye', 'gu', 'mood']],
      [/ssri|snri|tricyclic|antidepress|mirtazapine|bupropion|trazodone|serotonin/, ['mood', 'pain', 'seizure', 'psychosis', 'attention', 'gi']],
      [/anticonvuls|antiepilep|gaba|valpro|lamotrig|carbamaz|topiramate|phenytoin/, ['seizure', 'pain', 'mood', 'psychosis', 'neuro']],
      [/antipsychotic|neuroleptic/, ['psychosis', 'mood', 'neuro', 'gi']],
      [/benzodiaz|sedative|hypnotic|barbiturate/, ['mood', 'seizure', 'neuro', 'pain']],
      [/antihistamine|h1/, ['resp', 'mood', 'gi', 'derm', 'eye']],
      [/muscle relax|spasmolytic|gaba-b/, ['pain', 'neuro', 'spasm']],
      [/triptan|cgrp|ergot/, ['pain']],
      [/proton pump|h2 |histamine-2|antiemetic|5-ht3|antidiarrheal|laxative|prokinetic|dopamine receptor antag|stool|enzyme/, ['gi']],
      [/anticoag|antiplatelet|thrombin|factor xa|heparin/, ['cardiac']],
      [/statin|fibrate|lipid|cholesterol/, ['lipid', 'cardiac']],
      [/insulin|metformin|sulfonylurea|sglt|glp|dpp|thiazolidinedione|biguanide|incretin|amylin/, ['diabetes', 'cardiac', 'attention', 'lipid']],
      [/estrogen|progest|contracept|androgen|testosterone|selective estrogen|aromatase|5-alpha/, ['hormone', 'gu']],
      [/anticholinergic|antimuscarinic|antispasmodic|atropine/, ['gu', 'neuro', 'resp', 'gi', 'spasm']],
      [/dopamine|monoamine oxidase|mao/, ['neuro', 'mood', 'hormone']],
      [/stimulant|amphetamine|methylphenidate/, ['attention', 'mood']],
      [/bronchodilat|laba|lama|saba|sama|leukotriene|methylxanthine|inhaled|\bics\b/, ['resp', 'spasm']],
      [/tnf|biologic|interleukin|dmard|immunosuppress|jak|monoclonal/, ['immune', 'derm', 'gi', 'pain', 'resp']],
      [/pde.?5|phosphodiesterase/, ['gu', 'cardiac']],
      [/carbonic anhydrase|prostaglandin analog|miotic/, ['eye']]
    ];
    const clusOf = (t) => { t = String(t || '').toLowerCase(); const o = {}; IND_CLUS.forEach(c => { if (c[1].test(t)) o[c[0]] = 1; }); return o; };
    const relatedUse = (d, text) => {
      const w = clusOf(text), mine = clusOf(d.i.join(' ; '));
      if (Object.keys(w).some(k => mine[k])) return true;
      const cs = String(d.c || '').toLowerCase() + ' ' + String(d.g || '').toLowerCase();
      return CLS_BAN.some(r => r[0].test(cs) && r[1].some(k => w[k]));
    };
    const conflict = (type, d, x, text) => {
      if (type === 'ind') return relatedUse(d, text) || ovl(sig(text), sig(d.i.join(' '))).length > 0 || abOvl(text, d.i.join(' ')).length > 0 || ovl(sig(text), sig(d.c + ' ' + d.g)).length > 0;
      if (type === 'class') return classClash(d, x) || abOvl(x.c, d.c).length > 0 || nz(d.c).indexOf(nz(x.c)) >= 0 || nz(x.c).indexOf(nz(d.c)) >= 0 || (nz(x.c).length > 3 && (nz(d.m).indexOf(nz(x.c)) >= 0 || nz(d.i.join(' ')).indexOf(nz(x.c)) >= 0));
      if (type === 'moa') return nz(d.c) === nz(x.c) || ovl(sig(x.m), sig(d.m)).length >= 3 || (sig(d.c).length > 0 && sig(d.c).join() === sig(x.c).join());
      if (type === 'gen') { const A = nz(d.g).split(' ').filter(w => w.length > 4), W = nz(x.g).split(' ').filter(w => w.length > 4); return ovl(A, W).length > 0; }
      if (type === 'brand') return nz(d.b).split(' ').indexOf(nz(text)) >= 0 || nz(d.b).indexOf(nz(text)) >= 0;
      return false;
    };
    const byWeek = {}; ALLD.forEach(d => { (byWeek[d.w] = byWeek[d.w] || []).push(d); });
    const rowsOf = (d) => {
      const r = [];
      const bl = brandList(d.b); r.push(['Drug', d.g + (bl.length ? ' (' + bl.join(', ') + ')' : '')]);
      if (d.c) r.push(['Class', cut(d.c, 90)]);
      if (d.m && d.m.length >= 40 && !/^n\/a/i.test(d.m)) r.push(['How it works', firstSent(d.m, 170)]);
      if (d.i && d.i.length) r.push(['Used for', d.i.slice(0, 3).map(x => cut(x, 70)).join('; ')]);
      return r;
    };
    const ref = (d) => rowsOf(d).map(x => x[0] + ': ' + x[1]).join('. ') + '.';
    // 3 wrong answers: other drugs from the same week first, then any drug. `field` returns the candidate text (or '').
    const wrongs = (d, field, r, reject, type) => {
      const same = shuf((byWeek[d.w] || []).filter(x => x !== d), r), rest = shuf(ALLD.filter(x => x !== d && x.w !== d.w && baseId(x) !== baseId(d)), r);
      const out = [], seen = {}, usedCl = {}; const ok = field(d);
      seen[nz(ok)] = 1;
      same.concat(rest).forEach(x => { if (out.length >= 3) return; const t = field(x); if (!t) return; const n = nz(t); if (!n || seen[n]) return; if (reject && reject(t, x)) return; if (type && conflict(type, d, x, t)) return; if (type === 'ind') { const cl = Object.keys(clusOf(t)); if (cl.some(k => usedCl[k]) || out.some(o => ovl(sig(o), sig(t)).length > 0)) return; cl.forEach(k => usedCl[k] = 1); } seen[n] = 1; out.push(t); });
      return out.length === 3 ? out : null;
    };
    // ---- counseling (select all that apply): right answers are the workbook points, wrong answers contradict a point or belong to other drugs ----
    const cpt = {}; DRUGS.forEach(x => (x.cl || []).forEach(p => { const k = nz(p); cpt[k] = (cpt[k] || 0) + 1; }));
    const FLIPS = [
      [/^(do not (stop|abruptly)|avoid abrupt|do not abruptly|don.t stop)/i, 'Safe to stop suddenly at any time without tapering'],
      [/^take with (food|meals)/i, 'Take on an empty stomach for best absorption'],
      [/empty stomach/i, 'Take with a large, high-fat meal'],
      [/(take|dose)[^.]*in the morning|^morning/i, 'Take at bedtime so any urination does not bother the day'],
      [/at bedtime/i, 'Take first thing in the morning'],
      [/^complete (the )?(full|all)/i, 'Stop once symptoms improve and save the rest for later'],
      [/swallow[^.]*whole/i, 'Crush or chew to get a faster effect'],
      [/^avoid alcohol|avoid.*alcohol/i, 'Alcohol is safe in moderation'],
      [/^lowers blood pressure/i, 'Raises blood pressure; check for hypertension'],
      [/^lowers heart rate/i, 'Raises heart rate (tachycardia)'],
      [/hyperkalemia/i, 'Risk of hypokalemia (low potassium)'],
      [/rinse mouth/i, 'Swallow the rinse water; no need to rinse after use'],
      [/^shake/i, 'Never shake before use'],
      [/sun/i, 'Sun exposure is not a concern, no sunscreen needed'],
      [/weight gain/i, 'Associated with weight loss'],
      [/weight loss/i, 'Associated with weight gain'],
      [/^causes constipation/i, 'Causes diarrhea'],
      [/^schedule (ii|iii|iv|v)\b/i, 'Not a controlled substance, no special prescription rules'],
      [/do not share (pens|needles)/i, 'Pens may be shared with family if the needle is changed'],
      [/rotate injection sites/i, 'Inject in the same spot every time'],
      [/sharps container/i, 'Used needles can go in the household trash'],
      [/inform all providers before surgery/i, 'No need to tell the surgeon or dentist'],
      [/lowest effective dose/i, 'Use the highest dose you can tolerate for the longest time'],
      [/many weeks/i, 'Full effect is seen within the first day or two']
    ];
    const flipOf = (p) => { for (const f of FLIPS) if (f[0].test(p)) return f[1]; return ''; };
    // generic effects (sedation, low BP, GI upset, boxed warnings...) can be true of many drugs, so they are never used as wrong options
    const GENPT = /sedat|drows|dizz|orthostat|hypotens|hypertens|nausea|vomit|diarr|headache|constipat|\bgi\b|gastro|fatigue|weight|tachy|brady|side effect|adverse|most common|lowest effective|abrupt|full course|with food|empty stomach|\bsun|alcohol|pregnan|dry mouth|rash|bleed|hypoglyc|hyperglyc|blood sugar|blood pressure|heart rate|suicid|boxed|mortality|renal|kidney|liver|hepat|angioedema|cough|edema|sexual|mood|confus|tremor|insomnia|anxiety|palpitat|\bpain|allerg|skin|eye|vision|infection|fever|dose|dosing|monitor|toxicity|dependence|withdraw|brand|apply|clean|area|layer|amount|improv|days|wash|hands|store|keep|refrigerat|as needed|daily|weekly|twice|once|before|after|minutes|hours|meal|breakfast|first line|second line|alternative|preferred|not for|avoid use|same time|every day|everyday|adherence|absorption|dietary|diet|interaction|onset|effect|water|glass|crush|chew|swallow|hypersensitiv|hydrat|report any|\.\.\./i;
    const cnSim = (a, b) => { const A = sig(a), B = sig(b); if (!A.length || !B.length) return nz(a) === nz(b); const i = ovl(A, B).length; return i >= 2 || i / Math.min(A.length, B.length) >= 0.5; };
    ALLD.forEach(d => {
      const p3 = !!d.p3, p1 = !!d.p1, CAT = p1 ? 'TP1' : p3 ? 'TP3' : 'TOP', wk = wkOfN(d.w), r = rngOf('top' + d.id), label = p1 ? 'P1 · ' + wk.d + ' · ' + wk.topic : p3 ? 'P3 · ' + wk.d + ' · ' + wk.topic : 'Week ' + wk.n + (wk.t === 'PHAR 444' ? ' (spring)' : '') + ' · ' + wk.d;
      const mk = (type, diff, q, a, w, extra) => {
        if (!w) return;
        TOPQ.push({ wt: (type === 'brand' || type === 'gen') ? 'bg' : type, c: CAT, d: diff, q: q, a: a, w: w, e: ref(d), t: label, from: wk.from, wk: d.w, ref: d.id, rows: rowsOf(d), k: hash(CAT + '|' + d.id + '|' + type) });
      };
      const uniqB = brandList(d.b).slice().reverse().find(b0 => !ALLD.some(x => baseId(x) !== baseId(d) && brandList(x.b).some(y => nz(y) === nz(b0))));
      const brand = uniqB || '';
      if (brand && nz(brand) !== nz(d.g)) {
        mk('brand', 1, 'Which is a brand name for ' + d.g + '?', brand, wrongs(d, x => brandPick(x), r, (t) => nz(d.b).indexOf(nz(t)) >= 0, 'brand'));
        mk('gen', 1, brand + ' is the brand name of which drug?', d.g, wrongs(d, x => x.g, r, null, 'gen'));
      }
      if (!p1 && d.c) mk('class', 2, d.g + ' belongs to which drug class?', cut(d.c, 90), wrongs(d, x => cut(x.c, 90), r, null, 'class'));
      if (d.i && d.i.length) {
        const mine = words(d.i.join(' ')), first = cut(d.i[0], 100);
        mk('ind', 2, d.g + ' is indicated for:', first, wrongs(d, x => x.i && x.i.length ? cut(x.i[0], 100) : '', r, (t, x) => words(x.i.join(' ')).some(w => mine.indexOf(w) >= 0), 'ind'));
      }
      if (!p1 && String(d.p || '').replace(/\s+/g, ' ').trim().length >= 30) { const pr = cut(String(d.p).replace(/\s+/g, ' ').trim(), 150); mk('pearl', 2, 'Which is a clinical pearl for ' + d.g + '?', pr, wrongs(d, x => String(x.p || '').trim().length >= 30 ? cut(String(x.p).replace(/\s+/g, ' ').trim(), 150) : '', r, (t) => ovl(sig(t), sig(pr)).length >= 3 || t.toLowerCase().indexOf(String(d.g).toLowerCase().split(/[ ,\/]/)[0]) >= 0, null)); }
      if (!p1 && d.m && d.m.length >= 40 && !/^n\/a/i.test(d.m)) mk('moa', 3, 'Which statement describes the mechanism of action of ' + d.g + '?', firstSent(d.m, 170), wrongs(d, x => x.m && x.m.length >= 40 && !/^n\/a/i.test(x.m) ? firstSent(x.m, 170) : '', r, null, 'moa'));
      if (!p1 && d.cl && d.cl.length) {
        const pts = d.cl.slice(), total = Math.min(pts.length, 2 + Math.floor(r() * 3)), shown = shuf(pts, r).slice(0, Math.max(1, total));
        const nW = shown.length >= 3 ? 6 - shown.length : shown.length === 2 ? 3 : 3;
        const seen = {}; shown.forEach(p => { seen[nz(p)] = 1; });
        const bad = [];
        const addW = (t) => { const n = nz(t); if (!t || seen[n] || bad.length >= nW) return false; seen[n] = 1; bad.push(t); return true; };
        // contradictions of the points the player can see first, then of any other point (at most 2)
        let nFlip = 0;
        shown.concat(pts.filter(p => shown.indexOf(p) < 0)).forEach(p => { if (nFlip >= 2) return; const f = flipOf(p); if (f && !pts.some(o => o !== p && cnSim(f, o)) && addW(f)) nFlip++; });
        const own = nz(String(d.g).split(/[ ,\/(]/)[0]);
        const pool = shuf((byWeek[d.w] || []).filter(x => x !== d), r).concat(shuf(ALLD.filter(x => x !== d && x.w !== d.w && baseId(x) !== baseId(d)), r));
        pool.forEach(x => {
          if (bad.length >= nW) return;
          if (ovl(sig(x.i.join(' ')), sig(d.i.join(' '))).length || classClash(d, x)) return;
          shuf(x.cl || [], r).forEach(p => {
            if (bad.length >= nW) return; const t = p.length > 110 ? '' : p;
            if ((cpt[nz(p)] || 0) > 3 || t.length < 12 || GENPT.test(t) || nz(t).indexOf(own) >= 0 || pts.some(o => cnSim(t, o))) return;
            addW(t);
          });
        });
        if (bad.length >= 2 && (shown.length >= 2 || bad.length >= 3)) {
          const all = d.cl.join(' • ');
          TOPQ.push({ wt: 'cn', c: CAT, d: 3, ms: true, q: 'Select all that apply: which are counseling points for ' + d.g + '?', a: shown[0], as: shown, w: bad, e: 'Counseling points for ' + d.g + ': ' + all, t: label, from: wk.from, wk: d.w, ref: d.id, rows: [['Drug', d.g + (brandList(d.b).length ? ' (' + brandList(d.b).join(', ') + ')' : '')], ['Counseling points', all]], k: hash(CAT + '|' + d.id + '|cn') });
        }
      }
    });
  })();
  const curWeek = () => { const t = todayStr(); let n = 0; WEEKS.forEach(w => { if (w.from <= t) n = w.n; }); return n; };
  const curWeek3 = () => { const t = todayStr(); let n = 0; P3WEEKS.forEach(w => { if (w.from <= t) n = w.n; }); return n; };
  const curWeek1 = () => { const t = todayStr(); let n = 0; P1WEEKS.forEach(w => { if (w.from <= t) n = w.n; }); return n; };
  const isTop = (q) => q.c === 'TOP' || q.c === 'TP3' || q.c === 'TP1';
  const wkNow = (q) => q.c === 'TP1' ? curWeek1() : q.c === 'TP3' ? curWeek3() : curWeek();
  const wkAhead = (q) => q.c === 'TP1' ? !!S.set.ahead1 : q.c === 'TP3' ? !!S.set.ahead3 : !!S.set.ahead;
  function rebuildIndex() {
    BYKEY = {}; BANK.forEach(q => BYKEY[q.k] = q); TOPQ.forEach(q => { BYKEY[q.k] = q; });
    S.decks.forEach(d => d.items.forEach(q => { BYKEY[q.k] = q; }));
  }
  rebuildIndex();

  /* ---- helpers ---- */
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function money(n) {
    n = Math.floor(n);
    if (n < 10000) return '$' + n.toLocaleString('en-US');
    if (n < 1e6) return '$' + (n / 1e3).toFixed(1) + 'k';
    if (n < 1e9) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n < 1e12) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n < 1e15) return '$' + (n / 1e12).toFixed(2) + 'T';
    return '$' + (n / 1e15).toFixed(2) + 'Qa';
  }
  const franchiseMult = () => 1 + 0.25 * S.franchises + 0.5 * (S.retired || 0);
  const shopOwn = id => !!id && ((S.store || {}).own || []).indexOf(id) >= 0;
  const uniOf = () => SHOP_UNI.find(u => u[0] === (S.store || {}).uni);
  const uniBuff = () => { const u = uniOf(); return u && S.up.tech >= 1 ? u[5] : {}; };
  const techRate = () => 0.4 * (0.5 + S.rep / 100) * franchiseMult() * (1 + 0.25 * S.up.shelf) * (1 + 0.4 * S.up.train) * (1 + (uniBuff().tech || 0) + gearBuff().tech);
  const passive = () => S.up.tech * techRate();
  /* power-ups: consumables bought in the Shop (Power-ups). Counts live in S.pw. */
  const PW_MAX = 9;
  const PW = {
    hint: { name: 'Hint pill', emoji: '💊', base: 60, note: 'Removes two wrong answers on one question. Pays half.' },
    second: { name: 'Second chance', emoji: '🔁', base: 120, note: 'Arm it on a question. If your first pick is wrong, you get one more try. No streak or reputation loss, pays half, and it still counts as a miss for mastery.' },
    binder: { name: 'Reference binder', emoji: '📘', base: 90, note: 'Shows where this question comes from (week, topic and study source). Pays 15% less.' }
  };
  const pwCost = (k) => shopPx(Math.round(PW[k].base * franchiseMult()));
  const pwAdd = (k, n) => { S.pw[k] = Math.min(PW_MAX, (S.pw[k] || 0) + n); };
  const upTotal = () => Object.keys(S.up).reduce((a, k) => a + S.up[k], 0);
  const customCount = () => S.decks.reduce((a, d) => a + d.items.length, 0);
  const shopName = () => (S.shop && S.shop.trim()) || 'Corner Rx';
  function tierName() { const n = upTotal(); return n < 3 ? 'Corner shop' : n < 8 ? 'Neighborhood pharmacy' : n < 15 ? 'Community pharmacy' : n < 25 ? 'Hospital pharmacy' : 'Pharmacy campus'; }
  function rankInfo() {
    let i = 0; for (let k = 0; k < RANKS.length; k++) if (S.correct >= RANKS[k][0]) i = k;
    const next = RANKS[i + 1];
    return { name: RANKS[i][1], from: RANKS[i][0], to: next ? next[0] : null };
  }

  /* ---- avatar (HTML card) ---- */
  const JIM_LINES = ['Sorry, sorry, can I ask something quick? *mops forehead*', 'It is a little warm in here, right? Anyway, question...', 'I am not nervous. You are nervous. Okay, question:'];
  const JIM_BREAK = ['Hey, uh, is my prescription ready yet?', 'Is my prescription ready? I have been here forever.', 'Excuse me, quick thing, is my prescription done?'];
  const CALLER_LINES = ['I TRIED TO CALL and nobody picked up!', 'I called three times! Where is the manager?', 'Your phone just rang and rang. Unacceptable!'];
  function avatar(seed, mood, karen, sweaty, elder, him) {
    const url = World.ok && World.portrait ? World.portrait(seed, karen, sweaty, elder, him) : null;
    if (url) return '<img class="avatar lp ' + (karen ? 'k' : sweaty ? 's' : '') + ' ' + (mood || '') + '" src="' + url + '" alt="" width="64" height="64" aria-hidden="true">';
    const skins = ['#F2C9A5', '#E0A97E', '#C48A5E', '#8D5A3B', '#F6D7BD', '#6F4429'];
    const hairs = ['#2B1B12', '#6B3A1E', '#B5651D', '#D9B25A', '#A8A8A8', '#1E1E2E'];
    const shirts = ['#0E9A8E', '#F1A20E', '#E04F3A', '#5B7FD1', '#8A63C9', '#3E8E41'];
    const s = seed, skin = karen ? '#E8745F' : sweaty ? '#D4DAAE' : skins[s % 6], hair = elder ? '#E6E6EE' : karen ? '#E8C766' : sweaty ? '#2E2420' : hairs[(s >> 3) % 6], shirt = karen ? '#D9467A' : sweaty ? '#8A97A8' : shirts[(s >> 5) % 6], style = karen ? 3 : sweaty ? 4 : (s >> 7) % 3;
    const hairSvg = style === 4 ? `<path d="M18 28c0-10 6-15 14-15s14 5 14 15c-3-4-8-6-14-6s-11 2-14 6z" fill="${hair}"/><path d="M22 14l-2-7 6 5M32 11v-8l4 7M40 14l5-6-1 8" stroke="${hair}" stroke-width="3" fill="${hair}" stroke-linecap="round"/>`
      : style === 3 ? `<path d="M15 40c-3-18 6-28 17-28s20 10 17 28h-6c1-9-3-14-11-14s-12 5-11 14z" fill="${hair}"/>`
      : style === 0 ? `<path d="M17 30c0-12 7-18 15-18s15 6 15 18c-4-6-10-8-15-8s-11 2-15 8z" fill="${hair}"/>`
      : style === 1 ? `<path d="M16 32c-2-14 7-21 16-21s18 7 16 21c-3-7-8-11-16-11s-13 4-16 11z" fill="${hair}"/><circle cx="32" cy="9" r="5" fill="${hair}"/>`
      : `<path d="M20 24c3-8 8-10 12-10s9 2 12 10c-5-3-8-3-12-3s-7 0-12 3z" fill="${hair}"/>`;
    const face = sweaty ? (mood === 'ok' ? '<path d="M27 41q5 4 10 0" stroke="#3a1f12" stroke-width="2.2" fill="none" stroke-linecap="round"/>' : '<path d="M25 44q3-3 6 0t7 0" stroke="#3a1f12" stroke-width="2.2" fill="none" stroke-linecap="round"/>')
      : karen && mood !== 'ok'
      ? '<path d="M22 27l8 3M42 27l-8 3" stroke="#3a1f12" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="32" cy="42" rx="5" ry="3.4" fill="#3a1f12"/>'
      : mood === 'ok' ? '<path d="M26 40q6 7 12 0" stroke="#3a1f12" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
      : mood === 'bad' ? '<path d="M26 44q6-6 12 0" stroke="#3a1f12" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
      : '<path d="M27 41q5 3 10 0" stroke="#3a1f12" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    const steam = sweaty ? '<g fill="#8FD8FF"><path d="M46 20q3 5 0 8q-3-3 0-8z"/><path d="M14 26q2.5 4 0 7q-2.5-3 0-7z"/><path d="M50 36q2 4 0 6q-2-2 0-6z"/></g>' : karen && mood !== 'ok' ? '<g fill="#fff" opacity=".85"><circle cx="10" cy="14" r="3"/><circle cx="54" cy="12" r="3.5"/><circle cx="6" cy="24" r="2"/></g>' : '';
    return `<svg class="avatar" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="18" style="fill:${karen ? 'var(--coral-soft)' : sweaty ? 'var(--amber-soft)' : 'var(--surface2)'}"/>${steam}<path d="M8 64c2-12 12-17 24-17s22 5 24 17z" fill="${shirt}"/><circle cx="32" cy="32" r="15" fill="${skin}"/>${hairSvg}${sweaty ? '<circle cx="26" cy="33" r="4.2" fill="#fff"/><circle cx="38" cy="33" r="4.2" fill="#fff"/>' : ''}<circle cx="26" cy="33" r="2" fill="#2b1b12"/><circle cx="38" cy="33" r="2" fill="#2b1b12"/>${face}</svg>`;
  }

  /* ---- question selection ---- */
  let cur = null, lastKey = null, view = 'q', dirty = false, armed = null, armedDeck = null, sweatyOwed = false;
  const draft = { name: '', text: '', from: '' }, qz = { name: '', url: '', text: '', dir: 'td' };
  let studyMsg = '';

  const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  function eligible(q) {
    const st = S.set;
    if (st.mode === 'review') return !(q.from && q.from > todayStr()) && srDue(S.mastery[q.k]);
    if (q.c === 'TP1') { if (!p1On(q.wk)) return false; } else if (q.c === 'TP3') { if (!p3On(q.wk)) return false; } else if (q.c === 'TOP') { if (!p2On(q.wk)) return false; } else if (q.from && q.from > todayStr()) return false;
    if (isTop(q) && wkTypeOff(q)) return false;
    if (!st.topics[q.c] || st.diffs.indexOf(q.d) < 0) return false;
    if (st.mode === 'missed') return S.missed.indexOf(q.k) >= 0;
    if (st.mode === 'new') return !S.mastery[q.k];
    return true;
  }
  function poolQs() {
    const arr = [];
    BANK.forEach(q => { if (eligible(q)) arr.push(q); });
    TOPQ.forEach(q => { if (eligible(q)) arr.push(q); });
    S.decks.forEach(d => { if (d.enabled) d.items.forEach(q => { if (eligible(q)) arr.push(q); }); });
    return arr;
  }
  const WK_TYPES = [['bg', 'Brand / generic'], ['ind', 'Indications'], ['moa', 'Mechanism'], ['cn', 'Counseling (select all)'], ['class', 'Drug class']];
  /* P3 week picker: S.set.p3sel = { weekNumber: true } once the player has chosen. Before that, the old rules apply (open weeks, Study ahead, This week only, p3off). */
  /* Week pickers for the weekly drug lists. k is 'p2' (WEEKS) or 'p3' (P3WEEKS). Selection is saved in S.set[k + 'sel'] = { weekNumber: true } once the player has chosen.
     Before that, the old rules apply (started weeks, Study ahead, This week only, p3off) so older saves behave the same. */
  const WKCFG = {
    p2: { L: WEEKS, M: WK, cur: curWeek, only: 'wkOnly', ahead: 'ahead', topic: 'TOP' },
    p3: { L: P3WEEKS, M: WK3, cur: curWeek3, only: 'wkOnly3', ahead: 'ahead3', topic: 'TP3' },
    p1: { L: P1WEEKS, M: WK1, cur: curWeek1, only: 'wkOnly1', ahead: 'ahead1', topic: 'TP1', auto: true }
  };
  const wkOn = (k, n) => { const st = S.set, c = WKCFG[k], sel = st[k + 'sel']; if (sel) { const w0 = c.M[n]; if (c.auto && sel[n] === undefined && w0 && st[k + 'selAt'] && w0.from > st[k + 'selAt'] && w0.from <= todayStr()) return true; return !!sel[n]; } /* cumulative lists (P1): a week that starts after the player's last pick joins automatically */ if (st[c.only]) return n === c.cur(); const w = c.M[n]; return !!w && (w.from <= todayStr() || !!st[c.ahead]) && !(st[k + 'off'] && st[k + 'off'][n]); };
  const wkSel = (k) => { const o = {}; WKCFG[k].L.forEach(w => { if (wkOn(k, w.n)) o[w.n] = true; }); return o; };
  const wkOpenSel = (k) => { const o = {}, t = todayStr(); WKCFG[k].L.forEach(w => { if (w.from <= t) o[w.n] = true; }); return o; };
  const wkOnlyNow = (k) => { const c = WKCFG[k].cur(), ks = Object.keys(wkSel(k)); return !!c && ks.length === 1 && +ks[0] === c; };
  const p1On = (n) => wkOn('p1', n), p3On = (n) => wkOn('p3', n), p2On = (n) => wkOn('p2', n);
  /* a week counts as unlocked once it has started or the player picked it */
  const wk2Open = (w) => w.from <= todayStr() || p2On(w.n);
  function wkPick(k, v, a) {
    const st = S.set, c = WKCFG[k];
    if (a === 'toggle') { const o = wkSel(k); if (o[v]) delete o[v]; else { o[v] = true; st.topics[c.topic] = true; } st[k + 'sel'] = o; }
    else if (a === 'all') { const o = {}; c.L.forEach(w => { o[w.n] = true; }); st[k + 'sel'] = o; st.topics[c.topic] = true; }
    else if (a === 'none') st[k + 'sel'] = {};
    else if (a === 'sofar') { if (!c.cur()) { toast('No week has started yet. Tap a week below to preview it.'); return false; } st[k + 'sel'] = wkOpenSel(k); st.topics[c.topic] = true; }
    else if (a === 'only') {
      const cw = c.cur(); if (!cw) { toast('No week has started yet. Tap a week below to preview it.'); return false; }
      if (wkOnlyNow(k)) { st[k + 'sel'] = st[k + 'prev'] && Object.keys(st[k + 'prev']).length ? st[k + 'prev'] : wkOpenSel(k); st[k + 'prev'] = null; }
      else { st[k + 'prev'] = wkSel(k); st[k + 'sel'] = {}; st[k + 'sel'][cw] = true; st.topics[c.topic] = true; }
    } else if (a === 'course') { const o = wkSel(k), on = v.split('|')[1] === '1'; c.L.forEach(w => { if (w.t === v.split('|')[0]) { if (on) o[w.n] = true; else delete o[w.n]; } }); st[k + 'sel'] = o; if (on) st.topics[c.topic] = true; }
    st[c.only] = false; st[k + 'selAt'] = todayStr(); return true;
  }
  function wkSchedHTML(k, title) {
    const st = S.set, c = WKCFG[k], t = todayStr(), cw = c.cur(), n = c.L.filter(w => wkOn(k, w.n)).length;
    const row = (w) => { const on = wkOn(k, w.n), started = w.from <= t, cnt = w.ids ? w.ids.length : DRUGS.filter(d => d.w === w.n).length, lab = (w.t ? 'Wk ' + w.wk + ' · ' : '') + w.d;
      return `<li class="${w.n === cw ? 'now' : started || on ? '' : 'lock'}${on ? '' : ' off'}${shown(w) ? '' : ' upc'}"${shown(w) ? '' : ' hidden'} data-find="${esc(('week ' + w.wk + ' wk ' + w.wk + ' ' + (w.t || '') + ' ' + w.d + ' ' + w.topic + (w.n === cw ? ' this week now' : '')).toLowerCase())}"><button type="button" data-act="wkpick" data-v="${k}:${w.n}" aria-pressed="${on}" aria-label="${esc(lab)} ${esc(w.topic)}: ${on ? 'on' : 'off'}"><i class="p3box">${on ? '✓' : ''}</i><b>${esc(lab)}</b><span>${esc(w.topic)}</span><small>${on ? cnt + ' drugs' + (w.n === cw ? ' · this week' : started ? '' : ' · upcoming') : 'off'}</small></button></li>`; };
    const started = c.L.filter(w => w.from <= t), up = c.L.filter(w => w.from > t), foldUp = up.length > 3 && !st[k + 'up'];
    const shown = (w) => w.from <= t || !foldUp || wkOn(k, w.n);
    let body = '';
    const courses = [];
    c.L.forEach(w => { if (w.t && courses.indexOf(w.t) < 0) courses.push(w.t); });
    if (courses.length) courses.forEach(cr => {
      const ws = c.L.filter(w => w.t === cr), vis = ws.filter(shown); if (!vis.length) return; // upcoming rows are rendered hidden (class upc) so the find box can reach them
      const allOn = ws.every(w => wkOn(k, w.n));
      body += `<div class="crshd"><b>${esc(cr)}</b><span><button type="button" class="link" data-act="wkcourse" data-v="${k}:${esc(cr)}|1">All</button> &middot; <button type="button" class="link" data-act="wkcourse" data-v="${k}:${esc(cr)}|0">None</button></span></div><ol class="p3sched">${ws.map(row).join('')}</ol>`;
    });
    else body = `<ol class="p3sched">${c.L.map(row).join('')}</ol>`;
    const hidden = c.L.filter(w => !shown(w)).length;
    const more = up.length > 3 ? `<button type="button" class="link upmore" data-act="wkup" data-v="${k}">${st[k + 'up'] ? 'Hide' : 'Show'} upcoming weeks${hidden ? ' (' + hidden + ' more)' : ''}</button>` : '';
    return `<div class="grp"><div class="grphd"><button type="button" class="fold" data-act="wkfold" data-v="${k}" aria-expanded="${!st[k + 'fold']}"><i>${st[k + 'fold'] ? '▸' : '▾'}</i> ${title}</button><span class="grpr"><button type="button" class="chip sm" data-act="wkpick" data-v="${k}:only" aria-pressed="${wkOnlyNow(k)}">This week only</button>${c.auto ? `<button type="button" class="link" data-act="wkpick" data-v="${k}:sofar">So far</button> &middot; ` : ''}<button type="button" class="link" data-act="wkpick" data-v="${k}:all">All</button> &middot; <button type="button" class="link" data-act="wkpick" data-v="${k}:none">None</button></span></div>${st[k + 'fold'] ? `<p class="note wkfoldnote">${n} of ${c.L.length} weeks on. Tap ${title} to show the schedule.</p>` : ''}<div class="wkbody"${st[k + 'fold'] ? ' hidden' : ''}>${body + more}<p class="note">${k === 'p3' ? weekNote3() : weekNote()}</p></div><div class="chips" aria-label="Weekly question types">${WK_TYPES.map(x => `<button type="button" class="chip" data-act="wktype" data-v="${x[0]}" aria-pressed="${!(st.wkTypes && st.wkTypes[x[0]] === false)}">${x[1]}</button>`).join('')}</div></div>`;
  }
  const wkTypeOff = (q) => !!(S.set.wkTypes && S.set.wkTypes[q.wt] === false);
  const focusOn = () => !!S.set.focus;
  const labOn = () => !!S.lab;
  const LEARN_SEC = 300, learning = () => (S.playSec || 0) < LEARN_SEC; // the first five minutes: slower line, no surprise events
  const timerOn = () => S.set.timer && !S.set.focus && !labOn();
  const calcOn = () => S.set.topics.CALC && S.set.mode !== 'missed' && S.set.mode !== 'review';
  const retry = [];
  function chooseQ(karen) {
    let qs = poolQs();
    if (karen) { const hard = qs.filter(q => q.d >= 2); if (hard.length) qs = hard; }
    if (qs.length > 1) qs = qs.filter(q => q.k !== lastKey);
    // smart mix: a missed question comes back within a few cards until it sticks
    if (S.set.mode === 'mixed' && !karen) {
      const due = retry.filter(r => r.due <= S.served), hit = due.length && qs.find(q => q.k === due[0].k);
      if (hit) { retry.splice(retry.indexOf(due[0]), 1); return hit; }
    }
    const items = qs.map(q => {
      let w = 1;
      if (S.set.mode === 'mixed') { const m = S.mastery[q.k], box = m ? m.box : -1; w = box < 0 ? 4 : [10, 5, 0.8, 0.15][box]; if (m && m.cw) w *= 1.6; }
      if (isTop(q)) w *= q.wk === wkNow(q) ? 3 : q.from > todayStr() ? 1.5 : 0.7;
      return [q, w];
    });
    if (calcOn()) items.push([null, S.set.mode === 'mixed' ? 5 : S.set.mode === 'new' ? 2 : 3]);
    if (!items.length) return null;
    let r = Math.random() * items.reduce((a, b) => a + b[1], 0), chosen = items[items.length - 1][0];
    for (const it of items) { r -= it[1]; if (r <= 0) { chosen = it[0]; break; } }
    if (chosen) return chosen;
    for (let i = 0; i < 20; i++) { const c = genCalc(); if (S.set.diffs.indexOf(c.d) >= 0 && (!karen || c.d >= 2 || i > 12)) return c; }
    return null;
  }
  const KAREN_SEC = 25;
  function karenRoll() {
    if (focusOn() || learning() || labOn()) return false;
    if (S.karenCd > 0) { S.karenCd--; return false; }
    if (S.served < 6 || upTotal() < 2) return false;
    if (Math.random() < 0.25) { S.karenCd = 8; save(); return true; }
    return false;
  }
  /* the hard-of-hearing visitor: a greeting nobody can hear, then a bonus question that pays out a free upgrade */
  function elderRoll() {
    if (focusOn() || learning() || labOn()) return false;
    if (S.elderCd > 0) { S.elderCd--; return false; }
    if (S.served < 8) return false;
    if (Math.random() < 0.16) { S.elderCd = 10; save(); return true; }
    return false;
  }
  const ELDER_F = ['Mrs. Gable', 'Gladys', 'Miss Penny', 'Mrs. Whitfield'], ELDER_M = ['Mr. Albright', 'Harold', 'Mr. Lindqvist', 'Grandpa Walt'];
  const ELDER_ASK = ["I'm here to pick up my prescription.", "Hello, dear. I'm here to pick up my prescription.", "Good morning. I've come to pick up my prescription."];
  const ELDER_GREET = [['Yes, how can I help?', 'Who is the prescription for?'], ['Sure, what name is it under?', 'Of course, how can I help you?'], ['Welcome in. How can I help?', 'Who is the prescription for?']];
  function learnOff() { S.playSec = Math.max(S.playSec || 0, LEARN_SEC); save(); }
  function elderPick() {
    if (!cur || !cur.elder || cur.elderStage !== 0) return;
    cur.elderStage = 1; World.elderConfuse(true); SFX.play('huh'); renderPanel();
    setTimeout(() => { if (cur && cur.elder && cur.elderStage === 1) { cur.elderStage = 2; cur.t0 = Date.now(); cur.flavor = pick(['Oh, never mind, dear. Maybe you can help me with this instead.', 'Hmm? Oh, forget it. Tell me something, will you?', 'Nevermind that. My grandson says you know all about medicine:']); World.elderConfuse(false); renderPanel(); } }, 2300);
  }
  function elderHTML() {
    const stage = cur.elderStage, hear = stage === 1;
    const opts = ELDER_GREET[cur.seed % ELDER_GREET.length].map((t, i) => `<button type="button" class="opt" style="grid-row:${i + 1};grid-column:1" data-elder="${i}" ${hear ? 'disabled' : ''}><kbd>${i + 1}</kbd><span>${esc(t)}</span></button>`).join('');
    return `<article class="rx elder"><div class="rx-head"><span class="rx-sym" aria-hidden="true">&#8478;</span><div class="rx-meta"><b>${esc(cur.name.toUpperCase())} \u00B7 prescription pick-up</b><span>Say hello</span></div></div>
      <div class="rx-body"><div class="patient ${hear ? 'hear' : ''}">${avatar(cur.seed, 'idle', false, false, true)}${hear ? '<span class="cmarks" aria-hidden="true"><i>?</i><i>?</i><i>?!</i></span>' : ''}<div class="bubble"><em>${hear ? '*cups a hand to her ear*' : esc(cur.name)}</em><p>${hear ? 'WHAT?? I can’t hear you!' : esc(cur.ask)}</p></div></div>
      <div class="opts" role="group" aria-label="Greeting choices">${opts}</div>
      <div class="tools"><span class="keyhint">${hear ? 'She leans in closer...' : 'Pick a greeting.'}</span></div></div></article>`;
  }
  function elderGift() {
    const open = UPS.filter(u => S.up[u.id] < u.max);
    if (!open.length) { const bonus = Math.round(120 * franchiseMult()); S.cash += bonus; S.earned += bonus; return '<p class="gift"><b>' + esc(cur.name) + ' is delighted.</b> Everything is already maxed, so she tips ' + money(bonus) + '.</p>'; }
    const u = pick(open); S.up[u.id]++;
    save(); renderStats(); renderStore(); renderUpgrades(); renderFranchise();
    return '<p class="gift"><b>' + esc(cur.name) + ' tells all her friends about you.</b> Free upgrade: ' + esc(u.name || u.short) + ' is now level ' + S.up[u.id] + '.</p>';
  }
  function sweatyRoll() {
    if (focusOn() || learning() || labOn()) return false;
    if (S.sweatyCd > 0) { S.sweatyCd--; return false; }
    if (S.served < 3) return false;
    if (Math.random() < 0.22) { S.sweatyCd = 5; save(); return true; }
    return false;
  }
  function endInterrupt() {
    if (!cur || !cur.interrupt || cur.interrupt.dismissed) return;
    cur.interrupt.dismissed = true; World.interrupt(false);
  }
  function resumeTimers() {
    if (cur && cur.pausedAt) { const d = Date.now() - cur.pausedAt; cur.t0 += d; if (cur.interrupt) cur.interrupt.t0 += d; cur.pausedAt = 0; }
  }
  function newCard() {
    qExpand();
    endInterrupt();
    if (World.ok && World.synOn && World.synOn()) World.setSyn(false);
    if (labOn()) return labCard();
    let info;
    if (World.ok) info = World.nextCustomer();
    else {
      info = { seed: Math.floor(Math.random() * 100000), karen: karenRoll(), sweaty: false };
      if (phone.pending && !focusOn()) { phone.pending = false; info.karen = true; info.caller = true; }
      if (!info.karen) info.sweaty = sweatyRoll();
    }
    if (forceSp) { info.recall = forceSp.recall || null; info.regular = forceSp.regular || null; if (forceSp.seed) info.seed = forceSp.seed; info.body = forceSp.body || info.body; forceSp = null; }
    if (!World.ok && !info.karen && !info.sweaty && !info.recall && !info.regular && !info.evt) { const x = specialRoll(); if (x) { info.seed = x.seed; info.body = x.body; if (x.kind === 'recall') info.recall = x.k; else info.regular = x.n; } }
    if (!World.ok && !info.karen && !info.sweaty && !info.recall && !info.regular) info.elder = elderRoll();
    if (!info.karen && !info.sweaty && !info.elder && !info.evt && (forceEvt || !World.ok)) info.evt = eventRoll();
    const calm = focusOn(), karen = !!info.karen && !calm, sweaty = !!info.sweaty && !karen && !calm, elder = !!info.elder && !karen && !sweaty && !calm, evt = !karen && !sweaty && !elder && !calm && info.evt ? info.evt : null, sp = (!karen && !sweaty && !elder && !evt && !calm) ? spResolve(info, false) : null, q = evt ? evQuestion(evt) : (sp && sp.q) || (forceHim && !karen && !sweaty && !elder && !calm && himPick()) || chooseQ(karen);
    view = 'q';
    const himDev = forceHim; forceHim = false;
    if (!q) { cur = { empty: true, seed: info.seed, karen: false }; renderPanel(); return; }
    const himWalk = q.c === 'HIM' && !evt && !karen && !sweaty && !elder && !calm && World.ok && !!World.himArrive && (!S.himDone || himDev);
    const opts = q.place ? [{ t: q.a, ok: true }, { t: 'At least one blank was empty or wrong', ok: false }] : q.draw ? [{ t: q.a, ok: true }, { t: 'Your line did not match the real curve closely enough', ok: false }] : q.ms ? shuffle(q.as.map(t => ({ t, ok: true })).concat(q.w.map(t => ({ t, ok: false })))) : shuffle([q.a, ...q.w].map((t, i) => ({ t, ok: i === 0 })));
    cur = { q, sel: {}, wasMissed: S.missed.indexOf(q.k) >= 0, opts, t0: Date.now(), done: false, hint: false, karen, sweaty, elder, elderStage: elder ? 0 : 2, ask: pick(ELDER_ASK), caller: !!info.caller && !calm, name: karen ? 'Karen' : sweaty ? 'Jittery Jim' : elder ? pick(info.seed % 2 === 0 ? ELDER_F : ELDER_M) : evt && EV_NAME[evt] ? pick(EV_NAME[evt]) : pick(NAMES), flavor: info.caller ? pick(CALLER_LINES) : evt ? pick(EV_FLAVOR[evt]) : karen ? pick(KAREN_LINES) : sweaty ? pick(JIM_LINES) : pick(FLAVOR[q.c] || FLAVOR.MY), seed: info.seed, num: S.served + 1, picked: -1, ok: false, resHTML: '', interrupt: null, evt: evt, insp: evt === 'inspector' ? { n: 1, of: 3, ok: 0, used: [q.k] } : null, review: reviewDue(S.mastery[q.k]), body: info.body || 'normal' };
    if (info.recall) delete spOut['r' + info.recall]; if (info.regular) delete spOut['g' + info.regular];
    if (sp) spApply(sp);
    if (q.c === 'HIM') { cur.name = 'Andy'; if (himWalk) World.himArrive(); }
    if (evt === 'inspector') SFX.play('siren'); else if (evt === 'driver') SFX.play('thud'); else if (S.served > 0) SFX.play('bell');
    if (sweatyOwed && calm) sweatyOwed = false;
    if (sweatyOwed) { sweatyOwed = false; cur.interrupt = { t0: Date.now(), dur: 7000, a: Math.floor(Math.random() * 3), dismissed: false, line: pick(JIM_BREAK) }; World.interrupt(true); }
    renderPanel();
  }

  /* ---- answering ---- */
  function karenTakes() {
    const owned = UPS.filter(u => S.up[u.id] > 0);
    if (!owned.length) return { none: true };
    if (Math.random() < Math.min(0.6, 0.1 * S.up.counsel)) return { saved: true };
    let r = Math.random() * owned.reduce((a, u) => a + S.up[u.id], 0), u = owned[0];
    for (const x of owned) { r -= S.up[x.id]; if (r <= 0) { u = x; break; } }
    const from = S.up[u.id]; S.up[u.id]--;
    World.karenLoss(u.id);
    return { lost: u, from, to: from - 1 };
  }
  const confNeeded = () => S.set.conf !== false && srOn() && cur && cur.q && !askedToday(cur.q.k) && cur && cur.q && !cur.q.gen && !cur.q.draw && !cur.q.place && !cur.q.meta && !cur.karen && !cur.sweaty && !cur.elder && !cur.lab && !cur.caller && !cur.evt && !cur.visit;
  function answer(idx, conf) {
    if (!cur || cur.empty || cur.done || view !== 'q') return;
    if (cur.elder && cur.elderStage < 2) { if (idx >= 0 && idx < 2 && cur.elderStage === 0) elderPick(); return; }
    const q = cur.q; let o = cur.opts[idx], msOk = null;
    if (q.meta && idx >= 0 && !cur.site && !cur.done) { toast('Tap the site on the structure first.'); return; }
    if (conf === undefined && confNeeded()) {
      const okPick = idx === -2 ? Object.keys(cur.sel).length > 0 : !!(o && !o.gone && !isBlocked(idx));
      if (okPick) { cur.pend = idx; cur.tPick = cur.tPick || Date.now(); renderPanel(); const f = document.querySelector('.confbtn[data-conf="sure"]'); if (f) f.focus({ preventScroll: true }); }
      return;
    }
    if (q.ms && idx === -2) {
      const chosen = cur.opts.map((x, i) => i).filter(i => cur.sel[i]);
      if (!chosen.length) return;
      msOk = cur.opts.every((x, i) => !!cur.sel[i] === x.ok);
      const w = cur.opts.findIndex((x, i) => cur.sel[i] && !x.ok);
      idx = w >= 0 ? w : chosen[0]; o = cur.opts[idx];
    } else if (idx >= 0 && (!o || o.gone || isBlocked(idx))) return;
    else if (q.ms && idx >= 0) return;
    endInterrupt();
    if (cur.secArmed && !cur.secUsed && idx >= 0 && S.pw.second > 0 && !(msOk !== null ? msOk : o.ok)) {
      cur.secUsed = true; cur.secArmed = false; cur.pend = undefined; cur.tPick = 0; S.pw.second--;
      if (q.ms) cur.sel = {}; else o.gone = true;
      SFX.play('bad'); toast('Second chance used. Try again.'); save(); renderPanel(); return;
    }
    const siteOk = !q.meta || (idx >= 0 && [].concat(q.meta.site).indexOf(cur.site) >= 0), ok = (msOk !== null ? msOk : idx >= 0 && o.ok) && siteOk, elapsed = ((cur.tPick || Date.now()) - cur.t0) / 1000, karen = cur.karen, sweaty = cur.sweaty;
    cur.done = true; cur.picked = idx; cur.ok = ok; S.served++;
    const unseen = !q.gen && !(S.mastery[q.k] && S.mastery[q.k].seen);
    let pay = 0; const chips = []; let head = '', extra = '';
    if (ok) {
      S.streak++; S.best = Math.max(S.best, S.streak); S.correct++; holCorrect(); boardPushSoon();
      const base = 10 * [1, 1.6, 2.4][q.d - 1];
      const shelf = 1 + 0.25 * S.up.shelf;
      const speed = timerOn() ? 1 + 0.5 * Math.max(0, 1 - elapsed / (20 + gearBuff().time)) : 1;
      const bz = buffOn() ? 3 : 1, streakN = Math.min(S.streak * bz, (5 + 3 * S.up.counsel + gearBuff().streak) * bz), streak = 1 + 0.05 * streakN;
      const lucky = Math.random() < 0.06 * S.up.robot, fr = franchiseMult();
      pay = Math.max(1, Math.round(base * shelf * speed * streak * fr * buffPay() * (lucky ? 2 : 1) * (cur.hint ? 0.5 : 1) * (cur.secUsed ? 0.5 : 1) * (cur.binder ? 0.85 : 1) * (cur.recall ? 1.5 : 1) * (cur.regular ? 1.25 : 1) * (karen ? 2 : 1) * (sweaty ? 1.5 : 1) * (rush.on ? 1.5 : 1) * (cur.lab ? 1.5 : 1)));
      chips.push(`<span class="big">+${money(pay)}</span>`, `<span>base $${base.toFixed(0)}</span>`);
      if (blessOn()) chips.push('<span>Andy’s blessing x' + BLESS_MULT.toFixed(2) + '</span>');
      if (S.up.shelf) chips.push(`<span>shelves x${shelf.toFixed(2)}</span>`);
      if (timerOn()) chips.push(`<span>speed x${speed.toFixed(2)}</span>`);
      if (streakN > 0) chips.push(`<span>streak x${streak.toFixed(2)} (${S.streak} in a row)</span>`);
      if (S.franchises) chips.push(`<span>locations x${fr.toFixed(2)}</span>`);
      if (rush.on) chips.push('<span>rush hour x1.50</span>');
      if (cur.lab) chips.push('<span>compounding bench x1.50</span>');
      if (lucky) chips.push('<span>robot: double fill</span>');
      if (cur.hint) chips.push('<span>hint pill x0.5</span>');
      if (cur.secUsed) chips.push('<span>second chance x0.5</span>');
      if (cur.binder) chips.push('<span>binder x0.85</span>');
      if (cur.recall) chips.push('<span>recall bonus x1.50</span>');
      if (cur.regular) chips.push('<span>regular x1.25</span>');
      if (karen) chips.push('<span>Karen calmed x2</span>');
      if (sweaty) chips.push('<span>Jim relieved x1.5</span>');
      S.cash += pay; S.earned += pay; S.rep = Math.min(100, S.rep + (karen ? 5 : sweaty ? 3 : 2) + gearBuff().rep);
      if (q.gen) S.calcOK++;
      if (cur.lab) { S.labOK = (S.labOK || 0) + 1; }
      if (karen) S.karenWin++;
      if (sweaty) S.jimWin++;
      extra += streakGift(pay); SFX.play('ok'); SFX.play('coin');
      head = karen ? 'Karen is satisfied. Big tip!' : sweaty ? 'Jim mops his brow. Thank you!' : pick(['Order filled!', 'Correct!', 'Nice catch!', 'Spot on!']);
    } else {
      const kept = buffKeep(); if (!kept) S.streak = 0; S.wrong++; S.rep = Math.max(0, S.rep - (karen ? 10 : 6)); SFX.play('bad');
      chips.push(`<span>reputation -${karen ? 10 : 6}</span>`, kept ? '<span>tablet buff kept your streak</span>' : '<span>streak reset</span>');
      if (idx < 0) chips.push("<span>time ran out</span>");
      if (!q.gen) chips.push('<span>queued for review</span>');
      head = karen ? 'Karen demands a refund!' : sweaty ? 'Jim sweats even harder.' : (idx < 0 ? 'Out of time.' : 'Not quite.');
      if (sweaty) { S.jimLoss++; sweatyOwed = true; chips.push('<span>Jim will be back</span>'); extra = '<p class="karen-loss"><b>Jim is not leaving.</b> He will interrupt the next patient to ask about his prescription.</p>'; }
      if (karen) {
        S.karenLoss++;
        const r = karenTakes();
        if (r.lost) extra = `<p class="karen-loss"><b>Karen took a refund:</b> ${esc(r.lost.name)} dropped from level ${r.from} to ${r.to}.</p>`;
        else if (r.saved) extra = '<p class="karen-loss"><b>Your Counseling Room talked her down.</b> No upgrade lost this time.</p>';
        else extra = '<p class="karen-loss">Karen stormed out. You had nothing she could take.</p>';
      }
    }
    if (cur.evt) { if (cur.insp) { cur.insp.ok += ok ? 1 : 0; if (cur.insp.n >= cur.insp.of) extra += inspVerdict(); } else extra += evAfter(ok); }
    if (cur.elder) extra += ok ? elderGift() : '<p class="gift sad">She pats your hand anyway and shuffles off. No upgrade this time.</p>';
    if (!q.gen) {
      const m = srSeed(S.mastery[q.k] || { box: 0, seen: 0, ok: 0 });
      const mok = ok && !cur.secUsed;
      const wasDue = reviewDue(m);
      m.seen++;
      const wasNew = m.seen === 1;
      const cf = cur.secUsed ? 'sure' : conf;
      let inc = wasNew ? 2 : 1;
      if (cf === 'guess') { m.gr = (m.gr || 0) + 1; if (m.gr >= 2) m.gr = 0; else inc = wasNew ? 1 : 0; } else m.gr = 0;
      if (mok) { m.ok++; m.lapse = 0; m.box = Math.min(3, m.box + inc); } else slip(m);
      if (srOn()) srUpdate(m, mok, cf);
      if (mok && wasDue) chips.push('<span>memory check passed</span>');
      if (mok && m.box >= 2 && srOn()) chips.push('<span>next review in ' + fmtDays(m.d) + '</span>');
      if (srOn() && cf === 'certain' && !mok) chips.push('<span>you were certain, so this returns first</span>');
      else if (srOn() && cf === 'guess' && mok) chips.push('<span>lucky guess? it will be back soon</span>');
      if (S.set.mode === 'mixed') {
        const ri = retry.findIndex(r => r.k === q.k); if (ri >= 0) retry.splice(ri, 1);
        if (!mok) retry.push({ k: q.k, due: S.served + 3 });
        else if (m.box === 1) retry.push({ k: q.k, due: S.served + 6 });
      }
      S.mastery[q.k] = m;
      if (mok && q.c === 'HIM' && !S.himDone && himAllMastered()) himPending = true;
      const i = S.missed.indexOf(q.k);
      if (!mok && i < 0) S.missed.push(q.k);
      if (mok && m.box >= 2 && i >= 0) S.missed.splice(i, 1);
      lastKey = q.k;
    } else lastKey = null;
    if (!ok || cur.secUsed) recallAdd(q);
    recallDone(ok && !cur.secUsed); regularDone(ok && !cur.secUsed); checkRegulars();
    dailyTick({ ok: ok && !cur.secUsed, q: q, unseen: unseen, recall: !!cur.recall, regular: !!cur.regular });
    shiftNote(q, ok, pay, ok || idx < 0 ? '' : q.ms ? cur.opts.filter((x, i) => cur.sel[i]).map(x => x.t).join(' · ') : o.t);
    save();
    checkAwards();
    if (cur.lab) { S.labN = (S.labN || 0) + 1; save(); } else if (cur.visit) { if (cur.hero) World.himReact(ok); else World.visitorReact(ok); } else World.react(ok, pay);
    if (q.meta) { const ms = MOLS[q.meta.mol]().sites, want = [].concat(q.meta.site)[0]; if (!siteOk) extra += '<p class="why"><b>Site:</b> ' + (cur.site && ms[cur.site] ? 'You tapped the ' + esc(ms[cur.site].t) + '. ' : '') + 'The change happens at the ' + esc(ms[want].t) + ' (shown in green).</p>'; }
    if (q.place && !ok) extra += '<p class="why"><b>Correct blanks:</b> ' + esc(placeSlots(q).map(s => s.a).join(' \u2192 ')) + '</p>';
    if (q.draw && cur.dscore) extra += '<p class="why"><b>Your drawing:</b> ' + esc(cur.dscore.reason) + '</p>';
    const correctText = q.ms ? cur.opts.filter(o2 => o2.ok).map(o2 => o2.t).join(' · ') : cur.opts.find(o2 => o2.ok).t;
    cur.resHTML = `<div class="result ${ok ? 'good' : 'fail'}" id="result"><h3>${esc(head)}</h3>
      ${ok ? '' : q.ms ? msMiss() : `<p><b>Answer:</b> ${esc(correctText)}</p>`}${!ok && idx >= 0 && !q.ms && whyNot(o.t) ? '<p class="whynot"><b>Why not \u201C' + esc(o.t) + '\u201D?</b> ' + whyNot(o.t) + '</p>' : ''}${extra}
      <div class="pay">${chips.join('')}</div>${explHTML(q)}
      <div><button class="btn go" id="nextbtn" type="button">${cur.lab ? 'Next order' : 'Next patient'}</button> <!--FLAG--></div></div>`; cur.flagPick = q.ms ? cur.opts.filter((x, i) => cur.sel[i]).map(x => x.t).join(' | ') : (o ? o.t : '');
    renderPanel(); renderStats(); renderStore(); renderUpgrades(); renderMastery(); renderReview(); renderFranchise();
    if (ok) { const b = document.querySelector('.opt[data-i="' + idx + '"]'); if (b) pop(b, '+' + money(pay)); }
    const nb = $('#nextbtn'); if (nb) { nb.focus({ preventScroll: true }); nb.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    if (himPending) { himPending = false; himFarewell(false); }
  }
  const FLAG_REPO = 'Jadenrburns/CornerRxGame';
  function flagURL(q, picked) {
    const clip = (t, n) => { t = String(t == null ? '' : t); return t.length > n ? t.slice(0, n - 1) + '\u2026' : t; };
    const ans = q.ms ? (q.as || []).join(' | ') : q.a;
    const title = 'Question feedback: ' + clip(q.q, 80);
    const body = ['**Question**', clip(q.q, 500), '', '**Marked correct**', clip(ans, 300), '', '**Player picked**', clip(picked || '(none)', 300), '',
      '**Category**: ' + (q.c || '') + (q.t ? ' / ' + q.t : '') + (q.wk ? ' (week ' + q.wk + ')' : ''), '**Game version**: ' + GAME_VERSION, '', '**What is wrong or unclear?**', '', ''].join('\n');
    return 'https://github.com/' + FLAG_REPO + '/issues/new?labels=' + encodeURIComponent('question-feedback') + '&title=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(body);
  }
  const FLAG_REASONS = [['wrong', 'The marked answer is wrong'], ['two', 'More than one answer is correct'], ['unclear', 'The wording is unclear'], ['typo', 'Typo or formatting'], ['outdated', 'Outdated or not in our lecture'], ['other', 'Something else']];
  function flagLink(q, picked) {
    const done = (S.flagged || []).indexOf(q.k) >= 0; cur.flagPicked = picked || '';
    if (!Net.on()) return '<a class="flaglink" data-flagk="' + esc(q.k || '') + '" href="' + esc(flagURL(q, picked)) + '" target="_blank" rel="noopener noreferrer">' + (done ? 'Flagged ✓ (open again)' : 'Flag this question') + '</a>';
    if (cur.flagSent) return '<span class="flagdone">Flagged ✓ Thanks, it goes straight to the question list.</span>';
    return `<button type="button" class="link flaglink" data-act="flag-open" aria-expanded="${!!cur.flagOpen}">${done ? 'Flagged before. Flag again' : 'Flag this question'}</button>` + (cur.flagOpen ? `<form class="flagform" data-act="flag-send"><b>What is wrong with it?</b>${FLAG_REASONS.map((r, i) => `<label><input type="radio" name="freason" value="${r[0]}"${i === 0 ? ' checked' : ''}> ${r[1]}</label>`).join('')}<textarea name="fnote" maxlength="600" rows="3" placeholder="What would you change? (optional)"></textarea><div class="btnrow"><button type="submit" class="btn go">Send flag</button><button type="button" class="btn" data-act="flag-open">Cancel</button></div><small class="note">No account needed. Your nickname goes with it if you set one on the Leaderboard.</small></form>` : '');
  }
  document.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('a.flaglink'); if (!a) return; const k = a.dataset.flagk; if (k) { S.flagged = S.flagged || []; if (S.flagged.indexOf(k) < 0) { S.flagged.push(k); save(); } a.textContent = 'Flagged ✓ (open again)'; } });
  document.addEventListener('submit', (e) => {
    const f = e.target.closest && e.target.closest('form.flagform'); if (!f) return; e.preventDefault();
    const q = cur && cur.q; if (!q) return; const reason = (f.querySelector('input[name=freason]:checked') || {}).value || 'other', note = (f.querySelector('textarea[name=fnote]').value || '').trim().slice(0, 600);
    const row = { qk: q.k || '', cat: q.c || '', topic: (q.t || '') + (q.wk ? ' (week ' + q.wk + ')' : ''), q: String(q.q || '').slice(0, 800), a: String(q.ms ? (q.as || []).join(' | ') : q.a || '').slice(0, 400), picked: String(cur.flagPicked || '').slice(0, 400), reason, note, pid: playerId(), nick: S.nick || '', v: GAME_VERSION };
    const btn = f.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Sending…';
    Net.rpc('submit_flag', { p: row }).then(ok => { if (!ok) throw new Error('too many flags, try later'); S.flagged = S.flagged || []; if (S.flagged.indexOf(q.k) < 0) S.flagged.push(q.k); cur.flagSent = true; cur.flagOpen = false; save(); toast('Flag sent. Thank you.'); renderPanel(); })
      .catch(err => { btn.disabled = false; btn.textContent = 'Send flag'; toast('Could not send the flag (' + (err.message || 'offline') + '). Try again in a moment.'); });
  });
  const playerId = () => { if (!S.pid) { S.pid = Net.uuid(); save(); } return S.pid; };
  const playerTok = () => { if (!S.tok) { S.tok = Net.uuid() + Net.uuid(); save(); } return S.tok; };
  /* ---- leaderboard (opt in, nickname only) ---- */
  let boardRows = null, boardErr = '', boardT = null, pushT = null, boardBusy = false;
  function boardPush() {
    if (!Net.on() || !S.boardOn || !S.nick) return Promise.resolve();
    return Net.rpc('push_score', { p_pid: playerId(), p_tok: playerTok(), p_name: S.nick, p_earned: Math.round(S.earned || 0), p_v: GAME_VERSION }).catch(() => { /* quiet */ });
  }
  function boardPushSoon() { if (!Net.on() || !S.boardOn) return; clearTimeout(pushT); pushT = setTimeout(boardPush, 45000); }
  function boardLoad() {
    if (!Net.on() || boardBusy) return; boardBusy = true;
    Net.rpc('get_board', {}).then(rows => { boardRows = rows || []; boardErr = ''; }).catch(err => { boardErr = err.message || 'offline'; }).finally(() => { boardBusy = false; if (view === 'board') renderPanel(); });
  }
  function boardHTML() {
    const me = playerId();
    const nameBox = `<div class="grp"><b>Your nickname</b><div class="namerow"><input id="nickbox" class="field" type="text" maxlength="24" autocomplete="off" placeholder="e.g. RxRanger" value="${esc(S.nick || '')}" aria-label="Nickname"><button type="button" class="btn go" data-act="board-join">${S.boardOn ? 'Update' : 'Join the board'}</button>${S.boardOn ? '<button type="button" class="btn" data-act="board-leave">Leave</button>' : ''}</div><p class="note">${S.boardOn ? 'You are on the board as ' + esc(S.nick) + '. Only your nickname and your total money made are shared.' : 'Opt in with a nickname. No account, no email. You can leave any time.'}</p></div>`;
    if (!Net.on()) return `<div class="pane"><h3>Leaderboard</h3><p class="sub">Not connected yet.</p><p class="note">The online leaderboard switches on once the game has a database configured (see net.js). Until then your progress stays in this browser.</p><div class="btnrow"><button type="button" class="btn go" data-act="back">Back to counter</button></div></div>`;
    const rows = boardRows, sorted = rows ? rows.slice().sort((a, b) => b.earned - a.earned) : null;
    const tbl = !rows ? '<p class="note">Loading…</p>' : !rows.length ? '<p class="note">Nobody is on the board yet. Be the first.</p>' : `<div class="boardwrap"><table class="board"><thead><tr><th>#</th><th>Pharmacist</th><th class="num">Money made</th></tr></thead><tbody>${sorted.map((r, i) => `<tr${r.pid === me ? ' class="me"' : ''}><td>${i + 1}</td><td title="${esc(r.name)}">${esc(r.name)}</td><td class="num">${money(r.earned)}</td></tr>`).join('')}</tbody></table></div>`;
    return `<div class="pane boardpane"><h3>Leaderboard</h3><p class="sub">Ranked by total money made, all time. Spending it or retiring never lowers your total. Refreshes every 30 seconds.</p>${nameBox}${boardErr ? '<p class="note">Could not reach the board: ' + esc(boardErr) + '</p>' : ''}${tbl}<div class="btnrow"><button type="button" class="btn go" data-act="back">Back to counter</button><button type="button" class="btn" data-act="board-refresh">Refresh</button></div></div>`;
  }
  /* ---- flags page: live list for the question author (?flags=1 or the dev menu) ---- */
  let flagRows = null, flagErr = '', flagT = null, flagSeen = 0, flagShowDone = false, flagBusy = false;
  const adminKey = () => { try { return localStorage.getItem('rx.adminKey') || ''; } catch (e) { return ''; } };
  function flagsLoad(quiet) {
    if (!Net.on() || flagBusy) return; flagBusy = true;
    if (!adminKey()) { flagBusy = false; flagErr = 'Save your admin key below to load the flag list.'; if (view === 'flags') renderPanel(); return; }
    Net.rpc('admin_flags', { k: adminKey() }).then(rows => {
      rows = rows || []; const maxId = rows.reduce((m, r) => Math.max(m, r.id), 0);
      if (flagRows && maxId > flagSeen && quiet) { const n = rows.filter(r => r.id > flagSeen).length; toast(n + ' new flag' + (n === 1 ? '' : 's') + ' just came in.'); SFX.play('ok'); }
      flagRows = rows; flagErr = ''; if (!quiet || !flagSeen) flagSeen = maxId; flagNewMax = maxId;
    }).catch(err => { flagErr = err.message || 'offline'; }).finally(() => { flagBusy = false; if (view === 'flags') renderPanel(); });
  }
  let flagNewMax = 0;
  function flagsHTML() {
    if (!Net.on()) return `<div class="pane"><h3>Question flags</h3><p class="note">Not connected: fill in RX_NET in net.js first.</p><div class="btnrow"><button type="button" class="btn go" data-act="back">Back</button></div></div>`;
    const rows = (flagRows || []).filter(r => flagShowDone || !r.resolved), open = (flagRows || []).filter(r => !r.resolved).length;
    const when = (t) => { const d = new Date(t), m = Math.round((Date.now() - d) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : d.toLocaleDateString(); };
    const reasonN = (r) => (FLAG_REASONS.find(x => x[0] === r) || ['', r])[1];
    const list = !flagRows ? '<p class="note">Loading…</p>' : !rows.length ? '<p class="note">' + (flagShowDone ? 'No flags yet.' : 'No open flags. Nice.') + '</p>' : rows.map(r => {
      const issue = flagURL({ q: r.q, a: r.a, c: r.cat, t: r.topic, k: r.qk }, r.picked);
      return `<article class="flagcard${r.resolved ? ' done' : ''}${r.id > flagSeen ? ' new' : ''}"><header><b>${esc(reasonN(r.reason))}</b><span>${esc(r.cat || '')}${r.topic ? ' · ' + esc(r.topic) : ''} · v${r.v || '?'} · ${when(r.created_at)}${r.nick ? ' · ' + esc(r.nick) : ''}</span></header><p class="fq">${esc(r.q || '')}</p><p><b>Marked:</b> ${esc(r.a || '')}${r.picked ? ' <b>Picked:</b> ' + esc(r.picked) : ''}</p>${r.note ? '<p class="fnote">“' + esc(r.note) + '”</p>' : ''}<div class="btnrow"><button type="button" class="btn${r.resolved ? '' : ' go'}" data-act="flag-resolve" data-v="${r.id}" data-done="${r.resolved ? '0' : '1'}">${r.resolved ? 'Reopen' : 'Resolve'}</button><a class="btn" href="${esc(issue)}" target="_blank" rel="noopener noreferrer">Open as GitHub issue</a></div></article>`;
    }).join('');
    return `<div class="pane flagspane"><h3>Question flags <small>${open} open</small></h3><p class="sub">Live: checks for new flags every 8 seconds while this page is open.</p>
      <div class="grp"><b>Admin key</b><div class="namerow"><input id="adminkey" class="field" type="password" autocomplete="off" placeholder="the key you put in the admin table" value="${esc(adminKey())}" aria-label="Admin key"><button type="button" class="btn" data-act="flag-key">Save key</button></div><p class="note">Needed only to resolve or reopen flags. Stored in this browser.</p></div>
      <div class="btnrow"><button type="button" class="chip" data-act="flag-showdone" aria-pressed="${flagShowDone}">Show resolved</button><button type="button" class="btn" data-act="flag-refresh">Refresh now</button></div>
      ${flagErr ? '<p class="note">Could not load flags: ' + esc(flagErr) + '</p>' : ''}<div class="flaglist">${list}</div>
      <div class="btnrow"><button type="button" class="btn go" data-act="back">Back to counter</button></div></div>`;
  }
  function viewTimers() {
    clearInterval(boardT); clearInterval(flagT); boardT = flagT = null;
    if (view === 'board' && Net.on()) { boardLoad(); boardT = setInterval(boardLoad, 30000); }
    if (view === 'flags' && Net.on()) { flagsLoad(false); flagT = setInterval(() => flagsLoad(true), 8000); }
  }
  function pop(btn, text) {
    const rx = $('.rx'); if (!rx) return;
    const a = btn.getBoundingClientRect(), b = rx.getBoundingClientRect();
    const el = document.createElement('div'); el.className = 'pop'; el.textContent = text;
    el.style.left = Math.max(10, Math.min(b.width - 90, a.left - b.left + a.width / 2 - 30)) + 'px';
    el.style.top = (a.top - b.top) + 'px';
    rx.appendChild(el); setTimeout(() => el.remove(), 1000);
  }
  function msToggle(i) {
    if (!cur || cur.empty || cur.done || view !== 'q' || !cur.q.ms) return;
    const o = cur.opts[i]; if (!o || o.gone || isBlocked(i)) return;
    if (cur.sel[i]) delete cur.sel[i]; else cur.sel[i] = true;
    cur.pend = undefined;
    renderPanel(); const b = document.querySelector('.opt[data-i="' + i + '"]'); if (b) b.focus({ preventScroll: true });
  }
  function msMiss() {
    const missed = cur.opts.filter((x, i) => x.ok && !cur.sel[i]).map(x => x.t), wrong = cur.opts.filter((x, i) => !x.ok && cur.sel[i]).map(x => x.t);
    return '<p><b>Correct choices:</b> ' + esc(cur.opts.filter(x => x.ok).map(x => x.t).join(' \u00B7 ')) + '</p>' + (wrong.length ? '<p class="whynot"><b>Not true for ' + esc(cur.q.rows ? cur.q.rows[0][1].split(' (')[0] : 'this drug') + ':</b> ' + esc(wrong.join(' \u00B7 ')) + '</p>' : '') + (missed.length ? '<p class="whynot"><b>You missed:</b> ' + esc(missed.join(' \u00B7 ')) + '</p>' : '');
  }
  function useHint() {
    if (!cur || cur.empty || cur.done || cur.hint || S.pw.hint < 1) return;
    cur.hint = true; S.pw.hint--;
    const wr = cur.opts.filter(o => !o.ok && !o.gone); shuffle(wr).slice(0, cur.q.ms ? Math.min(2, wr.length - 1) : Math.min(2, wr.length)).forEach(o => { o.gone = true; delete cur.sel[cur.opts.indexOf(o)]; });
    save(); renderPanel();
  }
  function useSecond() {
    if (!cur || cur.empty || cur.done || cur.secUsed || (!cur.secArmed && S.pw.second < 1)) return;
    cur.secArmed = !cur.secArmed; renderPanel();
  }
  function useBinder() {
    if (!cur || cur.empty || cur.done || cur.binder || S.pw.binder < 1) return;
    cur.binder = true; S.pw.binder--; save(); renderPanel();
  }
  /* where a question comes from, for the reference binder */
  function binderNote(q) {
    const cat = (CATS.find(c => c[0] === q.c) || [0, q.c || 'Question'])[1], parts = [cat];
    const w = q.wk ? wkOfN(q.wk) : null;
    if (w) parts.push((w.t ? w.t + ' wk ' + w.wk + ' \u00B7 ' : '') + w.d + ' \u00B7 ' + w.topic);
    else if (q.t) parts.push(q.t);
    if (q.gen) return 'Calculation: set up the units first, then solve.';
    return esc(parts.join(' \u00B7 ')) + (q.s ? '<br><b>Study source:</b> ' + esc(q.s) : '<br><small>No slide reference saved for this question yet.</small>');
  }

  /* ---- panel rendering ---- */
  function summary() {
    const st = S.set, on = CATS.filter(c => st.topics[c[0]] && (c[0] !== 'MY' || S.decks.length));
    const total = CATS.filter(c => c[0] !== 'MY' || S.decks.length).length;
    const t = on.length === total ? 'All topics' : on.length === 0 ? 'No topics' : on.length <= 2 ? on.map(c => c[1]).join(' + ') : on.length + ' topics';
    const lv = st.diffs.length === 3 ? 'Any level' : 'Level ' + st.diffs.slice().sort().join(',');
    return t + ' · ' + lv + ' · ' + MODES.find(m => m[0] === st.mode)[1];
  }
  function qbar() {
    if (view === 'phone') return '<div class="qbar"><span class="qcall">&#128222; On the phone</span></div>';
    if (World.ok) return (view === 'q' || view === 'mic') ? '' : '<div class="qbar slim"><button type="button" class="btn go" data-act="back">Back to counter</button></div>';
    const n = customCount();
    return `<div class="qbar"><button type="button" class="qset ${view === 'set' ? 'on' : ''}" data-act="settings" aria-label="Question settings: ${esc(summary())}">${ICON_GEAR}<span>${esc(summary())}</span></button>
      <button type="button" class="${view === 'studies' ? 'on' : ''}" data-act="studies">${ICON_BOOK}<span>My studies${n ? ' (' + n + ')' : ''}</span></button>
      <button type="button" class="${view === 'awards' ? 'on' : ''}" data-act="awards"><span>\uD83C\uDFC6 Awards ${S.awards.frames.length}/27</span></button>
      <button type="button" class="${view === 'ref' ? 'on' : ''}" data-act="ref"><span>\uD83D\uDCDA Drug reference</span></button>
      ${World.ok && view === 'q' ? '<button type="button" class="restock" data-act="shelve" title="Put brand and generic drugs away. Patients keep waiting."><span>\uD83D\uDCE6 Restock</span></button>' : ''}
      ${view !== 'q' ? '<button type="button" data-act="back">Back to counter</button>' : ''}</div>`;
  }
  function isBlocked(i) { const j = cur && cur.interrupt; return !!(j && !j.dismissed && !cur.done && (i === j.a || i === j.a + 1)); }
  function jimHTML() {
    const j = cur.interrupt; if (!j || j.dismissed || cur.done) return '';
    return `<div class="jim" style="grid-row:${j.a + 1} / span 2" role="alert">${avatar(7771, 'idle', false, true)}<div><p>${esc(j.line)}</p><div class="jbar"><i id="jimbar"></i></div></div><button type="button" class="mini" id="jimgo" data-act="jim-go" hidden>Not yet, Jim</button></div>`;
  }
  function cardHTML() {
    if (cur.empty && S.set.mode === 'review') { const nx = nextDueText(); return `<div class="empty-q"><h3>Nothing due for review</h3><p>${nx ? 'Your next review is due in ' + nx + '.' : 'Answer questions in Smart mix and they will start coming back here on a schedule.'}</p><div class="btnrow"><button class="btn go" type="button" data-act="mode-go" data-v="mixed">Back to Smart mix</button><button class="btn" type="button" data-act="settings">Open settings</button></div></div>`; }
    if (cur.empty) return `<div class="empty-q"><h3>No questions match your settings</h3><p>Loosen the topics, level or mode, or add your own studies.</p><div class="btnrow"><button class="btn go" type="button" data-act="settings">Open settings</button><button class="btn" type="button" data-act="studies">Add my studies</button></div></div>`;
    if (cur.elder && cur.elderStage < 2) return elderHTML();
    const q = cur.q, pad = String(cur.num).padStart(5, '0'), keys = ['1', '2', '3', '4', '5', '6'];
    const dots = [1, 2, 3].map(i => `<i class="${i <= q.d ? 'on' : ''}"></i>`).join('');
    const opts = cur.opts.map((o, i) => {
      let c = o.gone ? 'gone' : '';
      if (q.ms) {
        const on = !!cur.sel[i];
        if (cur.done) { if (o.ok && on) c = 'ok'; else if (o.ok) c = 'ok miss'; else if (on) c = 'bad'; } else if (on) c = 'sel';
        return `<button type="button" class="opt ms ${c}" style="grid-row:${i + 1};grid-column:1" data-i="${i}" aria-pressed="${on}" ${o.gone || cur.done || isBlocked(i) ? 'disabled' : ''}><kbd>${on ? (cur.done && !o.ok ? '\u2715' : '\u2713') : keys[i]}</kbd><span>${esc(o.t)}${cur.done && o.ok && !on ? ' <em class="mtag">missed</em>' : ''}</span></button>`;
      }
      if (cur.done) { if (o.ok) c = 'ok'; else if (i === cur.picked) c = 'bad'; } else if (cur.pend === i) c = 'sel';
      return `<button type="button" class="opt ${c}" style="grid-row:${i + 1};grid-column:1" data-i="${i}" ${o.gone || cur.done || isBlocked(i) ? 'disabled' : ''}><kbd>${keys[i]}</kbd><span>${esc(o.t)}</span></button>`;
    }).join('');
    const label = cur.lab ? (cur.lab === 'pk' ? 'KINETICS CONSULT \u00B7 show your work' : 'COMPOUNDING ORDER \u00B7 show your work') : cur.elder ? cur.name.toUpperCase() + ' \u00B7 free upgrade if right' : cur.evt ? (cur.evt === 'inspector' ? 'HEALTH INSPECTOR \u00B7 question ' + cur.insp.n + ' of ' + cur.insp.of + ' \u00B7 need 2' : EV_LABEL[cur.evt]) : cur.caller ? 'KAREN · "I tried to call"' : cur.karen ? 'KAREN · wants the manager' : cur.sweaty ? 'JITTERY JIM · sweating buckets' : CATNAME[q.c] + (q.t ? ' · ' + q.t : '');
    const isK = cur.karen || cur.caller, showTimer = !isK && timerOn();
    return `<article class="rx ${cur.lab ? 'labq' : ''} ${cur.karen ? 'karen' : cur.sweaty ? 'sweaty' : ''} ${cur.recall ? 'recall' : cur.regular ? 'regular' : ''} ${cur.evt ? 'evt evt-' + cur.evt : ''}">
      ${spBanner()}
      <div class="rx-head"><span class="rx-sym" aria-hidden="true">&#8478;</span>
        <div class="rx-meta"><b>${esc(label)}</b><span>Rx #${pad} &middot; ${esc(cur.name)}</span></div>
        ${cur.wasMissed ? `<span class="missedtag" title="You missed this question before">Missed before</span>` : cur.review ? `<span class="missedtag rv" title="You mastered this a while ago. A quick memory check.">Memory check</span>` : ''}
        <span class="dots" title="Difficulty ${q.d} of 3" aria-label="Difficulty ${q.d} of 3">${dots}</span>
        ${showTimer ? '<div class="timer" aria-hidden="true"><i id="timerbar"></i></div>' : ''}</div>
      ${isK ? `<div class="ktimer" role="timer" aria-label="Time before Karen leaves"><div class="timer"><i id="timerbar"></i></div><b id="tcount">${KAREN_SEC}</b><small>sec</small></div>` : ''}
      <div class="rx-body">
        <div class="patient">${avatar(cur.seed, cur.done ? (cur.ok ? 'ok' : 'bad') : 'idle', cur.karen, cur.sweaty, cur.elder, cur.name === 'Andy')}<div class="bubble"><em>${esc(cur.flavor)}</em><p>${esc(q.q)}</p></div></div>
        ${molHTML()}${q.place ? `<div class="placebox">${placeHTML()}</div>${jimHTML()}` : q.draw ? `<div class="drawbox">${drawHTML()}</div>${jimHTML()}` : `<div class="opts" role="group" aria-label="Answer choices">${opts}${jimHTML()}</div>`}${q.ms && !cur.done && cur.pend === undefined ? `<div class="msbar"><span>Select all that apply (${Object.keys(cur.sel).length} picked)</span><button type="button" class="btn go" id="msgo" ${Object.keys(cur.sel).length ? '' : 'disabled'}>Submit answer</button></div>` : ''}${labToolsHTML()}
        ${cur.pend !== undefined && !cur.done ? confBar() : ''}
        ${cur.binder ? `<div class="binderbox" role="note"><b>\uD83D\uDCD8 Reference binder</b><span>${binderNote(q)}</span></div>` : ''}
        <div class="tools pwtools"><button type="button" class="btn" id="hintbtn" ${S.pw.hint < 1 || cur.hint || cur.done || q.draw || q.place ? 'disabled' : ''}>\uD83D\uDC8A Hint pill (${S.pw.hint})</button>
          <button type="button" class="btn" id="secbtn" aria-pressed="${!!cur.secArmed}" ${(S.pw.second < 1 && !cur.secArmed) || cur.secUsed || cur.done || q.draw || q.place || q.meta ? 'disabled' : ''}>\uD83D\uDD01 Second chance (${S.pw.second})${cur.secArmed ? ' ready' : ''}</button>
          <button type="button" class="btn" id="bindbtn" ${S.pw.binder < 1 || cur.binder || cur.done || q.draw || q.place ? 'disabled' : ''}>\uD83D\uDCD8 Binder (${S.pw.binder})</button>
          ${S.pw.hint + S.pw.second + S.pw.binder < 1 && !cur.done ? '<button type="button" class="mini" data-act="pwshop">Get power-ups</button>' : ''}
          <span class="keyhint">${isK ? 'Karen leaves in ' + KAREN_SEC + ' s. A wrong answer costs an upgrade.' : cur.lab ? 'Lab bench: no timer. Pays x1.5.' : timerOn() ? 'Speed bonus fades over 20 s' : focusOn() ? 'Focus mode: no timer' : 'Timer bonus is off'}</span></div>
      </div>${(cur.resHTML || '').replace('<!--FLAG-->', () => cur.q && cur.done ? flagLink(cur.q, cur.flagPick) : '')}</article>`;
  }
  /* ---- draw-the-hormone-line question (cycle.js) ---- */
  function molHTML() {
    const q = cur && cur.q; if (!q || !q.meta) return '';
    const st = { picked: cur.site, correct: q.meta.site, done: cur.done };
    const hit = cur.done && [].concat(q.meta.site).indexOf(cur.site) >= 0;
    const note = cur.done ? (hit ? '<b>Right site.</b>' : 'The green circle is where it happens.') : cur.site ? 'Site picked. Now choose the change below.' : 'Step 1: tap the site on the structure. Step 2: choose the change.';
    return '<div class="molbox">' + molSVG(q.meta.mol, st) + '<p class="molnote" aria-live="polite">' + note + '</p></div>';
  }
  function drawHTML() {
    const q = cur.q, pts = cur.dpts || [], n = pts.length;
    const msg = cur.done ? (cur.dscore ? esc(cur.dscore.reason) : '') : 'Press and drag across the graph from day 1 to day 28. Draw the line for <b>' + esc(CYC[q.draw].name) + '</b>.';
    return cycSVG(q.draw, pts, cur.done, cur.ok) + `<p class="drawnote" aria-live="polite">${msg}</p>` + (cur.done ? `<p class="drawkey"><i class="k1"></i> your line <i class="k2" style="--c:${CYC[q.draw].col}"></i> the real ${esc(CYC[q.draw].name)} curve</p>` : `<div class="btnrow"><button type="button" class="btn" id="drawclr" ${n ? '' : 'disabled'}>Clear</button><button type="button" class="btn go" id="drawgo" ${n >= 8 ? '' : 'disabled'}>Submit drawing</button></div>`);
  }

  /* ---- drag-and-place pathway question (bio4x.js): q.place = { parts:[ [text | {a:'answer'}, ...] per row ], extra:[decoy chips] } ---- */
  function placeSlots(q) { const out = []; ((q.place.dia && q.place.dia.nodes) || []).forEach((n, i) => { if (n.a) out.push({ id: 'd' + i, a: n.a }); }); q.place.rows.forEach((r, ri) => r.forEach((p, pi) => { if (typeof p !== 'string') out.push({ id: ri + '.' + pi, a: p.a }); })); return out; }
  function slotBtn(id, a) { const v = (cur.pl || {})[id]; const cls = 'pslot' + (v ? ' full' : '') + (cur.done ? (v === a ? ' right' : ' wrong') : ''); return '<button type="button" class="' + cls + '" data-sid="' + id + '" aria-label="blank">' + (v ? esc(v) : '<i>drop here</i>') + (cur.done && v !== a ? '<small>' + esc(a) + '</small>' : '') + '</button>'; }
  function diaHTML(dia) {
    if (!cur.diaT0) cur.diaT0 = Date.now(); const el = Date.now() - cur.diaT0, popC = el < 900 ? ' pop' : '', popS = el < 900 ? ';animation-delay:-' + el + 'ms' : '';
    const W = dia.W, H = dia.H, pc = (x, y) => 'left:' + (x / W * 100).toFixed(2) + '%;top:' + (y / H * 100).toFixed(2) + '%';
    const svg = '<svg class="diasvg" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><defs><marker id="dah" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 z" fill="context-stroke"/></marker></defs>' + (dia.boxes || []).map(b => '<rect class="diabox" x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="2"/><text class="diabt" x="' + (b.x + 2) + '" y="' + (b.y + 3.6) + '">' + esc(b.t || '') + '</text>').join('') + (dia.arrows || []).map(a => '<path class="diaar ' + (a.c || '') + '" d="' + (a.d || ('M' + a.p[0][0] + ',' + a.p[0][1] + ' L' + a.p[1][0] + ',' + a.p[1][1])) + '"' + (a.nm ? '' : ' marker-end="url(#dah)"') + '/>').join('') + '</svg>';
    const nodes = dia.nodes.map((n, i) => '<div class="dn ' + (n.al || 'c') + ' ' + (n.c || '') + '" style="' + pc(n.x, n.y) + (n.w ? ';width:' + n.w + '%' : '') + '">' + (n.t ? '<span class="dnt">' + esc(n.t) + '</span>' : '') + (n.a ? slotBtn('d' + i, n.a) : '') + '</div>').join('');
    return '<div class="dia' + popC + '" style="aspect-ratio:' + W + ' / ' + H + ';--ar:' + (W / H).toFixed(3) + popS + '">' + svg + nodes + '</div>';
  }
  function placeChips(q) {
    if (!q._pc) { const set = []; placeSlots(q).forEach(s => { if (set.indexOf(s.a) < 0) set.push(s.a); }); (q.place.extra || []).forEach(x => { if (set.indexOf(x) < 0) set.push(x); }); q._pc = set; }
    if (!cur.plOrder) cur.plOrder = shuffle(q._pc.slice());
    return cur.plOrder;
  }
  function placeHTML() {
    const q = cur.q, pl = cur.pl || (cur.pl = {}), sel = cur.plSel;
    const chips = placeChips(q);
    const rows = q.place.rows.map((r, ri) => '<li class="prow">' + r.map((p, pi) => (typeof p === 'string' ? '<span class="ptxt">' + esc(p) + '</span>' : slotBtn(ri + '.' + pi, p.a))).join('') + '</li>').join('');
    const bank = cur.done ? '' : '<div class="pbank" role="group" aria-label="Word bank">' + chips.map(c => '<button type="button" class="pchip' + (sel === c ? ' on' : '') + '" data-chip="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div>';
    const n = Object.keys(pl).length, tot = placeSlots(q).length;
    const note = cur.done ? (cur.ok ? '<b>Every blank is right.</b>' : 'Red blanks were wrong or empty; the right answer is shown under each.') : 'Drag a tile onto a blank, or tap a tile and then tap a blank. Tap a filled blank to clear it. Tiles can be used more than once. ' + n + ' of ' + tot + ' filled.';
    return '<div class="pwide"><div class="pmain">' + (q.place.dia ? diaHTML(q.place.dia) : '') + (q.place.rows.length ? '<ol class="prows">' + rows + '</ol>' : '') + '</div><div class="paside">' + bank + '<p class="drawnote" aria-live="polite">' + note + '</p>' + (cur.done ? '' : '<div class="btnrow"><button type="button" class="btn" id="plclr" ' + (n ? '' : 'disabled') + '>Clear</button><button type="button" class="btn go" id="plgo" ' + (n === tot ? '' : 'disabled') + '>Check</button></div>') + '</div></div>';
  }
  function placeFill(id, chip) { if (!cur || !cur.q || !cur.q.place || cur.done) return; cur.pl = cur.pl || {}; if (chip) cur.pl[id] = chip; else delete cur.pl[id]; cur.plSel = null; renderPanel(); }
  function placeSubmit() {
    if (!cur || !cur.q || !cur.q.place || cur.done) return;
    const sl = placeSlots(cur.q); if (sl.some(s => !cur.pl[s.id])) { toast('Fill every blank first.'); return; }
    const all = sl.every(s => cur.pl[s.id] === s.a); cur.tPick = Date.now(); answer(all ? 0 : 1);
  }
  let plDrag = null, plSkip = false;
  document.addEventListener('pointerdown', (e) => {
    const c = e.target.closest && e.target.closest('.pchip'); if (!c || !cur || !cur.q || !cur.q.place || cur.done) return;
    plDrag = { chip: c.dataset.chip, x: e.clientX, y: e.clientY, ghost: null, id: e.pointerId };
  });
  document.addEventListener('pointermove', (e) => {
    if (!plDrag) return;
    if (!plDrag.ghost && Math.hypot(e.clientX - plDrag.x, e.clientY - plDrag.y) > 7) { const g = document.createElement('div'); g.className = 'pghost'; g.textContent = plDrag.chip; document.body.appendChild(g); plDrag.ghost = g; }
    if (plDrag.ghost) { e.preventDefault(); plDrag.ghost.style.left = e.clientX + 'px'; plDrag.ghost.style.top = e.clientY + 'px'; const el = document.elementFromPoint(e.clientX, e.clientY), sl = el && el.closest && el.closest('.pslot'); document.querySelectorAll('.pslot.hot').forEach(x => x.classList.remove('hot')); if (sl) sl.classList.add('hot'); }
  }, { passive: false });
  const plEnd = (e) => {
    if (!plDrag) return; const d = plDrag; plDrag = null;
    if (!d.ghost) return;
    d.ghost.remove(); document.querySelectorAll('.pslot.hot').forEach(x => x.classList.remove('hot')); plSkip = true; setTimeout(() => { plSkip = false; }, 60);
    if (e.type === 'pointercancel') return;
    const el = document.elementFromPoint(e.clientX, e.clientY), sl = el && el.closest && el.closest('.pslot');
    if (sl) placeFill(sl.dataset.sid, d.chip);
  };
  document.addEventListener('pointerup', plEnd); document.addEventListener('pointercancel', plEnd);
  document.addEventListener('click', (e) => {
    if (plSkip || !cur || !cur.q || !cur.q.place || cur.done) return;
    const c = e.target.closest && e.target.closest('.pchip'), sl = e.target.closest && e.target.closest('.pslot');
    if (c) { cur.plSel = cur.plSel === c.dataset.chip ? null : c.dataset.chip; renderPanel(); }
    else if (sl) { if (cur.plSel) placeFill(sl.dataset.sid, cur.plSel); else if ((cur.pl || {})[sl.dataset.sid]) placeFill(sl.dataset.sid, null); }
  });
  function drawPt(e) {
    const svg = $('#cycsvg'); if (!svg) return null;
    const r = svg.getBoundingClientRect(), vx = (e.clientX - r.left) / r.width * 360, vy = (e.clientY - r.top) / r.height * 222;
    const x = Math.max(CYC_X0, Math.min(CYC_X1, vx)), y = Math.max(CYC_Y0, Math.min(CYC_Y1, vy));
    return [1 + (x - CYC_X0) / (CYC_X1 - CYC_X0) * 27, (CYC_Y1 - y) / (CYC_Y1 - CYC_Y0)];
  }
  function drawSync() {
    const pl = $('#cycuser'); if (pl && cur && cur.dpts) pl.setAttribute('points', cur.dpts.map(p => cycX(p[0]).toFixed(1) + ',' + cycY(p[1]).toFixed(1)).join(' '));
    const go = $('#drawgo'), cl = $('#drawclr'); if (go) go.disabled = !(cur.dpts && cur.dpts.length >= 8); if (cl) cl.disabled = !(cur.dpts && cur.dpts.length);
  }
  document.addEventListener('pointerdown', (e) => {
    const s = e.target.closest && e.target.closest('#cycsvg'); if (!s || !cur || !cur.q || !cur.q.draw || cur.done) return;
    e.preventDefault(); cur.dstroke = true; cur.tPick = cur.tPick || 0; try { s.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
    const p = drawPt(e); if (p) { (cur.dpts = cur.dpts || []).push(p); drawSync(); }
  });
  document.addEventListener('pointermove', (e) => { if (!cur || !cur.dstroke || !cur.q || !cur.q.draw || cur.done) return; const p = drawPt(e); if (p) { cur.dpts.push(p); drawSync(); } });
  const drawEnd = () => { if (cur) cur.dstroke = false; };
  document.addEventListener('pointerup', drawEnd); document.addEventListener('pointercancel', drawEnd);
  function drawSubmit() {
    if (!cur || !cur.q || !cur.q.draw || cur.done) return;
    cur.dscore = cycScore(cur.q.draw, cur.dpts || []);
    if (cur.dscore.reason && !cur.dscore.ok && /^(Draw a line|Draw the line all|A flat)/.test(cur.dscore.reason)) { const n = $('.drawnote'); if (n) n.textContent = cur.dscore.reason; cur.dscore = null; return; }
    cur.tPick = Date.now(); answer(cur.dscore.ok ? 0 : 1);
  }
  function confBar() {
    return '<div class="confbar" role="group" aria-label="How sure are you?"><b>How sure are you?</b><div class="confbtns"><button type="button" class="btn confbtn" data-conf="guess"><kbd>1</kbd> Guess</button><button type="button" class="btn confbtn" data-conf="sure"><kbd>2</kbd> Pretty sure</button><button type="button" class="btn confbtn" data-conf="certain"><kbd>3</kbd> Certain</button></div><small>Pick your answer first, then rate it. The result shows after.</small></div>';
  }
  function explHTML(q) {
    if (!q.rows) return '<p class="why"><b>' + (q.lab ? 'Worked solution:' : 'Why:') + '</b> ' + esc(q.e) + '</p>' + (q.s ? '<p class="srcline"><b>Study source:</b> ' + esc(q.s) + '</p>' : '');
    return '<dl class="expl">' + q.rows.map(r => '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>').join('') + '</dl>';
  }
  function weekNote() {
    const n = curWeek(), w = WK[n];
    if (!w) { const f = WEEKS[0]; return 'Weekly drug questions unlock on ' + esc(f.from) + ' (Week 1). Turn on Study ahead to preview them now.'; }
    return 'Now: ' + esc(w.t) + ' week ' + w.wk + ' (' + esc(w.d) + '): ' + esc(w.topic) + '. Questions from earlier weeks stay in the mix; this week is asked most. Study ahead also unlocks future weeks.';
  }
  function missedByCat() {
    const m = {}, set = {}; S.missed.forEach(k => { set[k] = 1; });
    const add = (q) => { if (set[q.k]) m[q.c] = (m[q.c] || 0) + 1; };
    BANK.forEach(add); TOPQ.forEach(add); S.decks.forEach(d => d.items.forEach(add));
    return m;
  }
  function masteryByCat() {
    const m = {}, add = (q) => { const o = m[q.c] = m[q.c] || { n: 0, s: 0 }, x = S.mastery[q.k]; o.n++; if (x && x.seen) o.s += [0.2, 0.45, 0.8, 1][x.box] || 0; };
    const cw = curWeek() || (S.set.ahead ? WEEKS[0].n : 0), cw3 = curWeek3() || (S.set.ahead3 ? P3WEEKS[0].n : 0), cw1 = curWeek1() || (S.set.ahead1 ? P1WEEKS[0].n : 0); BANK.forEach(add); TOPQ.forEach(q => { if (q.wk === (q.c === 'TP1' ? cw1 : q.c === 'TP3' ? cw3 : cw)) add(q); }); S.decks.forEach(d => d.items.forEach(add));
    return m;
  }
  function hubTabs(active) {
    const n = customCount(), tab = (id, act, label) => `<button type="button" role="tab" aria-selected="${active === id}" data-act="${act}">${label}</button>`;
    return `<div class="hubtabs" role="tablist">${tab('set', 'tab-set', 'Topics')}${tab('opts', 'tab-opts', 'Settings')}${tab('studies', 'tab-studies', 'My studies' + (n ? ' (' + n + ')' : ''))}</div>`;
  }
  function weekNote3() {
    const n = curWeek3(), w = WK3[n];
    if (!w) { const f = P3WEEKS[0]; return 'P3 weekly drugs start on ' + esc(f.from) + ' (' + esc(f.topic) + '). Tap a week to preview it now.'; }
    return 'Now: ' + esc(w.d) + ' \u00B7 ' + esc(w.topic) + '. Tap a week to add or remove it, including upcoming weeks.';
  }
  const nbWrap = (title, inner) => `<div class="pane nbk ${nbClosing ? 'closing' : ''}"><div class="nbcover"><span class="nbtitle">${title}</span></div><div class="nbsheet">${inner}</div></div>`;
  const nbFoot = () => { const n = poolQs().length; return `<p class="count">${n} question${n === 1 ? '' : 's'} match${calcOn() ? ' + endless calculations' : ''}</p>
      <div class="btnrow"><button type="button" class="btn go nbback" data-act="back">Close notebook and return to counter</button><button type="button" class="btn" data-act="tour">Replay tour</button><button type="button" class="btn" data-act="reset-set">Reset settings</button></div>`; };
  /* "Only this course": every topic outside the course is off (and something inside is on) */
  const courseOnly = (c) => { const st = S.set, ins = courseCats(c); return ins.some(k => st.topics[k]) && CATS.every(x => ins.indexOf(x[0]) >= 0 || !st.topics[x[0]] || (x[0] === 'MY' && !S.decks.length)); };
  const weekOnly = (k) => { const cat = WKCFG[k].topic; return S.set.topics[cat] && CATS.every(x => x[0] === cat || !S.set.topics[x[0]] || (x[0] === 'MY' && !S.decks.length)) && wkOnlyNow(k); };
  const yearOnly = (y) => { const ins = yearCats(y); return ins.some(k => S.set.topics[k]) && CATS.every(x => ins.indexOf(x[0]) >= 0 || !S.set.topics[x[0]] || (x[0] === 'MY' && !S.decks.length)); };
  function setOnly(keep) { // keep: list of cats to leave on; remembers the rest so a second tap restores them
    const st = S.set; st.restore = {}; CATS.forEach(c => { st.restore[c[0]] = !!st.topics[c[0]]; st.topics[c[0]] = keep.indexOf(c[0]) >= 0 ? (c[0] === 'MY' ? !!S.decks.length : true) : false; });
  }
  function unsetOnly() { const st = S.set, rs = st.restore || {}; CATS.forEach(c => st.topics[c[0]] = rs[c[0]] !== undefined ? rs[c[0]] : true); delete st.restore; }
  function settingsHTML() {
    const st = S.set, mc = missedByCat(), ms = masteryByCat();
    const bar = (n, sn) => { if (!n) return ''; const pc = Math.round(100 * sn / n); return `<span class="mbar" role="img" aria-label="${pc}% mastered"><i style="width:${pc}%"></i><em>${pc}%</em></span>`; };
    const chipOf = k => { const m = ms[k] || { n: 0, s: 0 }; return `<button type="button" class="chip tp" data-act="topic" data-v="${k}" aria-pressed="${!!st.topics[k]}" data-find="${esc((CHIP[k] || CATNAME[k]).toLowerCase())}"><span class="cn">${CHIP[k] || CATNAME[k]}${k === 'TOP' && curWeek() ? ' <small class="mc wk">wk ' + curWeek() + '</small>' : ''}${mc[k] ? ` <small class="mc">${mc[k]} missed</small>` : ''}</span>${bar(m.n, m.s)}</button>`; };
    const total = CATS.filter(c => c[0] !== 'MY' || S.decks.length).length, onN = CATS.filter(c => st.topics[c[0]] && (c[0] !== 'MY' || S.decks.length)).length;
    const card = (c) => {
      const cats = courseCats(c); if (!cats.length) return '';
      const on = cats.filter(k => st.topics[k]).length, open = !(st.cclose || {})[c.id];
      let n = 0, sn = 0; cats.forEach(k => { const m = ms[k]; if (m) { n += m.n; sn += m.s; } });
      const status = on === 0 ? 'off' : on === cats.length ? (cats.length === 1 ? 'on' : 'all ' + cats.length + ' on') : on + ' of ' + cats.length + ' on';
      return `<details class="crs${on ? '' : ' off'}" data-crs="${c.id}"${open ? ' open' : ''}><summary><i class="caret" aria-hidden="true"></i><span class="crsn"><b>${esc(c.name)}</b><small>${c.code ? esc(c.code) + ' · ' : ''}${esc(c.tag)}</small></span><span class="crsst">${status}</span>${bar(n, sn)}</summary>
        <div class="crsb"><div class="crsr"><span class="note">${esc(c.note)}</span><span class="grpr"><button type="button" class="link" data-act="course-all" data-v="${c.id}">All</button> &middot; <button type="button" class="link" data-act="course-none" data-v="${c.id}">None</button> &middot; <button type="button" class="link${courseOnly(c) ? ' arm' : ''}" data-act="course-only" data-v="${c.id}">${courseOnly(c) ? 'Only this (tap to undo)' : 'Only this'}</button></span></div>
        <div class="chips">${cats.map(chipOf).join('')}</div>${c.sched ? wkSchedHTML(c.sched, c.sched === 'p3' ? 'Weekly schedule' : 'Weekly schedule') : ''}</div></details>`;
    };
    const yr = curYear(), inY = COURSES.filter(c => c.year === yr && courseCats(c).length).concat(COURSES.filter(c => c.year === 'all' && courseCats(c).length)), sched = inY.find(c => c.sched); // this year's courses first, shared ones (Core skills, My studies) after
    const quick = [`<button type="button" class="chip" data-act="year-only" data-v="${yr}" aria-pressed="${yearOnly(yr)}">Only ${yr} topics</button>`]
      .concat(sched ? [`<button type="button" class="chip" data-act="week-only" data-v="${sched.sched}" aria-pressed="${weekOnly(sched.sched)}">This week’s drugs only</button>`] : [])
      .concat(inY.filter(c => c.id !== 'my' && c.id !== 'core').map(c => `<button type="button" class="chip" data-act="course-only" data-v="${c.id}" aria-pressed="${courseOnly(c)}">Only ${esc(c.short || c.name)}</button>`)).join('');
    const yearTabs = '<div class="fcab" role="tablist" aria-label="Year">' + YEARS.map((f, i) => `<button type="button" role="tab" class="ftab ft${i + 1}" aria-selected="${yr === f}" data-act="year" data-v="${f}"><span>${f}</span></button>`).join('') + '</div>';
    const empty = inY.every(c => c.year === 'all') ? `<div class="crs off"><div class="crsb"><p class="note">Nothing is filed under ${yr} yet. Core skills stay available in every year.</p></div></div>` : '';
    const inner = `${hubTabs('set')}
      <div class="tsum"><b>${onN} of ${total} topics on</b><span class="grpr"><button type="button" class="link" data-act="topics-all">All on</button> &middot; <button type="button" class="link" data-act="topics-none">All off</button></span></div>
      ${yearTabs}<div class="fbody fb-${yr}" role="tabpanel" aria-label="${yr} courses">
      <div class="grp"><b>Quick picks</b><div class="chips">${quick}</div><p class="note">One tap focuses on this year, one course, or this week’s drugs. Tap it again to bring the other topics back.</p></div>
      <label class="find"><span class="vh">Find a topic</span><input type="search" id="tfind" placeholder="Find a topic or week in ${yr}" value="${esc(findQ)}" autocomplete="off"></label>
      <div class="crsl">${inY.map(card).join('')}${empty}</div></div>
      <p class="note nomatch" hidden>Nothing matches that. Try a shorter word.</p>
      ${nbFoot()}`;
    return nbWrap('Topics', inner);
  }
  function optionsHTML() {
    const st = S.set;
    const diffs = [[1, 'Level 1 easy'], [2, 'Level 2 medium'], [3, 'Level 3 hard']].map(d => `<button type="button" class="chip" data-act="diff" data-v="${d[0]}" aria-pressed="${st.diffs.indexOf(d[0]) >= 0}">${d[1]}</button>`).join('');
    const modes = MODES.map(m => `<button type="button" class="chip" data-act="mode" data-v="${m[0]}" aria-pressed="${st.mode === m[0]}">${m[1]}${m[0] === 'review' && dueCount() ? ' (' + dueCount() + ' due)' : ''}</button>`).join('');
    const inner = `${hubTabs('opts')}<h3>How you study</h3><p class="sub">Changes apply to the next patient.</p>
      <div class="grp"><b>Mode</b><div class="chips">${modes}</div><p class="note">${MODES.find(m => m[0] === st.mode)[2]}</p></div>
      <div class="grp"><b>Difficulty</b><div class="chips">${diffs}</div></div>
      <div class="grp"><b>Focus mode</b><div class="chips"><button type="button" class="chip" data-act="focus" aria-pressed="${!!st.focus}">Focus mode ${st.focus ? 'on' : 'off'}</button></div><p class="note">Hides the 3D pharmacy and turns off the timer, patient events, phone calls, Karen and Jim, so it is only questions.</p></div>
      <div class="grp"><b>Confidence ratings</b><div class="chips"><button type="button" class="chip" data-act="conf" aria-pressed="${st.conf !== false}">Ask how sure I am ${st.conf !== false ? 'on' : 'off'}</button></div><p class="note">After you pick an answer, rate Guess, Pretty sure or Certain before the result shows. Works in Smart mix and Individual review only. Spaced review (SM-2) uses it: certain and right pushes a question far out, a guess comes back soon, certain but wrong returns first.</p></div>
      <div class="grp"><b>Speed bonus</b><div class="chips"><button type="button" class="chip" data-act="timer" aria-pressed="${st.timer}">Timer bonus ${st.timer ? 'on' : 'off'}</button></div><p class="note">Turn it off to study without time pressure. Karen still has a limit.</p></div>
      <div class="grp"><b>Compounding pharmacy</b><div class="chips"><button type="button" class="chip" data-act="labk" data-v="comp" aria-pressed="${(S.labK || {}).comp !== false}">Compounding math</button><button type="button" class="chip" data-act="labk" data-v="pk" aria-pressed="${(S.labK || {}).pk !== false}">Kinetics</button></div><p class="note">Used when you tap Switch to compounding in the menu. The level chips above apply there too. ${S.labN ? 'Solved at the bench: ' + S.labOK + ' of ' + S.labN + '.' : ''}</p></div>
      ${nbFoot()}`;
    return nbWrap('Settings', inner);
  }
  /* find box: filters topic chips and schedule rows in place, no re-render */
  let findQ = '';
  function applyFind() {
    const root = document.querySelector('.crsl'); if (!root) return;
    const q = findQ.trim().toLowerCase(); let any = false;
    root.querySelectorAll('.crs').forEach(d => {
      let hit = 0, tot = 0;
      d.querySelectorAll('.chip.tp, .p3sched li').forEach(el => { tot++; const t = (el.dataset.find || el.textContent).toLowerCase(); const ok = !q || t.indexOf(q) >= 0; el.hidden = !ok || (!q && el.classList.contains('upc')); if (ok) hit++; });
      const nameHit = q && (d.querySelector('.crsn').textContent.toLowerCase().indexOf(q) >= 0);
      if (nameHit) { d.querySelectorAll('.chip.tp, .p3sched li').forEach(el => { el.hidden = el.classList.contains('upc'); }); hit = tot; }
      d.querySelectorAll('.wkbody').forEach(wb => { const rows = [...wb.querySelectorAll('.p3sched li')]; const rowHit = rows.some(r => !r.hidden); const k = (wb.parentElement.querySelector('.fold') || {}).dataset ? wb.parentElement.querySelector('.fold').dataset.v : ''; const folded = !!S.set[k + 'fold']; wb.hidden = q ? !rowHit : folded; const fn = wb.parentElement.querySelector('.wkfoldnote'); if (fn) fn.hidden = q ? rowHit : false; wb.querySelectorAll('.upmore').forEach(u => { u.hidden = !!q; }); });
      d.hidden = !!q && !hit; if (q && hit) { d.open = true; any = true; } if (!q) { d.open = !(S.set.cclose || {})[d.dataset.crs]; any = true; }
    });
    const nm = document.querySelector('.nomatch'); if (nm) nm.hidden = any;
  }
  document.addEventListener('input', (e) => { if (e.target && e.target.id === 'tfind') { findQ = e.target.value; applyFind(); } });
  document.addEventListener('toggle', (e) => { const d = e.target; if (d.dataset && d.dataset.shop) { shopOpen[d.dataset.shop] = d.open; return; } if (!d.classList || !d.classList.contains('crs') || findQ.trim()) return; S.set.cclose = S.set.cclose || {}; if (d.open) delete S.set.cclose[d.dataset.crs]; else S.set.cclose[d.dataset.crs] = true; save(); }, true);
  function lockNote(d) {
    const t = todayStr(), l = d.items.filter(q => q.from && q.from > t); if (!l.length) return '';
    const next = l.map(q => q.from).sort()[0];
    return '<small class="lock">' + l.length + ' locked until ' + esc(next) + '</small>';
  }
  function studiesHTML() {
    const decks = S.decks.map(d => `<div class="deckrow"><b>${esc(d.name)}</b><span>${d.items.length} question${d.items.length === 1 ? '' : 's'}</span>${lockNote(d)}
      <div class="acts"><button type="button" class="mini ${d.enabled ? 'on' : ''}" data-act="deck-toggle" data-id="${d.id}" aria-pressed="${d.enabled}">${d.enabled ? 'In use' : 'Off'}</button>
      <button type="button" class="mini" data-act="deck-copy" data-id="${d.id}">Copy as text</button>${quizletOK(d.url) ? `<a class="mini" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">Open Quizlet</a>` : ''}
      <button type="button" class="mini danger ${armedDeck === d.id ? 'arm' : ''}" data-act="deck-del" data-id="${d.id}">${armedDeck === d.id ? 'Tap again to delete' : 'Delete'}</button></div></div>`).join('');
    return `<div class="pane nbk ${nbClosing ? 'closing' : ''}"><div class="nbcover"><span class="nbtitle">My studies</span></div><div class="nbsheet">${hubTabs('studies')}<h3>My studies</h3><p class="sub">Add your own questions and they join the patients in line. Same format every time.</p>
      ${studyMsg ? `<div class="prev good" role="status">${esc(studyMsg)}</div>` : ''}
      ${decks ? `<div class="grp"><b>Your decks</b>${decks}</div>` : ''}
      <div class="grp"><b>Add questions</b>
        <input id="deckname" class="field" type="text" maxlength="60" placeholder="Deck name (for example Cardiology week 3)" value="${esc(draft.name)}" aria-label="Deck name">
        <div class="datewrap"><label for="deckdate">Unlocks on</label><input id="deckdate" type="date" value="${esc(draft.from || '')}"><small>Optional. Questions stay hidden until this date, so you can load next week's material now. You can also put S: 2026-11-02 under a question.</small></div>
        <textarea id="studytext" class="field" spellcheck="false" aria-label="Questions in the standard format" placeholder="Q: Question text&#10;A: Correct answer&#10;W: Wrong answer&#10;W: Wrong answer&#10;W: Wrong answer&#10;E: Why it is right&#10;&#10;or quick cards:  question | answer">${esc(draft.text)}</textarea>
        <div class="btnrow"><button type="button" class="btn" data-act="preview">Preview</button><button type="button" class="btn go" data-act="addstudy">Add to my deck</button></div>
        <div id="studyprev" aria-live="polite"></div>
      </div>
      <div class="grp"><b>Import from Quizlet</b>
        <p class="note">In Quizlet open your set, tap the three dots, choose Export, then Copy text. Paste it here and each card becomes a question. Wrong choices come from your other cards, so the set needs at least 4 cards.</p>
        <input id="qzname" class="field" type="text" maxlength="60" placeholder="Deck name (for example Pharmacology unit 2)" value="${esc(qz.name)}" aria-label="Quizlet deck name">
        <input id="qzurl" class="field" type="url" maxlength="200" placeholder="Link to your Quizlet set (optional)" value="${esc(qz.url)}" aria-label="Quizlet set link">
        <div class="chips"><button type="button" class="chip" data-act="qz-dir" data-v="td" aria-pressed="${qz.dir === 'td'}">Show term, pick definition</button><button type="button" class="chip" data-act="qz-dir" data-v="dt" aria-pressed="${qz.dir === 'dt'}">Show definition, pick term</button></div>
        <textarea id="qztext" class="field" spellcheck="false" aria-label="Quizlet export text" placeholder="term&#9;definition&#10;term&#9;definition">${esc(qz.text)}</textarea>
        <div class="btnrow"><button type="button" class="btn go" data-act="qz-add">Import Quizlet cards</button></div>
        <div id="qzprev" aria-live="polite"></div>
      </div>
      <div class="grp"><b>Shortcuts</b><div class="btnrow"><button type="button" class="mini" data-act="template">Insert example</button><button type="button" class="mini" data-act="ai-prompt">Copy prompt for an AI helper</button></div>
        <p class="note">The prompt tells Claude or any chatbot to turn your notes into this exact format. Paste its answer above.</p></div>
      <details class="how"><summary>Format guide</summary><pre class="help">${esc(STUDY_HELP)}</pre></details>
      <div class="btnrow"><button type="button" class="btn go nbback" data-act="back">Close notebook and return to counter</button></div></div></div>`;
  }
  /* ---- your pharmacist ---- */
  const ME_SKIN = ['#F2C9A5', '#E0A97E', '#C48A5E', '#8D5A3B', '#F6D7BD', '#6F4429'];
  const ME_HAIR = ['#2B1B12', '#6B3A1E', '#B5651D', '#D9B25A', '#A8A8A8', '#1E1E2E'];
  const ME_SCRUB = ['#0E9A8E', '#27489C', '#D9467A', '#8A63C9', '#3E8E41', '#F1A20E'];
  const ME_SKIN_N = ['Light', 'Tan', 'Medium', 'Deep', 'Fair', 'Rich'], ME_HAIR_N = ['Black', 'Brown', 'Auburn', 'Blonde', 'Gray', 'Midnight'], ME_SCRUB_N = ['Teal', 'Blue', 'Pink', 'Purple', 'Green', 'Amber'];
  const ME_SHIRT = [['#F7FBFB', 'White coat'], ['#DCEBFA', 'Sky blue coat'], ['#FBE3EC', 'Blush coat'], ['#E6F4D9', 'Mint coat'], ['#FFF1C9', 'Cream coat'], ['#D9D4F5', 'Lavender coat'], ['#2B3A55', 'Navy coat']];
  const ME_SHOES = [['#27384F', 'Navy shoes'], ['#F4F4F0', 'White sneakers'], ['#E04F3A', 'Red sneakers'], ['#2B2B33', 'Black shoes'], ['#F2C94C', 'Gold shoes'], ['#3FD07F', 'Green sneakers'], ['#8A63C9', 'Purple sneakers']];
  const ME_BODIES = [['slim', 'Slim'], ['normal', 'Average'], ['jacked', 'Jacked'], ['obese', 'Round']];
  const ME_GENDERS = [['f', 'Woman'], ['m', 'Man'], ['n', 'Nonbinary']];
  const ME_HAIRS = ['Short', 'Bob', 'Long', 'Bun', 'Curly', 'Spiky', 'Bald'];
  function meSpec() { const m = S.me; return { body: m.body, gender: m.gender, hair: m.hair, skin: ME_SKIN[m.skin], hairCol: ME_HAIR[m.hairColor], scrub: ME_SCRUB[m.scrub], shirtCol: (ME_SHIRT[m.shirt | 0] || ME_SHIRT[0])[0], shoes: (ME_SHOES[m.shoes === undefined ? 3 : m.shoes] || ME_SHOES[3])[0], acc: S.acc || 0, accOn: accOnList(), cosm: cosmSpec() }; }
  function meSVG() {
    const m = S.me, skin = ME_SKIN[m.skin], hair = ME_HAIR[m.hairColor], scrub = ME_SCRUB[m.scrub];
    const w = ({ slim: 24, normal: 32, jacked: 46, obese: 50 }[m.body] || 32) * (m.gender === 'f' ? 0.92 : m.gender === 'm' ? 1.06 : 1);
    const body = `<path d="M${60 - w} 120C${60 - w} 98 ${60 - w * 0.6} 90 60 90S${60 + w} 98 ${60 + w} 120z" fill="#F7FBFB" stroke="#CFE0E0" stroke-width="1.5"/><path d="M52 91L60 120L68 91z" fill="${scrub}"/>`;
    const hs = [
      `<path d="M37 58c0-20 10-30 23-30s23 10 23 30c-4-9-12-13-23-13s-19 4-23 13z" fill="${hair}"/>`,
      `<path d="M35 62c0-24 10-34 25-34s25 10 25 34v14h-9V60c-4-7-10-10-16-10s-12 3-16 10v16h-9z" fill="${hair}"/>`,
      `<path d="M35 62c0-24 10-34 25-34s25 10 25 34v46h-10V60c-4-7-10-10-15-10s-11 3-15 10v48H35z" fill="${hair}"/>`,
      `<path d="M37 58c0-20 10-30 23-30s23 10 23 30c-4-9-12-13-23-13s-19 4-23 13z" fill="${hair}"/><circle cx="60" cy="24" r="9" fill="${hair}"/>`,
      `<g fill="${hair}"><circle cx="42" cy="42" r="12"/><circle cx="56" cy="32" r="13"/><circle cx="72" cy="33" r="13"/><circle cx="82" cy="46" r="11"/><circle cx="38" cy="54" r="9"/><circle cx="84" cy="58" r="8"/></g>`,
      `<path d="M37 56c0-16 9-24 23-24s23 8 23 24c-4-8-12-11-23-11s-19 3-23 11z" fill="${hair}"/><path d="M42 36l-3-14 11 9zM56 32l0-16 8 14zM72 33l6-14 3 15z" fill="${hair}"/>`,
      '',
      `<path d="M55 20h10v26H55z" fill="${hair}"/><path d="M52 30h16v14H52z" fill="${hair}"/>`,
      `<circle cx="60" cy="40" r="30" fill="${hair}"/>`,
      `<path d="M37 58c0-20 10-30 23-30s23 10 23 30c-4-9-12-13-23-13s-19 4-23 13z" fill="${hair}"/><path d="M62 46l14 30-8 4z" fill="${hair}"/>`,
      `<path d="M36 58c0-20 10-32 24-32s24 12 24 32c-4-9-12-14-24-14s-20 5-24 14z" fill="${hair}"/><path d="M42 30c8-12 28-12 38 0l-6 4c-8-6-18-6-26 0z" fill="${hair}"/>`,
      `<path d="M37 58c0-20 10-30 23-30s23 10 23 30c-4-9-12-13-23-13s-19 4-23 13z" fill="${hair}"/><circle cx="40" cy="34" r="9" fill="${hair}"/><circle cx="80" cy="34" r="9" fill="${hair}"/>`
    ];
    const f = m.gender === 'f';
    const face = `<circle cx="60" cy="62" r="22" fill="${skin}"/>${hs[m.hair] || ''}<circle cx="51" cy="62" r="2.4" fill="#2b1b12"/><circle cx="69" cy="62" r="2.4" fill="#2b1b12"/>${f ? '<path d="M46 57l5-2M74 57l-5-2" stroke="#2b1b12" stroke-width="1.6" stroke-linecap="round"/><path d="M54 73q6 4 12 0" stroke="#D9677A" stroke-width="3" fill="none" stroke-linecap="round"/>' : '<path d="M54 72q6 4 12 0" stroke="#3a1f12" stroke-width="2.2" fill="none" stroke-linecap="round"/>'}`;
    return `<svg viewBox="0 0 120 120" class="mepv-svg" role="img" aria-label="Preview of your pharmacist"><rect width="120" height="120" rx="22" style="fill:var(--surface2)"/>${body}${face}</svg>`;
  }
  function mePreview() {
    const url = World.ok && World.pharmPortrait ? World.pharmPortrait(meSpec()) : null;
    return url ? '<img class="mepv-img" alt="Preview of your pharmacist" src="' + url + '">' : meSVG();
  }
  /* ---- character screen: one slider row per part, top to bottom. Gear comes from GEAR (gear.js). ---- */
  const rdot = (r) => `<i class="rdot r-${r}" title="${RAR[r].n}" aria-label="${RAR[r].n}"></i>`;
  function gearOpts(slot) { // the choices in a gear slider: None, then everything you own in that slot
    return [{ v: '', n: 'None' }].concat(GEAR.filter(g => g.slot === slot && gearHave(g.id)).map(g => ({ v: g.id, n: g.name, r: g.r, b: buffText2(g.buff), g })));
  }
  function gearLocked(slot) { return GEAR.filter(g => g.slot === slot && !gearHave(g.id)); }
  function crows() {
    const m = S.me, on = S.cosmOn || {};
    const hairOpts = ME_HAIRS.map((n, i) => ({ v: i, n })).concat(GEAR.filter(g => g.slot === 'hair' && gearHave(g.id)).map(g => ({ v: g.hv, n: g.name, r: g.r, g })));
    const coatOpts = ME_SHIRT.map((x, i) => ({ v: i, n: x[1], c: x[0] })).concat(gearOpts('coat').slice(1));
    const cur = (slot) => gearHave(on[slot]) && gearById(on[slot]).slot === slot ? on[slot] : '';
    const rows = [
      { k: 'gender', t: 'Gender', cur: m.gender, o: ME_GENDERS.map(x => ({ v: x[0], n: x[1] })) },
      { k: 'body', t: 'Body type', cur: m.body, o: ME_BODIES.map(x => ({ v: x[0], n: x[1] })) },
      { k: 'skin', t: 'Skin tone', cur: m.skin, o: ME_SKIN.map((c, i) => ({ v: i, n: ME_SKIN_N[i], c })) },
      { k: 'hair', t: 'Hair style', cur: m.hair, o: hairOpts, lock: gearLocked('hair') },
      { k: 'hairColor', t: 'Hair color', cur: m.hairColor, o: ME_HAIR.map((c, i) => ({ v: i, n: ME_HAIR_N[i], c })) },
      { k: 'face', t: 'Facial hair', cur: cur('face'), o: gearOpts('face'), lock: gearLocked('face') },
      { k: 'eyes', t: 'Glasses', cur: cur('eyes'), o: gearOpts('eyes'), lock: gearLocked('eyes') },
      { k: 'hat', t: 'Hat', cur: cur('hat'), o: gearOpts('hat'), lock: gearLocked('hat') },
      { k: 'neck', t: 'Neck', cur: cur('neck'), o: gearOpts('neck'), lock: gearLocked('neck') },
      { k: 'coat', t: 'Coat', cur: cur('coat') || (m.shirt | 0), o: coatOpts, lock: gearLocked('coat') },
      { k: 'scrub', t: 'Pants', cur: m.scrub, o: ME_SCRUB.map((c, i) => ({ v: i, n: ME_SCRUB_N[i] + ' pants', c })) },
      { k: 'shoes', t: 'Shoes', cur: m.shoes === undefined ? 3 : m.shoes, o: ME_SHOES.map((x, i) => ({ v: i, n: x[1], c: x[0] })) },
      { k: 'hands', t: 'In hand', cur: cur('hands'), o: gearOpts('hands'), lock: gearLocked('hands') },
      { k: 'extra', t: 'Extras', cur: cur('extra'), o: gearOpts('extra'), lock: gearLocked('extra') },
      { k: 'cyber', t: 'Cyborg parts', cur: cur('cyber'), o: gearOpts('cyber'), lock: gearLocked('cyber') }
    ];
    return rows;
  }
  function crowHTML(r) {
    const n = r.o.length, i = Math.max(0, r.o.findIndex(x => x.v === r.cur)), c = r.o[i], dis = n < 2 ? ' disabled' : '';
    const lock = r.lock && r.lock.length ? `<details class="clock"><summary>${r.lock.length} more to unlock</summary><ul>${r.lock.map(g => `<li>${rdot(g.r)}<b>${esc(g.name)}</b><span>${esc(gearSrcText(g))}${g.buff && buffText2(g.buff) ? ' · ' + esc(buffText2(g.buff)) : ''}</span></li>`).join('')}</ul></details>` : '';
    return `<div class="crow" data-k="${r.k}"><span class="clab">${r.t}</span><div class="cslide"><button type="button" class="carr" data-act="cyc" data-k="${r.k}" data-d="-1" aria-label="Previous ${r.t.toLowerCase()}"${dis}>&#8249;</button><div class="cval" role="status" aria-live="polite">${c.c ? `<i class="csw" style="background:${c.c}"></i>` : c.r ? rdot(c.r) : ''}<span>${esc(c.n)}${c.b ? `<em class="cbuff">${esc(c.b)}</em>` : ''}</span><small>${i + 1}/${n}</small></div><button type="button" class="carr" data-act="cyc" data-k="${r.k}" data-d="1" aria-label="Next ${r.t.toLowerCase()}"${dis}>&#8250;</button></div>${lock}</div>`;
  }
  function setCrow(k, v) {
    S.cosmOn = S.cosmOn || {};
    if (k === 'coat') { if (typeof v === 'number') { S.me.shirt = v; delete S.cosmOn.coat; } else S.cosmOn.coat = v; return; }
    if (COSM_SLOTS.indexOf(k) >= 0) { if (v) S.cosmOn[k] = v; else delete S.cosmOn[k]; return; }
    S.me[k] = v;
  }
  /* ---- shop (a tab on the Character screen) ---- */
  let cTab = 'me'; const shopOpen = { walls: true };
  const buffText = b => [b.tech ? '+' + Math.round(b.tech * 100) + '% tech tips' : '', b.pay ? '+' + Math.round(b.pay * 100) + '% pay' : ''].filter(Boolean).join(', ');
  function uniSpec() { const u = uniOf(); return u ? { shirt: u[2], scrub: u[3], cosm: { hat: u[4] || '', eyes: u[0] === 'u5' ? 'goggles' : '' } } : null; }
  function applyShop() { musLabel(); MUS.sync(); if (!World.ok) return; World.setStore(S.store); World.setStaffLook(uniSpec()); World.setPharmacist(meSpec()); }
  const SHOP_CATS = [['walls', 'Wall paint'], ['floors', 'Floors'], ['uni', 'Tech uniforms'], ['deco', 'Decor'], ['tape', 'Radio tapes'], ['wear', 'Wardrobe'], ['pow', 'Power-ups']];
  /* v162: every shop price is multiplied by SHOP_X, so items take much longer to afford. Prices in shop.js and gear.js stay the base values. Free items stay free. */
  const SHOP_X = 5, shopPx = n => n ? Math.round(n * SHOP_X / 10) * 10 : 0;
  function shopRows(cat) { return shopRows0(cat).map(r => r.price && !r.free ? Object.assign({}, r, { price: r.stack ? r.price : shopPx(r.price) }) : r); }
  function shopRows0(cat) {
    const st = S.store;
    if (cat === 'walls') return SHOP_WALLS.map(w => ({ id: w[0], name: w[1], price: w[4], free: !w[4], on: st.walls === w[0], sw: [w[2], w[3]], note: '' }));
    if (cat === 'floors') return SHOP_FLOORS.map(f => ({ id: f[0], name: f[1], price: f[4], free: !f[4], on: st.floor === f[0], sw: [f[2], f[3]], note: '' }));
    if (cat === 'uni') return [{ id: '', name: 'Standard coats', price: 0, free: true, on: !st.uni, sw: ['#F4FAFA', '#27384F'], note: 'No bonus.' }].concat(SHOP_UNI.map(u => ({ id: u[0], name: u[1], price: u[6], on: st.uni === u[0], sw: [u[2], u[3]], note: buffText(u[5]) + '. ' + u[7] })));
    if (cat === 'deco') return SHOP_DECOR.map(d => ({ id: d[0], name: d[1], price: d[2], on: (st.deco || []).indexOf(d[0]) >= 0, emoji: d[4], note: d[3], toggle: true }));
    if (cat === 'tape') return SHOP_TAPES.map(t => ({ id: t[0], name: t[1], price: t[2], free: !t[2], on: (st.tape || 't1') === t[0], emoji: '📼', note: t[3] }));
    if (cat === 'pow') return Object.keys(PW).map(k => ({ id: k, name: PW[k].name, price: pwCost(k), emoji: PW[k].emoji, note: PW[k].note, stack: true, count: S.pw[k] || 0 }));
    return GEAR.filter(g => g.src === 'shop').map(g => ({ id: g.id, name: g.name, price: g.price, on: gearOn(g.id), emoji: g.e, r: g.r, note: SLOT_NAME[g.slot] + (buffText2(g.buff) ? ' · ' + buffText2(g.buff) : '') + (g.d ? '. ' + g.d : '') }));
  }
  function shopHTML() {
    const cash = S.cash, bf = buffText(uniBuff()), hasT = S.up.tech >= 1;
    const secs = SHOP_CATS.map(c => {
      const rows = shopRows(c[0]), ownN = rows.filter(r => r.stack ? r.count > 0 : r.free || shopOwn(r.id)).length;
      const cards = rows.map(r => {
        const own = r.stack ? false : r.free || shopOwn(r.id), sw = r.sw ? `<span class="spsw"><i style="background:${r.sw[0]}"></i><i style="background:${r.sw[1]}"></i></span>` : `<span class="spem" aria-hidden="true">${r.emoji || ''}</span>`;
        let btn;
        if (!own) btn = `<button type="button" class="btn go" data-act="shop-buy" data-k="${c[0]}" data-id="${r.id}"${cash < r.price || (r.stack && r.count >= PW_MAX) ? ' disabled' : ''}>${r.stack && r.count >= PW_MAX ? 'Full' : 'Buy ' + money(r.price)}</button>`;
        else if (r.toggle) btn = `<button type="button" class="btn" data-act="shop-use" data-k="${c[0]}" data-id="${r.id}" aria-pressed="${r.on}">${r.on ? 'Remove' : 'Place'}</button>`;
        else btn = r.on ? '<span class="spon">Equipped</span>' : `<button type="button" class="btn" data-act="shop-use" data-k="${c[0]}" data-id="${r.id}">Use</button>`;
        return `<div class="spcard${r.on ? ' on' : ''}">${sw}<div class="sptx"><b>${r.r ? rdot(r.r) : ''}${esc(r.name)}${r.stack ? ' <em class="pwn">x' + r.count + '</em>' : ''}</b>${r.note ? `<small>${esc(r.note)}</small>` : ''}</div>${btn}</div>`;
      }).join('');
      const note = c[0] === 'uni' ? `<p class="note">${hasT ? (bf ? 'Your techs are earning bonuses: ' + bf + '.' : 'Pick a uniform to give your techs a bonus.') : 'Hire a Pharmacy Technician first. Uniform bonuses work once you have at least one tech.'}</p>` : c[0] === 'wear' ? '<p class="note">Bought gear lands in the matching slider on the Character tab, with its bonus.</p>' : '';
      return `<details class="crs" data-shop="${c[0]}"${shopOpen[c[0]] ? ' open' : ''}><summary><i class="caret" aria-hidden="true"></i><span class="crsn"><b>${c[1]}</b><small>${c[0] === 'pow' ? rows.reduce((a, r) => a + r.count, 0) + ' in stock' : ownN + ' of ' + rows.length + ' owned'}</small></span></summary><div class="crsb">${note}<div class="spgrid">${cards}</div></div></details>`;
    }).join('');
    const rg = Object.assign({ off: false, c: '#F2A516', p: 'solid' }, S.store.rug || {}), RUGC = ['#F2A516', '#0E9A8E', '#D9374A', '#4C7BD9', '#3E8E41', '#8A63C9', '#F29BC1', '#7C8A93', '#27384F', '#E8D9A8'], RUGP = [['solid', 'Plain'], ['stripes', 'Stripes'], ['checks', 'Checks'], ['diamonds', 'Diamonds'], ['border', 'Border']];
    const rugSec = `<details class="crs" data-shop="rug"${shopOpen.rug ? ' open' : ''}><summary><i class="caret" aria-hidden="true"></i><span class="crsn"><b>Entry rug</b><small>${rg.off ? 'removed' : 'color and pattern'}</small></span></summary><div class="crsb"><div class="spcard${rg.off ? '' : ' on'}"><span class="spem" aria-hidden="true">🟫</span><div class="sptx"><b>Rug at the front door</b><small>Free. Pick a color and a pattern, or take it away.</small></div><button type="button" class="btn" data-act="rug-off" aria-pressed="${!rg.off}">${rg.off ? 'Put back' : 'Remove'}</button></div>${rg.off ? '' : `<div class="rugrow">${RUGP.map(q => `<button type="button" class="chip" data-act="rug-p" data-v="${q[0]}" aria-pressed="${rg.p === q[0]}">${q[1]}</button>`).join('')}</div><div class="rugrow">${RUGC.map(c => `<button type="button" class="rugsw${rg.c === c ? ' on' : ''}" data-act="rug-c" data-v="${c}" style="background:${c}" aria-label="Rug color ${c}"></button>`).join('')}</div>`}</div></details>`;
    const mvNote = `<p class="note">Tip: press and hold a decoration in the pharmacy, then drag it where you want it. <button type="button" class="btn" data-act="deco-reset">Put decorations back</button></p>`;
    const rotIds = SHOP_DECOR.filter(d => S.store.deco.indexOf(d[0]) >= 0 && ['bell', 'radio', 'cactus', 'lava', 'fish', 'cooler', 'vend', 'rug'].indexOf(d[0]) >= 0).map(d => [d[0], d[1]]); if (!rg.off) rotIds.push(['erug', 'Entry rug']);
    const rotSec = `<details class="crs" data-shop="rot"${shopOpen.rot ? ' open' : ''}><summary><i class="caret" aria-hidden="true"></i><span class="crsn"><b>Rotate decorations</b><small>turn floor and counter items</small></span></summary><div class="crsb">${rotIds.map(r => `<div class="rotrow"><span>${esc(r[1])}</span><button type="button" class="btn" data-act="deco-rot" data-v="${r[0]}" data-d="-1" aria-label="Turn ${esc(r[1])} left">⟲</button><button type="button" class="btn" data-act="deco-rot" data-v="${r[0]}" data-d="1" aria-label="Turn ${esc(r[1])} right">⟳</button></div>`).join('') || '<p class="note">Buy a decoration to turn it.</p>'}</div></details>`;
    return `<div class="spcash">Cash <b>${money(cash)}</b></div><div class="crsl">${secs}${rugSec}${rotSec}</div>${mvNote}`;
  }
  function shopBuy(kind, id) {
    if (kind === 'pow') {
      if (!PW[id]) return; const c = pwCost(id);
      if ((S.pw[id] || 0) >= PW_MAX) { toast('You are holding the most ' + PW[id].name + ' you can carry.'); return; }
      if (S.cash < c) { toast('Not enough cash for ' + PW[id].name + '.'); return; }
      S.cash -= c; pwAdd(id, 1); SFX.play('unlock'); save(); renderStats(); toast('Bought ' + PW[id].name + '. You have ' + S.pw[id] + '.'); return;
    }
    if (kind === 'tape' && !shopOwn('radio')) { toast('Buy the Tape radio in Decor first.'); return; }
    const rows = shopRows(kind), r = rows.find(x => x.id === id); if (!r || r.free || shopOwn(id)) return;
    if (S.cash < r.price) { toast('Not enough cash for ' + r.name + '.'); return; }
    S.cash -= r.price; S.store.own.push(id); SFX.play('unlock'); shopUse(kind, id, true); save(); renderStats(); toast('Bought ' + r.name + '.');
  }
  function shopUse(kind, id, quiet) {
    const st = S.store;
    if (kind === 'tape') { st.tape = id; S.music = true; save(); MUS.tape(); if (view === 'create') renderPanel(); return; }
    if (kind === 'walls') st.walls = id; else if (kind === 'floors') st.floor = id; else if (kind === 'uni') st.uni = id;
    else if (kind === 'deco') { const i = st.deco.indexOf(id); if (i >= 0 && !quiet) st.deco.splice(i, 1); else if (i < 0) st.deco.push(id); }
    else if (kind === 'wear' || kind === 'hair' || kind === 'cyber') { const g = gearById(id); if (g) { if (g.slot === 'hair') S.me.hair = g.hv; else { S.cosmOn = S.cosmOn || {}; S.cosmOn[g.slot] = id; } } }
    save(); applyShop(); if (view === 'create') renderPanel();
  }
  function outfitHTML() {
    const b = gearBuff(), t = buffText2(b), own = GEAR.filter(g => g.slot !== 'pet' && g.src !== 'start' && gearHave(g.id)).length, all = GEAR.filter(g => g.slot !== 'pet' && g.src !== 'start').length;
    return `<div class="tsum outfit"><b>Outfit bonus: ${t ? esc(t) : 'none yet'}</b><span>${own}/${all} gear found</span></div>`;
  }
  function petsHTML() {
    const have = (S.awards || {}).pets || [];
    const rows = GEAR.filter(g => g.slot === 'pet').map(g => {
      const on = have.indexOf(g.kind) >= 0, pd = PET_DEFS.find(p => p.id === g.id), prog = pd ? Math.min(pd.n, petProgress(pd)) : 0;
      const how = on ? 'Roaming the pharmacy. Tap it to say hi, or press and drag to carry it somewhere else.' : pd ? prog + '/' + pd.n + ' topics at ' + TIER[pd.tier - 1] + ' or better (see Awards)' : gearSrcText(g);
      return `<div class="awp${on ? ' on' : ''}"><span aria-hidden="true">${g.e}</span><div><b>${rdot(g.r)}${esc(g.name)}</b><small>${esc(g.d)}${buffText2(g.buff) ? ' Bonus: ' + esc(buffText2(g.buff)) + '.' : ''}</small><small>${esc(how)}</small>${pd && !on ? `<span class="awbar pbar"><i style="width:${Math.round(100 * prog / pd.n)}%"></i></span>` : ''}</div></div>`;
    }).join('');
    const fish = S.awards.pets.indexOf('fish') >= 0;
    return `<p class="note">Pets wander the floor. Press and hold one, then drag to carry it; let go to set it down. ${fish ? 'The goldfish tank stays put.' : ''}</p><div class="awpl">${rows}</div>`;
  }
  function createHTML() {
    const seg = (id, label) => `<button type="button" role="tab" aria-selected="${cTab === id}" data-act="ctab" data-v="${id}">${label}</button>`;
    const tabs = S.me.done ? `<div class="hubtabs" role="tablist" aria-label="Character screen">${seg('me', 'Wardrobe')}${seg('shop', 'Shop')}${seg('pets', 'Pets')}</div>` : '';
    if (S.me.done && cTab === 'shop') return `<div class="pane cpane"><h3>Pharmacy shop</h3>${tabs}<div class="mepv sticky">${mePreview()}</div>${shopHTML()}<div class="btnrow"><button type="button" class="btn go" data-act="me-done">Done</button></div></div>`;
    if (S.me.done && cTab === 'pets') return `<div class="pane cpane"><h3>Pets</h3>${tabs}${petsHTML()}<div class="btnrow"><button type="button" class="btn go" data-act="me-done">Done</button></div></div>`;
    const m = S.me, rows = crows().map(crowHTML).join('');
    return `<div class="pane cpane"><h3>Your character</h3>${tabs}
      <div class="mepv sticky">${mePreview()}</div>
      ${m.done ? outfitHTML() : ''}
      <div class="grp"><b>Name your pharmacy</b><input id="shopname" class="field" type="text" maxlength="24" autocomplete="off" placeholder="Corner Rx" value="${esc(S.shop || '')}" aria-label="Pharmacy name"><p class="note">It goes on the sign above your shelves.</p></div>
      <p class="note">Use the arrows on each row to flip through what you own. Gear comes from capsules in the lost pills vial (top bar), the Shop tab and rank promotions, and each piece carries a small bonus for your pharmacy.</p>
      <div class="crows">${rows}</div>
      <div class="btnrow"><button type="button" class="btn go" data-act="me-done">${m.done ? 'Done' : 'Start working'}</button></div></div>`;
  }

  /* ---- mastery awards: framed photos and pets ---- */
  const AW_CATS = ['BG', 'CL', 'MOA', 'AE', 'DDI', 'CN', 'AD', 'SIG', 'CALC'];
  const TIER = ['Bronze', 'Silver', 'Gold'], MEDAL = ['\uD83E\uDD49', '\uD83E\uDD48', '\uD83E\uDD47'];
  const PET_DEFS = [{ id: 'bunny', name: 'Bunny', emoji: '\uD83D\uDC30', n: 3, tier: 1 }, { id: 'cat', name: 'Cat', emoji: '\uD83D\uDC31', n: 4, tier: 2 }, { id: 'dog', name: 'Dog', emoji: '\uD83D\uDC36', n: 6, tier: 2 }];
  const catTotals = {}; BANK.forEach(q => { catTotals[q.c] = (catTotals[q.c] || 0) + 1; });
  function catMastery(c) {
    if (c === 'CALC') return { done: S.calcOK, total: 50, goals: [10, 25, 50] };
    const total = catTotals[c] || 0; let done = 0;
    BANK.forEach(q => { if (q.c === c) { const m = S.mastery[q.k]; if (m && m.box >= 2) done++; } });
    return { done, total, goals: [0.3, 0.6, 0.9].map(f => Math.max(1, Math.ceil(total * f))) };
  }
  const petProgress = (p) => AW_CATS.filter((c, ci) => S.awards.frames.indexOf(ci * 3 + p.tier - 1) >= 0).length;
  const CAL_NAMES = ['Bronze', 'Silver', 'Gold', 'Platinum'], CAL_ICON = ['\uD83E\uDD49', '\uD83E\uDD48', '\uD83E\uDD47', '\uD83D\uDC8E'];
  const weekQs = (n) => TOPQ.filter(q => q.wk === n && !wkTypeOff(q));
  const weekProg = (n) => { const qs = weekQs(n); return { done: qs.filter(q => (S.mastery[q.k] || {}).box >= 2).length, total: qs.length }; };
  const weeksOpen = () => WEEKS.filter(w => wk2Open(w) && weekQs(w.n).length);
  const weeksMastered = () => weeksOpen().filter(w => { const p = weekProg(w.n); return p.total > 0 && p.done >= p.total; }).length;
  /* floating unlock cards: a shining picture, then it travels to where it lives */
  const pend = { frames: new Set(), pets: new Set() };
  const worldAwards = () => ({ frames: S.awards.frames.filter(i => !pend.frames.has(i)), pets: S.awards.pets.filter(k => !pend.pets.has(k)) });
  const unlockQ = []; let unlockBusy = false;
  function showUnlock(u) { unlockQ.push(u); if (!unlockBusy) nextUnlock(); }
  function nextUnlock() {
    const u = unlockQ.shift(); if (!u) { unlockBusy = false; return; }
    unlockBusy = true; SFX.play('unlock');
    const el = document.createElement('div'); el.className = 'unlock'; el.setAttribute('role', 'status');
    el.innerHTML = '<div class="ubadge"><i class="urays"></i><div class="upic ' + (u.frame ? 'frame' : '') + '"><span>' + u.emoji + '</span><i class="usheen"></i></div></div><div class="ubody"><b>' + esc(u.title) + '</b><small>' + esc(u.sub || '') + '</small></div>';
    document.body.appendChild(el);
    let fin = false; const done = () => { if (fin) return; fin = true; el.remove(); try { if (u.land) u.land(); } catch (e) { if (window.console) console.error(e); } setTimeout(nextUnlock, 150); };
    const badge = el.querySelector('.ubadge'), body = el.querySelector('.ubody');
    if (!el.animate) { setTimeout(done, 5000); return; }
    badge.animate([{ transform: 'scale(.2) rotate(-12deg)', opacity: 0 }, { transform: 'scale(1.12) rotate(3deg)', opacity: 1, offset: .6 }, { transform: 'scale(1) rotate(0)', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'forwards' });
    body.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 400, delay: 200, fill: 'forwards' });
    setTimeout(() => {
      if (fin) return;
      const t = u.target && !document.body.classList.contains('focus') ? World.targetPos(u.target.kind, u.target.id) : null, r = badge.getBoundingClientRect();
      body.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' });
      if (!t) { const a = badge.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.6)' }], { duration: 450, fill: 'forwards' }); a.onfinish = done; return; }
      const dx = t.x - (r.left + r.width / 2), dy = t.y - (r.top + r.height / 2);
      const a = badge.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + dx * 0.55 + 'px,' + (dy * 0.55 - 70) + 'px) scale(.6) rotate(180deg)', opacity: 1, offset: .55 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.12) rotate(360deg)', opacity: .9 }], { duration: 900, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'forwards' });
      a.onfinish = done;
    }, 5200);
    setTimeout(done, 7600);
  }
  /* an achievement pop-up for every weekly quiz (Top 300 and P3) the first time all of its questions are mastered */
  function checkWeekQuiz(silent) {
    const isOpen = (w) => w.from <= todayStr() || (w.n > 200 ? p1On(w.n) : w.n > 100 ? p3On(w.n) : p2On(w.n));
    const mast = WEEKS.concat(P3WEEKS, P1WEEKS).filter(isOpen).filter(w => { const p = weekProg(w.n); return p.total > 0 && p.done >= p.total; });
    if (!S.awards.wkDone) { S.awards.wkDone = mast.map(w => w.n); save(); return; }
    const fresh = mast.filter(w => S.awards.wkDone.indexOf(w.n) < 0);
    if (!fresh.length) return;
    fresh.forEach(w => S.awards.wkDone.push(w.n)); save();
    if (silent) return;
    fresh.forEach(w => showUnlock({ emoji: '\uD83C\uDFC6', title: (w.n > 200 ? 'P1 Week ' : w.n > 100 ? 'P3 Week ' : 'Week ') + w.wk + ' quiz mastered', sub: w.topic + ' \u00B7 ' + w.d, target: { kind: 'cal' }, land: () => { if (view === 'awards') renderPanel(); } }));
  }
  function checkCal(silent) {
    checkWeekQuiz(silent);
    const n = weeksMastered(), have = S.awards.calW || 0;
    if (n <= have) return;
    S.awards.calW = n; save();
    const t = Math.min(4, n), land = () => World.setCalendar(t, true, n);
    if (silent) { World.setCalendar(t, false, n); return; }
    if (t <= Math.min(4, have)) { World.setCalendar(t, false, n); if (view === 'awards') renderPanel(); return; }
    showUnlock({ emoji: '\uD83D\uDCC5', title: 'Weekly drug calendar: ' + CAL_NAMES[t - 1], sub: n + (n === 1 ? ' week' : ' weeks') + ' fully mastered', target: { kind: 'cal' }, land: () => { land(); if (view === 'awards') renderPanel(); } });
  }
  /* pharmacist wardrobe: one accessory per promotion */
  const RANK_GEAR = GEAR.filter(g => g.src === 'rank').sort((a, b) => a.rank - b.rank), ACCS = RANK_GEAR.map(g => [g.name, g.e]);
  const rankEquip = (k) => { const g = RANK_GEAR[k - 1]; if (g) { S.cosmOn = S.cosmOn || {}; S.cosmOn[g.slot] = g.id; } };
  const rankIdx = () => { let i = 0; for (let k = 0; k < RANKS.length; k++) if (S.correct >= RANKS[k][0]) i = k; return i; };
  function syncRank(silent) {
    const target = Math.min(ACCS.length, rankIdx());
    let earned = S.accEarned || 0; if (target <= earned) { if ((S.acc || 0) < earned) { S.acc = earned; World.setPharmacist(meSpec()); } return; }
    if (silent && target - earned > 1) { earned = target - 1; S.accEarned = earned; S.acc = earned; for (let q = 1; q <= earned; q++) rankEquip(q); World.setPharmacist(meSpec()); }
    for (let k = earned + 1; k <= target; k++) {
      S.accEarned = k;
      if (silent && k < target) { S.acc = k; rankEquip(k); continue; }
      showUnlock({ emoji: ACCS[k - 1][1], title: ACCS[k - 1][0] + ' unlocked', sub: 'Promoted to ' + RANKS[k][1], target: { kind: 'pharm', id: k }, land: () => { S.acc = Math.max(S.acc || 0, k); rankEquip(k); save(); World.setPharmacist(meSpec()); if (view === 'awards' || view === 'create') renderPanel(); } });
    }
    save();
  }
  function checkAwards(silent) {
    checkCal(silent); syncRank(silent); fcCheck(silent);
    const fresh = [], freshPets = [];
    AW_CATS.forEach((c, ci) => { const m = catMastery(c); m.goals.forEach((g, t) => { const idx = ci * 3 + t; if (m.done >= g && S.awards.frames.indexOf(idx) < 0) { S.awards.frames.push(idx); fresh.push({ idx, c, t }); } }); });
    PET_DEFS.forEach(p => { if (S.awards.pets.indexOf(p.id) < 0 && petProgress(p) >= p.n) { S.awards.pets.push(p.id); freshPets.push(p); } });
    if (!fresh.length && !freshPets.length) return;
    save();
    if (!silent) { fresh.forEach(f => pend.frames.add(f.idx)); freshPets.forEach(p => pend.pets.add(p.id)); }
    World.setAwards(worldAwards());
    if (!silent) {
      fresh.forEach(f => { const a = World.artMeta[f.idx] || {}; showUnlock({ emoji: a.e || '\uD83D\uDDBC\uFE0F', title: (a.n || 'New photo') + ' frame', sub: CATNAME[f.c] + ' \u00B7 ' + TIER[f.t], frame: true, target: { kind: 'frame', id: f.idx }, land: () => { pend.frames.delete(f.idx); World.setAwards(worldAwards()); World.unlockFrame(f.idx); if (view === 'awards') renderPanel(); } }); });
      freshPets.forEach(p => showUnlock({ emoji: p.emoji, title: 'New pet: ' + p.name, sub: 'It will roam the pharmacy', target: { kind: 'pet' }, land: () => { pend.pets.delete(p.id); World.setAwards(worldAwards()); World.unlockPet(p.id); if (view === 'awards') renderPanel(); } }));
    }
    if (view === 'awards') renderPanel();
  }
  function awardsHTML() {
    const rows = AW_CATS.map((c, ci) => {
      const m = catMastery(c), pct = Math.min(100, Math.round(m.done / m.total * 100));
      const tiers = m.goals.map((g, t) => {
        const have = S.awards.frames.indexOf(ci * 3 + t) >= 0, a = World.artMeta[ci * 3 + t] || { n: '', e: '' };
        return have ? `<span class="tier on" title="${esc(TIER[t])}">${MEDAL[t]} ${a.e} ${esc(a.n)}</span>` : `<span class="tier">\uD83D\uDD12 ${g} ${c === 'CALC' ? 'correct' : 'mastered'}</span>`;
      }).join('');
      return `<div class="aw"><div class="awh"><b>${esc(CATNAME[c])}</b><span>${Math.min(m.done, m.total)}/${m.total}${c === 'CALC' ? ' correct' : ' mastered'}</span></div><div class="awbar"><i style="width:${pct}%"></i></div><div class="awt">${tiers}</div></div>`;
    }).join('');
    const pets = PET_DEFS.map(p => {
      const have = S.awards.pets.indexOf(p.id) >= 0;
      return `<div class="awp ${have ? 'on' : ''}"><span aria-hidden="true">${p.emoji}</span><div><b>${p.name}</b><small>${have ? 'Roaming the pharmacy. Click it!' : petProgress(p) + '/' + p.n + ' topics at ' + TIER[p.tier - 1] + ' or better'}</small><span class="awbar pbar"><i style="width:${have ? 100 : Math.round(100 * Math.min(p.n, petProgress(p)) / p.n)}%"></i></span></div></div>`;
    }).join('');
    const wm = weeksMastered(), wo = weeksOpen(), nextW = wo.find(w => { const p = weekProg(w.n); return p.done < p.total; }), np = nextW ? weekProg(nextW.n) : null, ct = Math.min(4, S.awards.calW || 0);
    const calRow = `<div class="aw"><div class="awh"><b>\uD83D\uDCC5 Weekly drug calendar</b><span>${wm} week${wm === 1 ? '' : 's'} mastered</span></div><div class="awbar"><i style="width:${np ? Math.round(100 * np.done / Math.max(1, np.total)) : 100}%"></i></div><small class="awnote">${nextW ? 'Next: master all ' + np.total + ' questions of week ' + nextW.wk + ' (' + np.done + '/' + np.total + ')' : 'Every open week is mastered.'} Each mastered week raises the calendar one level.</small><div class="awt">${CAL_NAMES.map((c, i) => i < ct ? `<span class="tier on">${CAL_ICON[i]} ${c}${i === 3 && wm > 4 ? ' x' + (wm - 3) : ''}</span>` : `<span class="tier">\uD83D\uDD12 ${i + 1} week${i ? 's' : ''}</span>`).join('')}</div></div>`;
    const accN = S.acc || 0;
    const wardRow = `<div class="aw"><div class="awh"><b>\uD83E\uDDE5 Pharmacist wardrobe</b><span>${accN}/${ACCS.length}</span></div><div class="awbar"><i style="width:${Math.round(100 * accN / ACCS.length)}%"></i></div><div class="awt">${ACCS.map((a, i) => i < accN ? `<span class="tier on">${a[1]} ${a[0]}</span>` : `<span class="tier">\uD83D\uDD12 ${RANKS[i + 1][1]}</span>`).join('')}</div></div>`;
    return `<div class="pane"><h3>Awards</h3><p class="sub">A question counts as mastered after two correct answers in a row. One slip on a mastered question will not undo it, but two misses in a row will. The top tier of a topic needs 90% of its questions mastered. Each tier hangs a framed photo on the pharmacy wall. Mastering several topics brings in pets. Each rank promotion adds an accessory to your pharmacist.</p>${calRow}${wardRow}${rows}<div class="grp"><b>Pets</b><div class="awps">${pets}${fcPetRow()}</div></div>${seasonHTML()}${capsHTML()}${shareHTML()}<div class="btnrow"><button type="button" class="btn" data-act="flash">Open flashcards</button></div>${saveBoxHTML()}<div class="btnrow"><button type="button" class="btn go" data-act="back">Back to counter</button></div></div>`;
  }


  /* ---- first-person events: bottle check, put-away drill, prior auth ---- */
  const BRANDS = [['Atorvastatin', 'Lipitor'], ['Rosuvastatin', 'Crestor'], ['Simvastatin', 'Zocor'], ['Amlodipine', 'Norvasc'], ['Losartan', 'Cozaar'], ['Valsartan', 'Diovan'], ['Carvedilol', 'Coreg'], ['Spironolactone', 'Aldactone'], ['Furosemide', 'Lasix'],
    ['Metformin', 'Glucophage'], ['Levothyroxine', 'Synthroid'], ['Sertraline', 'Zoloft'], ['Escitalopram', 'Lexapro'], ['Fluoxetine', 'Prozac'], ['Bupropion', 'Wellbutrin'], ['Aripiprazole', 'Abilify'], ['Quetiapine', 'Seroquel'],
    ['Alprazolam', 'Xanax'], ['Clonazepam', 'Klonopin'], ['Zolpidem', 'Ambien'], ['Omeprazole', 'Prilosec'], ['Esomeprazole', 'Nexium'], ['Pantoprazole', 'Protonix'], ['Montelukast', 'Singulair'], ['Cetirizine', 'Zyrtec'],
    ['Loratadine', 'Claritin'], ['Gabapentin', 'Neurontin'], ['Pregabalin', 'Lyrica'], ['Tramadol', 'Ultram'], ['Sildenafil', 'Viagra'], ['Tadalafil', 'Cialis'], ['Clopidogrel', 'Plavix'], ['Warfarin', 'Coumadin'],
    ['Apixaban', 'Eliquis'], ['Rivaroxaban', 'Xarelto'], ['Celecoxib', 'Celebrex'], ['Sumatriptan', 'Imitrex'], ['Ondansetron', 'Zofran'], ['Azithromycin', 'Zithromax'], ['Ciprofloxacin', 'Cipro'],
    ['Alendronate', 'Fosamax'], ['Tamsulosin', 'Flomax'], ['Levetiracetam', 'Keppra'], ['Lamotrigine', 'Lamictal'], ['Methylphenidate', 'Ritalin']];
  const fp = { on: false, kind: '', done: false, cool: Date.now() + 30000, nextBottle: Date.now() + (60 + Math.random() * 40) * 1000, nextPrior: Date.now() + (150 + Math.random() * 90) * 1000 };
  const fpEl = () => $('#fpq');
  function fpEnter(kind, pause) {
    fp.on = true; fp.kind = kind; fp.done = false;
    if (pause && cur && !cur.done && !cur.empty) cur.pausedAt = Date.now();
    view = 'fp'; $('#stage').classList.add('fpmode'); renderPanel();
    const el = fpEl(); el.hidden = false; updateInset();
  }
  function fpExit() {
    fp.on = false; fp.kind = ''; World.fpEnd();
    const el = fpEl(); el.hidden = true; el.className = 'fpq'; el.innerHTML = ''; el.removeAttribute('style');
    $('#stage').classList.remove('fpmode'); fp.cool = Date.now() + 25000;
    backToQ(); updateInset();
  }
  document.addEventListener('click', (e) => {
    const el = e.target.closest && e.target.closest('#fpq.tip'); if (!el || fp.kind !== 'shelve' || !fp.s || fp.s.ack) return;
    fp.s.ack = true; el.classList.add('fly'); setTimeout(() => { if (fp.on && fp.kind === 'shelve') renderFp(); }, 420);
  });
  function fpLeave() {
    if (!fp.on || fp.done) return;
    fp.done = true;
    if (fp.kind === 'bottle') { S.bottleBad = (S.bottleBad || 0) + 1; toast('You stepped away from the bottle check. That counts as a miss.'); }
    else if (fp.kind === 'shelve') { S.lastShelve = S.served; toast('Restock cancelled. The rest can wait.'); }
    else if (fp.kind === 'prior') toast('You hung up on the portal. Prior auth denied.');
    save(); fpExit();
  }
  // one slip on a mastered question does not undo it (it just comes back for a check tomorrow); a second miss in a row does
  function slip(m) { if (m.box >= 2 && !m.lapse) m.lapse = 1; else { m.box = 0; m.lapse = 0; } }
  function recordMastery(q, ok) {
    if (!q || !q.k) return;
    const m = srSeed(S.mastery[q.k] || { box: 0, seen: 0, ok: 0 });
    m.seen++; if (ok) { m.ok++; m.lapse = 0; m.box = Math.min(3, m.box + 1); } else slip(m);
    if (srOn()) srUpdate(m, ok, undefined);
    S.mastery[q.k] = m;
    const mi = S.missed.indexOf(q.k);
    if (!ok && mi < 0) S.missed.push(q.k);
    if (ok && m.box >= 2 && mi >= 0) S.missed.splice(mi, 1);
    save(); checkAwards();
  }
  const pips = (n, total, bad) => '<span class="pips" aria-hidden="true">' + Array.from({ length: total }, (_, i) => '<i class="' + (i < n ? 'on' : bad && i < bad ? 'bad' : '') + '"></i>').join('') + '</span>';
  function renderFp() {
    const el = fpEl(); if (!el || !fp.on) return;
    el.className = 'fpq' + (fp.kind === 'prior' ? ' portal' : '');
    if (fp.kind === 'bottle') {
      const b = fp.q;
      el.innerHTML = '<div class="fph"><span>Bottle check &middot; your view</span></div><p class="fpbig">' + esc(b.name) + '\'s prescription is for ' + esc(b.a.i) + '.</p><p>' +
        (fp.done ? (fp.picked === b.ok ? '<b>Right bottle.</b> ' : '<b>Wrong bottle!</b> This is going to be a problem... ') + esc(b.a.d) + ' is for ' + esc(b.a.i) + '. ' + esc(b.b.d) + ' is for ' + esc(b.b.i) + '.' : 'Click the correct bottle on the counter.') + '</p>';
    } else if (fp.kind === 'shelve') {
      const st = fp.s, g = st.pairs[st.targets[Math.min(st.step, 4)]][0];
      const head = '<div class="fph"><span>Put away &middot; ' + Math.min(st.step + (fp.done ? 0 : 1), 5) + ' of 5 ' + pips(st.step, 5) + '</span><span>Slip-ups allowed: 1 ' + pips(0, 2, st.miss) + '</span></div>';
      if (fp.done) { el.className = 'fpq'; el.innerHTML = head + '<p class="fpbig">' + (st.step >= 5 ? 'All shelved. Nice work!' : 'Too many mix-ups. The rest can wait.') + '</p>'; }
      else if (!st.ack) { el.className = 'fpq tip'; el.innerHTML = head + '<p class="fpbig">Click the brand-name spot for ' + esc(g) + '.</p><p>' + (window.innerWidth / window.innerHeight < 0.85 ? 'The bottle at the bottom shows the generic name. Every shelf spot shows a brand name.' : 'The bottle in front of you shows the generic name. The shelf spots show brand names.') + '</p><p class="fptap">Tap this tip to start</p>'; }
      else { el.className = 'fpq mini'; el.innerHTML = '<span class="mt">' + Math.min(st.step + 1, 5) + '/5</span> <span>Brand spot for <b>' + esc(g) + '</b></span> ' + pips(st.step, 5) + (st.miss ? ' <span class="mt bad">slip-up</span>' : ''); }
    } else if (fp.kind === 'prior') {
      el.innerHTML = paHTML();
      const pa = fp.pa; if (!pa.ptr) pa.ptr = { x: el.clientWidth * 0.84, y: el.clientHeight * 0.9 };
      const ptr = el.querySelector('.pptr'); if (ptr) { ptr.style.left = pa.ptr.x + 'px'; ptr.style.top = pa.ptr.y + 'px'; }
    }
  }
  /* indication bottles */
  function startBottles() {
    const a = pick(IND), pool = IND.filter(x => x.g !== a.g && a.ex.indexOf(x.g) < 0 && x.ex.indexOf(a.g) < 0), b = pick(pool);
    const opts = Math.random() < 0.5 ? [a, b] : [b, a];
    fp.q = { a: a, b: b, opts: opts, ok: opts.indexOf(a), name: pick(NAMES) }; fp.picked = -1;
    fpEnter('bottle', true); World.fpIndication(opts[0].d, opts[1].d); renderFp();
  }
  function bottleAnswer(i) {
    if (fp.kind !== 'bottle' || fp.done || !fp.q.opts[i]) return;
    const ok = i === fp.q.ok; fp.done = true; fp.picked = i;
    if (ok) S.bottleOK = (S.bottleOK || 0) + 1; else { S.bottleBad = (S.bottleBad || 0) + 1; World.fpMark('b' + i); }
    World.fpSelect('b' + i); save(); renderFp();
    setTimeout(() => { fpExit(); if (!ok) setTimeout(() => { if (World.ragdoll()) toast('Wrong bottle! A patient in the waiting area collapsed.'); }, 900); }, ok ? 3400 : 4600);
  }
  function policeCome() {
    S.polLoss = (S.polLoss || 0) + 1;
    S.rep = Math.max(0, S.rep - 15);
    let msg = 'Police took the patient away. Reputation -15.';
    if (S.up.shelf > 0) { S.up.shelf--; World.karenLoss('shelf'); msg = 'Police took the patient away. Reputation -15 and Stocked Shelves down to level ' + S.up.shelf + '.'; }
    toast(msg); save(); renderAll();
  }
  /* brand vs generic put-away drill */
  /* restock draws from the weekly drug list: this week first, then earlier unlocked weeks */
  function shelfPairs() {
    const t = todayStr(), cw = curWeek(), seen = {};
    const ok = DRUGS.filter(d => WK[d.w] && p2On(d.w) && brandPick(d) && brandPick(d).toLowerCase() !== d.g.toLowerCase() && d.g.length <= 26 && !/[;\/]/.test(d.g));
    const uniq = (l) => l.filter(d => { const k = brandPick(d).toLowerCase(); if (seen[k]) return false; seen[k] = 1; return true; });
    const now = shuffle(ok.filter(d => d.w === cw)), old = shuffle(ok.filter(d => d.w !== cw));
    const pick = uniq(now.concat(old)).slice(0, 6);
    if (pick.length < 6) return shuffle(BRANDS.slice()).slice(0, 6);
    return pick.map(d => [d.g, brandPick(d)]);
  }
  function applyFocus() {
    const on = focusOn(), fx = on && World.ok;
    document.body.classList.toggle('focus', fx);
    if (World.ok && World.setPaused) World.setPaused(fx);
    const lab = $('#focuslab'); if (lab) lab.textContent = on ? 'Focus mode: on' : 'Focus mode';
    const fb = $('#focusbtn'); if (fb) fb.setAttribute('aria-pressed', String(on));
    if (!on) return;
    if (fp.on) fpLeave();
    if (rush.on) { rush.on = false; World.setRush(false); rushBadge(); }
    if (phone.ringing) { phone.ringing = false; World.phoneRing(false); updatePhoneBtn(); }
  }
  function startShelve(auto) {
    if (fp.on || !World.ok) return;
    clearEvt('shelve');
    if (view !== 'q') { if (!auto) toast('Finish what you are doing first, then restock.'); return; }
    if (focusOn()) { if (!auto) toast('Turn off focus mode to restock the shelves.'); return; }
    const pairs = shelfPairs(), targets = shuffle([0, 1, 2, 3, 4, 5]).slice(0, 5);
    fp.s = { pairs: pairs, targets: targets, step: 0, miss: 0, auto: auto, filled: {} };
    fpEnter('shelve', auto); World.fpShelve(pairs.map(p => p[1])); World.fpHold(pairs[targets[0]][0]); renderFp();
  }
  function shelveClick(id) {
    const st = fp.s; if (fp.kind !== 'shelve' || fp.done || id.indexOf('bin') !== 0) return;
    const n = +id.slice(3); if (st.filled[n]) return;
    if (n === st.targets[st.step]) {
      st.filled[n] = 1; World.fpFill(n, st.pairs[n][0]); st.step++;
      if (st.step >= 5) {
        fp.done = true; S.lastShelve = S.served; S.shelveOK = (S.shelveOK || 0) + 1;
        const pay = Math.round(150 * franchiseMult()); S.cash += pay; S.earned += pay; S.rep = Math.min(100, S.rep + 2); save(); renderStats();
        renderFp(); setTimeout(() => { fpExit(); toast('Shelves stocked! +' + money(pay) + ', reputation +2'); }, 1400);
      } else { World.fpHold(st.pairs[st.targets[st.step]][0]); renderFp(); }
    } else {
      st.miss++; World.fpMark('held');
      if (st.miss > 1) { fp.done = true; S.lastShelve = S.served; S.shelveBad = (S.shelveBad || 0) + 1; save(); renderFp(); setTimeout(() => { fpExit(); toast('Too many shelving mix-ups. The rest can wait.'); }, 1600); }
      else renderFp();
    }
  }
  function fpClick(id) {
    if (!fp.on) return;
    if (fp.kind === 'bottle' && id[0] === 'b') bottleAnswer(+id.slice(1));
    else if (fp.kind === 'shelve') shelveClick(id);
  }
  /* prior authorization (fictional insurer, one impossible question) */
  const PA_CO = ['Umbrella Mutual Health', 'MedGuard Plus', 'CareSure Advantage', 'Benefitly Partners', 'Pinnacle Cover-ish'];
  const PA_DRUG = ['a once-weekly injectable', 'an extended-release inhaler', 'a brand-name migraine pen', 'a specialty biologic', 'a new oral anticoagulant'];
  const PA_ABSURD = [
    { q: 'What was the barometric pressure, to four decimals, when the prescriber signed the original script?', o: ['It was a Tuesday', '29.9213 inHg, probably', 'The form does not say', 'Blue'] },
    { q: "State the member's plan ID backwards, in Roman numerals, while hopping.", o: ['MMXIV', 'I lost count', 'Please fax us again', 'Hopping noises'] },
    { q: "Confirm the patient's grandmother's maiden name, her dog's maiden name, and the dog's middle name.", o: ['Biscuit', 'Not applicable to dogs', 'Form 27-B says no', 'All of the above, loudly'] },
    { q: 'How many pharmacists does it take to approve one fax, rounded to the nearest unicorn?', o: ['Two and a half', 'One, plus hope', 'Unicorns are out of network', 'Seven'] },
    { q: 'What is the sound of one hand faxing?', o: ['Beep boop screeeee', 'A polite refusal', 'Please hold', 'Form 27-C'] }
  ];
  const PA_DENY = [
    'We are SO sorry. Your answer was correct, but it was not the correct correct. Request DENIED. Your call is important to us.',
    'Thank you for your submission! After careful review by a committee that does not exist, this request is denied. We regret nothing, but we regret it warmly.',
    'Denied, with the deepest regret. A letter explaining why will arrive in 6 to 8 business years, written in a language we invented.',
    'You answered perfectly, which is exactly why we must deny you. We sincerely apologize for the inconvenience of our entire business model.',
    'We are truly sorry you feel disappointed by this denial. (This message was sent before you finished reading the question.)'
  ];
  function priorQs() {
    const t = todayStr(), live = [];
    S.decks.forEach(d => { if (d.enabled) d.items.forEach(q => { if (!q.from || q.from <= t) live.push(q); }); });
    TOPQ.forEach(q => { if (isTop(q) && S.set.topics[q.c] !== false && q.from <= t && !q.ms) live.push(q); });
    let pool = live;
    const dated = live.filter(q => q.from); if (dated.length) { const latest = dated.map(q => q.from).sort().pop(); pool = live.filter(q => q.from === latest); if (pool.length < 2) pool = dated; }
    if (pool.length < 2) pool = pool.concat(BANK.filter(q => !q.meta && !q.draw && !q.place));
    const picks = []; shuffle(pool.slice()).forEach(q => { if (picks.length < 2 && picks.every(p => p.k !== q.k)) picks.push(q); });
    return picks.map(q => ({ q: q, opts: shuffle([q.a, ...q.w].map((x, i) => ({ t: x, ok: i === 0 }))) }));
  }
  function startPrior() {
    const real = priorQs(), ab = pick(PA_ABSURD);
    fp.pa = { co: pick(PA_CO), drug: pick(PA_DRUG), steps: real.concat([{ absurd: true, qt: ab.q, opts: ab.o.map(t => ({ t: t, ok: false })) }]), i: 0, picked: -1, res: [] };
    fpEnter('prior', true); World.fpPrior(); renderFp();
  }
  // The on-screen mouse pointer glides to a button, presses it, and only then does the click take effect.
  function paGlide(btn, cb) {
    const pa = fp.pa, el = fpEl(); if (!pa || pa.busy || !btn) return;
    pa.busy = true;
    const p = el.querySelector('.pptr'), er = el.getBoundingClientRect(), br = btn.getBoundingClientRect();
    const k = (er.width / el.offsetWidth) || 1;
    const x = (br.left - er.left + Math.min(br.width * 0.6, br.width - 24 * k)) / k, y = (br.top - er.top + br.height * 0.55) / k;
    pa.ptr = { x: x, y: y };
    if (p) { p.style.left = x + 'px'; p.style.top = y + 'px'; }
    setTimeout(() => { if (p) p.classList.add('press'); btn.classList.add('pressed'); setTimeout(() => { pa.busy = false; cb(); }, 190); }, 800);
  }
  function paAnswer(i) {
    const pa = fp.pa; if (fp.kind !== 'prior' || !pa || pa.picked >= 0 || pa.busy) return;
    const st = pa.steps[pa.i]; if (!st.opts[i]) return;
    paGlide(fpEl().querySelector('[data-pa="' + i + '"]'), () => paCommit(i));
  }
  function paCommit(i) {
    const pa = fp.pa, st = pa.steps[pa.i];
    pa.picked = i;
    if (!st.absurd) {
      const ok = st.opts[i].ok; pa.res.push(ok); recordMastery(st.q, ok);
      if (ok) { const pay = Math.round(40 * franchiseMult()); S.cash += pay; S.earned += pay; renderStats(); }
      renderMastery(); renderReview();
    } else { pa.denial = pick(PA_DENY); S.priorN = (S.priorN || 0) + 1; save(); }
    renderFp();
  }
  function paNext() {
    const pa = fp.pa; if (!pa || pa.picked < 0 || pa.busy) return;
    paGlide(fpEl().querySelector('[data-panext]'), () => {
      if (pa.i >= 2) { fpExit(); toast('Prior auth denied. Surprise: it was always going to be.'); return; }
      pa.i++; pa.picked = -1; renderFp();
    });
  }
  function paHTML() {
    const pa = fp.pa, st = pa.steps[pa.i], last = pa.i === 2;
    const opts = st.opts.map((o, i) => {
      let k = ''; if (pa.picked >= 0 && !st.absurd) { if (o.ok) k = 'ok'; else if (i === pa.picked) k = 'bad'; }
      return '<button type="button" class="pbtn ' + k + '" data-pa="' + i + '" ' + (pa.picked >= 0 ? 'disabled' : '') + '>' + (i + 1) + '. ' + esc(o.t) + '</button>';
    }).join('');
    let res = '';
    if (pa.picked >= 0) {
      if (!st.absurd) res = '<div class="pres">' + (st.opts[pa.picked].ok ? '<b>Correct.</b> ' : '<b>Not quite.</b> Answer: ' + esc(st.opts.find(o => o.ok).t) + '. ') + esc(st.q.e || '') + '</div>';
      else res = '<div class="pres deny"><b>REQUEST DENIED.</b> ' + esc(pa.denial) + (pa.res[0] && pa.res[1] ? '<br><br>Great work on questions 1 and 2 though!' : '') + '</div>';
      res += '<button type="button" class="pnext" data-panext="1">' + (last ? 'Close portal' : 'Next question') + '</button>';
    }
    return '<div class="pbar"><span>' + esc(pa.co) + ' &middot; Provider Portal</span><span>Prior Authorization</span></div><div class="pbody">' +
      '<div class="pwarn">Coverage for ' + esc(pa.drug) + ' will be <b>approved</b> if you answer 3 verification questions correctly. Question ' + (pa.i + 1) + ' of 3.</div>' +
      '<div class="pq">' + esc(st.absurd ? st.qt : st.q.q) + '</div><div class="popts">' + opts + '</div><div class="pfoot">' + res + '</div><p class="tiny">Your call is important to us. Estimated wait: yes.</p></div>' +
      '<svg class="pptr" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 2l16 9-7 2 4 8-3 1.5-4-8-5 5z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  }
  /* ---- rush hour: the old busy pace, with bonus pay ---- */
  let tickDt = 0.25;
  const rush = { on: false, left: 0, next: Date.now() + 600000 };
  function rushBadge() { const el = $('#rush3d'); if (!el) return; el.hidden = !rush.on; if (rush.on) el.textContent = 'RUSH HOUR \u00B7 +50% pay \u00B7 ' + Math.ceil(rush.left) + 's'; }
  function rushTick() {
    if (!World.ok || focusOn() || learning() || labOn()) return;
    if (rush.on) {
      if (!fp.on && view === 'q') rush.left -= tickDt;
      if (rush.left <= 0) { rush.on = false; rush.next = Date.now() + (480 + Math.random() * 240) * 1000; World.setRush(false); toast('Rush hour is over. The line thins out.'); }
      rushBadge(); return;
    }
    if (fp.on || view !== 'q' || S.served < 5 || !S.me.done || Date.now() < rush.next || phone.ringing) return;
    rush.on = true; rush.left = 45; World.setRush(true); toast('Rush hour! Patients are pouring in. Everything pays +50% for 45 seconds.'); rushBadge();
  }
  function eventTick() {
    if (focusOn() || learning() || labOn() || fp.on || !World.ok || Date.now() < fp.cool) return;
    if (view !== 'q' || !cur || cur.empty || cur.done || phone.ringing || phone.open || S.served < 6 || !S.me.done) return;
    const now = Date.now();
    if (S.served - (S.lastShelve || 0) >= 20 && offerEvt('shelve', 'A delivery box is on the counter. Tap it to restock when you are ready.')) return;
    if (now >= fp.nextBottle && offerEvt('bottle', 'A pill bottle is waiting on the counter. Tap it for a bottle check.')) { fp.nextBottle = now + (90 + Math.random() * 80) * 1000; return; }
    if (S.served >= 10 && now >= fp.nextPrior && offerEvt('prior', 'A prior authorization folder landed on the counter. Tap it when you have a minute.')) fp.nextPrior = now + (180 + Math.random() * 120) * 1000;
  }
  /* events no longer pull the player in: they appear as an object on the counter and wait to be tapped */
  const evtAt = {};
  function offerEvt(kind, msg) {
    if (!World.ok || !World.evtShow) return false;
    if (World.evtOn(kind)) return false;
    World.evtShow(kind, true); evtAt[kind] = Date.now(); SFX.play('bell'); toast(msg); return true;
  }
  function clearEvt(kind) { if (World.ok && World.evtShow) World.evtShow(kind, false); delete evtAt[kind]; }
  function onEvt(kind) {
    if (fp.on) return;
    if (view !== 'q') { toast('Finish what you are doing first, then tap it again.'); return; }
    if (focusOn() || learning() || labOn()) return;
    if (kind !== 'shelve' && !(World.ok && World.evtOn && World.evtOn(kind))) { toast(kind === 'bottle' ? 'No bottle to check right now. It bounces when one is ready.' : 'No prior auth waiting right now. It bounces when one arrives.'); return; }
    clearEvt(kind);
    if (kind === 'shelve') startShelve(false); else if (kind === 'bottle') { fp.cool = 0; startBottles(); } else if (kind === 'prior') startPrior();
  }
  function evtExpire() {
    ['bottle', 'prior'].forEach(k => { if (evtAt[k] && Date.now() - evtAt[k] > 150000) clearEvt(k); });
  }

  /* ---- drug reference (Top 300 weekly list) ---- */
  let refQ = '';
  function drugHTML(d) {
    const row = (k, v) => v ? '<div class="rrow"><b>' + k + '</b><span>' + esc(v) + '</span></div>' : '';
    const doses = [d.lo && 'Low ' + d.lo, d.ty && 'Typical ' + d.ty, d.mx && 'Max ' + d.mx].filter(Boolean).join(' · ');
    return '<details class="rdrug"><summary><b>' + esc(d.g) + '</b>' + (d.b ? ' <span>' + esc(d.b) + '</span>' : '') + (d.c ? '<small>' + esc(d.c) + '</small>' : '') + '</summary><div class="rbody">' +
      row('Class', d.c) + row('Mechanism', d.m && !/^n\/a/i.test(d.m) ? d.m : '') + (d.i && d.i.length ? '<div class="rrow"><b>Indications</b><span>' + esc(d.i.join(' • ')) + '</span></div>' : '') + row('Counseling', d.cn) + row('Clinical pearl', d.p) + row('Doses', doses) +
      (d.sup ? '<div class="rrow"><b>Note</b><span>Not in the workbook you supplied; general reference text.</span></div>' : '') + '</div></details>';
  }
  function refListHTML() {
    const q = refQ.trim().toLowerCase(), t = todayStr(), cw = curWeek();
    let h = '';
    WEEKS.forEach(w => {
      const locked = !wk2Open(w);
      const list = DRUGS.filter(d => d.w === w.n && (!q || (d.g + ' ' + (d.b || '') + ' ' + (d.c || '')).toLowerCase().indexOf(q) >= 0));
      if (q && !list.length) return;
      if (locked) { if (!q) h += '<div class="rweek lockedw"><b>' + esc(w.t) + ' week ' + w.wk + ' · ' + esc(w.d) + '</b><small>Unlocks ' + esc(w.from) + '. Turn on Study ahead in settings to preview.</small></div>'; return; }
      h += '<details class="rweek" ' + (q || w.n === cw ? 'open' : '') + '><summary><b>' + esc(w.t) + ' week ' + w.wk + ' · ' + esc(w.d) + '</b>' + (w.n === cw ? ' <em>this week</em>' : '') + '<small>' + esc(w.topic) + '</small></summary>' + list.map(drugHTML).join('') + '</details>';
    });
    return h || '<p class="note">Nothing matches that search yet.</p>';
  }
  function refHTML() {
    return '<div class="pane"><h3>Drug reference</h3><p class="sub">Brand, class, mechanism, indications, counseling and pearls for each week of your Top 300 list. Weeks open on their start date.</p>' +
      '<input id="refq" class="field" type="search" placeholder="Search generic, brand or class" value="' + esc(refQ) + '" aria-label="Search the drug reference"><div id="reflist">' + refListHTML() + '</div>' +
      '<div class="btnrow"><button type="button" class="btn" data-act="back">Back to counter</button></div></div>';
  }

  /* ---- retirement ---- */
  const RETIRE_AT = 1e15;
  function retireHTML() {
    const mastered = Object.keys(S.mastery).filter(k => S.mastery[k].box >= 2).length, tot = S.correct + S.wrong;
    return '<div class="pane"><h3>Retirement</h3><p class="sub">You hold ' + money(S.cash) + '. Time to hang up the white coat.</p><div class="retsum">' +
      '<span>Patients served</span><b>' + S.served + '</b><span>Answers right</span><b>' + S.correct + (tot ? ' (' + Math.round(S.correct / tot * 100) + '%)' : '') + '</b><span>Questions mastered</span><b>' + mastered + '</b><span>Awards</span><b>' + S.awards.frames.length + '/27</b><span>Locations opened</span><b>' + (S.franchises + 1) + '</b><span>Career number</span><b>' + ((S.retired || 0) + 1) + '</b></div>' +
      '<p>Start a new career and every dollar you earn is worth +50% more, forever. Your mastery, decks, awards and pharmacist stay.</p>' +
      '<div class="btnrow"><button type="button" class="btn go" data-act="retire-new">Retire and start a new career</button><button type="button" class="btn" data-act="back">Not yet</button></div></div>';
  }

  /* ---- phone calls (rare) ---- */
  const PHONE_THEMES = [
    { id: 'safety', name: 'Safety line', cats: ['AE', 'AD'], callers: ['An ER nurse', 'A worried parent', 'A night-shift nurse', 'A poison-control follow-up'], lines: ['Quick safety question before I give this.', 'I need a second opinion on a safety issue.', 'Is this an emergency? Please help.'] },
    { id: 'counsel', name: 'Counseling line', cats: ['CN'], callers: ['A patient who just got home', 'A new caregiver', 'A patient at the bus stop', 'A first-time mom'], lines: ['I got home and forgot what you told me...', 'How exactly am I supposed to take this?', 'The label is confusing. Can you walk me through it?'] },
    { id: 'ddi', name: 'Interaction check', cats: ['DDI'], callers: ["Dr. Patel's office", 'A nurse practitioner', 'The hospital pharmacist', 'An urgent-care provider'], lines: ['Checking an interaction before we prescribe.', 'Can you screen these drugs for me?', 'Our system flagged a possible interaction.'] }
  ];
  const phone = { ringing: false, open: false, until: 0, nextAt: Date.now() + (60 + Math.random() * 50) * 1000, call: null, pending: false };
  const scheduleNext = (min, span) => { phone.nextAt = Date.now() + (min + Math.random() * span) * 1000; };
  function toast(msg) {
    const t = $('#toast3d'); if (!t) return;
    t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), Math.min(11000, 4800 + String(msg).length * 55));
  }
  function startRing() {
    SFX.play('ring'); phone.ringing = true; phone.until = Date.now() + 16000; World.phoneRing(true); updatePhoneBtn();
  }
  function updatePhoneBtn() {
    const b = $('#phonebtn'); if (!b) return;
    b.hidden = !phone.ringing;
    if (phone.ringing) b.textContent = '\uD83D\uDCDE Phone ringing! Answer (' + Math.max(0, Math.ceil((phone.until - Date.now()) / 1000)) + 's)';
  }
  function missCall() {
    phone.ringing = false; World.phoneRing(false); updatePhoneBtn(); S.phoneMiss++; save();
    if (World.ok) World.missedCall(); else phone.pending = true;
    toast('Missed call! An angry caller is on the way to the counter.');
    scheduleNext(110, 90);
  }
  function openPhone() {
    if (!phone.ringing || phone.open) return;
    phone.ringing = false; phone.open = true; World.phoneRing(false); updatePhoneBtn();
    if (view === 'q' && cur && !cur.done && !cur.empty && !cur.pausedAt) cur.pausedAt = Date.now();
    const th = pick(PHONE_THEMES);
    let pool = BANK.filter(q => th.cats.indexOf(q.c) >= 0); if (!pool.length) pool = BANK;
    const q = pick(pool);
    phone.call = { th, q, caller: pick(th.callers), line: pick(th.lines), opts: shuffle([q.a].concat(q.w).map((t, i) => ({ t, ok: i === 0 }))), done: false, ok: false, picked: -1, resHTML: '' };
    view = 'phone'; renderPanel(); $('#qpanel').scrollTop = 0;
  }
  function phoneAnswer(i) {
    const c = phone.call; if (!c || c.done || !c.opts[i]) return;
    const q = c.q, ok = c.opts[i].ok; c.done = true; c.picked = i; c.ok = ok;
    const chips = []; let head;
    if (ok) {
      const pay = Math.round(36 * [1, 1.6, 2.4][q.d - 1] * franchiseMult());
      S.cash += pay; S.earned += pay; S.rep = Math.min(100, S.rep + 4); S.phoneOK++;
      chips.push('<span class="big">+' + money(pay) + '</span>', '<span>reputation +4</span>', '<span>call handled</span>');
      head = 'Call handled. They thank you and hang up.';
    } else {
      S.rep = Math.max(0, S.rep - 5); S.phoneBad++;
      chips.push('<span>reputation -5</span>', '<span>queued for review</span>');
      head = 'Not quite. The caller sounds unsure and hangs up.';
    }
    const m = srSeed(S.mastery[q.k] || { box: 0, seen: 0, ok: 0 });
    m.seen++; if (ok) { m.ok++; m.lapse = 0; m.box = Math.min(3, m.box + 1); } else slip(m);
    if (srOn()) srUpdate(m, ok, undefined);
    S.mastery[q.k] = m;
    const mi = S.missed.indexOf(q.k);
    if (!ok && mi < 0) S.missed.push(q.k);
    if (ok && m.box >= 2 && mi >= 0) S.missed.splice(mi, 1);
    save(); checkAwards();
    const correctText = c.opts.find(o => o.ok).t;
    c.resHTML = '<div class="result ' + (ok ? 'good' : 'fail') + '" id="result"><h3>' + esc(head) + '</h3>' + (ok ? '' : '<p><b>Answer:</b> ' + esc(correctText) + '</p>') + '<div class="pay">' + chips.join('') + '</div><p>' + esc(q.e) + '</p><div><button class="btn go" id="hangbtn" type="button">Hang up</button></div></div>';
    renderPanel(); renderStats(); renderMastery(); renderReview();
    const hb = $('#hangbtn'); if (hb) { hb.focus({ preventScroll: true }); hb.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  }
  function hangUp() {
    phone.open = false; phone.call = null; scheduleNext(100, 80); backToQ();
  }
  function phoneHTML() {
    const c = phone.call; if (!c) return '';
    const opts = c.opts.map((o, i) => {
      let k = ''; if (c.done) { if (o.ok) k = 'ok'; else if (i === c.picked) k = 'bad'; }
      return '<button type="button" class="opt ' + k + '" data-ph="' + i + '" ' + (c.done ? 'disabled' : '') + '><kbd>' + (i + 1) + '</kbd><span>' + esc(o.t) + '</span></button>';
    }).join('');
    return '<article class="rx phonecall"><div class="rx-head"><span class="rx-sym" aria-hidden="true">&#9742;</span><div class="rx-meta"><b>' + esc(c.th.name.toUpperCase()) + ' \u00B7 incoming call</b><span>' + esc(c.caller) + '</span></div></div>' +
      '<div class="rx-body"><div class="patient"><div class="avatar callav" aria-hidden="true">&#9742;&#65039;</div><div class="bubble"><em>' + esc(c.line) + '</em><p>' + esc(c.q.q) + '</p></div></div>' +
      '<div class="opts" role="group" aria-label="Answer choices">' + opts + '</div>' +
      '<div class="tools"><span class="keyhint">The patient at the counter is waiting. Their timer is paused during the call.</span></div></div>' + (c.resHTML || '') + '</article>';
  }
  function phoneTick() {
    if (focusOn() || learning() || labOn()) return;
    const now = Date.now();
    if (phone.ringing) { if (now >= phone.until) missCall(); else updatePhoneBtn(); }
    else if (!phone.open && !fp.on && now >= phone.nextAt && cur && !cur.empty && S.served >= 4) startRing();
  }
  let flipTab = false, lastRendered = '';
  function renderPanel() {
    micSync();
    const pn = $('#qpanel'); if (!pn) return;
    pn.classList.toggle('karen', !!(cur && cur.karen && !cur.done && view === 'q'));
    pn.classList.toggle('wide', !!(view === 'q' && cur && cur.q && cur.q.place));
    const body = view === 'create' ? createHTML() : view === 'awards' ? awardsHTML() : view === 'phone' ? phoneHTML() : view === 'fp' || view === 'him' ? '' : view === 'shift' ? shiftHTML() : view === 'daily' ? dailyHTML() : view === 'mic' ? micHTML() : view === 'board' ? boardHTML() : view === 'flags' ? flagsHTML() : view === 'flash' ? fcHTML() : view === 'syn' ? synHTML() : view === 'ref' ? refHTML() : view === 'retire' ? retireHTML() : view === 'set' ? settingsHTML() : view === 'opts' ? optionsHTML() : view === 'studies' ? studiesHTML() : (cur ? cardHTML() : '');
    $('#counter').innerHTML = qbar() + body;
    const nb = document.querySelector('.nbk');
    if (nb) {
      if (flipTab) { nb.classList.add('still'); const sh = nb.querySelector('.nbsheet'); if (sh) sh.classList.add('flip'); }
      else if (lastRendered === view) nb.classList.add('still');
    }
    flipTab = false; lastRendered = view;
    if (view === 'set') applyFind();
    fitPanel();
    observeInset();
  }
  let insetObs = null;
  function observeInset() {
    if (!World.ok) return;
    if (!insetObs && window.ResizeObserver) { insetObs = new ResizeObserver(updateInset); insetObs.observe($('#qpanel')); insetObs.observe($('#stage')); }
    updateInset();
  }
  function updateInset() {
    if (!World.ok) return;
    const st = $('#stage').getBoundingClientRect(), p = $('#qpanel').getBoundingClientRect();
    if (!p.width || $('#stage').classList.contains('fpmode')) { World.setInset(0, 0); return; }
    if (p.width > st.width - 30) World.setInset(0, Math.max(0, st.bottom - p.top));
    else World.setInset(Math.max(0, st.right - p.left), 0);
  }
  /* On phones the question card must show every option without scrolling: shrink the card a notch at a time until it fits,
     and re-check whenever fonts load or the content changes size (late web fonts make text taller). */
  let fitBusy = false, fitRaf = 0;
  const fitOK = () => document.body.classList.contains('fx') && !$('#qpanel').classList.contains('min') && (view === 'q' || view === 'phone') && window.matchMedia('(max-width: 900px), (max-height: 520px)').matches;
  const overflows = (q) => q.scrollHeight > q.clientHeight + 1;
  function fitPanel(reset = true) {
    const q = $('#qpanel'), c = $('#counter');
    if (!q || !c || fitBusy) return;
    fitBusy = true;
    try {
      if (!fitOK()) { c.style.zoom = ''; return; }
      let z = reset ? 1 : (parseFloat(c.style.zoom) || 1);
      c.style.zoom = z === 1 ? '' : z;
      while (overflows(q) && z > 0.55) { z = Math.round((z - 0.04) * 100) / 100; c.style.zoom = z; }
      while (z < 1) { const t = Math.round((z + 0.04) * 100) / 100; c.style.zoom = t; if (overflows(q)) { c.style.zoom = z; break; } z = t; }
      if (z >= 1) c.style.zoom = '';
    } finally { fitBusy = false; }
  }
  const fitSoon = () => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(() => fitPanel(false)); };
  window.addEventListener('resize', fitSoon);
  window.addEventListener('orientationchange', () => setTimeout(fitSoon, 250));
  if (window.ResizeObserver) new ResizeObserver(fitSoon).observe($('#counter'));
  if (document.fonts) { if (document.fonts.ready) document.fonts.ready.then(fitSoon); if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', fitSoon); }
  function qExpand() { const p = $('#qpanel'); if (p) { p.classList.remove('min'); const b = $('#qgrab'); if (b) { b.setAttribute('aria-expanded', 'true'); b.firstElementChild.textContent = 'Hide card to see the pharmacy'; } } }
  function openView(v) {
    if (view === 'syn' && v !== 'syn') synExit();
    qExpand();
    if (view === 'q' && cur && !cur.done && !cur.empty) cur.pausedAt = Date.now();
    view = v; studyMsg = v === 'studies' ? studyMsg : ''; viewTimers(); renderPanel();
    $('#qpanel').scrollTop = 0;
  }
  let nbClosing = false;
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('#qgrab'); if (!b) return; const p = $('#qpanel'), min = p.classList.toggle('min'); b.setAttribute('aria-expanded', String(!min)); b.firstElementChild.textContent = min ? 'Show question card' : 'Hide card to see the pharmacy'; if (World.ok) updateInset(); fitPanel(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.body.classList.remove('drawer'); });
  function backToQ() {
    if ((view === 'studies' || view === 'set' || view === 'opts') && !nbClosing) {
      const pane = document.querySelector('.nbk');
      if (pane) { nbClosing = true; pane.classList.add('closing'); setTimeout(() => { backToQ(); nbClosing = false; }, 320); return; }
    }
    if ((view === 'studies' || view === 'set' || view === 'opts') && nbClosing && !document.querySelector('.nbk.closing')) return;
    view = 'q'; viewTimers();
    if (dirty) { dirty = false; newCard(); return; }
    resumeTimers();
    renderPanel();
  }

  /* ---- other panels ---- */
  const IC = {
    coin: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#F1A20E" stroke="#10292C" stroke-width="2"/><path d="M12 6v12M15 9.2c-.6-1-1.7-1.4-3-1.4-1.7 0-2.8.8-2.8 2 0 3 6 1.4 6 4.2 0 1.2-1.2 2-3 2-1.3 0-2.5-.5-3.1-1.6" fill="none" stroke="#10292C" stroke-width="1.8" stroke-linecap="round"/></svg>',
    rep: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.800-8 11-8 11z" fill="#E04F3A" stroke="#10292C" stroke-width="2" stroke-linejoin="round"/></svg>',
    streak: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z" fill="#F1A20E" stroke="#10292C" stroke-width="2" stroke-linejoin="round"/></svg>',
    tips: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L5 14h6l-1 8 8-12h-6z" fill="#0E9A8E" stroke="#10292C" stroke-width="2" stroke-linejoin="round"/></svg>'
  };
  function renderStats() {
    $('#stats').innerHTML = `
      <div class="stat cash" title="Cash"><i class="ic">${IC.coin}</i><span class="lbl">Cash</span><b id="cashv">${money(S.cash)}</b></div>
      <div class="stat rep" title="Reputation"><i class="ic">${IC.rep}</i><span class="lbl">Reputation</span><b>${Math.round(S.rep)}<small>/100</small></b><div class="repbar"><i class="${S.rep < 30 ? 'low' : ''}" style="width:${S.rep}%"></i></div></div>
      <div class="stat streak" id="streakstat" title="Answers in a row (best ${S.best})" role="img" aria-label="Streak ${S.streak}, best ${S.best}"><b style="${S.streak >= 100 ? 'font-size:13px' : S.streak >= 10 ? 'font-size:16px' : ''}">${S.streak}</b></div>`;
    streakFx(S.streak || 0); vialSync();
  }
  function sceneSVG() {
    const L = S.up, nb = Math.min(30, 6 + L.shelf * 2), cols = ['var(--teal)', 'var(--amber)', 'var(--coral)', 'var(--teal-ink)'];
    let g = '<rect x="0" y="0" width="360" height="180" rx="14" style="fill:var(--surface2)"/>';
    [50, 88, 126].forEach(y => { g += `<rect x="12" y="${y}" width="336" height="5" rx="2" style="fill:var(--line)"/>`; });
    for (let i = 0; i < nb; i++) {
      const row = i % 3, col = Math.floor(i / 3), y = [50, 88, 126][row], x = 22 + col * 31, c = cols[(i * 7 + row) % 4], h = 22 + ((i * 5) % 3) * 4;
      g += `<rect x="${x}" y="${y - h}" width="18" height="${h}" rx="4" style="fill:${c}"/><rect x="${x + 3}" y="${y - h - 6}" width="12" height="7" rx="2" style="fill:var(--ink)"/><rect x="${x + 3}" y="${y - h + 7}" width="12" height="8" rx="1" style="fill:var(--surface)"/>`;
    }
    g += `<rect x="8" y="148" width="344" height="26" rx="9" style="fill:var(--ink)"/><rect x="8" y="148" width="344" height="5" rx="2.5" style="fill:var(--amber)"/><text x="180" y="168" text-anchor="middle" style="fill:var(--surface);font:700 11px var(--f-mono);letter-spacing:.14em">CORNER Rx  #${S.franchises + 1}</text>`;
    return `<svg class="scene" viewBox="0 0 360 180" role="img" aria-label="Your pharmacy shelves">${g}</svg>`;
  }
  function renderStore() {
    if (World.ok) World.sync();
    const rk = rankInfo(), prog = rk.to ? Math.min(100, (S.correct - rk.from) / (rk.to - rk.from) * 100) : 100;
    $('#store').innerHTML = `<h2>Your pharmacy <small>${S.correct} correct &middot; ${S.wrong} missed</small></h2>
      <div class="store-name"><b>${esc(shopName())}</b><span>${tierName()} \u00B7 Location #${S.franchises + 1}</span></div>
      ${World.ok ? '' : sceneSVG()}
      <div class="rank"><div class="rank-row"><b>${rk.name}</b><span>${rk.to ? (rk.to - S.correct) + ' correct to promotion' : 'Top rank reached'}</span></div><div class="bar amber"><i style="width:${prog}%"></i></div></div>
      <p class="note" style="margin-top:12px">Karens calmed: ${S.karenWin} &middot; Refunds paid: ${S.karenLoss}<br>Jim helped: ${S.jimWin} &middot; Jim interruptions: ${S.jimLoss}<br>Calls answered: ${S.phoneOK} &middot; Wrong: ${S.phoneBad} &middot; Missed: ${S.phoneMiss}<br>Bottle checks: ${S.bottleOK || 0} right &middot; ${S.bottleBad || 0} wrong &middot; Police visits: ${S.polLoss || 0}</p>`;
  }
  function icon(id) {
    const g = {
      shelf: '<rect x="9" y="12" width="6" height="8" rx="1.5"/><rect x="17" y="9" width="6" height="11" rx="1.5"/><rect x="25" y="14" width="6" height="6" rx="1.5"/><rect x="7" y="22" width="26" height="3" rx="1.5"/>',
      tech: '<circle cx="20" cy="14" r="5.5"/><path d="M9 29c1-6 5-9 11-9s10 3 11 9z"/>',
      train: '<path d="M20 9l14 7-14 7-14-7z"/><path d="M12 21v6c0 2 4 4 8 4s8-2 8-4v-6l-8 4z"/><rect x="32" y="17" width="2" height="9"/>',
      counsel: '<path d="M8 10h24a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H18l-7 5v-5H8a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2z"/>',
      robot: '<rect x="9" y="14" width="22" height="17" rx="4"/><rect x="19" y="7" width="2.5" height="7"/><circle cx="20" cy="6" r="2.5"/><circle cx="15" cy="22" r="2.6" style="fill:var(--amber)"/><circle cx="25" cy="22" r="2.6" style="fill:var(--amber)"/>'
    }[id];
    return `<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" style="fill:var(--teal-soft)"/><g style="fill:var(--teal-ink)">${g}</g></svg>`;
  }
  function renderUpgrades() {
    $('#ups').innerHTML = `<h2>Upgrades <small>${money(S.cash)} on hand</small></h2><div class="ups">` + UPS.map(u => {
      const l = S.up[u.id], maxed = l >= u.max, cost = u.cost(l);
      return `<div class="up">${icon(u.id)}<div><h3>${u.name} <small>Lv ${l}/${u.max}</small></h3><p>${u.desc(l)}</p></div>
        <button type="button" class="buy" data-buy="${u.id}" data-cost="${cost}" ${maxed || S.cash < cost ? 'disabled' : ''}>${maxed ? 'MAX' : money(cost)}</button></div>`;
    }).join('') + '</div>';
  }
  function frCost() { return Math.round(2500 * Math.pow(1.6, S.franchises)); }
  function renderFranchise() {
    const cost = frCost(), can = S.cash >= cost, a = armed === 'fr';
    $('#franchise').innerHTML = `<h2>Open a new location <small>${S.franchises} open</small></h2>
      <p>Start a fresh location with a permanent +25% to all income. Cash and upgrades reset; your knowledge progress and decks stay. Replay the loop as often as you like.</p>
      <button type="button" class="btn go" id="frbtn" ${can ? '' : 'disabled'}>${a ? 'Tap again to confirm' : 'Open location #' + (S.franchises + 2) + ' for ' + money(cost)}</button>
      <div class="retire"><h3>Retirement</h3><p>${S.cash >= RETIRE_AT ? 'You made it. You can finally retire.' : 'Unlocks when you hold ' + money(RETIRE_AT) + '. You have ' + money(S.cash) + '.'}</p><button type="button" class="btn go" id="retirebtn" ${S.cash >= RETIRE_AT ? '' : 'disabled'}>Retire</button></div>`;
  }
  function masteryRow(label, n, total) { return `<div class="mrow"><b>${esc(label)}</b><span>${n}/${total}</span><div class="bar"><i style="width:${total ? n / total * 100 : 0}%"></i></div></div>`; }
  function renderMastery() {
    let h = '<h2>Mastery by topic <small>2 right in a row = mastered</small></h2>' + calibNote() + (dueCount() ? '<p class="note"><b>' + dueCount() + ' question' + (dueCount() === 1 ? ' is' : 's are') + ' due for review.</b> Pick Individual review in Settings whenever you want to run through them. They wait if you are busy with something else.</p>' : '');
    CATS.forEach(c => {
      if (c[0] === 'MY') return;
      if (c[0] === 'CALC') { h += `<div class="mrow"><b>${c[1]}</b><span>${S.calcOK} solved</span><div class="bar"><i style="width:${Math.min(100, S.calcOK / 20 * 100)}%"></i></div></div>`; return; }
      if (c[0] === 'TP1') { const un = TOPQ.filter(q => q.c === 'TP1' && !(q.from > todayStr())); h += masteryRow('Weekly drugs P1 (unlocked)', un.filter(q => (S.mastery[q.k] || {}).box >= 2).length, un.length); return; }
      if (c[0] === 'TP3') { const un = TOPQ.filter(q => q.c === 'TP3' && !(q.from > todayStr())); h += masteryRow('Weekly drugs P3 (unlocked)', un.filter(q => (S.mastery[q.k] || {}).box >= 2).length, un.length); return; }
      if (c[0] === 'TOP') { const un = TOPQ.filter(q => q.c === 'TOP' && !(q.from > todayStr())); h += masteryRow('Weekly drugs (unlocked)', un.filter(q => (S.mastery[q.k] || {}).box >= 2).length, un.length); return; }
      const qs = BANK.filter(q => q.c === c[0]);
      h += masteryRow(c[1], qs.filter(q => (S.mastery[q.k] || {}).box >= 2).length, qs.length);
    });
    S.decks.forEach(d => { h += masteryRow(d.name, d.items.filter(q => (S.mastery[q.k] || {}).box >= 2).length, d.items.length); });
    $('#mastery').innerHTML = h;
  }
  function renderReview() {
    const items = S.missed.slice(-5).reverse().map(k => BYKEY[k]).filter(Boolean);
    $('#review').innerHTML = `<h2>Review shelf <small>${S.missed.length} waiting</small></h2>` + (items.length
      ? `<div class="rev">${items.map(q => `<div><b>${esc(q.q)}</b><span>${esc(q.ms ? q.as.join(' · ') : q.a)}</span></div>`).join('')}</div>`
      : '<p class="empty">Nothing here yet. Questions you miss land on this shelf and come back more often until you answer them correctly twice in a row.</p>');
  }
  function renderAll() { renderStats(); renderStore(); renderUpgrades(); renderFranchise(); renderMastery(); renderReview(); renderReset(); }
  function renderReset() {
    $('#resetwrap').innerHTML = `<button type="button" class="link ${armed === 'reset' ? 'arm' : ''}" id="resetbtn">${armed === 'reset' ? 'Tap again to erase all progress and decks' : 'Reset progress'}</button>`;
  }

  /* ---- buying ---- */
  function buyUp(id) {
    const u = UPS.find(x => x.id === id), l = S.up[id], cost = u.cost(l);
    if (l >= u.max || S.cash < cost) return false;
    S.cash -= cost; S.up[id]++;
    save(); renderStats(); renderStore(); renderUpgrades(); renderFranchise();
    if (view === 'q' && cur && !cur.empty) renderPanel();
    return true;
  }
  function tagInfo(id) {
    const u = UPS.find(x => x.id === id), l = S.up[id], cost = u.cost(l), maxed = l >= u.max;
    return { name: u.short, lvl: l, max: u.max, maxed, can: !maxed && S.cash >= cost, costText: money(cost).slice(1) };
  }

  /* ---- study decks ---- */
  function findDeck(name) { const n = name.trim().toLowerCase(); return S.decks.find(d => d.name.toLowerCase() === n); }
  function syncBrand() { const h = document.querySelector('.brand h1'); if (h) h.textContent = shopName(); }
  function readShop() { const el = $('#shopname'); if (el) { S.shop = el.value.replace(/\s+/g, ' ').trim().slice(0, 24); save(); syncBrand(); } }
  function readDraft() {
    readQz();
    const t = $('#studytext'), n = $('#deckname');
    if (t) draft.text = t.value; if (n) draft.name = n.value; const dd = $('#deckdate'); if (dd) draft.from = dd.value;
  }
  function previewHTML(r) {
    let h = '';
    if (r.items.length) h += `<div>${r.items.length} question${r.items.length === 1 ? '' : 's'} ready for deck <b>${esc(draft.name.trim() || r.deckName)}</b>${r.items.some(i => i.auto) ? ' (some wrong answers were filled in from your other answers)' : ''}.</div><div>First: ${esc(r.items[0].q)}</div>`;
    if (r.errors.length) h += `<div><b>${r.errors.length} problem${r.errors.length === 1 ? '' : 's'}:</b><ul>${r.errors.slice(0, 6).map(e => `<li>${e.line ? 'Line ' + e.line + ': ' : ''}${esc(e.msg)}</li>`).join('')}</ul></div>`;
    if (r.warnings.length) h += `<div>Notes: ${esc(r.warnings.slice(0, 3).map(w => 'line ' + w.line + ' ' + w.msg).join(' '))}</div>`;
    return `<div class="prev ${r.errors.length ? 'err' : 'good'}">${h}</div>`;
  }
  const quizletOK = u => /^https:\/\/(www\.)?quizlet\.com\//i.test(String(u || ''));
  function readQz() { const g = id => { const e = $(id); return e ? e.value : null; }; const n = g('#qzname'), u = g('#qzurl'), t = g('#qztext'); if (n !== null) qz.name = n; if (u !== null) qz.url = u; if (t !== null) qz.text = t; }
  function addQuizlet() {
    readQz();
    const c = quizletToJson(qz.text, qz.dir), url = qz.url.trim();
    const bad = m => { $('#qzprev').innerHTML = `<div class="prev err">${esc(m)}</div>`; };
    if (url && !quizletOK(url)) return bad('The link should start with https://quizlet.com/. Clear it to import without a link.');
    if (c.count < 4) return bad(c.count ? 'Only ' + c.count + ' card(s) found. Quizlet sets need at least 4 cards so wrong choices can be filled in.' : 'No cards found. Paste the exported text with the term and definition on each line separated by a tab.');
    const r = parseStudy(c.json, 'Quizlet set');
    if (!r.items.length) return bad(r.errors.length ? r.errors[0].msg : 'Nothing could be imported.');
    addStudy(r, (qz.name.trim() || 'Quizlet set').slice(0, 60), url);
    qz.text = ''; qz.url = ''; qz.name = ''; renderPanel();
  }
  function addStudy(pre, preName, preUrl) {
    if (!pre) readDraft();
    const r = pre || parseStudy(draft.text, 'My notes');
    if (!r.items.length) { $('#studyprev').innerHTML = previewHTML(r); return; }
    const name = preName || (draft.name.trim() || r.deckName || 'My notes').slice(0, 60);
    let deck = findDeck(name);
    if (!deck) { deck = { id: 'd' + Date.now().toString(36), name, enabled: true, items: [] }; S.decks.push(deck); }
    if (preUrl) deck.url = preUrl;
    const have = {}; deck.items.forEach(q => { have[q.k] = q; });
    let added = 0;
    r.items.forEach(it => {
      const from = it.from || (pre ? '' : draft.from) || '';
      const q = { c: 'MY', d: it.d, q: it.q, a: it.a, w: it.w, e: it.e, t: it.t, from: from, k: hash(deck.id + '|' + it.q) };
      if (!have[q.k]) { deck.items.push(q); have[q.k] = q; added++; } else if (from) have[q.k].from = from;
    });
    S.set.topics.MY = true; deck.enabled = true; dirty = true;
    rebuildIndex(); save();
    studyMsg = `Added ${added} question${added === 1 ? '' : 's'} to "${name}"` + (r.items.length - added ? ` (${r.items.length - added} duplicates skipped)` : '') + (r.errors.length ? `, ${r.errors.length} skipped because of problems` : '') + '. They join your next patients.';
    if (!pre) draft.text = ''; renderPanel(); renderMastery(); renderReview();
    if (World.ok) World.sync();
  }
  /* ---- first-run tour (menus only; events stay a surprise) ---- */
  let tourEl = null, tourStep = 0, tourPaused = 0;
  const TOUR = [
    { t: 'Welcome to Corner Rx', p: 'You are the pharmacist at the counter. Each patient asks one question. Pick the right answer to earn cash and reputation, and read the explanation when you miss one. Take your time at first.' },
    { t: 'The menu', p: 'Tap the menu button in the top right.', l: [['Upgrades', 'spend your cash on the pharmacy'], ['Progress & awards', 'mastery, photos, pets and the weekly calendar'], ['Topics', 'pick courses, topics and weekly drugs; the Settings tab has mode and difficulty; add your own questions under My studies'], ['Focus mode', 'just the questions, no 3D world'], ['Drug reference', 'the weekly drug lists']] },
    { t: 'Look around', p: 'Drag to look around the pharmacy and pinch to zoom. Tap glowing spots to build upgrades. The corner button makes the game full screen, and the bar above the question card hides it so you can see the shop.' },
    { t: 'What mastered means', p: 'A question is mastered after two correct answers in a row. One miss on a mastered question is forgiven and it comes back for a check the next day, but a second miss in a row sends it back to zero. Each topic has Bronze, Silver and Gold tiers at 30%, 60% and 90% of its questions mastered, and every tier hangs a photo on the pharmacy wall. Mastered questions fade out of the mix, so you see mostly new and missed ones.' },
    { t: 'Your progress', p: 'Everything saves in this browser. To back up or move to another device, open Progress and copy your save code. Good luck out there.' }
  ];
  function drawTour() {
    const s = TOUR[tourStep], last = tourStep === TOUR.length - 1;
    tourEl.innerHTML = '<div class="tourcard" role="dialog" aria-modal="true" aria-label="Quick tour"><h3>' + esc(s.t) + '</h3><p>' + esc(s.p) + '</p>' +
      (s.l ? '<ul>' + s.l.map(x => '<li><b>' + esc(x[0]) + '</b><span>' + esc(x[1]) + '</span></li>').join('') + '</ul>' : '') +
      '<div class="tourdots">' + TOUR.map((x, i) => '<i class="' + (i === tourStep ? 'on' : '') + '"></i>').join('') + '</div>' +
      '<div class="tourbtns">' + (tourStep ? '<button type="button" class="btn" data-act="tour-back">Back</button>' : '') + '<button type="button" class="btn go" data-act="tour-next">' + (last ? 'Start serving' : 'Next') + '</button>' + (last ? '' : '<button type="button" class="skip" data-act="tour-skip">Skip tour</button>') + '</div></div>';
  }
  function showTour() { if (tourEl) return; tourStep = 0; tourPaused = Date.now(); tourEl = document.createElement('div'); tourEl.className = 'tour'; document.body.appendChild(tourEl); drawTour(); }
  function endTour() {
    if (tourEl) { tourEl.remove(); tourEl = null; }
    S.tutDone = true; save(); setTimeout(maybeJoinAsk, 1500);
    if (cur && !cur.done && !cur.empty && tourPaused) cur.t0 += Date.now() - tourPaused;
    tourPaused = 0;
  }
  /* one-time welcome prompt: pick a nickname to join the leaderboard (only when the online database is configured) */
  let joinEl = null;
  function maybeJoinAsk() {
    if (navigator.webdriver && !/[?&]ask=1/.test(location.search)) return; /* automated tests: stay quiet unless ?ask=1 */
    if (joinEl || !Net.on() || !S.me.done || !S.tutDone || S.boardOn || S.boardAsked || tourEl) return;
    joinEl = document.createElement('div'); joinEl.className = 'tour joinask'; joinEl.setAttribute('role', 'dialog'); joinEl.setAttribute('aria-label', 'Join the leaderboard');
    joinEl.innerHTML = `<div class="joincard"><h3>Join the leaderboard?</h3><p>Pick a nickname and see how you rank against other pharmacy students this week. No account, no email. Only your nickname and your numbers are shared, and you can leave any time from the Leaderboard page.</p><input id="joinnick" class="field" type="text" maxlength="24" autocomplete="off" placeholder="e.g. RxRanger" aria-label="Nickname"><div class="btnrow"><button type="button" class="btn go" data-act="join-go">Join</button><button type="button" class="btn" data-act="join-skip">Not now</button></div></div>`;
    document.body.appendChild(joinEl); const f = joinEl.querySelector('input'); if (f) f.focus();
  }
  function closeJoin() { if (joinEl) { joinEl.remove(); joinEl = null; } S.boardAsked = true; save(); }
  function maybeTour() { if (S.me.done && !S.tutDone && !tourEl) showTour(); }
  /* ---- save code: the whole save as one long code, to move progress between devices or keep a backup ---- */
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


  /* ---- music: lofi tapes for the counter radio, made with WebAudio (no audio files). MUS_TAPES holds the music for each tape id in SHOP_TAPES (shop.js). Plays only while the Tape radio is placed and Music is on; starts after the first tap or key; pauses when the tab is hidden ---- */
  const MUS_TAPES = {
    t1: { bpm: 76, ch: [{ b: 48, n: [60, 64, 67, 71, 74] }, { b: 45, n: [57, 60, 64, 67, 71] }, { b: 50, n: [62, 65, 69, 72, 76] }, { b: 43, n: [59, 62, 65, 69, 71] }], pen: [67, 69, 72, 74, 76, 79, 81, 84], kick: [0, 5], snare: 4, sw: 0.14, mel: 0.5, lp: 4200 },
    t2: { bpm: 84, ch: [{ b: 45, n: [57, 60, 64, 67, 71] }, { b: 38, n: [62, 65, 69, 72, 76] }, { b: 43, n: [59, 62, 65, 69, 76] }, { b: 48, n: [59, 64, 67, 71, 74] }], pen: [69, 72, 74, 76, 79, 81, 84, 88], kick: [0, 5], snare: 4, sw: 0.12, mel: 0.6, lp: 3800, rel: 2.2, pad: 0.03, arp: [0, 2, 1, 3, 2, 4, 3, 1] },
    t3: { bpm: 92, ch: [{ b: 50, n: [62, 65, 69, 72, 76] }, { b: 43, n: [59, 62, 64, 65, 69] }, { b: 48, n: [64, 67, 71, 74, 79] }, { b: 45, n: [61, 64, 67, 69, 73] }], pen: [72, 74, 76, 79, 81, 84, 86, 88], kick: [0, 3, 6], snare: 4, sw: 0.26, mel: 0.6, lp: 4800, rel: 1.4, stab: [2, 3, 6], pad: 0.02 },
    t4: { bpm: 80, ch: [{ b: 41, n: [60, 64, 67, 69, 72] }, { b: 40, n: [59, 62, 66, 67, 71] }, { b: 38, n: [60, 65, 69, 72, 76] }, { b: 43, n: [59, 64, 65, 69, 74] }], pen: [67, 69, 72, 74, 76, 79], kick: [0, 5], snare: 4, sw: 0.18, mel: 0, lp: 3400, rel: 2.4, pad: 0.035, arp: [0, 1, 2, 1, 3, 2, 1, 0], voice: { vowel: 'aah', vol: 0.07, ph: [[0, 72, 3], [3, 76, 2], [5, 74, 3], [8, 71, 4], [13, 74, 3], [16, 69, 3], [19, 72, 2], [21, 74, 3], [24, 74, 4], [29, 71, 3]] } },
    t5: { bpm: 88, ch: [{ b: 41, n: [57, 60, 64, 65, 69] }, { b: 43, n: [59, 62, 64, 67, 69] }, { b: 40, n: [59, 62, 64, 67, 71] }, { b: 45, n: [57, 60, 64, 67, 72] }], pen: [69, 72, 74, 76, 77, 81, 84, 86], kick: [0, 4], snare: 2, sw: 0.12, mel: 0.55, lp: 5200 }
  };
  const MUS = (() => {
    let a = null, bus = null, lp = null, nz = null, timer = null, nextT = 0, step = 0, bar = 0, mi = 2, started = false, ready = false, active = false;
    const tp = () => MUS_TAPES[(S.store || {}).tape] || MUS_TAPES.t1, sp = () => 60 / tp().bpm / 2, mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
    const radioOwned = () => ((S.store || {}).deco || []).indexOf('radio') >= 0;
    function init() {
      if (ready) return !!a;
      ready = true;
      try {
        const C = window.AudioContext || window.webkitAudioContext; if (!C) return false;
        a = new C(); bus = a.createGain(); bus.gain.value = 0;
        lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200;
        const dl = a.createDelay(1); dl.delayTime.value = 0.4; const fb = a.createGain(); fb.gain.value = 0.28; const wet = a.createGain(); wet.gain.value = 0.22;
        bus.connect(lp); lp.connect(a.destination); lp.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(a.destination);
        nz = a.createBuffer(1, a.sampleRate, a.sampleRate); const d = nz.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      } catch (err) { a = null; }
      return !!a;
    }
    function tone(t, f, dur, type, vol, cut, atk, rel) {
      const o = a.createOscillator(), g = a.createGain(), fl = a.createBiquadFilter();
      o.type = type; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = cut;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + rel);
      o.connect(fl); fl.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + rel + 0.05);
    }
    function hit(t, dur, vol, type, freq) {
      const s = a.createBufferSource(), g = a.createGain(), fl = a.createBiquadFilter();
      s.buffer = nz; fl.type = type; fl.frequency.value = freq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(fl); fl.connect(g); g.connect(bus); s.start(t); s.stop(t + dur + 0.02);
    }
    function kick(t) {
      const o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      g.gain.setValueAtTime(0.34, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28); o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.3);
    }
    function voice(t, m, dur, V) {
      const f = mf(m), mix = a.createGain(), fl = a.createBiquadFilter(), env = a.createGain(), lfo = a.createOscillator(), lg = a.createGain(), dl = a.createGain();
      const fm = V.vowel === 'ooh' ? [[350, 6, 1], [800, 8, 0.4]] : [[730, 7, 1], [1090, 9, 0.6]];
      [-7, 7].forEach(dt => { const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dt; lg.connect(o.detune); o.connect(mix); o.start(t); o.stop(t + dur + 0.9); });
      lfo.frequency.value = 5.1; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(9, t + 0.5); lfo.connect(lg); lfo.start(t); lfo.stop(t + dur + 0.9);
      fl.type = 'lowpass'; fl.frequency.value = 2600; mix.connect(fl);
      fm.forEach(q => { const bp = a.createBiquadFilter(), g = a.createGain(); bp.type = 'bandpass'; bp.frequency.value = q[0]; bp.Q.value = q[1]; g.gain.value = q[2]; fl.connect(bp); bp.connect(g); g.connect(env); });
      env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(V.vol, t + 0.14); env.gain.setValueAtTime(V.vol, t + Math.max(0.15, dur - 0.1)); env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.7);
      env.connect(bus);
    }
    function play(s, t) {
      const P = tp(), SP = sp(), c = P.ch[bar % 4], tt = t + ((s % 2) ? SP * P.sw : 0);
      if (s === 0) {
        c.n.forEach((m, i) => tone(t + i * 0.012, mf(m), SP * 7, 'triangle', 0.028, 1500, 0.08, P.rel || 1.4));
        if (P.pad) c.n.slice(0, 3).forEach(m => tone(t, mf(m - 12), SP * 8, 'sine', P.pad, 900, 0.5, 1.2));
        tone(t, mf(c.b), SP * 3.4, 'sine', 0.2, 600, 0.02, 0.35);
      }
      if (s === 5) tone(tt, mf(c.b + 12), SP * 1.6, 'sine', 0.12, 700, 0.02, 0.25);
      if (s === 0 || s === 3 || s === 6) { const m = c.n[(bar + s) % c.n.length] + 12; tone(tt, mf(m), SP * 1.2, 'triangle', 0.05, 2400, 0.008, 0.5); }
      if (s === 2 || s === 5 || s === 7) {
        if (Math.random() < P.mel) { mi = Math.max(0, Math.min(P.pen.length - 1, mi + (Math.random() < 0.5 ? -1 : 1) * (1 + (Math.random() < 0.3 ? 1 : 0)))); tone(tt, mf(P.pen[mi]), SP * 1.6, 'sine', 0.06, 3200, 0.01, 0.9); }
      }
      if (P.voice) P.voice.ph.forEach(n => { if (n[0] === (bar % 4) * 8 + s) voice(tt, n[1], SP * n[2], P.voice); });
      if (P.arp) tone(tt, mf(c.n[P.arp[s]] + 12), SP * 2.4, 'triangle', 0.034, 2600, 0.01, 1.1);
      if (P.stab && P.stab.indexOf(s) >= 0) c.n.slice(1).forEach((m, i) => tone(tt + i * 0.008, mf(m), SP * 0.9, 'triangle', 0.03, 2200, 0.005, 0.35));
      if (P.kick.indexOf(s) >= 0) kick(t);
      if (s === P.snare) hit(t, 0.16, 0.07, 'bandpass', 1900);
      if (s % 2) hit(tt, 0.05, 0.035, 'highpass', 7000);
    }
    function pump() {
      if (!a || !started || !active) return;
      if (nextT < a.currentTime) nextT = a.currentTime + 0.06;
      while (nextT < a.currentTime + 1.6) { play(step, nextT); nextT += sp(); step++; if (step === 8) { step = 0; bar++; } }
    }
    function fade(v) { if (!a) return; const t = a.currentTime; bus.gain.cancelScheduledValues(t); bus.gain.setValueAtTime(bus.gain.value, t); bus.gain.linearRampToValueAtTime(v, t + 1.2); }
    function want() { return S.music !== false && radioOwned() && !document.hidden; }
    function spin() { try { if (World.ok && World.setRadio) World.setRadio(S.music !== false && radioOwned()); } catch (err) { /* cosmetic */ } }
    function sync() {
      spin();
      if (want()) {
        if (!init()) return;
        if (a.state === 'suspended') { try { a.resume(); } catch (err) { /* ignore */ } }
        lp.frequency.value = tp().lp; active = true;
        if (!started) { started = true; nextT = a.currentTime + 0.1; step = 0; timer = setInterval(pump, 250); }
        pump(); fade(0.16);
      } else if (started) { active = false; fade(0); }
    }
    function tape() { step = 0; bar = 0; mi = 2; if (a) nextT = a.currentTime + 0.15; sync(); }
    function owned() { return SHOP_TAPES.filter(t => !t[2] || shopOwn(t[0])).map(t => t[0]); }
    function tap() {
      if (!radioOwned()) return;
      const l = owned(), cur = (S.store.tape || 't1');
      if (S.music === false) { S.music = true; toast('Radio on: ' + tapeName(cur) + '.'); }
      else if (l.length < 2) { S.music = false; toast('Radio off.'); }
      else { const i = l.indexOf(cur), nx = l[(i + 1) % l.length]; S.store.tape = nx; toast('Tape in: ' + tapeName(nx) + '.'); tape(); }
      save(); musLabel(); sync(); SFX.play('ok');
    }
    function tapeName(id) { const t = SHOP_TAPES.find(x => x[0] === id); return t ? t[1] : id; }
    function arm() {
      const go = () => { document.removeEventListener('pointerdown', go, true); document.removeEventListener('keydown', go, true); sync(); };
      document.addEventListener('pointerdown', go, true); document.addEventListener('keydown', go, true);
      document.addEventListener('visibilitychange', sync);
    }
    return { sync: sync, arm: arm, tape: tape, tap: tap, owned: owned, radio: radioOwned, playing: () => active };
  })();
  function musLabel() {
    const on = S.music !== false, l = $('#muslab'), b = $('#musbtn'), has = ((S.store || {}).deco || []).indexOf('radio') >= 0;
    if (l) l.textContent = 'Radio: ' + (on ? 'on' : 'off');
    if (b) { b.setAttribute('aria-pressed', String(on)); b.style.display = has ? '' : 'none'; }
  }

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
    if (big) pwAdd('hint', 1);
    SFX.play('streak');
    return '<p class="gift streak"><b>' + S.streak + ' in a row!</b> Streak bonus ' + money(bonus) + (big ? ' plus 1 hint pill' : '') + '.</p>';
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
  /* SM-2 spaced repetition. Each answer gets a 0-5 grade from correctness and the player's confidence; the interval grows by the ease factor. */
  const CONF_NAMES = { guess: 'Guess', sure: 'Pretty sure', certain: 'Certain' };
  function srGrade(ok, conf) { return ok ? (conf === 'guess' ? 3 : conf === 'certain' ? 5 : 4) : (conf === 'certain' ? 0 : conf === 'guess' ? 2 : 1); }
  function srSeed(m) { if (m.n === undefined && m.seen > 0) { m.n = m.box >= 2 ? 2 : m.box >= 1 ? 1 : 0; m.d = m.n === 2 ? 6 : m.n === 1 ? 1 : 0; } return m; } // older saves: start SM-2 from the existing box
  function srUpdate(m, ok, conf) {
    m.lt = Date.now();
    const q = srGrade(ok, conf);
    const early = q >= 3 && m.n > 0 && m.due > Date.now(); // an extra right answer before the review date is practice, not a longer interval
    if (early) { if (conf) { const c = S.cf = S.cf || {}; const o = c[conf] = c[conf] || { n: 0, ok: 0 }; o.n++; o.ok++; } m.cw = 0; return; }
    if (m.n === undefined) { m.n = 0; m.d = 0; }
    if (!m.ef) m.ef = 2.5;
    if (q >= 3) { m.n++; m.d = m.n === 1 ? 1 : m.n === 2 ? 6 : Math.round((m.d || 6) * m.ef); } else { m.n = 0; m.d = 1; }
    m.ef = Math.max(1.3, +(m.ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)).toFixed(3));
    m.due = Date.now() + m.d * 864e5;
    if (ok) m.cw = 0; else if (conf === 'certain') m.cw = 1;
    if (conf) { const c = S.cf = S.cf || {}; const o = c[conf] = c[conf] || { n: 0, ok: 0 }; o.n++; if (ok) o.ok++; }
  }
  function reviewDue(m) { if (!m || m.box < 2) return false; if (m.due !== undefined) return m.due <= Date.now(); return !!(m.t && (Date.now() - m.t) >= IV[Math.min(IV.length - 1, m.iv || 0)] * 864e5); }
  const fmtDays = (d) => d < 1.5 ? 'tomorrow' : d < 14 ? Math.round(d) + ' days' : d < 60 ? Math.round(d / 7) + ' weeks' : Math.round(d / 30) + ' months';
  function calibNote() {
    const c = S.cf || {}, t = (c.guess ? c.guess.n : 0) + (c.sure ? c.sure.n : 0) + (c.certain ? c.certain.n : 0);
    if (t < 5) return '';
    const pc = (k) => c[k] && c[k].n ? Math.round(c[k].ok / c[k].n * 100) + '% (' + c[k].n + ')' : 'none yet';
    let cw = 0; for (const k in S.mastery) if (BYKEY[k] && S.mastery[k].cw) cw++;
    return '<p class="note"><b>Your confidence check:</b> right when you said Certain: ' + pc('certain') + ' &middot; Pretty sure: ' + pc('sure') + ' &middot; Guess: ' + pc('guess') + '.' + (cw ? ' ' + cw + ' question' + (cw === 1 ? '' : 's') + ' you were certain about but missed. Those return first.' : '') + '</p>';
  }
  // due for the daily review: SM-2 date has arrived (older saves: the old memory-check ladder)
  function srDue(m) { return !!(m && m.seen > 0 && (m.due !== undefined ? m.due <= Date.now() : reviewDue(m))); }
  function dueCount() { let n = 0; for (const k in S.mastery) if (BYKEY[k] && srDue(S.mastery[k])) n++; return n; }
  function nextDueText() { let t = 0; for (const k in S.mastery) { const m = S.mastery[k]; if (BYKEY[k] && m && m.due > Date.now() && (!t || m.due < t)) t = m.due; } return t ? fmtDays((t - Date.now()) / 864e5) : ''; }
  const askedToday = (k) => { const m = S.mastery[k]; return !!(m && m.lt && new Date(m.lt).toDateString() === new Date().toDateString()); }; // repeats on the same day skip the confidence prompt
  const srOn = () => S.set.mode === 'mixed' || S.set.mode === 'review';

  /* ---- shifts: every 10 patients you get a report with what you missed ---- */
  const SHIFT_LEN = 10;
  let shiftLog = [], shiftRes = null;
  function shiftState() { if (!S.shift) S.shift = { n: 0, ok: 0, earned: 0, best: 0 }; return S.shift; }
  function shiftNote(q, ok, pay, picked) {
    const sh = shiftState(); sh.n++; if (ok) sh.ok++; sh.earned += pay; sh.best = Math.max(sh.best, S.streak);
    if (q && q.c && !q.gen) { sh.cs = sh.cs || {}; sh.cs[q.c] = (sh.cs[q.c] || 0) + 1; }
    if (!S.shiftProg) shiftSnap();
    if (!ok) shiftLog.push({ q: q, picked: picked });
  }
  const shiftDue = () => shiftState().n >= SHIFT_LEN;
  /* topic progress in the shift report: the same fraction the Topics bars show (masteryByCat), compared with where it stood at the end of the last shift (S.shiftProg) */
  function shiftSnap() { const ms = masteryByCat(), o = {}; Object.keys(ms).forEach(c => { if (ms[c].n) o[c] = +(ms[c].s / ms[c].n).toFixed(4); }); S.shiftProg = o; return o; }
  function openShift() {
    const sh = shiftState(), acc = sh.n ? sh.ok / sh.n : 0;
    let bonus = 0;
    if (acc >= 0.8) { bonus = Math.round(sh.earned * 0.25); S.cash += bonus; S.earned += bonus; S.rep = Math.min(100, S.rep + 3); }
    S.shifts = (S.shifts || 0) + 1;
    const was = S.shiftProg || {}, now = shiftSnap();
    const prog = Object.keys(sh.cs || {}).filter(c => now[c] !== undefined).sort((a, b) => sh.cs[b] - sh.cs[a]).slice(0, 8).map(c => ({ c: c, n: sh.cs[c], from: was[c] !== undefined ? was[c] : now[c], to: now[c] }));
    shiftRes = { n: sh.n, ok: sh.ok, earned: sh.earned, best: sh.best, bonus: bonus, acc: acc, miss: shiftLog.slice(), num: S.shifts, prog: prog, played: false };
    S.shift = { n: 0, ok: 0, earned: 0, best: 0 }; shiftLog = [];
    save(); renderStats(); SFX.play('shift');
    qExpand(); view = 'shift'; renderPanel(); const p = $('#qpanel'); if (p) p.scrollTop = 0;
    shiftAnim();
  }
  const shPct = f => Math.round(f * 100);
  function shiftProgHTML(r) {
    if (!r.prog || !r.prog.length) return '';
    const rows = r.prog.map((p, i) => {
      const w = r.played ? p.to : p.from, d = shPct(p.to) - shPct(p.from);
      return '<li data-i="' + i + '"><div class="shpt"><b>' + esc(CHIP[p.c] || CATNAME[p.c] || p.c) + '</b><small>' + p.n + ' answered</small><span class="shpv"><em>' + shPct(w) + '%</em><span class="shdl ' + (d > 0 ? 'up' : d < 0 ? 'down' : 'same') + (r.played ? ' on' : '') + '">' + (d > 0 ? '+' + d : d < 0 ? d : 'no change') + (d ? '%' : '') + '</span></span></div><span class="shbar" role="img" aria-label="' + shPct(p.to) + '% progress"><i style="width:' + Math.round(w * 1000) / 10 + '%"></i><u style="left:' + Math.round(p.from * 1000) / 10 + '%"></u></span></li>';
    }).join('');
    return '<h4 class="shh">Topic progress</h4><ul class="shprog" id="shprog">' + rows + '</ul>';
  }
  /* each bar zooms from where it stood after the last shift to where it is now (staggered, fast then easing in); the numbers count along */
  function shiftAnim() {
    const r = shiftRes; if (!r || !r.prog || !r.prog.length || r.played) return;
    r.played = true;
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, DUR = 1500;
    r.prog.forEach((p, i) => {
      const li = document.querySelector('#shprog [data-i="' + i + '"]'); if (!li) return;
      const bar = li.querySelector('.shbar i'), em = li.querySelector('.shpv em'), pill = li.querySelector('.shdl');
      const fin = () => { bar.style.width = Math.round(p.to * 1000) / 10 + '%'; em.textContent = shPct(p.to) + '%'; pill.classList.add('on'); };
      if (reduce) { fin(); return; }
      setTimeout(() => {
        bar.style.width = Math.round(p.to * 1000) / 10 + '%'; li.classList.add('go');
        const t0 = performance.now(), a = shPct(p.from), b = shPct(p.to);
        const tick = (t) => { const u = Math.min(1, (t - t0) / DUR), k = 1 - Math.pow(1 - u, 4); em.textContent = Math.round(a + (b - a) * k) + '%'; if (u < 1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
        setTimeout(() => { fin(); li.classList.remove('go'); }, DUR + 40);
      }, 450 + i * 260);
    });
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
      shiftProgHTML(r) +
      (r.miss.length ? '<h4 class="shh">Missed this shift</h4><ol class="shmiss">' + miss + '</ol>' : '<p class="note">Nothing missed. Keep it up!</p>') +
      '<div class="btnrow">' + (nonGen ? '<button type="button" class="btn" data-act="shift-retry">Quiz me on these soon</button>' : '') + '<button type="button" class="btn go" data-act="shift-next">Start next shift</button></div></div>';
  }
  function shiftNext(retryMissed) {
    if (retryMissed && shiftRes) shiftRes.miss.forEach((x, i) => { if (!x.q.gen) { const j = retry.findIndex(r => r.k === x.q.k); if (j >= 0) retry.splice(j, 1); retry.push({ k: x.q.k, due: S.served + 1 + i }); } });
    shiftRes = null; view = 'q'; newCard();
  }

  /* ---- daily goals: three goals a day, new ones at local midnight. Finishing all three keeps a day streak going. ---- */
  const DG = {
    right: { t: n => 'Answer ' + n + ' questions correctly', lo: 10, hi: 18, ic: '✅' },
    streak: { t: n => 'Reach a streak of ' + n, lo: 4, hi: 8, ic: '🔥' },
    fresh: { t: n => 'Meet ' + n + ' questions you have never seen', lo: 3, hi: 6, ic: '✨' },
    week: { t: n => 'Get ' + n + ' weekly drug questions right', lo: 5, hi: 9, ic: '📅' },
    hard: { t: n => 'Get ' + n + ' level 3 questions right', lo: 2, hi: 4, ic: '🧠' },
    recall: { t: () => 'Help a Recall patient', lo: 1, hi: 1, ic: '↩️' },
    regular: { t: () => 'Help one of your regulars', lo: 1, hi: 1, ic: '⭐' }
  };
  const dayStr = (off) => { const d = new Date(); d.setDate(d.getDate() + (off || 0)); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  function dailyRng(seedStr) { let h = 1779033703 ^ seedStr.length; for (let i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; }
  function dailyState() {
    const t = todayStr(), old = S.daily;
    if (old && old.d === t) return old;
    const R = dailyRng('rx' + t), ids = ['right', 'streak', 'fresh', 'week', 'hard'];
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    const special = [];
    if ((S.recall || []).length) special.push('recall');
    if (Object.keys(S.reg || {}).length) special.push('regular');
    const pickIds = (special.length ? [special[Math.floor(R() * special.length)]] : []).concat(ids).slice(0, 3);
    S.daily = { d: t, g: pickIds.map(id => { const c = DG[id], need = c.lo + Math.floor(R() * (c.hi - c.lo + 1)); return { id: id, need: need, n: 0, done: false }; }), paid: false, streak: old ? old.streak || 0 : 0, last: old ? old.last || '' : '' };
    save(); return S.daily;
  }
  const dayStreak = () => { const s = S.daily; if (!s || !s.last) return 0; return s.last === todayStr() || s.last === dayStr(-1) ? s.streak : 0; };
  const dailyPay = () => Math.round(100 * franchiseMult() * (1 + Math.min(5, dayStreak()) * 0.1));
  function dailyTick(ev) {
    const st = dailyState(); let fresh = 0;
    st.g.forEach(g => {
      if (g.done) return;
      if (g.id === 'right' && ev.ok) g.n++;
      else if (g.id === 'streak' && ev.ok) g.n = Math.max(g.n, S.streak);
      else if (g.id === 'fresh' && ev.unseen) g.n++;
      else if (g.id === 'week' && ev.ok && isTop(ev.q)) g.n++;
      else if (g.id === 'hard' && ev.ok && ev.q.d === 3) g.n++;
      else if (g.id === 'recall' && ev.ok && ev.recall) g.n++;
      else if (g.id === 'regular' && ev.ok && ev.regular) g.n++;
      if (g.n >= g.need) { g.n = g.need; g.done = true; fresh++; const pay = dailyPay(); S.cash += pay; S.earned += pay; toast('Daily goal done: ' + DG[g.id].t(g.need) + '. +' + money(pay)); }
    });
    if (!st.paid && st.g.every(g => g.done)) {
      st.paid = true;
      st.streak = st.last === dayStr(-1) ? (st.streak || 0) + 1 : 1; st.last = todayStr();
      const bonus = 2 * dailyPay(), kind = pick(['hint', 'second', 'binder']);
      S.cash += bonus; S.earned += bonus; pwAdd(kind, 1);
      showUnlock({ emoji: '🎯', title: 'Daily goals complete!', sub: money(bonus) + ' bonus and a free ' + PW[kind].name + '. Day streak: ' + st.streak + '.' });
    }
    if (fresh) { save(); renderStats(); }
    dailyBadge();
  }
  function dailyBadge() { const b = $('#dailybadge'); if (!b) return; const st = dailyState(); b.textContent = st.g.filter(g => g.done).length + '/' + st.g.length; }
  function dailyHTML() {
    const st = dailyState(), ds = dayStreak(), pay = dailyPay(), done = st.g.filter(g => g.done).length;
    const rows = st.g.map(g => { const c = DG[g.id], pct = Math.round(100 * g.n / g.need); return `<li class="${g.done ? 'done' : ''}"><span class="dgic" aria-hidden="true">${g.done ? '✔️' : c.ic}</span><div><b>${esc(c.t(g.need))}</b><div class="dgbar" role="progressbar" aria-valuemin="0" aria-valuemax="${g.need}" aria-valuenow="${g.n}"><i style="width:${pct}%"></i></div></div><small>${g.n}/${g.need}<br>${g.done ? 'paid' : '+' + money(pay)}</small></li>`; }).join('');
    return `<div class="pane dailypane"><h3>Daily goals</h3><p class="sub">${done === st.g.length ? 'All done for today. New goals tomorrow.' : 'Three goals a day. New ones appear at midnight.'}</p>
      <div class="dgstreak"><b>${ds}</b><span>day streak</span><small>${st.paid ? 'Today counted.' : ds ? 'Finish all three today to keep it.' : 'Finish all three to start a streak.'}</small></div>
      <ol class="dglist">${rows}</ol>
      <div class="grp"><b>Patients who come back</b><p class="note">${(S.recall || []).length ? 'Recall: ' + S.recall.length + ' patient' + (S.recall.length === 1 ? '' : 's') + ' will return with a question you missed.' : 'Recall: miss a question and that patient may come back a day later with it.'}</p><p class="note">${Object.keys(S.reg || {}).length ? 'Regulars (' + Object.keys(S.reg).length + '): ' + Object.values(S.reg).map(g => esc(g.name) + (g.visits ? ' x' + g.visits : '')).join(', ') + '.' : 'Regulars: master every question in a week to unlock one and add a jar to the mastery shelf.'}</p></div>
      <p class="note">Each goal pays ${money(pay)}. Finishing all three pays ${money(2 * pay)} more and a free power-up. A longer day streak raises the payout (up to +50%).</p>
      <div class="btnrow"><button type="button" class="btn go" data-act="back">Back to counter</button></div></div>`;
  }

  /* ---- recall patients and regulars ----
     Recall: a patient whose question you missed comes back about a day later, looking the same, with that exact question.
     Regular: mastering a week unlocks a regular who stops by with questions from that week. Both ignore your topic filters on purpose, and the card says so. */
  const RC_DELAY = 864e5, RC_MAX = 10;
  const RC_LINES = ['Hi again! I came in a while back and the answer did not stick. Can we go over it?', 'Remember me? I still have the same question from last time.', 'I am back. I wrote the question on my hand so I would not forget it.'];
  const RG_LINES = ['Just my usual visit. Quick one for you:', 'You know me. Same pharmacy, same questions:', 'Hello again! I brought a question from our favorite topic:'];
  const REG_NAMES = ['Mrs. Okafor', 'Big Mike', 'Dolores', 'Mr. Tran', 'Priya', 'Coach Hale', 'Ms. Dubois', 'Gus', 'Nadia', 'Pops Reyes', 'Lena', 'Rafi', 'Auntie Bea', 'Mr. Kowalski', 'Jun', 'Sister Agnes', 'Teddy', 'Ms. Ibarra', 'Walt', 'Zainab', 'Captain Lou', 'Mrs. Park', 'Dex', 'Granny Mae'];
  let spOut = {}, forceSp = null;
  const spReady = () => !focusOn() && !learning() && !labOn() && S.served - (S.lastSp || 0) >= 4;
  function specialRoll() {
    if (forceSp) return null;
    if (!spReady()) return null;
    const now = Date.now(), due = (S.recall || []).filter(r => r.due <= now && BYKEY[r.k] && !spOut['r' + r.k]);
    if (due.length && Math.random() < 0.6) { const r = due[0]; spOut['r' + r.k] = 1; S.lastSp = S.served; return { kind: 'recall', k: r.k, seed: r.seed, body: r.body || 'normal' }; }
    const regs = Object.keys(S.reg || {}).filter(n => !spOut['g' + n]);
    if (regs.length && Math.random() < 0.16) { const g = S.reg[regs[Math.floor(Math.random() * regs.length)]]; spOut['g' + g.n] = 1; S.lastSp = S.served; return { kind: 'regular', n: g.n, seed: g.seed, body: g.body || 'normal' }; }
    return null;
  }
  const regQ = (g) => { const qs = TOPQ.filter(q => q.wk === g.n && !wkTypeOff(q) && q.k !== lastKey); return qs.length ? qs[Math.floor(Math.random() * qs.length)] : null; };
  /* resolve a roll to { kind, r|g, q }, or null when the card can't be used */
  function spResolve(info, blocked) {
    if (blocked) return null;
    if (info.recall) { const r = (S.recall || []).find(x => x.k === info.recall); return r && BYKEY[r.k] ? { kind: 'recall', r: r, q: BYKEY[r.k] } : null; }
    if (info.regular) { const g = (S.reg || {})[info.regular], q = g && regQ(g); return q ? { kind: 'regular', g: g, q: q } : null; }
    return null;
  }
  function spApply(sp) {
    if (sp.kind === 'recall') { cur.recall = sp.r; cur.name = sp.r.name || cur.name; cur.flavor = pick(RC_LINES); }
    else { cur.regular = sp.g; cur.name = sp.g.name; cur.flavor = pick(RG_LINES); }
  }
  function recallAdd(q) {
    if (!cur || cur.recall || cur.karen || cur.sweaty || cur.elder || cur.evt || cur.lab || cur.visit || q.gen || q.c === 'HIM') return;
    S.recall = S.recall || [];
    if (S.recall.some(r => r.k === q.k) || S.served < 12) return;
    S.recall.push({ k: q.k, seed: cur.seed, body: cur.body || 'normal', name: cur.name, due: Date.now() + RC_DELAY * (1 + Math.random() * 0.5), tries: 0, at: Date.now() });
    while (S.recall.length > RC_MAX) S.recall.shift();
  }
  function recallDone(ok) {
    const r = cur.recall; if (!r) return;
    const i = S.recall.indexOf(r);
    if (ok) { if (i >= 0) S.recall.splice(i, 1); S.recallOK = (S.recallOK || 0) + 1; }
    else { r.tries = (r.tries || 0) + 1; if (r.tries >= 2 && i >= 0) S.recall.splice(i, 1); else r.due = Date.now() + RC_DELAY; }
  }
  function regularDone(ok) { const g = cur.regular; if (!g) return; g.visits = (g.visits || 0) + 1; if (ok) g.ok = (g.ok || 0) + 1; }
  const courseColor = (w) => w.n > 200 ? '#E8647C' : w.n > 100 ? '#F2B01E' : w.t === 'PHAR 444' ? '#8E6BD8' : '#2FB5A5';
  const masteryList = () => WEEKS.concat(P3WEEKS, P1WEEKS).filter(w => (S.reg || {})[w.n]).map(w => ({ n: w.n, c: courseColor(w) }));
  function checkRegulars() {
    S.reg = S.reg || {}; let fresh = 0;
    WEEKS.concat(P3WEEKS, P1WEEKS).forEach(w => {
      if (S.reg[w.n]) return;
      const p = weekProg(w.n); if (!(p.total > 0 && p.done >= p.total)) return;
      const body = w.n % 5 === 0 ? 'jacked' : w.n % 7 === 0 ? 'obese' : 'normal', name = REG_NAMES[(w.n * 7) % REG_NAMES.length];
      S.reg[w.n] = { n: w.n, name: name, seed: 7000 + w.n * 137, body: body, visits: 0, ok: 0, at: Date.now() };
      fresh++;
      showUnlock({ emoji: '⭐', title: 'New regular: ' + name, sub: 'You mastered ' + w.d + ' · ' + w.topic + '. A jar joined the mastery shelf, and ' + name + ' will stop by with questions from that week.' });
    });
    if (fresh) { if (World.ok && World.setMastery) World.setMastery(masteryList()); save(); }
  }
  const dayWord = (t) => { const d = Math.max(0, Math.round((Date.now() - t) / 864e5)); return d <= 0 ? 'earlier today' : d === 1 ? 'yesterday' : d + ' days ago'; };
  function spBanner() {
    if (cur.recall) return `<div class="spbanner recall" role="note"><b>↩ RECALL PATIENT</b><span>You missed this ${esc(dayWord(cur.recall.at))}. It can be from any topic.</span></div>`;
    if (cur.regular) { const g = cur.regular, w = wkOfN(g.n); return `<div class="spbanner regular" role="note"><b>★ REGULAR</b><span>${esc(g.name)} · from a week you mastered${w ? ': ' + esc(w.topic) : ''}. It may not match your topic filters.</span></div>`; }
    return '';
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
    const open = (c) => { const wk = WK[c.w]; return !wk || wk2Open(wk); };
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
      if (ok) { pwAdd('hint', 1); return '<p class="gift"><b>Delivery stored correctly.</b> Dale leaves you a free hint pill.</p>'; }
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


  /* ---------------- Andy (heart failure event character) ---------------- */
  let forceHim = false, himPending = false;
  const BLESS_MS = 120000, BLESS_MULT = 1.5; // placeholder blessing: money x1.5 for 2 minutes
  const blessOn = () => Date.now() < (S.blessUntil || 0);
  const blessMult = () => blessOn() ? BLESS_MULT : 1;
  const HIM_LINES = ['*lands in a cloud of dust* Heart failure emergency!', 'Citizens! I need one quick pharmacology answer!', 'Never fear, Andy is here. One question!'];
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
    if (!(World.ok && World.himAscend && World.himAtCounter && World.himAtCounter())) { toast('Andy’s work here is done. He will pass over in the clouds now and then.'); return; }
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
    cur = { q: q, wasMissed: S.missed.indexOf(q.k) >= 0, opts: opts, t0: Date.now(), done: false, hint: false, karen: false, sweaty: false, elder: false, elderStage: 2, ask: '', caller: false, name: 'Andy', flavor: pick(HIM_LINES), seed: 4242, num: S.served + 1, picked: -1, ok: false, resHTML: '', interrupt: null, evt: null, insp: null, review: false, visit: true, hero: true };
    SFX.play('thud'); qExpand(); renderPanel(); return true;
  }
  let blessEl = null, blessTimer = null;
  function blessTick() {
    const left = (S.blessUntil || 0) - Date.now();
    if (left <= 0) { clearInterval(blessTimer); blessTimer = null; if (blessEl) { blessEl.remove(); blessEl = null; } toast('Andy’s blessing fades.'); return; }
    const s = Math.ceil(left / 1000);
    if (blessEl) blessEl.textContent = '✨ Andy’s blessing ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + ' · money x' + BLESS_MULT.toFixed(2);
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
    if (n === CAPS.length) { pwAdd('hint', 3); S.cash += 500; S.earned += 500; sub += ' All five found: +' + money(500) + ' and 3 hint pills!'; }
    save(); SFX.play('unlock');
    showUnlock({ emoji: capSvg(id, 54), title: 'Secret capsule ' + n + ' of ' + CAPS.length + ' (' + (src === 'plant' ? 'from the plant' : 'from the sky') + ')', sub });
    renderStats(); if (view === 'awards') renderPanel();
  }
  /* ---------------- lost pills: vial, tablet buff, capsule cosmetics ---------------- */
  /* gear helpers (the item table is GEAR in gear.js) */
  const COSM_SLOTS = ['face', 'eyes', 'hat', 'neck', 'coat', 'hands', 'extra', 'cyber'];
  const gearById = id => GEAR_BY[id] || null;
  const gearHave = id => { const g = gearById(id); if (!g) return false;
    if (g.src === 'start') return true; if (g.src === 'rank') return (S.acc || 0) >= g.rank; if (g.src === 'shop') return ((S.store || {}).own || []).indexOf(id) >= 0;
    if (g.slot === 'pet') return ((S.awards || {}).pets || []).indexOf(g.kind) >= 0; return (S.cosm || []).indexOf(id) >= 0; };
  const gearOn = id => { const g = gearById(id); if (!g || !gearHave(id)) return false; if (g.slot === 'pet') return true; if (g.slot === 'hair') return S.me.hair === g.hv; return ((S.cosmOn || {})[g.slot]) === id; };
  const gearSrcText = g => g.src === 'start' ? 'Everyone starts with it' : g.src === 'shop' ? 'Shop, ' + money(shopPx(g.price)) : g.src === 'rank' ? 'Rank: ' + RANKS[g.rank][1] : g.src === 'award' ? 'Mastery award (see Awards)' : RAR[g.r].n + ' capsule';
  const buffText2 = b => { b = b || {}; const o = []; if (b.pay) o.push('+' + Math.round(b.pay * 100) + '% pay'); if (b.tech) o.push('+' + Math.round(b.tech * 100) + '% tech tips'); if (b.time) o.push('+' + b.time + ' s on the timer'); if (b.rep) o.push('+' + b.rep + ' reputation per fill'); if (b.pills) o.push('+' + Math.round(b.pills * 100) + '% lost pills'); if (b.streak) o.push('+' + b.streak + ' streak cap'); return o.join(', '); };
  /* total bonus from everything equipped plus every pet you own */
  function gearBuff() {
    const t = { pay: 0, tech: 0, time: 0, rep: 0, pills: 0, streak: 0 };
    GEAR.forEach(g => { if (gearOn(g.id)) Object.keys(g.buff || {}).forEach(k => { t[k] += g.buff[k]; }); });
    return t;
  }
  /* what the 3D pharmacist wears: rank gear travels as accOn (world.js draws it by rank number), the rest as cosm by slot */
  function cosmSpec() { const on = S.cosmOn || {}, o = {}; COSM_SLOTS.forEach(k => { o[k] = ''; }); Object.keys(on).forEach(k => { const id = on[k], g = id && gearHave(id) ? gearById(id) : null; if (g && g.slot === k && g.src !== 'rank' && g.slot !== 'pet' && g.slot !== 'hair') o[g.slot] = id; }); return o; }
  function accOnList() { const out = []; GEAR.forEach(g => { if (g.src === 'rank' && gearOn(g.id)) out.push(g.rank); }); return out; }
  /* older saves: rank gear used to be always on (minus S.accOff); put each unlocked piece into its slot once */
  function gearMigrate() {
    if (S.gearV >= 1) return; S.gearV = 1; S.cosmOn = S.cosmOn || {}; const off = S.accOff || [];
    GEAR.forEach(g => { if (g.src === 'rank' && (S.acc || 0) >= g.rank && off.indexOf(g.rank) < 0 && !S.cosmOn[g.slot]) S.cosmOn[g.slot] = g.id; });
    if (S.cosmOn.extra === 'bowtie') { if (!S.cosmOn.neck) S.cosmOn.neck = 'bowtie'; delete S.cosmOn.extra; } // bow tie moved to the neck slot
    delete S.accOff;
  }
  /* capsule rarity: rolled when the pill is picked up, so the vial can show it */
  function rollRarity(boost) { let r = Math.random() * 100; const keys = ['legendary', 'epic', 'rare', 'common']; for (const k of keys) { const w = RAR[k].w * (k === 'common' ? 1 : 1 + (boost || 0)); if (r < w) return k; r -= w; } return 'common'; }
  const capsulePool = (r) => GEAR.filter(g => g.src === 'capsule' && g.r === r && !gearHave(g.id));
  function capsulePick(r) { const order = { common: ['common', 'rare', 'epic', 'legendary'], rare: ['rare', 'common', 'epic', 'legendary'], epic: ['epic', 'rare', 'legendary', 'common'], legendary: ['legendary', 'epic', 'rare', 'common'] }[r] || ['common']; for (const k of order) { const pool = capsulePool(k); if (pool.length) return pick(pool); } return null; }
  function gearGrant(g, equip) {
    if (g.slot === 'pet') { S.awards.pets = S.awards.pets || []; if (S.awards.pets.indexOf(g.kind) < 0) S.awards.pets.push(g.kind); try { World.setAwards(worldAwards()); World.unlockPet(g.kind); } catch (e) { /* ignore */ } return; }
    S.cosm = S.cosm || []; if (S.cosm.indexOf(g.id) < 0) S.cosm.push(g.id);
    if (equip) { S.cosmOn = S.cosmOn || {}; if (g.slot === 'hair') S.me.hair = g.hv; else S.cosmOn[g.slot] = g.id; }
  }
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
    S.vial = S.vial || []; const ent = { k: sp.k, c: sp.c, c2: sp.c2 || '', s: sp.s }; if (sp.k === 'c') ent.r = sp.r || rollRarity(); S.vial.push(ent); if (S.vial.length > 24) S.vial.shift();
    S.pillN = (S.pillN || 0) + 1; save(); vialSync(); SFX.play('ok');
    toast('Added to the lost pills vial: ' + pillName(sp) + (sp.k === 'c' && ent.r !== 'common' ? ' (it shimmers, a ' + RAR[ent.r].n.toLowerCase() + ' capsule).' : '.'));
  }
  /* tablet buff */
  const BUFF_MS = 90000; let buffUntil = 0, buffSlips = 0, buffTimer = null, buffEl = null;
  const buffOn = () => Date.now() < buffUntil;
  const buffPay = () => (buffOn() ? 2 : 1) * blessMult() * (1 + (uniBuff().pay || 0) + gearBuff().pay);
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
      (v.length ? '<p>Pills that popped out of bottles around the pharmacy. Pick one to take.</p><div class="vgrid">' + v.map((p, i) => '<button type="button" class="vpill' + (p.k === 'c' && p.r && p.r !== 'common' ? ' rar-' + p.r : '') + '" data-i="' + i + '" aria-pressed="' + (i === vSel) + '" aria-label="' + esc(pillName(p)) + (p.r && p.r !== 'common' ? ', ' + RAR[p.r].n.toLowerCase() : '') + '">' + pillSvg(p, 40) + '</button>').join('') + '</div>' : '<p>Empty. Watch the shelves and other spots around the pharmacy for pills that pop out, then tap them to collect.</p>') +
      (sel ? '<p class="vdesc"><b>' + esc(pillName(sel)) + '.</b> ' + (sel.k === 't' ? 'Tablets are rare and strong. For 90 seconds the screen warps and your pharmacist feels sharp: money ×2, streak bonus ×3, and two free slips that keep your streak.' : (sel.r && sel.r !== 'common' ? 'This one shimmers: a <b>' + RAR[sel.r].n.toLowerCase() + '</b> capsule. ' : '') + 'Capsules pop open to reveal gear for your pharmacist (hats, glasses, coats, things to hold) or, if you are lucky, a new pet. Rarer capsules hold rarer gear with bigger bonuses.') + '</p>' : '') +
      '<div class="tourbtns">' + (sel ? '<button type="button" class="btn go" data-take>Take it</button>' : '') + '<button type="button" class="btn" data-close>Close</button></div></div>';
  }
  /* capsule reveal */
  function capsuleOpen(p) {
    const tier = p.r || rollRarity(), res = capsulePick(tier), rr = res ? res.r : tier;
    vOpenAt = Date.now(); vBack = document.activeElement;
    const el = document.createElement('div'); el.className = 'tour vdlg capdlg rar-' + rr; document.body.appendChild(el); vdlg = el;
    document.addEventListener('keydown', vdlgKey, true);
    const c1 = p.c, c2 = p.c2 || p.c, st = 'stroke="#1d2b2e" stroke-width="2.4"';
    el.innerHTML = '<div class="tourcard vcard" role="dialog" aria-modal="true" aria-labelledby="ctitle"><div class="rarband">' + RAR[rr].n + ' capsule</div><h3 id="ctitle">The capsule is opening...</h3><div class="capstage"><svg viewBox="0 0 120 60" class="capbig" aria-hidden="true"><g class="chalf l"><path d="M60 14H30a16 16 0 0 0 0 32h30z" fill="' + c1 + '" ' + st + '/></g><g class="chalf r"><path d="M60 14h30a16 16 0 0 1 0 32H60z" fill="' + c2 + '" ' + st + '/></g></svg><div class="reel" id="creel" aria-hidden="true"></div></div><p class="rname" id="cname">&nbsp;</p><div id="cprev" class="capprevwrap"></div><div class="tourbtns"><button type="button" class="btn go" id="cdone" data-close disabled>Nice</button></div></div>';
    el.addEventListener('click', ev => { const t = ev.target.closest('button'); if (t && t.dataset.close !== undefined && !t.disabled) vdlgClose(); });
    const reel = el.querySelector('#creel'), nm = el.querySelector('#cname'), title = el.querySelector('#ctitle'), done = el.querySelector('#cdone');
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const spin = GEAR.filter(g => g.src === 'capsule'), icons = {};
    spin.forEach(g => { icons[g.id] = g.slot !== 'pet' && World.ok && World.cosmIcon ? World.cosmIcon(g.slot, g.id) : null; });
    const showIt = (g) => { const u = icons[g.id]; reel.innerHTML = u ? '<img alt="" src="' + u + '">' : '<span class="capemo">' + g.e + '</span>'; reel.className = 'reel rar-' + g.r + (reel.classList.contains('land') ? ' land' : ''); };
    let ticks = reduce ? 4 : 22, i = 0, last = -1; const t0 = reduce ? 200 : 900;
    setTimeout(() => { el.querySelector('.capstage').classList.add('open'); SFX.play('unlock'); step(); }, t0);
    function step() {
      if (!vdlg || vdlg !== el) return;
      i++; let k; do { k = Math.floor(Math.random() * spin.length); } while (k === last && spin.length > 1); last = k;
      const fin = i >= ticks; const it = fin ? (res || spin[k]) : spin[k];
      showIt(it); reel.classList.toggle('land', fin);
      if (!fin) { setTimeout(step, 70 + Math.pow(i / ticks, 2.4) * 380); return; }
      let msg = '';
      if (res) {
        gearGrant(res, true);
        const bt = buffText2(res.buff), found = GEAR.filter(g => g.src === 'capsule' && gearHave(g.id)).length, all = GEAR.filter(g => g.src === 'capsule').length;
        msg = (res.slot === 'pet' ? res.name + ' joins the pharmacy! Find it on the floor. Drag it anywhere you like.' : 'New ' + SLOT_NAME[res.slot].toLowerCase() + ': ' + res.name + '. It is on your pharmacist now (change it any time in Character).') + (bt ? ' Bonus: ' + bt + '.' : '') + ' ' + found + '/' + all + ' capsule finds.';
        if (found === all) { S.cash += 1000; S.earned += 1000; pwAdd('hint', 3); msg += ' Every capsule item found: +' + money(1000) + ' and 3 hint pills!'; }
      } else { const b = Math.round({ common: 250, rare: 600, epic: 1500, legendary: 4000 }[tier] * franchiseMult()); S.cash += b; S.earned += b; msg = 'You already found everything a capsule can hold, so this one held ' + money(b) + ' instead.'; }
      save(); try { World.setPharmacist(meSpec()); } catch (e) { /* ignore */ }
      title.textContent = res ? (rr === 'legendary' ? 'Legendary! ' : rr === 'epic' ? 'Epic find: ' : rr === 'rare' ? 'Rare find: ' : 'Unlocked: ') + res.name : 'Cash capsule'; nm.textContent = msg; done.disabled = false; done.focus(); SFX.play(rr === 'legendary' || rr === 'epic' ? 'streak' : 'unlock'); renderStats();
      if (res && res.slot !== 'pet' && World.ok && World.pharmPortrait) { const u = World.pharmPortrait(meSpec()); if (u) el.querySelector('#cprev').innerHTML = '<img class="mepv-img capprev" alt="Your pharmacist wearing the new item" src="' + u + '">'; }
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
  const SYN = { cat: 'epi', labels: true, q: null, last: '', sel: null, gaba: null };
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
  function synExit() { gabaStop(); if (World.ok && World.synOn && World.synOn()) World.setSyn(false); }
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

  /* ---- GABA-A demo: hyperpolarizing IPSP vs shunting inhibition (voltage trace in the panel, Cl- channel in the 3D synapse) ---- */
  const GB = { t0: 0, timer: null, mode: null, last3d: null }, GB_LEN = 9, GB_REST = -70, GB_ECL = -75, GB_THR = -55;
  const gbEpsp = (t, t0, A) => { const x = t - t0; return x <= 0 ? 0 : A * 1.87 * (Math.exp(-x / 0.5) - Math.exp(-x / 0.1)); };
  function gbV(t, mode) {
    // GABA-A channels are open from 3 s to 7 s; a test EPSP arrives at 1 s (control) and at 5 s (during GABA)
    let base = GB_REST;
    if (mode === 'ipsp') { const d = GB_ECL - GB_REST; if (t >= 3 && t < 7) base += d * (1 - Math.exp(-(t - 3) / 0.25)); else if (t >= 7) base += d * (1 - Math.exp(-4 / 0.25)) * Math.exp(-(t - 7) / 0.3); }
    return base + gbEpsp(t, 1, 14) + gbEpsp(t, 5, mode === 'shunt' ? 5 : 14);
  }
  function gbDraw() {
    const cv = document.getElementById('gabacv'); if (!cv || !SYN.gaba) return;
    const W = cv.width, H = cv.height, c = cv.getContext('2d'), mode = SYN.gaba, t = ((performance.now() - GB.t0) / 1000) % GB_LEN;
    const css = getComputedStyle(document.documentElement), ink = css.getPropertyValue('--ink').trim() || '#123', mut = css.getPropertyValue('--muted').trim() || '#678';
    const X = s => 44 + s / GB_LEN * (W - 56), Y = v => 14 + (-52 - v) / 28 * (H - 34);
    c.clearRect(0, 0, W, H); c.font = '11px ui-monospace, monospace'; c.textBaseline = 'middle';
    c.fillStyle = 'rgba(95,224,138,.18)'; c.fillRect(X(3), 8, X(7) - X(3), H - 22); c.fillStyle = mut; c.fillText('GABA-A open', X(3) + 4, 16);
    [[GB_THR, 'threshold −55', '#E04F3A', 1], [GB_REST, 'rest −70', mut, 0], [GB_ECL, 'E(Cl⁻) −75', '#2BB673', 0]].forEach(l => { const y = Y(l[0]); c.strokeStyle = l[2]; c.lineWidth = 1; c.setLineDash(l[3] ? [5, 4] : [2, 4]); c.beginPath(); c.moveTo(40, y); c.lineTo(W - 8, y); c.stroke(); c.setLineDash([]); c.fillStyle = l[2]; c.textAlign = 'left'; c.fillText(String(l[0]), 2, y); });
    c.strokeStyle = ink; c.lineWidth = 2.4; c.beginPath(); for (let s = 0; s <= t; s += 0.03) { const x = X(s), y = Y(gbV(s, mode)); if (s === 0) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke();
    c.fillStyle = ink; c.beginPath(); c.arc(X(t), Y(gbV(t, mode)), 4, 0, 7); c.fill();
    c.fillStyle = mut; c.textAlign = 'center'; c.fillText('EPSP (control)', X(1.4), H - 6); c.fillText('same EPSP, GABA open', X(5.4), H - 6);
    const want = t >= 3 && t < 7 ? mode : null; if (GB.last3d !== want) { GB.last3d = want; if (World.ok && World.synGaba) World.synGaba(want); }
    const rd = document.getElementById('gabard'); if (rd) { const p1 = Math.round(gbV(1.2, mode) * 10) / 10, p2 = Math.round(gbV(5.2, mode) * 10) / 10; rd.textContent = mode === 'ipsp' ? 'Baseline falls toward −75 mV, so the same EPSP peaks at about ' + Math.round(gbV(5.2, 'ipsp')) + ' mV instead of ' + Math.round(p1) + ' mV: farther from threshold.' : 'Baseline stays at −70 mV, but conductance is up, so the EPSP is only ' + Math.round(gbV(5.2, 'shunt') + 70) + ' mV instead of ' + Math.round(gbV(1.2, 'shunt') + 70) + ' mV.'; }
  }
  function gabaStop() { if (GB.timer) { clearInterval(GB.timer); GB.timer = null; } SYN.gaba = null; GB.last3d = null; if (World.ok && World.synGaba) { World.synGaba(null); if (World.synHighlight) World.synHighlight(null); } }
  function gabaStart(m) {
    if (!m || SYN.gaba === m) return gabaStop();
    SYN.gaba = m; GB.t0 = performance.now(); GB.last3d = undefined;
    if (SYN.cat !== 'epi' && SYN.cat !== 'cbd') { SYN.cat = 'epi'; SYN.q = null; synNewQ(); synSet(); }
    if (World.ok && World.synHighlight) World.synHighlight(['gabaa']);
    if (!GB.timer) GB.timer = setInterval(() => { if (view !== 'syn' || !SYN.gaba) { gabaStop(); return; } gbDraw(); }, 33);
  }
  function gabaHTML() {
    const m = SYN.gaba, b = (k, t) => `<button type="button" class="chip" data-act="syn-gaba" data-v="${k}" aria-pressed="${m === k}">${t}</button>`;
    return `<div class="syncard gabacard"><div class="synq"><b>GABA-A: two ways to inhibit</b></div><p class="note">Watch the voltage trace and the Cl⁻ channel on the postsynaptic spine at the same time.</p><div class="chips">${b('ipsp', 'Hyperpolarizing IPSP')}${b('shunt', 'Shunting inhibition')}</div>${m ? `<canvas id="gabacv" width="420" height="190" style="width:100%;max-width:520px;height:auto" role="img" aria-label="Membrane potential over time with an EPSP before and during GABA-A opening"></canvas><p class="note" id="gabard"></p><p class="note">${m === 'ipsp' ? 'Cl⁻ flows in toward E(Cl⁻) near −75 mV, so the membrane moves away from threshold.' : 'No net Cl⁻ transport is needed. The open channel is a short circuit: conductance rises, resistance falls, and an EPSP gets smaller.'}</p>` : ''}</div>`;
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
      ${gabaHTML()}
      <details class="grp"><summary><b>Site guide</b> <small>tap a name to see what it does</small></summary><ul class="synguide">${guide}</ul></details>
      <div class="btnrow"><button type="button" class="btn go" data-act="back">Back to the pharmacy</button></div></div>`;
  }

  /* ---- Microbe lab (the trash can). Spliced into game.js at the MIC marker so it shares the game's scope. Data and matching helpers live in micdata.js.
     Two ways to study each group: drag from the petri dish (word bank) into slots, or type the blanks. A perfect round with no hints earns a star for that mode. ---- */
  const micS = () => { const m = S.mic = S.mic || { st: {}, mode: 'drag', set: 'body', rounds: 0 }; m.st = m.st || {}; return m; };
  const micSet = (id) => MICSETS.find(s => s.id === id) || MICSETS[0];
  const micGrp = (set, gid) => set.groups.find(g => g.id === gid);
  const micRec = (gid) => { const r = micS().st[gid]; return r || { d: 0, f: 0, n: 0 }; };
  const micStars = (g) => { const r = micRec(g.id); return (r.d ? 1 : 0) + (r.f ? 1 : 0); };
  let micZSig = '', micPicking = false, micR = null, micSelG = null, micDrag = null, micIn = false, micSig = '', micNonce = 0;
  const MICSORTS = {
    body: [
      { id: 'sort-dis', kind: 'dish', name: 'Put the bugs in the disease dishes', n: 10, dishes: [['cns', 'Meningitis', ['cns']], ['lower', 'Pneumonia', ['lower']], ['uti', 'UTI', ['uti']], ['heart', 'Endocarditis', ['heart']], ['bone', 'Bone and joint infection', ['bone']]], help: 'Each petri dish in the lab is labeled with a disease. Drag each bug from the bank onto the dish for the infection it usually causes, or tap a bug and then tap a dish.' }
      , { id: 'sort-fam', board: 'fam', name: 'Fill the bug family boxes', n: 10, cells: ['egnr', 'aty', 'sti'], help: 'The bottom of the body map has three boxes. Drag each bug from the bank into its box: enteric gram negative rods, atypicals or sexually transmitted diseases.' }
    ],
    res: [
      { id: 'sort-iv', board: 'res', name: 'Fill the IV column', n: 10, cells: ['paiv', 'mrsaiv', 'vreiv', 'anaiv', 'atyd'], help: 'This is the Resistant Organisms handout. Drag each drug from the bank into the IV box of the bug it treats (the atypical box has no IV or PO split), or tap a drug and then tap a box.' },
      { id: 'sort-po', board: 'res', name: 'Fill the PO column', n: 10, cells: ['papo', 'mrsapo', 'vrepo', 'anapo', 'atyd'], help: 'Drag each drug into the PO box of the bug it treats, laid out like the handout.' },
      { id: 'sort-all', board: 'res', name: 'Fill the whole handout', n: 14, cells: ['paiv', 'papo', 'mrsaiv', 'mrsapo', 'vreiv', 'vrepo', 'anaiv', 'anapo', 'atyd'], help: 'Drag each drug into the right IV or PO box. A drug that fits more than one box goes in any of them.' }
    ],
    gram: [
      { id: 'sort-gp', bugs: true, board: 'gp', name: 'Fill the Gram-positive tree', n: 11, cells: ['gpba', 'gpca', 'gpch', 'gpcp', 'gpcn'], help: 'This is the Gram-positive tree from the survival guide. Drag each bug from the bank onto the paper where it belongs on the lab table, or tap a bug and then tap a paper.' },
      { id: 'sort-gn', bugs: true, board: 'gn', name: 'Fill the Gram-negative tree', n: 9, cells: ['gndi', 'gncc', 'gnnl', 'gnlf', 'gnan'], help: 'This is the Gram-negative tree from the survival guide. Drag each bug onto the paper where it belongs on the lab table.' }
      , { id: 'sort-gb', bugs: true, board: 'gb', name: 'Fill both trees', n: 20, cells: ['gpba', 'gpca', 'gpch', 'gpcp', 'gpcn', 'gndi', 'gncc', 'gnnl', 'gnlf', 'gnan'], help: 'Both trees from the survival guide are on the lab table, Gram-positive on the left and Gram-negative on the right. Drag each bug from the bank onto the paper where it belongs, or tap a bug and then tap a paper.' }
    ],
    pk: [{ id: 'sort-pk', board: 'pk', name: 'Fill the three boxes', n: 10, cells: ['time', 'conc', 'norenal'], help: 'The last page of the handout has three boxes. Drag each antibiotic into the box it belongs in: time-dependent, concentration-dependent or not renally adjusted. A few fit two boxes.' }]
  };
  /* paper layouts on the lab table (x, z in table units, w, h = paper size). Targets are group ids from micdata.js; labels and notes are not drop targets. edges join a parent to its children like the printed trees. */
  const PN = (id, title, x, z, w, h, kind) => ({ id, title, x, z, w, h, kind: kind || 'paper' });
  const BOARDS = {
    res: { nodes: [PN('paiv', 'Pseudomonas IV', -4.0, -1.9, 2.3, 2.4), PN('papo', 'Pseudomonas PO', -1.5, -1.9, 2.3, 2.4), PN('mrsaiv', 'MRSA IV', -4.0, 1.5, 2.3, 2.0), PN('mrsapo', 'MRSA PO', -1.5, 1.5, 2.3, 2.0),
      PN('vreiv', 'VRE IV', 1.6, -2.4, 2.3, 1.6), PN('vrepo', 'VRE PO', 4.1, -2.4, 2.3, 1.6), PN('anaiv', 'Anaerobes IV', 1.6, -0.3, 2.3, 1.9), PN('anapo', 'Anaerobes PO', 4.1, -0.3, 2.3, 1.9), PN('atyd', 'Atypical organisms', 2.85, 2.1, 4.8, 1.5)], edges: [] },
    pk: { nodes: [PN('time', 'Time-dependent', -3.6, 0, 3.2, 3.8), PN('conc', 'Concentration-dependent', 0, 0, 3.2, 3.8), PN('norenal', 'NOT renally adjusted', 3.6, 0, 3.2, 3.8)], edges: [] },
    fam: { nodes: [PN('egnr', 'Enteric gram negative rods', -3.6, 0, 3.2, 3.4), PN('aty', 'Atypicals', 0, 0, 3.2, 3.4), PN('sti', 'Sexually transmitted diseases', 3.6, 0, 3.2, 3.4)], edges: [] },
    gp: { nodes: [PN('gp0', 'Gram-Positive Bacteria', -1.0, -3.1, 3.8, 0.62, 'label'), PN('gpB', 'Bacilli', -3.9, -2.2, 1.6, 0.55, 'label'), PN('gpC', 'Cocci', 1.9, -2.2, 1.6, 0.55, 'label'),
      PN('gpBa', 'aerobic', -4.8, -1.35, 1.3, 0.5, 'label'), PN('gpBn', 'anaerobic', -3.0, -1.35, 1.5, 0.5, 'label'), PN('gpCa', 'aerobic', -0.2, -1.35, 1.3, 0.5, 'label'), PN('gpCn', 'anaerobic', 4.3, -1.35, 1.5, 0.5, 'label'),
      PN('gpBnote', 'these exist / but none to / memorize', -4.8, -0.35, 1.6, 1.0, 'note'), PN('gpba', 'Anaerobic bacilli', -3.0, -0.35, 1.9, 1.0), PN('gpch', 'Chains', -0.8, 0.45, 2.3, 2.1), PN('gpcl', 'clusters', 1.7, -0.5, 1.3, 0.5, 'label'), PN('gpca', 'Anaerobic cocci', 4.3, -0.4, 1.9, 1.0),
      PN('gpcp', 'Coagulase +', 1.0, 2.2, 2.0, 1.2), PN('gpcn', 'Coagulase – (CoNS)', 3.6, 2.2, 2.4, 1.4)],
      edges: [['gp0', 'gpB'], ['gp0', 'gpC'], ['gpB', 'gpBa'], ['gpB', 'gpBn'], ['gpC', 'gpCa'], ['gpC', 'gpCn'], ['gpBa', 'gpBnote'], ['gpBn', 'gpba'], ['gpCa', 'gpch'], ['gpCa', 'gpcl'], ['gpCn', 'gpca'], ['gpcl', 'gpcp'], ['gpcl', 'gpcn']] },
    gn: { nodes: [PN('gn0', 'Gram-Negative Bacteria', 0, -3.1, 3.8, 0.62, 'label'), PN('gnA', 'aerobic', -2.3, -2.2, 1.5, 0.5, 'label'), PN('gnN', 'anaerobic', 3.9, -2.2, 1.6, 0.5, 'label'),
      PN('gndi', 'Diplococci', -4.4, -0.9, 2.0, 1.2), PN('gncc', 'Coccobacilli', -2.0, -0.9, 2.0, 1.2), PN('gnB', 'Bacilli', 0.9, -1.45, 1.3, 0.5, 'label'), PN('gnBn', 'Bacilli', 3.9, -1.45, 1.3, 0.5, 'label'), PN('gnan', 'Anaerobic bacilli', 3.9, -0.2, 2.0, 1.1),
      PN('gnnl', 'NOT lactose fermenting', -0.4, 1.5, 2.5, 1.5), PN('gnlf', 'Lactose fermenting', 2.3, 1.5, 2.5, 1.5)],
      edges: [['gn0', 'gnA'], ['gn0', 'gnN'], ['gnA', 'gndi'], ['gnA', 'gncc'], ['gnA', 'gnB'], ['gnN', 'gnBn'], ['gnBn', 'gnan'], ['gnB', 'gnnl'], ['gnB', 'gnlf']] }
  };
  { const sc = 0.52, mk = (k, dx) => BOARDS[k].nodes.map(n => Object.assign({}, n, { x: n.x * sc + dx, z: n.z * sc, w: n.w * sc, h: n.h * sc })); BOARDS.gb = { nodes: mk('gp', -2.75).concat(mk('gn', 2.75)), edges: BOARDS.gp.edges.concat(BOARDS.gn.edges) }; }
  BOARDS.pk.nodes[0].icon = 'clock'; BOARDS.pk.nodes[1].icon = 'conc'; BOARDS.pk.nodes[2].icon = 'kidney';
  const MICBOARD_OF = { res: 'res', pk: 'pk', gram: 'gp' };
  function micBoardSpec(key, active) {
    const B = BOARDS[key], by = {}; B.nodes.forEach(n => { by[n.id] = n; });
    const nodes = B.nodes.map(n => Object.assign({}, n, { off: n.kind === 'paper' && !!active && !active.has(n.id) }));
    const edges = (B.edges || []).map(e => { const a = by[e[0]], b = by[e[1]]; return [a.x, a.z + a.h / 2, b.x, b.z - b.h / 2]; });
    return { nodes, edges };
  }
  const micSortsFor = (sid) => (World.ok && World.setMic) ? (MICSORTS[sid] || []) : [];
  const micAllSorts = () => [].concat(MICSORTS.body, MICSORTS.res, MICSORTS.pk, MICSORTS.gram);
  /* what is under the pointer in the lab: {id, row} for a man site, a dish or a paper */
  function micHit(x, y) {
    if (!micR || !World.ok) return null;
    if (micR.sort && micR.kind === 'part') { const id = World.micSiteAt(x, y); return id === micR.part ? { id, row: -1 } : null; }
    if (micR.sort && micR.kind === 'site') { const id = World.micSiteAt(x, y); return id ? { id, row: -1 } : null; }
    if (micR.sort && micR.kind === 'dish') { const id = World.micDishAt(x, y); return id ? { id, row: -1 } : null; }
    if ((micR.sort && micR.kind === 'board') || (!micR.sort && micR.mode === 'drag' && !micR.done)) return World.micPaperAt(x, y);
    return null;
  }
  function micHot(h) {
    if (!micR || !World.ok) return; const id = h ? h.id : null;
    try { if (micR.sort && (micR.kind === 'site' || micR.kind === 'part')) World.micSiteHot(id); else if (micR.sort && micR.kind === 'dish') World.micDishHot(id); else World.micPaperHot(id); } catch (e) { /* decor */ }
  }
  function micCommit(chipId, h) {
    if (!micR || !h) return;
    if (micR.sort) { micDrop(chipId, h.id); return; }
    const free = micR.slots.findIndex(c => c === null); micPlace(chipId, h.row >= 0 && micR.slots[h.row] === null ? h.row : free);
  }
  const micClean = (t) => String(t).replace(/ \((UTI only|only with other antibiotics)\)$/, '');
  /* the 3D lab room: entered whenever the Microbe lab view is open, left when it closes */
const micLab3 = () => !!(World.ok && World.setMic);
  /* what the 3D lab shows right now: the man, labeled dishes, or papers on the table (a tree, handout boxes, or one answer sheet) */
  function micDesc() {
    const m = micS(), R = micR;
    if (R) {
      if (R.sort) {
        if (R.kind === 'part') return { k: 'man', key: 'part:' + R.part + ':' + R.nonce, zoom: R.part };
        if (R.kind === 'dish') return { k: 'dish', key: 'd:' + R.sid + ':' + R.nonce, list: R.dishes };
        if (R.kind === 'board') return { k: 'paper', key: 'b:' + R.sid + ':' + R.nonce, spec: micBoardSpec(R.board, new Set(R.dishes.map(d => d.id))) };
        return { k: 'man', key: 'man' };
      }
      const g = micGrp(micSet(R.set), R.gid), n = g ? g.items.length : 1;
      return { k: 'paper', key: 's:' + R.gid + ':' + R.mode + ':' + R.nonce, spec: { nodes: [{ id: 'slots', title: g ? g.name : '', x: 0, z: 0.2, w: 6.4, h: Math.min(6.2, 1.5 + n * 0.62), kind: 'paper', rows: n }], edges: [] } };
    }
    if (MICBOARD_OF[m.set]) return { k: 'paper', key: 'p:' + m.set, spec: micBoardSpec(MICBOARD_OF[m.set], null) };
    return { k: 'man', key: 'man' };
  }
  /* push the player's progress onto the papers */
  function micPaperStates() {
    const R = micR; if (!R) return;
    try {
      if (R.sort && R.kind === 'board') R.dishes.forEach(d => World.micPaperSet(d.id, { lines: R.items[d.id] || [] }));
      else if (!R.sort) {
        const g = micGrp(micSet(R.set), R.gid); if (!g) return;
        if (R.mode === 'drag') World.micPaperSet('slots', { rows: R.slots.map(c => c === null ? {} : { t: micClean(R.chips[c].t), ok: true }) });
        else World.micPaperSet('slots', { rows: g.items.map((t, i) => { const lk = R.lock[i] >= 0; return { t: lk ? micClean(g.items[R.lock[i]]) : (R.vals[i] || ''), ok: lk, bad: !lk && !!R.bad[i], sel: !R.done && i === R.cur }; }) });
      }
    } catch (e) { /* decor */ }
  }
  function micSync() {
    const want = view === 'mic' && !!World.ok && !!World.setMic;
    if (want && !micIn) { micIn = true; micSig = ''; micZSig = ''; try { World.setMic(true); } catch (e) { micIn = false; } }
    else if (!want && micIn) { micIn = false; micSig = ''; micZSig = ''; try { World.setMic(false); } catch (e) { /* decor */ } if (view !== 'mic') micR = null; return; }
    if (!micIn) return;
    const m = micS(), body = MICSETS[0], d = micDesc();
    try {
      if (d.key !== micSig) {
        micSig = d.key;
        if (d.k === 'paper') { World.micDishes([]); World.micPapers(d.spec); }
        else { World.micPapers(null); World.micDishes(d.k === 'dish' ? d.list.map(x => ({ id: x.id, label: x.label })) : []); }
      }
      World.micMan(d.k === 'man'); if (d.key !== micZSig) { micZSig = d.key; World.micZoom(d.zoom || null); }
      World.micPins(body.groups.filter(g => !g.fam).map(g => ({ id: g.id, st: micStars(g), ster: !!g.sterile, name: g.name })));
      World.micSelect(micR && micR.kind === 'part' ? micR.part : micSelG && micGrp(body, micSelG) ? micSelG : null);
    } catch (e) { /* decor */ }
    micPaperStates();
  }
  function micStartSort(sid) {
    const def = micAllSorts().find(x => x.id === sid); if (!def) return false;
    const m = micS(), kind = def.board ? 'board' : (def.kind || 'dish'), sk = MICSORTS.body.indexOf(def) >= 0 ? 'body' : MICSORTS.res.indexOf(def) >= 0 ? 'res' : MICSORTS.gram.indexOf(def) >= 0 ? 'gram' : 'pk'; m.set = sk; const set = micSet(sk), body = MICSETS[0];
    const allSites = body.groups.filter(g => !g.fam);
    let dishes;
    if (def.board) { const BD = BOARDS[def.board], nm = {}; BD.nodes.forEach(n => { nm[n.id] = n.title; }); dishes = def.cells.map(cid => { const g = micGrp(set, cid) || micGrp(body, cid); return { id: cid, label: nm[cid], keys: new Set(g.items.map(micNorm)), names: g.items }; }); }
    else if (kind === 'site') dishes = def.sites.map(id => { const g = micGrp(body, id); return { id, label: g.name, keys: new Set(g.items.map(micNorm)), names: g.items }; });
    else dishes = def.dishes.map(d => { const names = []; d[2].forEach(gid => { const g = micGrp(set, gid); if (g) g.items.forEach(t => names.push(t)); }); return { id: d[0], label: d[1], keys: new Set(names.map(micNorm)), names }; });
    const rnd = () => Math.random(), pick = [], seen = new Set(), per = Math.ceil(def.n / dishes.length);
    const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; } return a; };
    const validFor = (k) => kind === 'site' ? allSites.filter(g => g.items.some(t => micCovers(t, k))).map(g => g.id) : dishes.filter(d => d.keys.has(k)).map(d => d.id);
    const take = (t) => { const k = micNorm(t); if (seen.has(k)) return false; seen.add(k); pick.push({ t: micClean(t), k, valid: validFor(k) }); return true; };
    dishes.forEach(d => { let c = 0; shuf(d.names).forEach(t => { if (c < per && pick.length < def.n && take(t)) c++; }); });
    shuf([].concat.apply([], dishes.map(d => d.names))).forEach(t => { if (pick.length < def.n) take(t); });
    const chips = shuf(pick); chips.forEach((c, i) => { c.id = i; c.used = false; });
    micR = { sort: true, kind, board: def.board || null, items: {}, bugs: sk === 'body' || sk === 'gram', sid, name: def.name, help: def.help, set: sk, mode: 'drag', dishes: dishes.map(d => ({ id: d.id, label: d.label })), chips, placed: {}, mist: 0, hint: false, done: false, msg: '', sel: null, nonce: ++micNonce };
    renderPanel(); return true;
  }
  function micStartPart(gid) {
    const body = MICSETS[0], g = micGrp(body, gid); if (!g || g.fam) return false;
    const m = micS(); m.set = 'body'; micPicking = false;
    const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; } return a; };
    const covers = (t) => g.items.some(x => micCovers(x, micNorm(t)) || micNorm(x) === micNorm(t));
    const good = shuf(g.items).slice(0, 6).map(t => ({ t: micClean(t), k: micNorm(t), valid: [gid] }));
    const seen = new Set(good.map(c => c.k)), pool = [];
    body.groups.forEach(o => { if (o.id !== gid) o.items.forEach(t => { const k = micNorm(t); if (!seen.has(k) && !covers(t)) { seen.add(k); pool.push(t); } }); });
    const bad = shuf(pool).slice(0, Math.max(3, 9 - good.length)).map(t => ({ t: micClean(t), k: micNorm(t), valid: [] }));
    const chips = shuf(good.concat(bad)); chips.forEach((c, i) => { c.id = i; c.used = false; });
    micR = { sort: true, kind: 'part', part: gid, board: null, items: {}, bugs: true, sid: 'part:' + gid, name: g.name, help: 'Zoomed in on the ' + g.name.toLowerCase() + ' on the man. Drag each bug that usually infects it onto the glowing part in the lab, or tap a bug and then tap the part. Some bugs in the bank do not belong here.', set: 'body', mode: 'drag', dishes: [{ id: gid, label: g.name }], chips, placed: {}, mist: 0, hint: false, done: false, msg: '', sel: null, nonce: ++micNonce };
    renderPanel(); return true;
  }
  function micPickHTML() {
    const body = MICSETS[0], parts = body.groups.filter(g => !g.fam), lab3 = micLab3();
    return `<div class="pane micpane">${micTop(true)}<h3>Pick a body part</h3><p class="sub">${lab3 ? 'Click a part of the man in the lab: the brain, ear, mouth, throat, lungs, heart, liver, bowel, bladder, skin or the leg bone. The camera zooms in, then you place the bugs that usually infect it.' : 'Pick a body part. Then place the bugs that usually infect it.'}</p>
      <div class="micfam">${parts.map(g => `<button type="button" class="btn" data-act="mic-go" data-v="part:${g.id}">${esc(g.name)} ${micStarsHTML(g)}</button>`).join('')}</div></div>`;
  }
  function micDrop(chipId, dishId) {
    const R = micR; if (!R || !R.sort || R.done || !dishId) return; const ch = R.chips[chipId]; if (!ch || ch.used) return; R.sel = null; R.shake = null;
    const dish = R.kind === 'site' ? { id: dishId, label: (micGrp(MICSETS[0], dishId) || { name: dishId }).name } : R.dishes.find(d => d.id === dishId); if (!dish) return;
    const fill = (ok) => { try { if (R.kind === 'part') { World.micSiteFill(dishId, ok); } else if (R.kind === 'board') World.micPaperFill(dishId, ok); else if (R.kind === 'site') World.micSiteFill(dishId, ok); else World.micDishFill(dishId, ok); } catch (e) { /* decor */ } };
    if (ch.valid.indexOf(dishId) >= 0) { ch.used = true; R.placed[dishId] = (R.placed[dishId] || 0) + 1; (R.items[dishId] = R.items[dishId] || []).push(ch.t); R.msg = ''; fill(true); SFX.play('ok'); if (R.chips.every(c => c.used || (R.kind === 'part' && !c.valid.length))) { micFinish(false); return; } }
    else { R.mist++; R.shake = chipId; R.msg = ch.t + ((R.kind === 'site' || R.kind === 'part') ? ' does not usually infect the ' : ' does not belong in the ') + dish.label.toLowerCase() + (R.kind === 'dish' ? ' dish.' : '.'); fill(false); SFX.play('bad'); }
    renderPanel();
  }
  function micSiteClick(id) {
    if (micR && micR.sort && micR.kind === 'part') { if (id === micR.part && !micR.done && micR.sel !== null && micR.sel !== undefined) micDrop(micR.sel, micR.part); return; }
    if (!micR && view === 'mic' && (micPicking || micS().mode === 'drag') && micS().set === 'body') { const g = micGrp(MICSETS[0], id); if (g && !g.fam) { micStartPart(id); return; } }
    if (micR && micR.sort && micR.kind === 'site') { if (!micR.done && micR.sel !== null && micR.sel !== undefined) micDrop(micR.sel, id); return; } micSelG = id; renderPanel(); }
  function micPaperClick(id, row) {
    const R = micR; if (!R || R.done) return;
    if (R.sort && R.kind === 'board') { if (R.sel !== null && R.sel !== undefined) micDrop(R.sel, id); return; }
    if (R.sort) return;
    if (R.mode === 'drag') { if (R.sel !== null && R.sel !== undefined) micCommit(R.sel, { id, row }); return; }
    if (row >= 0 && R.lock[row] < 0) { R.cur = row; renderPanel(); const inp = document.querySelector('.mfillone input'); if (inp) inp.focus(); }
  }
  function micDishClick(id) { if (micR && micR.sort && micR.kind === 'dish' && !micR.done && micR.sel !== null && micR.sel !== undefined) micDrop(micR.sel, id); }
  const micTop = (back) => `<div class="mictop">${back ? '<button type="button" class="btn mback" data-act="mic-menu" aria-label="Back to the lab menu">\u2039 Back</button>' : '<span></span>'}<button type="button" class="xbtn" data-act="back" aria-label="Back to counter" title="Back to counter">\u2715</button></div>`;
  const MICICON = {
    clock: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><polygon points="12,2 19,5 22,12 19,19 12,22 5,19 2,12 5,5" fill="#fff" stroke="#C0392B" stroke-width="2"/><path d="M12 6v6l4 2" stroke="#18202A" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><polygon points="12,2 18,5 19,11 15,15 9,15 5,11 6,5" fill="#FFE27A" stroke="#C99A12" stroke-width="2"/><rect x="9" y="16" width="6" height="4" fill="#8A96A0"/></svg>',
    kidney: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><polygon points="8,3 15,3 19,8 18,15 14,21 8,21 5,16 9,12 6,8" fill="#B5482F" stroke="#7B2A18" stroke-width="2"/></svg>'
  };
  function micBoardHTML(R) {
    const cells = R.dishes.map(d => `<button type="button" class="bcell" data-cell="${d.id}" aria-label="${esc(d.label)}"><b>${esc(d.label)}</b>${(R.items[d.id] || []).map(t => `<i>${esc(t)}</i>`).join('')}</button>`).join('');
    return `<div class="board row" aria-label="Boxes">${cells}</div>`;
  }
  function micSortHTML() {
    const R = micR, head = `<h3>${esc(R.name)}</h3><p class="sub">${esc(R.help || 'Look at the lab: each petri dish is labeled with a bug. Drag each drug from the word bank below onto the dish it treats, or tap a drug and then tap a dish.')}</p>`;
    const placedAll = R.chips.filter(c => c.used).length, count = R.kind === 'board' ? (micLab3() ? `<p class="note">Placed <b>${placedAll}</b> of ${R.chips.length}. The papers are on the lab table: drag a bank item onto the right one, or tap it and then tap a paper.</p>` : micBoardHTML(R)) : `<div class="micdishes" aria-label="Dishes">${R.dishes.map(d => `<span class="${R.hot === d.id ? 'hot' : ''}">${esc(d.label)} \u00B7 ${R.placed[d.id] || 0}</span>`).join('')}</div>`;
    if (R.done) {
      const r = R.res;
      return `<div class="pane micpane round">${micTop(true)}${head}${count}<div class="result ${r.stars ? 'good' : 'fail'}"><h3>${R.mist === 0 ? 'Perfect round!' : 'Round complete'}</h3>
        <div class="pay"><span class="big">+${money(r.pay)}</span><span>${R.mist} miss${R.mist === 1 ? '' : 'es'}</span>${r.bug ? '<span>trash can cleaned x2</span>' : ''}${r.stars ? '<span>\u2605 star earned</span>' : ''}</div>
        <div class="btnrow"><button type="button" class="btn go" data-act="mic-again" data-v="${R.sid}">Again</button><button type="button" class="btn" data-act="mic-menu">Back to the lab</button></div></div></div>`;
    }
    const dishes = R.chips.map(c => `<button type="button" class="petri ${R.bugs ? 'bug' : ''} ${c.used ? 'used' : ''} ${R.sel === c.id ? 'sel' : ''} ${R.shake === c.id ? 'shake' : ''}" data-chip="${c.id}" style="--d:${c.id * 1.7 % 7}" ${c.used ? 'disabled' : ''}>${R.bugs ? micCrit(c.id * 7 + c.t.length) : micDish(c.t, 'drug', c.id * 7 + c.t.length)}<span>${esc(c.t)}</span></button>`).join('');
    return `<div class="pane micpane round">${micTop(true)}${head}${count}<p class="micmsg" aria-live="polite">${esc(R.msg || (R.sel !== null ? (R.kind === 'board' ? (R.bugs ? 'Bug picked. Tap the right paper.' : 'Drug picked. Tap the right box.') : (R.kind === 'part' ? 'Bug picked. Tap the ' + R.name.toLowerCase() + ' in the lab.' : R.bugs ? 'Bug picked. Tap the right dish.' : 'Drug picked. Tap the right dish.')) : ''))}</p><div class="mdishes" aria-label="Petri dish word bank">${dishes}</div><p class="note nmiss">Misses: <b>${R.mist}</b></p>
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
  function micSortRows(sorts, title) {
    return `<div class="grp"><b>${title}</b><ul class="miclist">${sorts.map(x => `<li><button type="button" class="microw" data-act="mic-go" data-v="${x.id}"><span class="mrn">${esc(x.name)}</span><small>${x.n} ${x.kind || x.bugs ? 'bugs' : 'drugs'}</small><span class="mstars" aria-label="${micRec(x.id).d ? 1 : 0} of 1 star"><i class="${micRec(x.id).d ? 'on' : ''}">\u2605</i></span></button></li>`).join('')}</ul></div>`;
  }
  function micHTML() {
    const m = micS(), set = micSet(m.set);
    if (micR) return micR.sort ? micSortHTML() : micRoundHTML();
    if (micPicking && micS().set === 'body') return micPickHTML();
    const srt = World.ok && World.setMic ? micAllSorts() : [], total = MICSETS.reduce((n, s) => n + s.groups.length * 2, 0) + srt.length, got = MICSETS.reduce((n, s) => n + s.groups.reduce((a, g) => a + micStars(g), 0), 0) + srt.filter(x => micRec(x.id).d).length;
    const tabs = MICSETS.map(s => `<button type="button" class="seg-b ${s.id === set.id ? 'on' : ''}" data-act="mic-set" data-v="${s.id}" aria-pressed="${s.id === set.id}">${esc(s.name)}</button>`).join('');
    const gramOnly = set.id === 'gram' && World.ok && World.setMic;
    const modes = gramOnly ? '' : [['drag', 'Drag from the petri dish'], ['fill', 'Fill in the blank']].map(a => `<button type="button" class="seg-b ${m.mode === a[0] ? 'on' : ''}" data-act="mic-mode" data-v="${a[0]}" aria-pressed="${m.mode === a[0]}">${a[1]}</button>`).join('');
    let body = '';
    if (set.id === 'body') {
      const sites = set.groups.filter(g => !g.fam), fams = set.groups.filter(g => g.fam), sel = micSelG && micGrp(set, micSelG);
      const lab3 = micIn || (World.ok && World.setMic);
      body = `<div class="micbody ${lab3 ? 'solo' : ''}">${lab3 ? '' : `<div class="mantw">${micManSVG()}${micPinsHTML(set, sites)}</div>`}
        <div class="micside">${m.mode === 'drag' && lab3 ? '<div class="grp"><b>Place the bugs</b><ul class="miclist"><li><button type="button" class="microw" data-act="mic-pick"><span class="mrn">Pick a body part</span><small>click it, zoom in, place the bugs</small></button></li></ul></div>' : ''}${m.mode === 'drag' ? micSortRows(micSortsFor('body'), 'Drag bugs from the bank') : ''}<p class="note">${lab3 ? (m.mode === 'drag' ? 'Click a part of the man in the lab to zoom in on it, or use Pick a body part. Markers with a ring are normally sterile sites.' : 'Click a marker or an organ on the man in the lab to pick a body site for typing. Markers with a ring are normally sterile sites.') : 'Tap a pin to pick a body site. The brain (CNS) and the leg bone (bone and joint) are popping out. Dashed pins are normally sterile sites.'}</p>
        ${sel ? `<div class="micpick"><b>${esc(sel.name)}</b>${micStarsHTML(sel)}<small>${sel.items.length} usual bugs${sel.sterile ? ' · normally sterile' : ''}</small><button type="button" class="btn go" data-act="mic-go" data-v="${sel.id}">Start this site</button></div>` : (m.mode === 'fill' ? '<div class="micpick empty"><small>No site picked yet.</small></div>' : '')}
        <div class="micfam"><b>Bug families</b>${fams.map(g => `<button type="button" class="btn" data-act="mic-go" data-v="${g.id}">${esc(g.name)} ${micStarsHTML(g)}</button>`).join('')}</div>
        <p class="note small">Normally sterile (no bugs): bone, heart, lower respiratory area, the central nervous system, and the blood.</p></div></div>`;
    } else {
      const sorts = (m.mode === 'drag' || gramOnly) ? micSortsFor(set.id) : [];
      if (gramOnly) body = micSortRows(sorts, 'Fill in the tree'); else body = (sorts.length ? micSortRows(sorts, set.id === 'res' ? 'Fill in the handout boxes' : 'Fill in the three boxes') + '<div class="grp"><b>Or fill the slots for one list</b></div>' : '') + `<ul class="miclist">${set.groups.map(g => `<li><button type="button" class="microw" data-act="mic-go" data-v="${g.id}"><span class="mrn">${esc(g.name)}</span><small>${g.items.length} to place</small>${micStarsHTML(g)}</button></li>`).join('')}</ul>`;
    }
    const bug = S.binBug ? '<p class="micbug">🦠 The trash can is crawling with bacteria! Finish a round to clean it up and earn double.</p>' : '';
    return `<div class="pane micpane">${micTop(false)}<h3>Microbe lab</h3><p class="sub">${esc(set.sub)}. Stars: <b>${got}</b> of ${total}. One star per mode when you finish a group with no misses and no hint.</p>${bug}
      ${modes ? `<div class="seg" role="group" aria-label="Study mode">${modes}</div>` : ''}<div class="seg sets" role="group" aria-label="List">${tabs}</div>${body}</div>`;
  }

  /* ---- a round ---- */
  const micItemLabel = (set, t) => `<i>${esc(t)}</i>`;
  function micCrit(seed) {
    const cols = ['#6FBF2E', '#9B59D0', '#D9A91E', '#1FB39A', '#E0703A'], col = cols[Math.abs(seed) % 5], rod = Math.abs(seed) % 3 !== 2;
    let legs = '';
    for (let i = 0; i < 3; i++) { const x = 18 + i * 8; legs += `<path class="leg" style="animation-delay:${(i * 0.17).toFixed(2)}s" d="M${x} 13 l-3 -7 M${x} 27 l-3 7 M${x + 6} 13 l3 -7 M${x + 6} 27 l3 7" stroke="${col}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`; }
    const body = rod ? `<rect x="10" y="11" width="38" height="18" rx="9" fill="${col}"/>` : `<circle cx="22" cy="20" r="9" fill="${col}"/><circle cx="36" cy="20" r="9" fill="${col}"/>`;
    return `<svg viewBox="0 0 60 40" width="52" height="36" aria-hidden="true">${legs}${body}<path d="M10 20 q-5 -5 -9 0" stroke="${col}" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="${rod ? 43 : 41}" cy="16" r="3" fill="#fff"/><circle cx="${rod ? 43 : 41}" cy="24" r="3" fill="#fff"/><circle cx="${rod ? 44.2 : 42.2}" cy="16" r="1.4" fill="#18202A"/><circle cx="${rod ? 44.2 : 42.2}" cy="24" r="1.4" fill="#18202A"/></svg>`;
  }
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
    const R = { set: set.id, gid, mode, mist: 0, hint: false, done: false, msg: '', sel: null, nonce: ++micNonce, cur: 0 };
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
      const dishes = R.chips.map(c => `<button type="button" class="petri ${drug ? '' : 'bug'} ${c.used ? 'used' : ''} ${R.sel === c.id ? 'sel' : ''} ${R.shake === c.id ? 'shake' : ''}" data-chip="${c.id}" style="--d:${c.id * 1.7 % 7}" ${c.used ? 'disabled' : ''}>${drug ? micDish(c.t, 'drug', c.id * 7 + c.t.length) : micCrit(c.id * 7 + c.t.length)}<span>${esc(c.t)}</span></button>`).join('');
      const placedN = R.slots.filter(c => c !== null).length;
      body = `${micLab3() ? `<p class="note">Answer sheet on the lab table: <b>${placedN}</b> of ${n} placed. Drag a bank item onto the paper, or tap it and then tap the paper.</p>` : `<div class="mslots" aria-label="Slots">${slots}</div>`}<p class="micmsg" aria-live="polite">${esc(R.msg || (R.sel !== null ? (micLab3() ? 'Picked. Tap the paper.' : 'Dish picked. Tap an empty slot.') : ''))}</p><div class="mdishes" aria-label="Petri dish word bank">${dishes}</div><p class="note nmiss">Misses: <b>${R.mist}</b></p>
        <div class="btnrow"><button type="button" class="btn" data-act="mic-menu">Back to the lab</button></div>`;
    } else {
      const rows = g.items.map((t, i) => { const lk = R.lock[i] >= 0; const ph = R.hint ? (() => { const w = lk ? '' : (g.items.find((x, j) => R.lock.indexOf(j) < 0 && j >= 0) || ''); return ''; })() : ''; return `<label class="mfill ${lk ? 'ok' : R.bad[i] ? 'bad' : ''}"><span>${i + 1}</span><input type="text" data-fill="${i}" value="${esc(lk ? g.items[R.lock[i]].replace(/ \((UTI only|only with other antibiotics)\)$/, '') : R.vals[i])}" ${lk ? 'readonly' : ''} placeholder="${R.hint && !lk ? esc(micHintFor(g, R, i)) : 'Type here'}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Blank ${i + 1}"></label>`; }).join('');
      const cur = R.cur >= 0 && R.cur < n && R.lock[R.cur] < 0 ? R.cur : Math.max(0, R.lock.findIndex(x => x < 0)), one = `<label class="mfill mfillone ${R.bad[cur] ? 'bad' : ''}"><span>${cur + 1}</span><input type="text" data-fill="${cur}" value="${esc(R.vals[cur] || '')}" placeholder="Type blank ${cur + 1} here" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Blank ${cur + 1}"></label>`;
      body = `${micLab3() ? `<p class="note">Click a blank line on the paper in the lab, then type it here. Enter moves to the next blank.</p>${one}` : `<div class="mfills">${rows}</div>`}<p class="micmsg" aria-live="polite">${esc(R.msg)}</p><p class="note nmiss">Misses: <b>${R.mist}</b>. Spelling does not need to be perfect, and short forms like <i>E. coli</i> or <i>MRSA</i> are fine.</p>
        <div class="btnrow"><button type="button" class="btn go" data-act="mic-check">Check</button><button type="button" class="btn" data-act="mic-hint" ${R.hint ? 'disabled' : ''}>Hint (first letters)</button><button type="button" class="btn" data-act="mic-reveal">Show answers</button><button type="button" class="btn" data-act="mic-menu">Back to the lab</button></div>`;
    }
    return `<div class="pane micpane round">${micTop(true)}${head}${body}</div>`;
  }
  function micHintFor(g, R, i) { const left = g.items.filter((t, j) => R.lock.indexOf(j) < 0); const t = left[R.hintMap ? R.hintMap[i] : 0] || ''; return ''; }
  function micNextGroup(set, g) { const i = set.groups.findIndex(x => x.id === g.id); for (let k = 1; k <= set.groups.length; k++) { const o = set.groups[(i + k) % set.groups.length]; if (o.id !== g.id && !!o.fam === !!g.fam) return o; } return null; }
  /* chips: the player drops a dish on a slot, either by dragging or by tap, tap */
  function micPlace(chipId, slot) {
    const R = micR; if (!R || R.done || R.mode !== 'drag') return; const set = micSet(R.set), g = micGrp(set, R.gid), ch = R.chips[chipId]; if (!ch || ch.used || R.slots[slot] !== null) return;
    const okKeys = g.items.map(micNorm), placed = R.slots.filter(c => c !== null).map(c => R.chips[c].k);
    R.sel = null; R.shake = null;
    if (okKeys.indexOf(ch.k) >= 0 && placed.indexOf(ch.k) < 0) { ch.used = true; R.slots[slot] = chipId; R.msg = ''; try { World.micPaperFill('slots', true); } catch (e) { /* decor */ } SFX.play('ok'); if (R.slots.every(c => c !== null)) { micFinish(false); return; } }
    else { R.mist++; R.shake = chipId; R.msg = ch.t.replace(/ \((UTI only|only with other antibiotics)\)$/, '') + ' is not on this list. It goes back in the bank.'; try { World.micPaperFill('slots', false); } catch (e) { /* decor */ } SFX.play('bad'); }
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
    R.cur = Math.max(0, R.lock.findIndex(x => x < 0));
    if (wrong) try { World.micPaperFill('slots', false); } catch (e) { /* decor */ }
    R.msg = (added ? added + ' right. ' : '') + (wrong ? wrong + ' not on this list' + (wrong === 1 ? '' : ' (each counts as a miss)') + '. ' : '') + (empty ? empty + ' blank' + (empty === 1 ? '' : 's') + ' still empty.' : '');
    SFX.play(wrong ? 'bad' : 'ok'); renderPanel();
  }
  function micFinish(gaveUp) {
    const R = micR, set = micSet(R.set), g = R.sort ? { id: R.kind === 'part' ? R.part : R.sid, items: R.chips } : micGrp(set, R.gid), n = g.items.length, m = micS(); const rec = m.st[g.id] = m.st[g.id] || { d: 0, f: 0, n: 0 };
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
      case 'mic': micR = null; micPicking = false; openView(view === 'mic' ? 'q' : 'mic'); if (view === 'q') { resumeTimers(); renderPanel(); } return;
      case 'mic-mode': m.mode = v === 'fill' ? 'fill' : 'drag'; save(); renderPanel(); return;
      case 'mic-set': m.set = v; micSelG = null; save(); renderPanel(); return;
      case 'mic-sel': micSelG = v; renderPanel(); return;
      case 'mic-go': case 'mic-again': if (/^part:/.test(String(v))) micStartPart(String(v).slice(5)); else micStart(v); return;
      case 'mic-pick': micPicking = true; micSelG = null; m.set = 'body'; renderPanel(); return;
      case 'mic-menu': micPicking = !!(micR && micR.kind === 'part'); micR = null; renderPanel(); return;
      case 'mic-check': micCheck(); return;
      case 'mic-hint': if (micR && !micR.hint && micR.mode === 'fill') { micR.hint = true; const g = micGrp(micSet(micR.set), micR.gid); micR.msg = 'Hint: the answers start with ' + g.items.filter((t, j) => micR.lock.indexOf(j) < 0).map(t => t.replace(/^[^A-Za-z]*/, '').charAt(0).toUpperCase()).sort().join(', ') + '.'; renderPanel(); } return;
      case 'mic-reveal': if (micR && !micR.done) { const g = micGrp(micSet(micR.set), micR.gid); micR.mist += micR.lock.filter(x => x < 0).length; micFinish(true); } return;
    }
  }
  /* keep typed text when the panel redraws, and use Enter to check */
  document.addEventListener('input', (e) => { const i = e.target && e.target.dataset && e.target.dataset.fill; if (i === undefined || !micR) return; micR.vals[+i] = e.target.value; micR.bad[+i] = false; const lab = e.target.closest('.mfill'); if (lab) lab.classList.remove('bad'); micPaperStates(); });
  document.addEventListener('keydown', (e) => {
    if (!micR || view !== 'mic' || micR.mode !== 'fill' || micR.done) return;
    const t = e.target; if (!t || !t.dataset || t.dataset.fill === undefined || e.key !== 'Enter') return; e.preventDefault();
    if (t.closest('.mfillone')) { const nx = micR.vals.findIndex((v, i) => i !== micR.cur && micR.lock[i] < 0 && !String(v).trim()); if (nx >= 0 && String(micR.vals[micR.cur] || '').trim()) { micR.cur = nx; renderPanel(); const inp = document.querySelector('.mfillone input'); if (inp) inp.focus(); } else micCheck(); return; }
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
    if (d.on) { e.preventDefault(); d.ghost.style.left = e.clientX + 'px'; d.ghost.style.top = e.clientY + 'px'; const s = document.elementFromPoint(e.clientX, e.clientY), sl = s && s.closest && s.closest('.mslot:not(.full), .bcell:not(:disabled)'); document.querySelectorAll('.mslot.over, .bcell.over').forEach(x => x !== sl && x.classList.remove('over')); if (sl) sl.classList.add('over'); micHot(micHit(e.clientX, e.clientY)); }
  }, { passive: false });
  const micDragEnd = (e) => {
    const d = micDrag; if (!d || d.pid !== e.pointerId) return; micDrag = null;
    if (d.ghost) d.ghost.remove(); d.el.classList.remove('drag'); document.querySelectorAll('.mslot.over, .bcell.over').forEach(x => x.classList.remove('over'));
    if (e.type === 'pointercancel' || !micR) return;
    micHot(null);
    if (d.on) {
      if (micLab3()) { const h = micHit(e.clientX, e.clientY); if (h) micCommit(d.id, h); else renderPanel(); }
      else { const so = document.elementFromPoint(e.clientX, e.clientY), bc = so && so.closest && so.closest('.bcell'), sl = so && so.closest && so.closest('.mslot'); if (bc && !bc.disabled && micR.sort) micDrop(d.id, bc.dataset.cell); else if (sl && !sl.disabled) micPlace(d.id, +sl.dataset.slot); else renderPanel(); }
    }
    else { micR.sel = micR.sel === d.id ? null : d.id; micR.msg = ''; renderPanel(); }
  };
  document.addEventListener('pointerup', micDragEnd); document.addEventListener('pointercancel', micDragEnd);
  document.addEventListener('click', (e) => {
    if (!micR || view !== 'mic') return; const sl = e.target.closest && e.target.closest('.mslot'), ch = e.target.closest && e.target.closest('.petri');
    if (ch && e.detail === 0 && !ch.disabled) { micR.sel = micR.sel === +ch.dataset.chip ? null : +ch.dataset.chip; renderPanel(); return; }
    const bc = e.target.closest && e.target.closest('.bcell'); if (bc && !bc.disabled && micR.sort && !micR.done && micR.sel !== null && micR.sel !== undefined) { micDrop(micR.sel, bc.dataset.cell); return; }
    if (sl && !sl.disabled && micR.sel !== null && micR.sel !== undefined) micPlace(micR.sel, +sl.dataset.slot);
  });
  /* the trash can gets crawling with bacteria now and then; the player does not have to act, but a round while it is dirty pays double */
  function micTick() {
    if (!World.ok || S.binBug || !S.tutDone || (S.served || 0) < 5 || document.hidden || view === 'create') return;
    if (Math.random() < 0.2) { S.binBug = true; try { World.setBin(true); } catch (e) { /* decor */ } save(); toast('Something is crawling on the trash can. Click it!'); }
  }
  setInterval(micTick, 25000);

  const GAME_VERSION = 167;
  const b64u = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const unb64u = (t) => { const s = atob(t.replace(/-/g, '+').replace(/_/g, '/')), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  const chk = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  const pipe = async (u8, Stream) => { const st = new Blob([u8]).stream().pipeThrough(new Stream('gzip')); return new Uint8Array(await new Response(st).arrayBuffer()); };
  async function makeCode() {
    const u8 = new TextEncoder().encode(JSON.stringify({ g: 'cornerRx', s: S }));
    let body, tag = 'RX1'; try { body = b64u(await pipe(u8, window.CompressionStream)); tag = 'RX2'; } catch (e) { body = b64u(u8); }
    return tag + '.' + body + '.' + chk(body);
  }
  async function readCode(code) {
    const m = String(code || '').replace(/\s+/g, '').match(/^(RX[12])\.([A-Za-z0-9_-]+)\.([a-z0-9]+)$/);
    if (!m || chk(m[2]) !== m[3]) throw new Error('bad');
    let u8 = unb64u(m[2]); if (m[1] === 'RX2') u8 = await pipe(u8, window.DecompressionStream);
    const o = JSON.parse(new TextDecoder().decode(u8)); if (!o || o.g !== 'cornerRx' || !o.s || typeof o.s !== 'object') throw new Error('bad');
    return o.s;
  }
  let armedLoad = false;
  function saveBoxHTML() {
    return '<section class="card savebox"><h2>Save code <small>version ' + GAME_VERSION + '</small></h2><p class="note">Your progress saves in this browser. To keep a backup or move to another device, copy your save code, then paste it into the game there and tap Load. Treat it like a password: anyone with it can load your save.</p>' +
      '<textarea class="field sctext" spellcheck="false" aria-label="Save code" placeholder="Your save code appears here. Paste a code here to load it."></textarea>' +
      '<div class="btnrow"><button type="button" class="btn go" data-act="sc-copy">Copy my save code</button><button type="button" class="btn" data-act="sc-load">Load code</button></div><p class="scmsg" role="status"></p></section>';
  }
  async function saveCodeAct(t, a) {
    const box = t.closest('.savebox'), ta = box.querySelector('.sctext'), msg = box.querySelector('.scmsg');
    const say = (m, bad) => { msg.textContent = m; msg.className = 'scmsg' + (bad ? ' bad' : ''); };
    if (a === 'sc-copy') {
      armedLoad = false;
      try { const c = await makeCode(); ta.value = c; ta.select(); let ok = false; try { await navigator.clipboard.writeText(c); ok = true; } catch (e) { /* manual copy */ } say(ok ? 'Copied. Paste it somewhere safe.' : 'Select the code above and copy it.'); } catch (e) { say('Could not make a code in this browser.', true); }
      return;
    }
    const raw = ta.value.trim(); if (!raw) { say('Paste a save code above first.', true); return; }
    let s; try { s = await readCode(raw); } catch (e) { say('That code is not valid. Copy the whole thing, including the RX at the start.', true); armedLoad = false; return; }
    if (!armedLoad) { armedLoad = true; say('Valid code. Loading replaces this device’s progress. Tap Load code again to confirm.'); setTimeout(() => { armedLoad = false; }, 8000); return; }
    armedLoad = false; clearTimeout(saveTimer);
    window.__rxLoading = true;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); say('Loaded. Restarting\u2026'); setTimeout(() => location.reload(), 300); } catch (e) { say('This browser would not store the save.', true); }
  }
  function copyText(txt) {
    const prev = $('#studyprev');
    const fallback = () => { if (!prev) return; prev.innerHTML = '<div class="prev"><div>Copy this text:</div><textarea class="field" id="copybox" readonly></textarea></div>'; const b = $('#copybox'); b.value = txt; b.focus(); b.select(); };
    try { navigator.clipboard.writeText(txt).then(() => { if (prev) prev.innerHTML = '<div class="prev good">Copied to your clipboard.</div>'; }, fallback); } catch (e) { fallback(); }
  }

  /* ---- events ---- */
  function act(t) {
    const a = t.dataset.act, v = t.dataset.v, st = S.set;
    if (document.body.classList.contains('menuopen') || a === 'awards') {
      const inMenu = !!(t.closest && t.closest('#menu')), same = { settings: 'set', studies: 'studies', create: 'create', awards: 'awards', ref: 'ref' }[a];
      if (a !== 'menu' && a !== 'sfx' && !/^sheet-/.test(a)) document.body.classList.remove('menuopen', 'drawer');
      if (inMenu && same && view === same) return;
    }
    switch (a) {
      case 'settings': openView(view === 'set' ? 'q' : 'set'); if (view === 'q') { resumeTimers(); renderPanel(); } return;
      case 'studies': openView(view === 'studies' ? 'q' : 'studies'); if (view === 'q') { resumeTimers(); renderPanel(); } return;
      case 'vial': openVial(); return;
      case 'cyc': { readShop(); const k = t.dataset.k, d = +t.dataset.d, r = crows().find(x => x.k === k); if (!r || r.o.length < 2) return; const i = Math.max(0, r.o.findIndex(x => x.v === r.cur)), nx = r.o[(i + d + r.o.length) % r.o.length]; setCrow(k, nx.v); save(); World.setPharmacist(meSpec());
        const row = document.querySelector('.crow[data-k="' + k + '"]'), nr = crows().find(x => x.k === k); if (row && nr) { row.outerHTML = crowHTML(nr); const nb = document.querySelector('.crow[data-k="' + k + '"] [data-d="' + d + '"]'); if (nb) nb.focus(); } const pv = document.querySelector('.mepv'); if (pv) pv.innerHTML = mePreview(); return; }
      case 'create': openView(view === 'create' ? 'q' : 'create'); if (view === 'q') { resumeTimers(); renderPanel(); } return;
      case 'awards': openView(view === 'awards' ? 'q' : 'awards'); if (view === 'q') { resumeTimers(); renderPanel(); } return;
      case 'me': { readShop(); const k = t.dataset.k, v = t.dataset.v; S.me[k] = (k === 'hair' || k === 'hairColor' || k === 'skin' || k === 'scrub') ? +v : v; save(); World.setPharmacist(meSpec()); renderPanel(); return; }
      case 'ctab': readShop(); cTab = v === 'shop' || v === 'pets' ? v : 'me'; renderPanel(); return;
      case 'shop-buy': shopBuy(t.dataset.k, t.dataset.id); if (view === 'create') renderPanel(); return;
      case 'shop-use': shopUse(t.dataset.k, t.dataset.id); return;
      case 'rug-off': S.store.rug = Object.assign({ off: false, c: '#F2A516', p: 'solid' }, S.store.rug || {}); S.store.rug.off = !S.store.rug.off; save(); applyShop(); if (view === 'create') renderPanel(); return;
      case 'rug-p': case 'rug-c': S.store.rug = Object.assign({ off: false, c: '#F2A516', p: 'solid' }, S.store.rug || {}); S.store.rug[t.dataset.act === 'rug-p' ? 'p' : 'c'] = t.dataset.v; S.store.rug.off = false; save(); applyShop(); if (view === 'create') renderPanel(); return;
      case 'deco-rot': { const id = t.dataset.v, d = Number(t.dataset.d) || 1, st = Math.PI / 4; if (id === 'erug') { S.store.rug = Object.assign({ off: false, c: '#F2A516', p: 'solid' }, S.store.rug || {}); S.store.rug.rot = (((S.store.rug.rot || 0) + d * st) % (Math.PI * 2)); } else { S.store.rot = S.store.rot || {}; S.store.rot[id] = (((S.store.rot[id] || 0) + d * st) % (Math.PI * 2)); } save(); applyShop(); if (view === 'create') renderPanel(); return; }
      case 'deco-reset': S.store.pos = {}; S.store.rot = {}; if (S.store.rug) S.store.rug.rot = 0; save(); applyShop(); toast('Decorations are back in their spots.'); return;
      case 'pwshop': cTab = 'shop'; Object.keys(shopOpen).forEach(k => { shopOpen[k] = false; }); shopOpen.pow = true; openView('create'); return;
      case 'me-done': readShop(); S.me.done = true; save(); syncBrand(); backToQ(); maybeTour(); return;
      case 'back': if (view === 'syn') synExit(); if (view === 'shift') return shiftNext(false); readDraft(); const wasC = view === 'create' && !S.me.done; if (view === 'create') readShop(); if (wasC) { S.me.done = true; save(); } backToQ(); if (wasC) maybeTour(); return;
      case 'phone': return openPhone();
      case 'menu': document.body.classList.remove('drawer'); document.body.classList.toggle('menuopen'); return;
      case 'sheet-ups': case 'sheet-prog': {
        const ups = a === 'sheet-ups'; document.body.classList.remove('menuopen'); document.body.dataset.sheet = ups ? 'ups' : 'prog';
        $('#sheettitle').textContent = ups ? 'Upgrades' : 'Progress';
        renderStore(); renderUpgrades(); renderMastery(); renderReview(); renderFranchise(); document.body.classList.add('drawer'); const d = $('#drawer'); if (d) d.scrollTop = 0; return;
      }
      case 'drawer-close': document.body.classList.remove('drawer', 'menuopen'); return;
      case 'sc-copy': case 'sc-load': return saveCodeAct(t, a);
      case 'dev-elder': { const ok = World.ok && World.devElder(); toast(ok ? 'An elder patient is next in line. Use "Test: skip to next patient".' : 'No patient could be swapped right now.'); return; }
      case 'dev-next': if (view === 'q') newCard(); return;
      case 'dev-recall': { const q = BANK.find(x => !x.ms && x.k !== lastKey); if (!q) return; S.recall = S.recall || []; if (!S.recall.some(r => r.k === q.k)) S.recall.push({ k: q.k, seed: 4321, body: 'obese', name: 'Rosa', due: 0, tries: 0, at: Date.now() - 2 * 864e5 }); forceSp = { recall: q.k, seed: 4321, body: 'obese' }; if (view === 'q') newCard(); return; }
      case 'dev-regular': { const w = WEEKS[0]; S.reg = S.reg || {}; if (!S.reg[w.n]) { S.reg[w.n] = { n: w.n, name: 'Big Mike', seed: 7000 + w.n * 137, body: 'jacked', visits: 0, ok: 0, at: Date.now() }; if (World.ok && World.setMastery) World.setMastery(masteryList()); } forceSp = { regular: w.n, seed: S.reg[w.n].seed, body: 'jacked' }; if (view === 'q') newCard(); return; }
      case 'dev-pill': { const ok = World.ok && World.devPill(); toast(ok ? 'A pill popped out. Tap it.' : 'Could not spawn one.'); return; }
      case 'dev-exportjson': { const r = World.exportManJson(); toast(r.ok ? 'Downloaded LabPatient.partmaker.json: ' + r.msg : 'Export failed: ' + r.msg); return; }
      case 'dev-exportman': { toast('Building the patient file...'); World.exportMan((ok, m) => toast(ok ? 'Downloaded corner-rx-lab-patient.glb (' + m + ')' : 'Export failed: ' + m)); return; }
      case 'dev-legcap': { S.vial = S.vial || []; S.vial.push({ k: 'c', c: '#F2A516', c2: '#F4F4F0', s: 'two', r: 'legendary' }); save(); vialSync(); toast('A legendary capsule is in the vial.'); return; }
      case 'dev-bottle': learnOff(); fp.cool = 0; return startBottles();
      case 'dev-shelve': learnOff(); return startShelve(false);
      case 'dev-prior': learnOff(); return startPrior();
      case 'dev-rush': learnOff(); rush.next = 0; if (!rush.on) { rush.on = true; rush.left = 45; World.setRush(true); toast('Rush hour!'); rushBadge(); } return;
      case 'dev-fast': learnOff(); toast('Slow start skipped. Events can happen now.'); return;
      case 'lab': return toggleLab();
      case 'syn': return synEnter();
      case 'syn-cat': SYN.cat = v; SYN.q = null; SYN.sel = null; synNewQ(); synSet(); renderPanel(); return;
      case 'syn-gaba': gabaStart(v); renderPanel(); return;
      case 'syn-labels': SYN.labels = !SYN.labels; synSet(); renderPanel(); return;
      case 'syn-act': return synAnswerAct(v);
      case 'syn-site': return synAnswerSite(v);
      case 'syn-submit': return synSubmit();
      case 'syn-dir': return synDir(v);
      case 'syn-dirsubmit': return synDirSubmit();
      case 'syn-next': synNewQ(); renderPanel(); return;
      case 'syn-info': SYN.sel = SYN.sel === v ? null : v; if (World.ok) World.synHighlight(SYN.sel ? [SYN.sel] : null); renderPanel(); return;
      case 'lab-ins': { const el = $('#labexpr'); if (!el) return; const p = el.selectionStart == null ? el.value.length : el.selectionStart; el.value = el.value.slice(0, p) + v + el.value.slice(el.selectionEnd == null ? p : el.selectionEnd); const np = p + v.length; el.focus(); try { el.setSelectionRange(np, np); } catch (x) {} LABCALC.expr = el.value; labTick(); return; }
      case 'lab-ans': labTick(); if (LABCALC.val != null) { LABCALC.ans = LABCALC.val; toast('Stored. Type ans to reuse ' + fmtS(LABCALC.val) + '.'); } return;
      case 'lab-clr': { LABCALC.expr = ''; const el = $('#labexpr'); if (el) el.value = ''; labTick(); return; }
      case 'labk': { S.labK = S.labK || {}; const on = ['comp', 'pk'].filter(x => S.labK[x] !== false).length; if (S.labK[v] !== false && on <= 1) { toast('Keep at least one kind on.'); return; } S.labK[v] = S.labK[v] === false; save(); renderPanel(); return; }
      case 'sfx': S.sfx = S.sfx === false; save(); sfxLabel(); SFX.play('ok'); return;
      case 'music': S.music = S.music === false; save(); musLabel(); MUS.sync(); toast(S.music === false ? 'Radio off.' : 'Radio on.'); return;
      case 'flash': openView(view === 'flash' ? 'q' : 'flash'); if (view === 'q') { resumeTimers(); renderPanel(); } return;
      case 'share': return makeShare();
      case 'share-send': return shareSend();
      case 'shift-next': return shiftNext(false);
      case 'shift-retry': return shiftNext(true);
      case 'fc-cat': fcs.cat = t.dataset.v; fcs.card = null; fcNext(); renderPanel(); return;
      case 'fc-flip': if (!fcs.flip) { fcs.flip = true; SFX.play('flip'); renderPanel(); } return;
      case 'fc-got': return fcRate(true);
      case 'fc-no': return fcRate(false);
      case 'dev-sky': case 'dev-plant': { const ok = World.ok && World.devCapsule(a === 'dev-sky' ? 'sky' : 'plant'); toast(ok ? 'A capsule is out. Tap it.' : 'Could not spawn one.'); return; }
      case 'dev-insp': case 'dev-driver': { const k = { 'dev-insp': 'inspector', 'dev-driver': 'driver' }[a]; learnOff(); if (!(World.ok && World.devEvent && World.devEvent(k))) forceEvt = k; toast(!World.ok ? 'A visitor is next in line. Use "Test: skip to next patient".' : 'The visitor is walking in. Wait for them behind the counter, then click them.'); return; }
      case 'dev-him-walk': learnOff(); forceHim = true; if (cur && (cur.done || cur.empty) && view === 'q') newCard(); else toast('Andy is the next patient. Finish this one first (or use "skip to next patient").'); return;
      case 'dev-him-asc': { learnOff(); if (!World.ok || !World.himArrive) { toast('Needs the 3D pharmacy (turn off Focus mode).'); return; } if (!World.himAtCounter()) World.himArrive(); toast('Andy is walking in. Watch the counter.'); setTimeout(() => himFarewell(true), 4500); return; }
      case 'dev-him-angel': { learnOff(); toast(World.ok && World.devHimAngel() ? 'The angel is up in the clouds. Click him!' : 'Could not start the flyover.'); return; }
      case 'dev-him-smash': { learnOff(); toast(World.ok && World.devHimSmash() ? 'Andy is diving in...' : 'Could not start the smash.'); return; }
      case 'tour': return showTour();
      case 'shop-save': { const el = $('#shopname2'); const v = el ? el.value.replace(/\s+/g, ' ').trim().slice(0, 24) : ''; if (v) { S.shop = v; save(); syncBrand(); toast('Your pharmacy is now ' + v + '.'); renderPanel(); } return; }
      case 'tour-next': if (tourStep >= TOUR.length - 1) endTour(); else { tourStep++; drawTour(); } return;
      case 'tour-back': if (tourStep > 0) { tourStep--; drawTour(); } return;
      case 'tour-skip': return endTour();
      case 'fp-leave': return fpLeave();
      case 'fp-tip': return;
      case 'shelve': return startShelve(false);
      case 'mic': case 'mic-mode': case 'mic-set': case 'mic-sel': case 'mic-go': case 'mic-again': case 'mic-menu': case 'mic-pick': case 'mic-check': case 'mic-hint': case 'mic-reveal': return micAct(a, v);
      case 'daily': openView(view === 'daily' ? 'q' : 'daily'); if (view === 'q') { resumeTimers(); renderPanel(); } return;
      case 'board': openView(view === 'board' ? 'q' : 'board'); if (view === 'q') { resumeTimers(); renderPanel(); } return;
      case 'flags': openView(view === 'flags' ? 'q' : 'flags'); if (view === 'q') { resumeTimers(); renderPanel(); } return;
      case 'flag-open': if (cur) { cur.flagOpen = !cur.flagOpen; renderPanel(); const ta = document.querySelector('.flagform textarea'); if (ta) ta.focus(); } return;
      case 'board-join': { const nb = $('#nickbox'), nick = nb ? nb.value.replace(/\s+/g, ' ').trim().slice(0, 24) : ''; if (!nick) { toast('Pick a nickname first.'); return; } S.nick = nick; S.boardOn = true; save(); boardPush().then(boardLoad); renderPanel(); toast('You are on the board as ' + nick + '.'); return; }
      case 'join-go': { const nb = $('#joinnick'), nick = nb ? nb.value.replace(/\s+/g, ' ').trim().slice(0, 24) : ''; if (!nick) { toast('Type a nickname first, or tap Not now.'); return; } S.nick = nick; S.boardOn = true; closeJoin(); boardPush(); toast('You are on the leaderboard as ' + nick + '.'); return; }
      case 'join-skip': closeJoin(); toast('No problem. You can join any time from the Leaderboard page.'); return;
      case 'board-leave': { S.boardOn = false; save(); Net.rpc('leave_board', { p_pid: playerId(), p_tok: playerTok() }).catch(() => {}).then(() => { boardLoad(); }); renderPanel(); toast('Removed from the board.'); return; }
      case 'board-refresh': boardLoad(); return;
      case 'flag-refresh': flagsLoad(false); return;
      case 'flag-showdone': flagShowDone = !flagShowDone; renderPanel(); return;
      case 'flag-key': { const k = ($('#adminkey') || {}).value || ''; try { localStorage.setItem('rx.adminKey', k); } catch (e) { /* ignore */ } toast(k ? 'Admin key saved in this browser.' : 'Admin key cleared.'); return; }
      case 'flag-resolve': { const id = +v, done = t.dataset.done === '1'; if (!adminKey()) { toast('Save the admin key first.'); return; } t.disabled = true; Net.rpc('resolve_flag', { fid: id, k: adminKey(), done }).then(ok => { if (ok) { const r = (flagRows || []).find(x => x.id === id); if (r) r.resolved = done; renderPanel(); } else { t.disabled = false; toast('That admin key was not accepted.'); } }).catch(err => { t.disabled = false; toast('Could not update: ' + (err.message || 'offline')); }); return; }
      case 'ref': openView(view === 'ref' ? 'q' : 'ref'); if (view === 'q') { resumeTimers(); renderPanel(); } return;
      case 'retire-new': {
        S.retired = (S.retired || 0) + 1; S.cash = 0; S.franchises = 0; S.rep = 50; S.streak = 0; S.up = defaults().up;
        save(); renderAll(); view = 'q'; newCard(); toast('Career #' + (S.retired + 1) + ' begins. Income +50% per retirement.'); return;
      }
      case 'jim-go': endInterrupt(); renderPanel(); return;
      case 'topic': st.topics[v] = !st.topics[v]; break;
      case 'topics-all': CATS.forEach(c => st.topics[c[0]] = true); break;
      case 'topics-none': CATS.forEach(c => st.topics[c[0]] = false); break;
      case 'diff': { const i = st.diffs.indexOf(+v); if (i >= 0) { if (st.diffs.length > 1) st.diffs.splice(i, 1); } else st.diffs.push(+v); break; }
      case 'mode': st.mode = v; break;
      case 'mode-go': st.mode = v; save(); newCard(); return;
      case 'timer': st.timer = !st.timer; break;
      case 'conf': st.conf = st.conf === false; if (cur) cur.pend = undefined; break;
      case 'focus': st.focus = !st.focus; applyFocus(); toast(st.focus ? 'Focus mode on. No timer, events or 3D world.' : 'Focus mode off. The pharmacy is back.'); break;
      case 'tab-set': flipTab = true; openView('set'); return;
      case 'tab-studies': flipTab = true; openView('studies'); return;
      case 'tab-opts': flipTab = true; openView('opts'); return;
      case 'course-all': { const c = COURSES.find(x => x.id === v); if (c) courseCats(c).forEach(k => st.topics[k] = true); break; }
      case 'course-none': { const c = COURSES.find(x => x.id === v); if (c) courseCats(c).forEach(k => st.topics[k] = false); break; }
      case 'course-only': { const c = COURSES.find(x => x.id === v); if (!c) break; if (courseOnly(c)) { unsetOnly(); toast('The other topics are back on.'); } else { setOnly(courseCats(c)); toast('Only ' + c.name + ' topics are on.'); } break; }
      case 'week-only': { const k = WKCFG[v] ? v : 'p2', cat = WKCFG[k].topic; if (weekOnly(k)) { unsetOnly(); wkPick(k, '', 'only'); toast('The other topics and weeks are back on.'); } else { if (!WKCFG[k].cur()) { toast('No week has started yet.'); return; } setOnly([cat]); if (!wkOnlyNow(k)) wkPick(k, '', 'only'); toast('Only this week’s drugs are on.'); } break; }
      case 'year': st.year = YEARS.indexOf(v) >= 0 ? v : 'P2'; findQ = ''; break;
      case 'year-only': { if (yearOnly(v)) { unsetOnly(); toast('The other years are back on.'); } else { if (!COURSES.some(c => c.year === v && courseCats(c).length)) { toast(v + ' has no courses filed yet.'); return; } setOnly(yearCats(v)); toast('Only ' + v + ' topics are on.'); } break; }
      case 'wkpick': { const [k, x] = v.split(':'); const a = x === 'all' || x === 'none' || x === 'only' || x === 'sofar' ? x : 'toggle'; if (wkPick(k, a === 'toggle' ? x : '', a) === false) return; break; }
      case 'wkcourse': { const i = v.indexOf(':'); wkPick(v.slice(0, i), v.slice(i + 1), 'course'); break; }
      case 'wkfold': st[v + 'fold'] = !st[v + 'fold']; break;
      case 'wkup': st[v + 'up'] = !st[v + 'up']; break;
      case 'wktype': { st.wkTypes = st.wkTypes || {}; const on = WK_TYPES.filter(x => st.wkTypes[x[0]] !== false).length; if (st.wkTypes[v] !== false && on <= 1) { toast('Keep at least one kind of weekly question on.'); return; } st.wkTypes[v] = st.wkTypes[v] === false; break; }
      case 'reset-set': S.set = defaults().set; break;
      case 'preview': readDraft(); $('#studyprev').innerHTML = previewHTML(parseStudy(draft.text, 'My notes')); return;
      case 'addstudy': return addStudy();
      case 'qz-dir': readQz(); readDraft(); qz.dir = v === 'dt' ? 'dt' : 'td'; renderPanel(); return;
      case 'qz-add': return addQuizlet();
      case 'template': readDraft(); draft.text = STUDY_TEMPLATE; studyMsg = ''; renderPanel(); return;
      case 'ai-prompt': readDraft(); copyText(STUDY_AI_PROMPT); return;
      case 'deck-toggle': { const d = S.decks.find(x => x.id === t.dataset.id); if (d) { d.enabled = !d.enabled; dirty = true; save(); renderPanel(); } return; }
      case 'deck-copy': { const d = S.decks.find(x => x.id === t.dataset.id); if (d) copyText(deckToText(d)); return; }
      case 'deck-del': {
        const id = t.dataset.id;
        if (armedDeck !== id) { armedDeck = id; renderPanel(); setTimeout(() => { if (armedDeck === id) { armedDeck = null; if (view === 'studies') renderPanel(); } }, 4000); return; }
        armedDeck = null; S.decks = S.decks.filter(x => x.id !== id); rebuildIndex(); S.missed = S.missed.filter(k => BYKEY[k]); dirty = true; save(); renderPanel(); renderMastery(); renderReview(); return;
      }
    }
    dirty = true; save(); renderPanel();
  }
  function siteTap(id) { if (!cur || !cur.q || !cur.q.meta || cur.done || view !== 'q') return; cur.site = id; renderPanel(); }
  document.addEventListener('click', (e) => { const sg = e.target.closest && e.target.closest('.molsvg .site[data-site]'); if (sg) siteTap(sg.getAttribute('data-site')); });
  document.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('.molsvg .site[data-site]')) { e.preventDefault(); siteTap(e.target.closest('.site').getAttribute('data-site')); } });
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.elder !== undefined) return elderPick();
    if (t.dataset.act) return act(t);
    if (t.dataset.ph !== undefined) return phoneAnswer(+t.dataset.ph);
    if (t.dataset.pa !== undefined) return paAnswer(+t.dataset.pa);
    if (t.dataset.panext) return paNext();
    if (t.id === 'retirebtn') { if (S.cash >= RETIRE_AT) openView('retire'); return; }
    if (t.id === 'hangbtn') return hangUp();
    if (t.dataset.conf) { if (cur && cur.pend !== undefined && !cur.done) answer(cur.pend, t.dataset.conf); return; }
    if (t.id === 'msgo') return answer(-2);
    if (t.id === 'plgo') return placeSubmit();
    if (t.id === 'plclr') { if (cur && !cur.done) { cur.pl = {}; cur.plSel = null; renderPanel(); } return; }
    if (t.id === 'drawgo') return drawSubmit();
    if (t.id === 'drawclr') { if (cur && !cur.done) { cur.dpts = []; renderPanel(); } return; }
    if (t.classList.contains('opt')) return cur && cur.q && cur.q.ms ? msToggle(+t.dataset.i) : answer(+t.dataset.i);
    if (t.id === 'nextbtn') { if (cur && cur.insp && cur.insp.n < cur.insp.of) return inspContinue(); if (cur && cur.visit) return endVisit(); if (shiftDue()) return openShift(); return newCard(); }
    if (t.id === 'hintbtn') return useHint();
    if (t.id === 'secbtn') return useSecond();
    if (t.id === 'bindbtn') return useBinder();
    if (t.dataset.buy) { buyUp(t.dataset.buy); return; }
    if (t.id === 'frbtn') {
      if (S.cash < frCost()) return;
      if (armed !== 'fr') { armed = 'fr'; renderFranchise(); setTimeout(() => { if (armed === 'fr') { armed = null; renderFranchise(); } }, 4000); return; }
      armed = null; S.cash = 0; S.franchises++; S.rep = 50; S.streak = 0;
      S.up = defaults().up; save(); renderAll(); newCard(); return;
    }
    if (t.id === 'resetbtn') {
      if (armed !== 'reset') { armed = 'reset'; renderReset(); setTimeout(() => { if (armed === 'reset') { armed = null; renderReset(); } }, 4000); return; }
      armed = null; S = defaults(); rebuildIndex(); try { localStorage.removeItem(SAVE_KEY); } catch (err) { /* ignore */ }
      lastKey = null; draft.text = ''; draft.name = ''; renderAll(); newCard();
    }
  });
  document.addEventListener('input', (e) => { if (e.target.id === 'refq') { refQ = e.target.value; const l = $('#reflist'); if (l) l.innerHTML = refListHTML(); } });
  document.addEventListener('change', (e) => { if (e.target.id === 'deckdate') draft.from = e.target.value; });
  document.addEventListener('input', (e) => { if (e.target.id === 'studytext') draft.text = e.target.value; else if (e.target.id === 'deckname') draft.name = e.target.value; else if (e.target.id === 'deckdate') draft.from = e.target.value; });
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || !cur) return;
    if (e.target.closest && e.target.closest('input,textarea,select')) return;
    if (view === 'fp') { if (fp.kind === 'prior') { if (['1', '2', '3', '4'].indexOf(e.key) >= 0) paAnswer(+e.key - 1); else if (e.key === 'Enter') paNext(); } return; }
    if (e.key.toLowerCase() === 'p' && phone.ringing) { openPhone(); return; }
    if (view === 'phone') {
      if (['1', '2', '3', '4'].indexOf(e.key) >= 0) phoneAnswer(+e.key - 1);
      else if (e.key === 'Enter' && phone.call && phone.call.done && !e.target.closest('button')) hangUp();
      return;
    }
    if (view === 'q' && !cur.done && !cur.empty && cur.q && (cur.q.draw || cur.q.place)) return;
    if (view === 'q' && !cur.done && !cur.empty && cur.q && cur.q.ms && cur.pend !== undefined && ['1', '2', '3'].indexOf(e.key) >= 0) { answer(-2, ['guess', 'sure', 'certain'][+e.key - 1]); return; }
    if (view === 'q' && !cur.done && !cur.empty && cur.q && cur.q.ms) { if (['1', '2', '3', '4', '5', '6'].indexOf(e.key) >= 0) msToggle(+e.key - 1); else if (e.key === 'Enter' && Object.keys(cur.sel).length) { e.preventDefault(); answer(-2); } return; }
    if (view === 'q' && cur.pend !== undefined && !cur.done && !cur.empty && ['1', '2', '3'].indexOf(e.key) >= 0) { answer(cur.pend, ['guess', 'sure', 'certain'][+e.key - 1]); return; }
    if (['1', '2', '3', '4'].indexOf(e.key) >= 0) { if (view === 'q' && !cur.done && !cur.empty) answer(+e.key - 1); }
    else if (e.key === 'Enter' && view === 'q' && cur.done && !e.target.closest('button')) newCard();
  });

  /* ---- loops ---- */
  let tickAt = Date.now();
  setInterval(() => {
    // real elapsed time, not a fixed 0.25s: hidden tabs throttle timers, which used to make income and countdowns lag
    const nowT = Date.now(); tickDt = Math.max(0, Math.min(120, (nowT - tickAt) / 1000)); tickAt = nowT;
    if (S.up.tech > 0) { const g = passive() * tickDt; S.cash += g; S.earned += g; }
    const c = $('#cashv'); if (c) c.textContent = money(S.cash);
    document.querySelectorAll('[data-buy]').forEach(b => { const max = b.textContent === 'MAX'; b.disabled = max || S.cash < +b.dataset.cost; });
    const fb = $('#frbtn'); if (fb) fb.disabled = S.cash < frCost();
    const rb = $('#retirebtn'); if (rb) rb.disabled = S.cash < RETIRE_AT;
    if (!document.hidden && !tourEl) S.playSec = (S.playSec || 0) + Math.min(1, tickDt);
    World.setSlow(learning());
    World.refreshTags(); phoneTick(); rushTick(); eventTick(); evtExpire(); holSync();
    const uh = document.querySelector('#ups h2 small'); if (uh) uh.textContent = money(S.cash) + ' on hand';
  }, 250);
  setInterval(() => {
    if (!cur || cur.empty || cur.done || view !== 'q') return;
    const el = (Date.now() - cur.t0) / 1000, lim = cur.karen ? KAREN_SEC : 20;
    const bar = $('#timerbar'); if (bar) bar.style.transform = 'scaleX(' + Math.max(0, 1 - el / lim) + ')';
    if (cur.karen) { const tc = $('#tcount'); if (tc) { const left = Math.max(0, Math.ceil(KAREN_SEC - el)); if (tc.textContent !== String(left)) tc.textContent = left; const kt = tc.parentElement; if (kt) kt.classList.toggle('low', left <= 8); } }
    if (cur.karen && el >= KAREN_SEC) answer(-1);
    const j = cur.interrupt;
    if (j && !j.dismissed) {
      const e = Date.now() - j.t0, jb = $('#jimbar'); if (jb) jb.style.transform = 'scaleX(' + Math.max(0, 1 - e / j.dur) + ')';
      const go = $('#jimgo'); if (go && go.hidden && e > 2500) go.hidden = false;
      if (e >= j.dur) { endInterrupt(); renderPanel(); }
    }
  }, 100);
  setInterval(() => { if (window.__rxLoading) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }, 5000);

  { const sc = $('#savecard'); if (sc) sc.innerHTML = saveBoxHTML(); }
  World.init({ host: $('#stage'), getS: () => S, onPetMove: (k, pos) => { S.store.petOn = S.store.petOn || {}; if (pos) S.store.petOn[k] = pos; else delete S.store.petOn[k]; save(); }, onRadio: () => MUS.tap(), onDecorMove: (id, p) => { S.store.pos = S.store.pos || {}; S.store.pos[id] = p.map(v => Math.round(v * 100) / 100); save(); }, specialRoll: specialRoll, tagInfo: tagInfo, onBuy: buyUp, onNotes: () => openView('studies'), onBin: () => { micR = null; openView('mic'); }, onMicSite: (id) => micSiteClick(id), onMicDish: (id) => micDishClick(id), onMicPaper: (id, row) => micPaperClick(id, row), notesInfo: customCount, karenRoll: karenRoll, sweatyRoll: sweatyRoll, elderRoll: elderRoll, eventRoll: eventRoll, onVisitor: visitClick, onVisitorArrive: visitArrive, capsuleOk: capsuleOk, onCapsule: onCapsule, onBrain: synEnter, onSynSite: onSynSite, onEvt: onEvt, pillOk: pillOk, onPill: onPill, pillBoost: () => gearBuff().pills, onPhone: openPhone, onPolice: policeCome, himOk: himOk, onHimSpawn: onHimSpawn, onHimAngel: himAngelOk, onHimLand: himLand, onHimBless: onHimBless, onFp: fpClick, sign: () => shopName() + '|' + tierName() + ' #' + (S.franchises + 1) });
  window.__rxDbg = () => ({ openShift: openShift, shiftSnap: shiftSnap, mus: MUS, micDbg: () => ({ get R() { return micR; }, get inLab() { return micIn; }, drop: micDrop, paper: micPaperClick, part: micStartPart, startSort: micStartSort, sel: id => { micSelG = id; renderPanel(); } }), sr: srUpdate, nc: newCard, sp: specialRoll, fp: fp, S: S, view: view, rush: rush, phoneR: phone.ringing, TOPQ: TOPQ, pool: poolQs, cur: cur, synQ: () => (typeof SYN !== 'undefined' ? SYN.q : null), synTap: id => onSynSite(id), offer: k => offerEvt(k, 'test'), onEvt: onEvt, holiday: () => holNow(), holN: () => holCount(), renderStats: renderStats, passive: passive, techRate: techRate, buyUp: buyUp, openVial: openVial, tabletTake: tabletTake, capsuleOpen: capsuleOpen, buffOn: buffOn, GEAR: GEAR, gearBuff: gearBuff, gearHave: gearHave });
  if (!World.ok) $('#stage').classList.add('flat');
  else { document.body.classList.add('fx'); try { World.setBin(!!S.binBug); } catch (e) { /* decor */ } World.setPharmacist(meSpec()); World.setStore(S.store); World.setStaffLook(uniSpec()); World.setAwards(S.awards); World.setCalendar(Math.min(4, S.awards.calW || 0), false, S.awards.calW || 0); }
  applyFocus(); syncBrand(); sfxLabel(); musLabel(); MUS.arm(); if (S.me.done && !S.shiftProg) shiftSnap();
  /* test tools: open the game with ?dev=1 on the end of the link to get extra menu buttons for trying events quickly */
  { const bb = document.querySelector('#menu [data-act="board"]'); if (bb) bb.hidden = !Net.on(); }
  if (/[?&]flags=1/.test(location.search)) setTimeout(() => openView('flags'), 400);
  if (/[?&]dev=1/.test(location.search)) {
    const menu = $('#menu'), close = menu && menu.querySelector('.menuclose');
    if (menu && close) {
      const hr = document.createElement('hr'); menu.insertBefore(hr, close);
      [['dev-pill', 'Test: pop a pill'], ['dev-exportman', 'Export lab patient (.glb)'], ['dev-exportjson', 'Export lab patient (Part Maker .json)'], ['dev-legcap', 'Test: legendary capsule in vial'], ['flags', 'Question flags (live)'], ['dev-elder', 'Test: elder patient next'], ['dev-next', 'Test: skip to next patient'], ['dev-recall', 'Test: recall patient'], ['dev-regular', 'Test: regular patient'], ['dev-bottle', 'Test: bottle check'], ['dev-shelve', 'Test: restock'], ['dev-prior', 'Test: prior auth'], ['dev-rush', 'Test: rush hour'], ['dev-insp', 'Test: health inspector next'], ['dev-driver', 'Test: delivery next'], ['dev-sky', 'Test: sky capsule'], ['dev-him-walk', 'Test: Andy walks in next'], ['dev-him-asc', 'Test: Andy ascension'], ['dev-him-angel', 'Test: Andy angel flyover'], ['dev-him-smash', 'Test: Andy smash (skip click)'], ['dev-plant', 'Test: plant capsule'], ['dev-fast', 'Test: skip slow start']].forEach(b => {
        const el = document.createElement('button'); el.type = 'button'; el.dataset.act = b[0]; el.innerHTML = '<i aria-hidden="true">\u2699</i><span>' + b[1] + '</span>'; menu.insertBefore(el, close);
      });
    }
  }
  if (S.libRefund) { const r = S.libRefund; delete S.libRefund; toast('The Reference Library is retired. Refunded ' + money(r) + '. Hint pills and more power-ups are in the Shop.'); save(); }
  gearMigrate(); checkAwards(true); dailyBadge(); if (World.ok && World.setMastery) World.setMastery(masteryList()); checkRegulars();
  if (blessOn()) blessStart(false);
  if (S.lab && World.ok && World.setLab) World.setLab(true);
  syncLab();
  renderAll();
  newCard();
  if (!S.me.done) openView('create');
  maybeTour(); setTimeout(maybeJoinAsk, 4000);
})();
