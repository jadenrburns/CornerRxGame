/* ---------------- Corner Rx game logic ---------------- */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const SAVE_KEY = 'cornerRx.v1';
  const CATS = [
    ['BG', 'Brand / Generic'], ['CL', 'Drug classes'], ['MOA', 'Mechanisms'], ['AE', 'Adverse effects'],
    ['DDI', 'Interactions'], ['CN', 'Counseling'], ['AD', 'Antidotes'], ['SIG', 'Sig & law'],
    ['TOP', 'Weekly drugs'], ['TP3', 'Weekly drugs \u00B7 P3'], ['CALC', 'Calculations'], ['PT3', 'PharmTox \u00B7 Exam 3 questions'], ['PT3G', 'PharmTox \u00B7 Exam 3 drug practice'], ['PT4', 'PharmTox \u00B7 Exam 4 drug practice'], ['TH3', 'Therapeutics \u00B7 Exam 3'], ['T553', 'Therapeutics III \u00B7 Syllabus topics'], ['HIM', 'Himothy \u00B7 Heart failure'], ['MY', 'My studies']
  ];
  const CATNAME = {}; CATS.forEach(c => CATNAME[c[0]] = c[1]);
  const FLAVOR = {
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
    TP3: ['P3 drug list: this one is on the sheet.', 'Quiz week! Do you know this one?', 'Straight off the Top 300 sheet.'],
    T553: ['My doctor changed my plan, can you explain?', 'Quick therapy question before I go.', 'Is this the right treatment for me?'],
    HIM: ['*high knees* Quick heart failure question!', 'Is my ejection fraction a problem?', 'Which pills do I take for my heart?'],
    MY: ['A question from your own notes.', 'Straight from your study sheet.', 'This one is on your exam list.']
  };
  const KAREN_LINES = ['I WANT TO SPEAK TO YOUR MANAGER!', 'This is UNACCEPTABLE. Answer me right now!', 'I have been coming here for twenty years!', 'Do you even know what you are doing?!'];
  const NAMES = ['Marcus', 'Priya', 'Mrs. Alvarez', 'Devon', 'Mei', 'Mr. Okafor', 'Sofia', 'Grandpa Joe', 'Hannah', 'Luis', 'Dr. Patel', 'Aisha', 'Tom', 'Nadia', 'Ben', 'Ms. Lindqvist'];
  const RANKS = [[0, 'Pharmacy Intern'], [20, 'Pharmacy Technician'], [60, 'Staff Pharmacist'], [130, 'Clinical Pharmacist'], [250, 'Residency Preceptor'], [450, 'Chief of Pharmacy'], [700, 'Director of Pharmacy'], [1000, 'Pharmacy Legend']];
  const MODES = [
    ['mixed', 'Smart mix', 'Built for faster mastery: new and missed questions come up most, a miss returns within 3 cards, a first-try hit counts double, and mastered ones fade out.'],
    ['missed', 'Review misses', 'Only questions on your Review Shelf.'],
    ['new', 'New only', 'Only questions you have never answered.'],
    ['even', 'Even shuffle', 'Every question has the same chance.']
  ];
  const UPS = [
    { id: 'shelf', short: 'Shelves', name: 'Stocked Shelves', max: 20, cost: l => Math.round(40 * Math.pow(1.55, l)), desc: l => `Each sale pays +25% more. Now +${l * 25}%.` },
    { id: 'tech', short: 'Techs', name: 'Pharmacy Technician', max: 20, cost: l => Math.round(80 * Math.pow(1.6, l)), desc: l => `Techs earn tips on their own, about ${money(techRate())}/s each right now. Hired: ${l}.` },
    { id: 'train', short: 'Training', name: 'Tech Training', max: 10, cost: l => Math.round(150 * Math.pow(1.7, l)), desc: l => `Technicians earn +40% per level. Techs now also gain from Stocked Shelves. Now +${l * 40}%. Needs hired techs.` },
    { id: 'counsel', short: 'Counseling', name: 'Counseling Room', max: 10, cost: l => Math.round(120 * Math.pow(1.8, l)), desc: l => `Streak bonus (+5% per answer) caps at ${5 + 3 * l} in a row. ${Math.min(60, l * 10)}% chance to talk Karen down.` },
    { id: 'library', short: 'Library', name: 'Reference Library', max: 5, cost: l => Math.round(150 * Math.pow(1.9, l)), desc: l => `Ask the pharmacist to remove two wrong answers. Holds ${2 * l} hints.` },
    { id: 'robot', short: 'Robot', name: 'Dispensing Robot', max: 5, cost: l => Math.round(300 * Math.pow(2, l)), desc: l => `${l * 6}% chance that a correct fill pays double.` }
  ];
  const ICON_GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>';
  const ICON_BOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M9 7h6"/></svg>';

  function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return 'q' + (h >>> 0).toString(36); }
  BANK.forEach(q => { q.k = hash(q.q); });
  let BYKEY = {};

  /* ---- state ---- */
  function defaults() {
    const topics = {}; CATS.forEach(c => topics[c[0]] = true);
    return { cash: 0, earned: 0, rep: 50, streak: 0, best: 0, correct: 0, wrong: 0, served: 0, franchises: 0,
      hintsLeft: 0, sinceHint: 0, calcOK: 0, mastery: {}, missed: [], karenCd: 0, karenWin: 0, karenLoss: 0, sweatyCd: 0, jimWin: 0, jimLoss: 0, phoneOK: 0, phoneBad: 0, phoneMiss: 0, lastShelve: 0, retired: 0, shelveOK: 0, shelveBad: 0, priorN: 0, decks: [],
      me: { done: false, body: 'normal', gender: 'n', hair: 0, hairColor: 0, skin: 1, scrub: 0, shirt: 0, shoes: 3 }, awards: { frames: [], pets: [] },
      set: { topics: topics, diffs: [1, 2, 3], mode: 'mixed', timer: true, focus: false },
      vial: [], cosm: [], cosmOn: {}, pillN: 0, store: { own: [], walls: 'w0', floor: 'f0', uni: '', deco: [] },
      up: { shelf: 0, tech: 0, train: 0, counsel: 0, library: 0, robot: 0 } };
  }
  let S = load();
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
        f.store = Object.assign(defaults().store, o.store || {}); f.store.own = (f.store.own || []).slice(); f.store.deco = (f.store.deco || []).slice();
        f.awards = { frames: ((o.awards || {}).frames || []).slice(), pets: ((o.awards || {}).pets || []).slice(), calW: (o.awards || {}).calW || 0, wkDone: (o.awards || {}).wkDone ? o.awards.wkDone.slice() : null };
        const d = defaults().set, os = o.set || {};
        f.set = Object.assign(d, os); f.set.topics = Object.assign(defaults().set.topics, os.topics || {});
        if (!Array.isArray(f.set.diffs) || !f.set.diffs.length) f.set.diffs = [1, 2, 3];
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
  const ALLD = DRUGS.concat(D3), baseId = (d) => d.id % 100000;
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
      const p3 = !!d.p3, CAT = p3 ? 'TP3' : 'TOP', wk = p3 ? WK3[d.w] : WK[d.w], r = rngOf('top' + d.id), label = p3 ? 'P3 · ' + wk.d + ' · ' + wk.topic : 'Week ' + wk.n + (wk.t === 'PHAR 444' ? ' (spring)' : '') + ' · ' + wk.d;
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
      if (d.c) mk('class', 2, d.g + ' belongs to which drug class?', cut(d.c, 90), wrongs(d, x => cut(x.c, 90), r, null, 'class'));
      if (d.i && d.i.length) {
        const mine = words(d.i.join(' ')), first = cut(d.i[0], 100);
        mk('ind', 2, d.g + ' is indicated for:', first, wrongs(d, x => x.i && x.i.length ? cut(x.i[0], 100) : '', r, (t, x) => words(x.i.join(' ')).some(w => mine.indexOf(w) >= 0), 'ind'));
      }
      if (String(d.p || '').replace(/\s+/g, ' ').trim().length >= 30) { const pr = cut(String(d.p).replace(/\s+/g, ' ').trim(), 150); mk('pearl', 2, 'Which is a clinical pearl for ' + d.g + '?', pr, wrongs(d, x => String(x.p || '').trim().length >= 30 ? cut(String(x.p).replace(/\s+/g, ' ').trim(), 150) : '', r, (t) => ovl(sig(t), sig(pr)).length >= 3 || t.toLowerCase().indexOf(String(d.g).toLowerCase().split(/[ ,\/]/)[0]) >= 0, null)); }
      if (d.m && d.m.length >= 40 && !/^n\/a/i.test(d.m)) mk('moa', 3, 'Which statement describes the mechanism of action of ' + d.g + '?', firstSent(d.m, 170), wrongs(d, x => x.m && x.m.length >= 40 && !/^n\/a/i.test(x.m) ? firstSent(x.m, 170) : '', r, null, 'moa'));
      if (d.cl && d.cl.length) {
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
  const isTop = (q) => q.c === 'TOP' || q.c === 'TP3';
  const wkNow = (q) => q.c === 'TP3' ? curWeek3() : curWeek();
  const wkAhead = (q) => q.c === 'TP3' ? !!S.set.ahead3 : !!S.set.ahead;
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
  const techRate = () => 0.4 * (0.5 + S.rep / 100) * franchiseMult() * (1 + 0.25 * S.up.shelf) * (1 + 0.4 * S.up.train) * (1 + (uniBuff().tech || 0));
  const passive = () => S.up.tech * techRate();
  const hintCap = () => 2 * S.up.library;
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
  const draft = { name: '', text: '', from: '' };
  let studyMsg = '';

  const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  function eligible(q) {
    const st = S.set;
    if (q.from && q.from > todayStr() && !(isTop(q) && wkAhead(q))) return false;
    if (isTop(q) && (q.c === 'TP3' ? st.wkOnly3 : st.wkOnly) && q.wk !== wkNow(q)) return false;
    if (isTop(q) && wkTypeOff(q)) return false;
    if (q.c === 'TP3' && st.p3off && st.p3off[q.wk]) return false;
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
  const p3Off = (n) => !!(S.set.p3off && S.set.p3off[n]);
  const wkTypeOff = (q) => !!(S.set.wkTypes && S.set.wkTypes[q.wt] === false);
  const focusOn = () => !!S.set.focus;
  const labOn = () => !!S.lab;
  const LEARN_SEC = 300, learning = () => (S.playSec || 0) < LEARN_SEC; // the first five minutes: slower line, no surprise events
  const timerOn = () => S.set.timer && !S.set.focus && !labOn();
  const calcOn = () => S.set.topics.CALC && S.set.mode !== 'missed';
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
      if (S.set.mode === 'mixed') { const m = S.mastery[q.k], box = m ? m.box : -1; w = box < 0 ? 4 : [10, 5, 0.8, 0.15][box]; }
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
      <div class="rx-body"><div class="patient ${hear ? 'hear' : ''}">${avatar(cur.seed, 'idle', false, false, true)}${hear ? '<span class="cmarks" aria-hidden="true"><i>?</i><i>?</i><i>?!</i></span>' : ''}<div class="bubble"><em>${hear ? '*cups a hand to her ear*' : esc(cur.name)}</em><p>${hear ? 'WHAT?? I can\u2019t hear you!' : esc(cur.ask)}</p></div></div>
      <div class="opts" role="group" aria-label="Greeting choices">${opts}</div>
      <div class="tools"><span class="keyhint">${hear ? 'She leans in closer...' : 'Pick a greeting.'}</span></div></div></article>`;
  }
  function elderGift() {
    const open = UPS.filter(u => S.up[u.id] < u.max);
    if (!open.length) { const bonus = Math.round(120 * franchiseMult()); S.cash += bonus; S.earned += bonus; return '<p class="gift"><b>' + esc(cur.name) + ' is delighted.</b> Everything is already maxed, so she tips ' + money(bonus) + '.</p>'; }
    const u = pick(open); S.up[u.id]++;
    if (u.id === 'library') S.hintsLeft += 2;
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
    if (!World.ok && !info.karen && !info.sweaty) info.elder = elderRoll();
    if (!info.karen && !info.sweaty && !info.elder && !info.evt && (forceEvt || !World.ok)) info.evt = eventRoll();
    const calm = focusOn(), karen = !!info.karen && !calm, sweaty = !!info.sweaty && !karen && !calm, elder = !!info.elder && !karen && !sweaty && !calm, evt = !karen && !sweaty && !elder && !calm && info.evt ? info.evt : null, q = evt ? evQuestion(evt) : (forceHim && !karen && !sweaty && !elder && !calm && himPick()) || chooseQ(karen);
    view = 'q';
    const himDev = forceHim; forceHim = false;
    if (!q) { cur = { empty: true, seed: info.seed, karen: false }; renderPanel(); return; }
    const himWalk = q.c === 'HIM' && !evt && !karen && !sweaty && !elder && !calm && World.ok && !!World.himArrive && (!S.himDone || himDev);
    const opts = q.ms ? shuffle(q.as.map(t => ({ t, ok: true })).concat(q.w.map(t => ({ t, ok: false })))) : shuffle([q.a, ...q.w].map((t, i) => ({ t, ok: i === 0 })));
    cur = { q, sel: {}, wasMissed: S.missed.indexOf(q.k) >= 0, opts, t0: Date.now(), done: false, hint: false, karen, sweaty, elder, elderStage: elder ? 0 : 2, ask: pick(ELDER_ASK), caller: !!info.caller && !calm, name: karen ? 'Karen' : sweaty ? 'Jittery Jim' : elder ? pick(info.seed % 2 === 0 ? ELDER_F : ELDER_M) : evt && EV_NAME[evt] ? pick(EV_NAME[evt]) : pick(NAMES), flavor: info.caller ? pick(CALLER_LINES) : evt ? pick(EV_FLAVOR[evt]) : karen ? pick(KAREN_LINES) : sweaty ? pick(JIM_LINES) : pick(FLAVOR[q.c] || FLAVOR.MY), seed: info.seed, num: S.served + 1, picked: -1, ok: false, resHTML: '', interrupt: null, evt: evt, insp: evt === 'inspector' ? { n: 1, of: 3, ok: 0, used: [q.k] } : null, review: reviewDue(S.mastery[q.k]) };
    if (q.c === 'HIM') { cur.name = 'Himothy'; if (himWalk) World.himArrive(); }
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
    if (u.id === 'library') S.hintsLeft = Math.min(S.hintsLeft, hintCap());
    World.karenLoss(u.id);
    return { lost: u, from, to: from - 1 };
  }
  function answer(idx) {
    if (!cur || cur.empty || cur.done || view !== 'q') return;
    if (cur.elder && cur.elderStage < 2) { if (idx >= 0 && idx < 2 && cur.elderStage === 0) elderPick(); return; }
    const q = cur.q; let o = cur.opts[idx], msOk = null;
    if (q.ms && idx === -2) {
      const chosen = cur.opts.map((x, i) => i).filter(i => cur.sel[i]);
      if (!chosen.length) return;
      msOk = cur.opts.every((x, i) => !!cur.sel[i] === x.ok);
      const w = cur.opts.findIndex((x, i) => cur.sel[i] && !x.ok);
      idx = w >= 0 ? w : chosen[0]; o = cur.opts[idx];
    } else if (idx >= 0 && (!o || o.gone || isBlocked(idx))) return;
    else if (q.ms && idx >= 0) return;
    endInterrupt();
    const ok = msOk !== null ? msOk : idx >= 0 && o.ok, elapsed = (Date.now() - cur.t0) / 1000, karen = cur.karen, sweaty = cur.sweaty;
    cur.done = true; cur.picked = idx; cur.ok = ok; S.served++;
    let pay = 0; const chips = []; let head = '', extra = '';
    if (ok) {
      S.streak++; S.best = Math.max(S.best, S.streak); S.correct++; holCorrect();
      const base = 10 * [1, 1.6, 2.4][q.d - 1];
      const shelf = 1 + 0.25 * S.up.shelf;
      const speed = timerOn() ? 1 + 0.5 * Math.max(0, 1 - elapsed / 20) : 1;
      const bz = buffOn() ? 3 : 1, streakN = Math.min(S.streak * bz, (5 + 3 * S.up.counsel) * bz), streak = 1 + 0.05 * streakN;
      const lucky = Math.random() < 0.06 * S.up.robot, fr = franchiseMult();
      pay = Math.max(1, Math.round(base * shelf * speed * streak * fr * buffPay() * (lucky ? 2 : 1) * (cur.hint ? 0.5 : 1) * (karen ? 2 : 1) * (sweaty ? 1.5 : 1) * (rush.on ? 1.5 : 1) * (cur.lab ? 1.5 : 1)));
      chips.push(`<span class="big">+${money(pay)}</span>`, `<span>base $${base.toFixed(0)}</span>`);
      if (blessOn()) chips.push('<span>Himothy\u2019s blessing x' + BLESS_MULT.toFixed(2) + '</span>');
      if (S.up.shelf) chips.push(`<span>shelves x${shelf.toFixed(2)}</span>`);
      if (timerOn()) chips.push(`<span>speed x${speed.toFixed(2)}</span>`);
      if (streakN > 0) chips.push(`<span>streak x${streak.toFixed(2)} (${S.streak} in a row)</span>`);
      if (S.franchises) chips.push(`<span>locations x${fr.toFixed(2)}</span>`);
      if (rush.on) chips.push('<span>rush hour x1.50</span>');
      if (cur.lab) chips.push('<span>compounding bench x1.50</span>');
      if (lucky) chips.push('<span>robot: double fill</span>');
      if (cur.hint) chips.push('<span>hint used x0.5</span>');
      if (karen) chips.push('<span>Karen calmed x2</span>');
      if (sweaty) chips.push('<span>Jim relieved x1.5</span>');
      S.cash += pay; S.earned += pay; S.rep = Math.min(100, S.rep + (karen ? 5 : sweaty ? 3 : 2));
      S.sinceHint++;
      if (S.sinceHint >= 5 && S.hintsLeft < hintCap()) { S.hintsLeft++; S.sinceHint = 0; }
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
      const m = S.mastery[q.k] || { box: 0, seen: 0, ok: 0 };
      const wasDue = reviewDue(m);
      m.seen++;
      const wasNew = m.seen === 1;
      if (ok) { m.ok++; m.lapse = 0; m.box = Math.min(3, m.box + (wasNew ? 2 : 1)); } else slip(m);
      if (ok) { if (wasDue) { m.iv = Math.min(IV.length - 1, (m.iv || 0) + 1); chips.push('<span>memory check passed, next in ' + IV[m.iv] + ' d</span>'); } if (!m.t || wasDue || m.box < 2) { m.t = Date.now(); if (m.iv === undefined) m.iv = 0; } } else { m.iv = 0; m.t = Date.now(); }
      if (S.set.mode === 'mixed') {
        const ri = retry.findIndex(r => r.k === q.k); if (ri >= 0) retry.splice(ri, 1);
        if (!ok) retry.push({ k: q.k, due: S.served + 3 });
        else if (m.box === 1) retry.push({ k: q.k, due: S.served + 6 });
      }
      S.mastery[q.k] = m;
      if (ok && q.c === 'HIM' && !S.himDone && himAllMastered()) himPending = true;
      const i = S.missed.indexOf(q.k);
      if (!ok && i < 0) S.missed.push(q.k);
      if (ok && m.box >= 2 && i >= 0) S.missed.splice(i, 1);
      lastKey = q.k;
    } else lastKey = null;
    shiftNote(q, ok, pay, ok || idx < 0 ? '' : q.ms ? cur.opts.filter((x, i) => cur.sel[i]).map(x => x.t).join(' · ') : o.t);
    save();
    checkAwards();
    if (cur.lab) { S.labN = (S.labN || 0) + 1; save(); } else if (cur.visit) { if (cur.hero) World.himReact(ok); else World.visitorReact(ok); } else World.react(ok, pay);
    const correctText = q.ms ? cur.opts.filter(o2 => o2.ok).map(o2 => o2.t).join(' · ') : cur.opts.find(o2 => o2.ok).t;
    cur.resHTML = `<div class="result ${ok ? 'good' : 'fail'}" id="result"><h3>${esc(head)}</h3>
      ${ok ? '' : q.ms ? msMiss() : `<p><b>Answer:</b> ${esc(correctText)}</p>`}${!ok && idx >= 0 && !q.ms && whyNot(o.t) ? '<p class="whynot"><b>Why not \u201C' + esc(o.t) + '\u201D?</b> ' + whyNot(o.t) + '</p>' : ''}${extra}
      <div class="pay">${chips.join('')}</div>${explHTML(q)}
      <div><button class="btn go" id="nextbtn" type="button">${cur.lab ? 'Next order' : 'Next patient'}</button> ${flagLink(q, q.ms ? cur.opts.filter((x, i) => cur.sel[i]).map(x => x.t).join(' | ') : (o ? o.t : ''))}</div></div>`;
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
  function flagLink(q, picked) {
    const done = (S.flagged || []).indexOf(q.k) >= 0;
    return '<a class="flaglink" data-flagk="' + esc(q.k || '') + '" href="' + esc(flagURL(q, picked)) + '" target="_blank" rel="noopener noreferrer">' + (done ? 'Flagged \u2713 (open again)' : 'Flag this question') + '</a>';
  }
  document.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('.flaglink'); if (!a) return; const k = a.dataset.flagk; if (k) { S.flagged = S.flagged || []; if (S.flagged.indexOf(k) < 0) { S.flagged.push(k); save(); } a.textContent = 'Flagged \u2713 (open again)'; } });
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
    renderPanel(); const b = document.querySelector('.opt[data-i="' + i + '"]'); if (b) b.focus({ preventScroll: true });
  }
  function msMiss() {
    const missed = cur.opts.filter((x, i) => x.ok && !cur.sel[i]).map(x => x.t), wrong = cur.opts.filter((x, i) => !x.ok && cur.sel[i]).map(x => x.t);
    return '<p><b>Correct choices:</b> ' + esc(cur.opts.filter(x => x.ok).map(x => x.t).join(' \u00B7 ')) + '</p>' + (wrong.length ? '<p class="whynot"><b>Not true for ' + esc(cur.q.rows ? cur.q.rows[0][1].split(' (')[0] : 'this drug') + ':</b> ' + esc(wrong.join(' \u00B7 ')) + '</p>' : '') + (missed.length ? '<p class="whynot"><b>You missed:</b> ' + esc(missed.join(' \u00B7 ')) + '</p>' : '');
  }
  function useHint() {
    if (!cur || cur.empty || cur.done || cur.hint || S.hintsLeft < 1) return;
    cur.hint = true; S.hintsLeft--;
    const wr = cur.opts.filter(o => !o.ok); shuffle(wr).slice(0, cur.q.ms ? Math.min(2, wr.length - 1) : 2).forEach(o => { o.gone = true; delete cur.sel[cur.opts.indexOf(o)]; });
    save(); renderPanel();
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
    if (World.ok) return view === 'q' ? '' : '<div class="qbar slim"><button type="button" class="btn go" data-act="back">Back to counter</button></div>';
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
      if (cur.done) { if (o.ok) c = 'ok'; else if (i === cur.picked) c = 'bad'; }
      return `<button type="button" class="opt ${c}" style="grid-row:${i + 1};grid-column:1" data-i="${i}" ${o.gone || cur.done || isBlocked(i) ? 'disabled' : ''}><kbd>${keys[i]}</kbd><span>${esc(o.t)}</span></button>`;
    }).join('');
    const label = cur.lab ? (cur.lab === 'pk' ? 'KINETICS CONSULT \u00B7 show your work' : 'COMPOUNDING ORDER \u00B7 show your work') : cur.elder ? cur.name.toUpperCase() + ' \u00B7 free upgrade if right' : cur.evt ? (cur.evt === 'inspector' ? 'HEALTH INSPECTOR \u00B7 question ' + cur.insp.n + ' of ' + cur.insp.of + ' \u00B7 need 2' : EV_LABEL[cur.evt]) : cur.caller ? 'KAREN · "I tried to call"' : cur.karen ? 'KAREN · wants the manager' : cur.sweaty ? 'JITTERY JIM · sweating buckets' : CATNAME[q.c] + (q.t ? ' · ' + q.t : '');
    const isK = cur.karen || cur.caller, showTimer = !isK && timerOn();
    return `<article class="rx ${cur.lab ? 'labq' : ''} ${cur.karen ? 'karen' : cur.sweaty ? 'sweaty' : ''} ${cur.evt ? 'evt evt-' + cur.evt : ''}">
      <div class="rx-head"><span class="rx-sym" aria-hidden="true">&#8478;</span>
        <div class="rx-meta"><b>${esc(label)}</b><span>Rx #${pad} &middot; ${esc(cur.name)}</span></div>
        ${cur.wasMissed ? `<span class="missedtag" title="You missed this question before">Missed before</span>` : cur.review ? `<span class="missedtag rv" title="You mastered this a while ago. A quick memory check.">Memory check</span>` : ''}
        <span class="dots" title="Difficulty ${q.d} of 3" aria-label="Difficulty ${q.d} of 3">${dots}</span>
        ${showTimer ? '<div class="timer" aria-hidden="true"><i id="timerbar"></i></div>' : ''}</div>
      ${isK ? `<div class="ktimer" role="timer" aria-label="Time before Karen leaves"><div class="timer"><i id="timerbar"></i></div><b id="tcount">${KAREN_SEC}</b><small>sec</small></div>` : ''}
      <div class="rx-body">
        <div class="patient">${avatar(cur.seed, cur.done ? (cur.ok ? 'ok' : 'bad') : 'idle', cur.karen, cur.sweaty, cur.elder, cur.name === 'Himothy')}<div class="bubble"><em>${esc(cur.flavor)}</em><p>${esc(q.q)}</p></div></div>
        <div class="opts" role="group" aria-label="Answer choices">${opts}${jimHTML()}</div>${q.ms && !cur.done ? `<div class="msbar"><span>Select all that apply (${Object.keys(cur.sel).length} picked)</span><button type="button" class="btn go" id="msgo" ${Object.keys(cur.sel).length ? '' : 'disabled'}>Submit answer</button></div>` : ''}${labToolsHTML()}
        <div class="tools"><button type="button" class="btn" id="hintbtn" ${S.hintsLeft < 1 || cur.hint || cur.done ? 'disabled' : ''}>Ask the pharmacist (${S.hintsLeft})</button>
          <span class="keyhint">${isK ? 'Karen leaves in ' + KAREN_SEC + ' s. A wrong answer costs an upgrade.' : cur.lab ? 'Lab bench: no timer. Pays x1.5.' : timerOn() ? 'Speed bonus fades over 20 s' : focusOn() ? 'Focus mode: no timer' : 'Timer bonus is off'}</span></div>
      </div>${cur.resHTML || ''}</article>`;
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
    const cw = curWeek() || (S.set.ahead ? WEEKS[0].n : 0), cw3 = curWeek3() || (S.set.ahead3 ? P3WEEKS[0].n : 0); BANK.forEach(add); TOPQ.forEach(q => { if (q.wk === (q.c === 'TP3' ? cw3 : cw)) add(q); }); S.decks.forEach(d => d.items.forEach(add));
    return m;
  }
  function hubTabs(active) {
    const n = customCount();
    return `<div class="hubtabs" role="tablist"><button type="button" role="tab" aria-selected="${active === 'set'}" data-act="tab-set">Topics</button><button type="button" role="tab" aria-selected="${active === 'studies'}" data-act="tab-studies">My studies${n ? ' (' + n + ')' : ''}</button></div>`;
  }
  function cabinetHTML(active) {
    return '<div class="fcab" role="tablist" aria-label="Folders">' + ['P1', 'P2', 'P3'].map((f, i) => `<button type="button" role="tab" class="ftab ft${i + 1}" aria-selected="${active === f}" data-act="folder" data-v="${f}"><span>${f}</span></button>`).join('') + '</div>';
  }
  function weekNote3() {
    const n = curWeek3(), w = WK3[n];
    if (!w) { const f = P3WEEKS[0]; return 'P3 weekly drugs start on ' + esc(f.from) + ' (' + esc(f.topic) + '). Turn on Study ahead to preview them now.'; }
    return 'Now: ' + esc(w.d) + ' \u00B7 ' + esc(w.topic) + '. Earlier weeks stay in the mix; this week is asked most. Study ahead also unlocks future weeks.';
  }
  function settingsHTML() {
    const st = S.set, mc = missedByCat(), ms = masteryByCat();
    const chipOf = c => `<button type="button" class="chip tp" data-act="topic" data-v="${c[0]}" aria-pressed="${!!st.topics[c[0]]}"><span class="cn">${c[0] === 'PT3' ? 'Exam 3: your exam questions' : c[0] === 'PT3G' ? 'Exam 3: drug-list practice' : c[0] === 'PT4' ? 'Exam 4: mania and psychosis drugs' : c[0] === 'TH3' ? 'Exam 3: diarrhea, constipation, IBS' : c[0] === 'T553' ? 'Relevant otherwise: Therapeutics III topics' : c[0] === 'TP3' ? 'Top 300 weekly drugs' : c[1]}${c[0] === 'TOP' && curWeek() ? ' <small class="mc wk">wk ' + curWeek() + '</small>' : ''}${mc[c[0]] ? ` <small class="mc">${mc[c[0]]} missed</small>` : ''}</span>${ms[c[0]] && ms[c[0]].n ? (() => { const pc = Math.round(100 * ms[c[0]].s / ms[c[0]].n); return `<span class="mbar" role="img" aria-label="${pc}% mastered"><i style="width:${pc}%"></i><em>${pc}%</em></span>`; })() : ''}</button>`;
    const topics = CATS.filter(c => c[0] !== 'MY' && c[0] !== 'PT3' && c[0] !== 'PT3G' && c[0] !== 'PT4' && c[0] !== 'TH3' && c[0] !== 'TP3' && c[0] !== 'T553' || c[0] === 'MY' && S.decks.length).map(chipOf).join('');
    const tox = CATS.filter(c => c[0] === 'PT3' || c[0] === 'PT3G' || c[0] === 'PT4').map(chipOf).join('');
    const thx = CATS.filter(c => c[0] === 'TH3').map(chipOf).join('');
    const diffs = [[1, 'Level 1 easy'], [2, 'Level 2 medium'], [3, 'Level 3 hard']].map(d => `<button type="button" class="chip" data-act="diff" data-v="${d[0]}" aria-pressed="${st.diffs.indexOf(d[0]) >= 0}">${d[1]}</button>`).join('');
    const modes = MODES.map(m => `<button type="button" class="chip" data-act="mode" data-v="${m[0]}" aria-pressed="${st.mode === m[0]}">${m[1]}</button>`).join('');
    const n = poolQs().length;
    const fold = st.folder === 'P1' || st.folder === 'P3' ? st.folder : 'P2';
    const inFold = (f, c) => f === 'P3' ? (c[0] === 'TP3' || c[0] === 'T553') : f === 'P2' ? !(c[0] === 'TP3' || c[0] === 'T553') : false;
    const onlyOn = (f) => { const o = CATS.filter(c => !inFold(f, c)); return f !== 'P1' && o.length > 0 && o.every(c => !st.topics[c[0]]); };
    const fsw = (f) => `<div class="fsw${f === 'P1' ? ' dis' : ''}"><span class="fswl" id="fsw-${f}">Only ${f} topics<small>${f === 'P1' ? 'Nothing is filed here yet' : onlyOn(f) ? 'Other folders are switched off' : 'Switch off the other folders\u2019 topics'}</small></span><button type="button" class="swt" role="switch" aria-labelledby="fsw-${f}" aria-checked="${onlyOn(f)}" data-act="folder-only" data-v="${f}"${f === 'P1' ? ' disabled' : ''}><i></i></button></div>`;
    const p2 = `${fsw('P2')}<h3>Question settings</h3><p class="sub">Changes apply to the next patient.</p>
      <div class="grp"><b>Focus mode</b><div class="chips"><button type="button" class="chip" data-act="focus" aria-pressed="${!!st.focus}">Focus mode ${st.focus ? 'on' : 'off'}</button></div><p class="note">Hides the 3D pharmacy and turns off the timer, patient events, phone calls, Karen and Jim, so it is only questions.</p></div>
      <div class="grp"><b>Topics <span><button type="button" class="link" data-act="topics-all">All</button> &middot; <button type="button" class="link" data-act="topics-none">None</button></span></b><div class="chips">${topics}</div>${tox ? '<div class="subgrp"><b class="subh">PharmTox</b><div class="chips">' + tox + '</div></div>' : ''}${thx ? '<div class="subgrp"><b class="subh">Therapeutics</b><div class="chips">' + thx + '</div></div>' : ''}</div>
      <div class="grp"><b>Difficulty</b><div class="chips">${diffs}</div></div>
      <div class="grp"><b>Mode</b><div class="chips">${modes}</div><p class="note">${MODES.find(m => m[0] === st.mode)[2]}</p></div>
      <div class="grp"><b>Compounding pharmacy</b><div class="chips"><button type="button" class="chip" data-act="labk" data-v="comp" aria-pressed="${(S.labK || {}).comp !== false}">Compounding math</button><button type="button" class="chip" data-act="labk" data-v="pk" aria-pressed="${(S.labK || {}).pk !== false}">Kinetics</button></div><p class="note">Used when you tap Switch to compounding in the menu. Level chips above apply there too. ${S.labN ? 'Solved at the bench: ' + S.labOK + ' of ' + S.labN + '.' : ''}</p></div>
      <div class="grp"><b>Weekly drugs</b><div class="chips"><button type="button" class="chip" data-act="wkonly" aria-pressed="${!!st.wkOnly}">This week only</button><button type="button" class="chip" data-act="ahead" aria-pressed="${!!st.ahead}">Study ahead</button></div><div class="chips" aria-label="Weekly question types">${WK_TYPES.map(x => `<button type="button" class="chip" data-act="wktype" data-v="${x[0]}" aria-pressed="${!(st.wkTypes && st.wkTypes[x[0]] === false)}">${x[1]}</button>`).join('')}</div><p class="note">${weekNote()} Use the question-type buttons to pick which kinds of weekly questions you get.</p></div>
      <div class="grp"><b>Speed bonus</b><div class="chips"><button type="button" class="chip" data-act="timer" aria-pressed="${st.timer}">Timer bonus ${st.timer ? 'on' : 'off'}</button></div><p class="note">Turn it off to study without time pressure. Karen still has a limit.</p></div>
      `;
    const w3 = curWeek3();
    const sched = P3WEEKS.map(w => { const open = w.from <= todayStr() || st.ahead3, off = p3Off(w.n), cnt = TOPQ.filter(q => q.wk === w.n && !wkTypeOff(q)).length; return `<li class="${w.n === w3 ? 'now' : open ? '' : 'lock'}${off ? ' off' : ''}"><button type="button" data-act="p3wk" data-v="${w.n}" aria-pressed="${!off}" aria-label="${esc(w.d)} ${esc(w.topic)}: ${off ? 'off' : 'on'}"><i class="p3box">${off ? '' : '\u2713'}</i><b>${esc(w.d)}</b><span>${esc(w.topic)}</span><small>${off ? 'off' : w.ids.length + ' drugs' + (w.n === w3 ? ' \u00B7 this week' : open ? '' : ' \u00B7 locked')}</small></button></li>`; }).join('');
    const p3 = `${fsw('P3')}<h3>P3 weekly drugs</h3><p class="sub">Drug list sheets by system, one set per week. Changes apply to the next patient.</p>
      <div class="grp"><b>Top 300</b><div class="chips">${CATS.filter(c => c[0] === 'TP3').map(chipOf).join('')}</div><div class="chips"><button type="button" class="chip" data-act="wkonly3" aria-pressed="${!!st.wkOnly3}">This week only</button><button type="button" class="chip" data-act="ahead3" aria-pressed="${!!st.ahead3}">Study ahead</button></div><div class="chips" aria-label="Weekly question types">${WK_TYPES.map(x => `<button type="button" class="chip" data-act="wktype" data-v="${x[0]}" aria-pressed="${!(st.wkTypes && st.wkTypes[x[0]] === false)}">${x[1]}</button>`).join('')}</div><p class="note">${weekNote3()}</p></div>
      <div class="grp"><b>Relevant otherwise</b><div class="chips">${CATS.filter(c => c[0] === 'T553').map(chipOf).join('')}</div><p class="note">Therapeutics III (PHAR 553) syllabus topics: asthma, COPD, renal, diabetes, gout, migraine, RA and SLE, thyroid, liver, hepatitis, blood pressure, lipids, pain, nutrition, fluids and electrolytes.</p></div>
      <div class="grp"><b>P3 schedule <span><button type="button" class="link" data-act="p3wk-all">All</button> &middot; <button type="button" class="link" data-act="p3wk-none">None</button></span></b><ol class="p3sched">${sched}</ol><p class="note">Tap a week to choose which weeks you get questions from. Future weeks still need Study ahead.</p></div>
      <div class="grp"><b>Focus</b><div class="chips"><button type="button" class="chip" data-act="topics-all">Turn every topic back on</button></div><p class="note">Use the switch at the top of this folder to ask only P3 topics.</p></div>`;
    const p1 = `${fsw('P1')}<h3>P1 folder</h3><p class="sub">Nothing is filed here yet.</p><div class="grp"><b>Empty folder</b><p class="note">P1 drug lists and exam questions will go in this folder. Your current question settings live in the P2 folder.</p></div>`;
    return `<div class="pane nbk ${nbClosing ? 'closing' : ''}"><div class="nbcover"><span class="nbtitle">Topics</span></div><div class="nbsheet">${hubTabs('set')}${cabinetHTML(fold)}<div class="fbody fb-${fold}" role="tabpanel" aria-label="${fold} folder">${fold === 'P1' ? p1 : fold === 'P3' ? p3 : p2}</div>
      <p class="count">${n} question${n === 1 ? '' : 's'} match${calcOn() ? ' + endless calculations' : ''}</p>
      <div class="btnrow"><button type="button" class="btn go nbback" data-act="back">Close notebook and return to counter</button><button type="button" class="btn" data-act="tour">Replay tour</button><button type="button" class="btn" data-act="reset-set">Reset settings</button></div></div></div>`;
  }
  function lockNote(d) {
    const t = todayStr(), l = d.items.filter(q => q.from && q.from > t); if (!l.length) return '';
    const next = l.map(q => q.from).sort()[0];
    return '<small class="lock">' + l.length + ' locked until ' + esc(next) + '</small>';
  }
  function studiesHTML() {
    const decks = S.decks.map(d => `<div class="deckrow"><b>${esc(d.name)}</b><span>${d.items.length} question${d.items.length === 1 ? '' : 's'}</span>${lockNote(d)}
      <div class="acts"><button type="button" class="mini ${d.enabled ? 'on' : ''}" data-act="deck-toggle" data-id="${d.id}" aria-pressed="${d.enabled}">${d.enabled ? 'In use' : 'Off'}</button>
      <button type="button" class="mini" data-act="deck-copy" data-id="${d.id}">Copy as text</button>
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
  const ME_HAIRS = ['Short', 'Bob', 'Long', 'Bun', 'Curly', 'Spiky', 'Bald'].concat(SHOP_HAIR.map(h => h[1]));
  function meSpec() { const m = S.me; return { body: m.body, gender: m.gender, hair: m.hair, skin: ME_SKIN[m.skin], hairCol: ME_HAIR[m.hairColor], scrub: ME_SCRUB[m.scrub], shirtCol: (ME_SHIRT[m.shirt | 0] || ME_SHIRT[0])[0], shoes: (ME_SHOES[m.shoes === undefined ? 3 : m.shoes] || ME_SHOES[3])[0], acc: S.acc || 0, accOn: accOnList(), cosm: cosmSpec() }; }
  function accOnList() { const off = S.accOff || [], out = []; for (let k = 1; k <= (S.acc || 0); k++) if (off.indexOf(k) < 0) out.push(k); return out; }
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
  /* ---- character screen: one slider row per part, top to bottom ---- */
  function crows() {
    const m = S.me, on = cosmSpec(), N = (arr) => arr.map((x, i) => ({ v: i, n: x[1] || x, c: x[0] && x[0][0] === '#' ? x[0] : '' }));
    const cos = (slot, std) => [{ v: '', n: 'None' }].concat((std || []).map(c => ({ v: c[1], n: c[2] })), COSM.concat(SHOP_COS).filter(c => c[0] === slot && cosmHave(c[1])).map(c => ({ v: c[1], n: c[2] })));
    return [
      { k: 'gender', t: 'Gender', cur: m.gender, o: ME_GENDERS.map(x => ({ v: x[0], n: x[1] })) },
      { k: 'body', t: 'Body type', cur: m.body, o: ME_BODIES.map(x => ({ v: x[0], n: x[1] })) },
      { k: 'skin', t: 'Skin tone', cur: m.skin, o: ME_SKIN.map((c, i) => ({ v: i, n: ME_SKIN_N[i], c })) },
      { k: 'hair', t: 'Hair style', cur: m.hair, o: ME_HAIRS.map((n, i) => ({ v: i, n })).filter(x => x.v < 7 || shopOwn(SHOP_HAIR[x.v - 7][0])) },
      { k: 'hairColor', t: 'Hair color', cur: m.hairColor, o: ME_HAIR.map((c, i) => ({ v: i, n: ME_HAIR_N[i], c })) },
      { k: 'face', t: 'Facial hair', cur: on.face, o: cos('face') },
      { k: 'eyes', t: 'Glasses', cur: on.eyes, o: cos('eyes', STD_EYES) },
      { k: 'hat', t: 'Hat', cur: on.hat, o: cos('hat') },
      { k: 'shirt', t: 'Shirt', cur: m.shirt | 0, o: ME_SHIRT.map((x, i) => ({ v: i, n: x[1], c: x[0] })) },
      { k: 'scrub', t: 'Pants', cur: m.scrub, o: ME_SCRUB.map((c, i) => ({ v: i, n: ME_SCRUB_N[i] + ' pants', c })) },
      { k: 'shoes', t: 'Shoes', cur: m.shoes === undefined ? 3 : m.shoes, o: ME_SHOES.map((x, i) => ({ v: i, n: x[1], c: x[0] })) },
      { k: 'extra', t: 'Extras', cur: on.extra, o: cos('extra') }
    ].concat(SHOP_CYBER.some(c => shopOwn(c[1])) ? [{ k: 'cyber', t: 'Cyborg parts', cur: on.cyber, o: cos('cyber') }] : []);
  }
  function crowHTML(r) {
    const n = r.o.length, i = Math.max(0, r.o.findIndex(x => x.v === r.cur)), c = r.o[i], dis = n < 2 ? ' disabled' : '';
    return `<div class="crow" data-k="${r.k}"><span class="clab">${r.t}</span><div class="cslide"><button type="button" class="carr" data-act="cyc" data-k="${r.k}" data-d="-1" aria-label="Previous ${r.t.toLowerCase()}"${dis}>&#8249;</button><div class="cval" role="status" aria-live="polite">${c.c ? `<i class="csw" style="background:${c.c}"></i>` : ''}<span>${esc(c.n)}</span><small>${i + 1} of ${n}</small></div><button type="button" class="carr" data-act="cyc" data-k="${r.k}" data-d="1" aria-label="Next ${r.t.toLowerCase()}"${dis}>&#8250;</button></div></div>`;
  }
  function setCrow(k, v) {
    if (['face', 'eyes', 'hat', 'extra', 'cyber'].indexOf(k) >= 0) { S.cosmOn = S.cosmOn || {}; const keep = {}; Object.keys(S.cosmOn).forEach(s => { const c = S.cosmOn[s] && cosmById(S.cosmOn[s]); if (c && c[0] !== k) keep[c[0]] = S.cosmOn[s]; }); S.cosmOn = keep; if (v) S.cosmOn[k] = v; }
    else S.me[k] = (typeof v === 'number') ? v : v;
  }
  /* ---- shop (a tab on the Character screen) ---- */
  let cTab = 'me', shopCat = 'walls';
  const buffText = b => [b.tech ? '+' + Math.round(b.tech * 100) + '% tech tips' : '', b.pay ? '+' + Math.round(b.pay * 100) + '% pay' : ''].filter(Boolean).join(', ');
  function uniSpec() { const u = uniOf(); return u ? { shirt: u[2], scrub: u[3], cosm: { hat: u[4] || '', eyes: u[0] === 'u5' ? 'goggles' : '' } } : null; }
  function applyShop() { if (!World.ok) return; World.setStore(S.store); World.setStaffLook(uniSpec()); World.setPharmacist(meSpec()); }
  const SHOP_CATS = [['walls', 'Wall paint'], ['floors', 'Floors'], ['uni', 'Tech uniforms'], ['deco', 'Decor'], ['hair', 'Hairstyles'], ['cyber', 'Cyborg']];
  function shopRows(cat) {
    const st = S.store;
    if (cat === 'walls') return SHOP_WALLS.map(w => ({ id: w[0], name: w[1], price: w[4], free: !w[4], on: st.walls === w[0], sw: [w[2], w[3]], note: '' }));
    if (cat === 'floors') return SHOP_FLOORS.map(f => ({ id: f[0], name: f[1], price: f[4], free: !f[4], on: st.floor === f[0], sw: [f[2], f[3]], note: '' }));
    if (cat === 'uni') return [{ id: '', name: 'Standard coats', price: 0, free: true, on: !st.uni, sw: ['#F4FAFA', '#27384F'], note: 'No bonus.' }].concat(SHOP_UNI.map(u => ({ id: u[0], name: u[1], price: u[6], on: st.uni === u[0], sw: [u[2], u[3]], note: buffText(u[5]) + '. ' + u[7] })));
    if (cat === 'deco') return SHOP_DECOR.map(d => ({ id: d[0], name: d[1], price: d[2], on: (st.deco || []).indexOf(d[0]) >= 0, emoji: d[4], note: d[3], toggle: true }));
    if (cat === 'hair') return SHOP_HAIR.map((h, i) => ({ id: h[0], name: h[1], price: h[3], on: S.me.hair === 7 + i, emoji: '💇', note: 'For your pharmacist.' }));
    return SHOP_CYBER.map(c => ({ id: c[1], name: c[2], price: c[4], on: ((S.cosmOn || {}).cyber) === c[1], emoji: c[3], note: 'For your pharmacist.' }));
  }
  function shopHTML() {
    const cash = S.cash, rows = shopRows(shopCat);
    const cats = SHOP_CATS.map(c => `<button type="button" class="chip" data-act="shopcat" data-v="${c[0]}" aria-pressed="${shopCat === c[0]}">${c[1]}</button>`).join('');
    const cards = rows.map(r => {
      const own = r.free || shopOwn(r.id), sw = r.sw ? `<span class="spsw"><i style="background:${r.sw[0]}"></i><i style="background:${r.sw[1]}"></i></span>` : `<span class="spem" aria-hidden="true">${r.emoji || ''}</span>`;
      let btn;
      if (!own) btn = `<button type="button" class="btn go" data-act="shop-buy" data-k="${shopCat}" data-id="${r.id}"${cash < r.price ? ' disabled' : ''}>Buy ${money(r.price)}</button>`;
      else if (r.toggle) btn = `<button type="button" class="btn" data-act="shop-use" data-k="${shopCat}" data-id="${r.id}" aria-pressed="${r.on}">${r.on ? 'Remove' : 'Place'}</button>`;
      else btn = r.on ? '<span class="spon">Equipped</span>' : `<button type="button" class="btn" data-act="shop-use" data-k="${shopCat}" data-id="${r.id}">Use</button>`;
      return `<div class="spcard${r.on ? ' on' : ''}">${sw}<div class="sptx"><b>${esc(r.name)}</b>${r.note ? `<small>${esc(r.note)}</small>` : ''}</div>${btn}</div>`;
    }).join('');
    const bf = buffText(uniBuff()), hasT = S.up.tech >= 1;
    const note = shopCat === 'uni' ? `<p class="note">${hasT ? (bf ? 'Your techs are earning bonuses: ' + bf + '.' : 'Pick a uniform to give your techs a bonus.') : 'Hire a Pharmacy Technician first. Uniform bonuses work once you have at least one tech.'}</p>` : shopCat === 'cyber' || shopCat === 'hair' ? '<p class="note">Bought items show up in the Character tab, where you can mix and match.</p>' : '';
    return `<div class="spcash">Cash <b>${money(cash)}</b></div><div class="chips spcats" role="group" aria-label="Shop sections">${cats}</div>${note}<div class="spgrid">${cards}</div>`;
  }
  function shopBuy(kind, id) {
    const rows = shopRows(kind), r = rows.find(x => x.id === id); if (!r || r.free || shopOwn(id)) return;
    if (S.cash < r.price) { toast('Not enough cash for ' + r.name + '.'); return; }
    S.cash -= r.price; S.store.own.push(id); SFX.play('unlock'); shopUse(kind, id, true); save(); renderStats(); toast('Bought ' + r.name + '.');
  }
  function shopUse(kind, id, quiet) {
    const st = S.store;
    if (kind === 'walls') st.walls = id; else if (kind === 'floors') st.floor = id; else if (kind === 'uni') st.uni = id;
    else if (kind === 'deco') { const i = st.deco.indexOf(id); if (i >= 0 && !quiet) st.deco.splice(i, 1); else if (i < 0) st.deco.push(id); }
    else if (kind === 'hair') { const i = SHOP_HAIR.findIndex(h => h[0] === id); if (i >= 0) S.me.hair = 7 + i; }
    else if (kind === 'cyber') { S.cosmOn = S.cosmOn || {}; S.cosmOn.cyber = id; }
    save(); applyShop(); if (view === 'create') renderPanel();
  }
  function createHTML() {
    const tabs = S.me.done ? `<div class="chips ctabs" role="tablist" aria-label="Character screen"><button type="button" class="chip" role="tab" data-act="ctab" data-v="me" aria-pressed="${cTab === 'me'}">Character</button><button type="button" class="chip" role="tab" data-act="ctab" data-v="shop" aria-pressed="${cTab === 'shop'}">Shop</button></div>` : '';
    if (S.me.done && cTab === 'shop') return `<div class="pane cpane"><h3>Pharmacy shop</h3>${tabs}${shopCat === 'hair' || shopCat === 'cyber' ? '<div class="mepv sticky">' + mePreview() + '</div>' : ''}${shopHTML()}<div class="btnrow"><button type="button" class="btn go" data-act="me-done">Done</button></div></div>`;
    const m = S.me, rows = crows().map(crowHTML).join('');
    const gear = (S.acc || 0) < 1 ? '' : `<div class="grp"><b>Rank gear</b><div class="chips">${ACCS.map((a, i) => { const k = i + 1, un = k <= (S.acc || 0), onN = un && (S.accOff || []).indexOf(k) < 0; return un ? `<button type="button" class="chip" data-act="acc-tog" data-v="${k}" aria-pressed="${onN}">${a[1]} ${a[0]}</button>` : ''; }).join('')}</div></div>`;
    const found = (S.cosm || []).length;
    return `<div class="pane cpane"><h3>Your character</h3>${tabs}
      <div class="mepv sticky">${mePreview()}</div>
      <div class="grp"><b>Name your pharmacy</b><input id="shopname" class="field" type="text" maxlength="24" autocomplete="off" placeholder="Corner Rx" value="${esc(S.shop || '')}" aria-label="Pharmacy name"><p class="note">It goes on the sign above your shelves.</p></div>
      <p class="note">Use the arrows on each row to flip through your options, top to bottom. ${found ? found + '/' + COSM.length + ' cosmetics found.' : 'Open capsules from the lost pills vial (top bar) to unlock facial hair, hats, glasses and more.'}</p>
      <div class="crows">${rows}</div>${gear}
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
  const weeksOpen = () => WEEKS.filter(w => (w.from <= todayStr() || S.set.ahead) && weekQs(w.n).length);
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
    const isOpen = (w) => w.from <= todayStr() || (w.n > 100 ? S.set.ahead3 : S.set.ahead);
    const mast = WEEKS.concat(P3WEEKS).filter(isOpen).filter(w => { const p = weekProg(w.n); return p.total > 0 && p.done >= p.total; });
    if (!S.awards.wkDone) { S.awards.wkDone = mast.map(w => w.n); save(); return; }
    const fresh = mast.filter(w => S.awards.wkDone.indexOf(w.n) < 0);
    if (!fresh.length) return;
    fresh.forEach(w => S.awards.wkDone.push(w.n)); save();
    if (silent) return;
    fresh.forEach(w => showUnlock({ emoji: '\uD83C\uDFC6', title: (w.n > 100 ? 'P3 Week ' : 'Week ') + w.wk + ' quiz mastered', sub: w.topic + ' \u00B7 ' + w.d, target: { kind: 'cal' }, land: () => { if (view === 'awards') renderPanel(); } }));
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
  const ACCS = [['Gold chain', '\u26D3\uFE0F'], ['Sunglasses', '\uD83D\uDD76\uFE0F'], ['Brass knuckles', '\uD83D\uDC4A'], ['Gold grill', '\uD83E\uDDB7'], ['Fedora', '\uD83C\uDFA9'], ['Cane', '\uD83E\uDDAF'], ['Purple fur coat', '\uD83E\uDDE5']];
  const rankIdx = () => { let i = 0; for (let k = 0; k < RANKS.length; k++) if (S.correct >= RANKS[k][0]) i = k; return i; };
  function syncRank(silent) {
    const target = Math.min(ACCS.length, rankIdx());
    let earned = S.accEarned || 0; if (target <= earned) { if ((S.acc || 0) < earned) { S.acc = earned; World.setPharmacist(meSpec()); } return; }
    if (silent && target - earned > 1) { earned = target - 1; S.accEarned = earned; S.acc = earned; World.setPharmacist(meSpec()); }
    for (let k = earned + 1; k <= target; k++) {
      S.accEarned = k;
      if (silent && k < target) { S.acc = k; continue; }
      showUnlock({ emoji: ACCS[k - 1][1], title: ACCS[k - 1][0] + ' unlocked', sub: 'Promoted to ' + RANKS[k][1], target: { kind: 'pharm', id: k }, land: () => { S.acc = Math.max(S.acc || 0, k); save(); World.setPharmacist(meSpec()); if (view === 'awards') renderPanel(); } });
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
    const m = S.mastery[q.k] || { box: 0, seen: 0, ok: 0 };
    m.seen++; if (ok) { m.ok++; m.lapse = 0; m.box = Math.min(3, m.box + 1); } else slip(m);
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
    const ok = DRUGS.filter(d => (d.w <= cw || (S.set.ahead && !S.set.wkOnly)) && WK[d.w] && (WK[d.w].from <= t || S.set.ahead) && brandPick(d) && brandPick(d).toLowerCase() !== d.g.toLowerCase() && d.g.length <= 26 && !/[;\/]/.test(d.g));
    const uniq = (l) => l.filter(d => { const k = brandPick(d).toLowerCase(); if (seen[k]) return false; seen[k] = 1; return true; });
    const now = shuffle(ok.filter(d => d.w === cw)), old = shuffle(ok.filter(d => d.w !== cw));
    const pick = uniq(S.set.wkOnly ? now : now.concat(old)).slice(0, 6);
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
    if (pool.length < 2) pool = pool.concat(BANK);
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
  const rush = { on: false, left: 0, next: Date.now() + 600000 };
  function rushBadge() { const el = $('#rush3d'); if (!el) return; el.hidden = !rush.on; if (rush.on) el.textContent = 'RUSH HOUR \u00B7 +50% pay \u00B7 ' + Math.ceil(rush.left) + 's'; }
  function rushTick() {
    if (!World.ok || focusOn() || learning() || labOn()) return;
    if (rush.on) {
      if (!fp.on && view === 'q') rush.left -= 0.25;
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
      const locked = w.from > t && !S.set.ahead;
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
    const m = S.mastery[q.k] || { box: 0, seen: 0, ok: 0 };
    m.seen++; if (ok) { m.ok++; m.lapse = 0; m.box = Math.min(3, m.box + 1); } else slip(m);
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
    const pn = $('#qpanel'); if (!pn) return;
    pn.classList.toggle('karen', !!(cur && cur.karen && !cur.done && view === 'q'));
    const body = view === 'create' ? createHTML() : view === 'awards' ? awardsHTML() : view === 'phone' ? phoneHTML() : view === 'fp' || view === 'him' ? '' : view === 'shift' ? shiftHTML() : view === 'flash' ? fcHTML() : view === 'syn' ? synHTML() : view === 'ref' ? refHTML() : view === 'retire' ? retireHTML() : view === 'set' ? settingsHTML() : view === 'studies' ? studiesHTML() : (cur ? cardHTML() : '');
    $('#counter').innerHTML = qbar() + body;
    const nb = document.querySelector('.nbk');
    if (nb) {
      if (flipTab) { nb.classList.add('still'); const sh = nb.querySelector('.nbsheet'); if (sh) sh.classList.add('flip'); }
      else if (lastRendered === view) nb.classList.add('still');
    }
    flipTab = false; lastRendered = view;
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
  function qExpand() { const p = $('#qpanel'); if (p) { p.classList.remove('min'); const b = $('#qgrab'); if (b) { b.setAttribute('aria-expanded', 'true'); b.firstElementChild.textContent = 'Hide card to look around'; } } }
  function openView(v) {
    if (view === 'syn' && v !== 'syn') synExit();
    qExpand();
    if (view === 'q' && cur && !cur.done && !cur.empty) cur.pausedAt = Date.now();
    view = v; studyMsg = v === 'studies' ? studyMsg : ''; renderPanel();
    $('#qpanel').scrollTop = 0;
  }
  let nbClosing = false;
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('#qgrab'); if (!b) return; const p = $('#qpanel'), min = p.classList.toggle('min'); b.setAttribute('aria-expanded', String(!min)); b.firstElementChild.textContent = min ? 'Show question card' : 'Hide card to look around'; if (World.ok) updateInset(); fitPanel(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.body.classList.remove('drawer'); });
  function backToQ() {
    if ((view === 'studies' || view === 'set') && !nbClosing) {
      const pane = document.querySelector('.nbk');
      if (pane) { nbClosing = true; pane.classList.add('closing'); setTimeout(() => { backToQ(); nbClosing = false; }, 320); return; }
    }
    if ((view === 'studies' || view === 'set') && nbClosing && !document.querySelector('.nbk.closing')) return;
    view = 'q';
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
      library: '<rect x="8" y="9" width="7" height="22" rx="1.5"/><rect x="17" y="9" width="7" height="22" rx="1.5"/><path d="M26 11l6-1.5 4 20-6 1.5z"/>',
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
    let h = '<h2>Mastery by topic <small>2 right in a row = mastered</small></h2>' + (dueCount() ? '<p class="note">' + dueCount() + ' mastered question' + (dueCount() === 1 ? ' is' : 's are') + ' ready for a memory check. They return in your mix on their own.</p>' : '');
    CATS.forEach(c => {
      if (c[0] === 'MY') return;
      if (c[0] === 'CALC') { h += `<div class="mrow"><b>${c[1]}</b><span>${S.calcOK} solved</span><div class="bar"><i style="width:${Math.min(100, S.calcOK / 20 * 100)}%"></i></div></div>`; return; }
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
    if (id === 'library') S.hintsLeft += 2;
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
  function addStudy() {
    readDraft();
    const r = parseStudy(draft.text, 'My notes');
    if (!r.items.length) { $('#studyprev').innerHTML = previewHTML(r); return; }
    const name = (draft.name.trim() || r.deckName || 'My notes').slice(0, 60);
    let deck = findDeck(name);
    if (!deck) { deck = { id: 'd' + Date.now().toString(36), name, enabled: true, items: [] }; S.decks.push(deck); }
    const have = {}; deck.items.forEach(q => { have[q.k] = q; });
    let added = 0;
    r.items.forEach(it => {
      const from = it.from || draft.from || '';
      const q = { c: 'MY', d: it.d, q: it.q, a: it.a, w: it.w, e: it.e, t: it.t, from: from, k: hash(deck.id + '|' + it.q) };
      if (!have[q.k]) { deck.items.push(q); have[q.k] = q; added++; } else if (from) have[q.k].from = from;
    });
    S.set.topics.MY = true; deck.enabled = true; dirty = true;
    rebuildIndex(); save();
    studyMsg = `Added ${added} question${added === 1 ? '' : 's'} to "${name}"` + (r.items.length - added ? ` (${r.items.length - added} duplicates skipped)` : '') + (r.errors.length ? `, ${r.errors.length} skipped because of problems` : '') + '. They join your next patients.';
    draft.text = ''; renderPanel(); renderMastery(); renderReview();
    if (World.ok) World.sync();
  }
  /* ---- first-run tour (menus only; events stay a surprise) ---- */
  let tourEl = null, tourStep = 0, tourPaused = 0;
  const TOUR = [
    { t: 'Welcome to Corner Rx', p: 'You are the pharmacist at the counter. Each patient asks one question. Pick the right answer to earn cash and reputation, and read the explanation when you miss one. Take your time at first.' },
    { t: 'The menu', p: 'Tap the menu button in the top right.', l: [['Upgrades', 'spend your cash on the pharmacy'], ['Progress & awards', 'mastery, photos, pets and the weekly calendar'], ['Topics', 'choose topics and weekly drugs, or add your own questions'], ['Focus mode', 'just the questions, no 3D world'], ['Drug reference', 'the weekly drug lists']] },
    { t: 'Look around', p: 'Drag to look around the pharmacy and pinch to zoom. Tap glowing spots to build upgrades. The corner button makes the game full screen, and the bar above the question card hides it so you can see the shop.' },
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
    S.tutDone = true; save();
    if (cur && !cur.done && !cur.empty && tourPaused) cur.t0 += Date.now() - tourPaused;
    tourPaused = 0;
  }
  function maybeTour() { if (S.me.done && !S.tutDone && !tourEl) showTour(); }
  /* ---- save code: the whole save as one long code, to move progress between devices or keep a backup ---- */
/*@EXT@*/
  const GAME_VERSION = 99;
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
    if (!armedLoad) { armedLoad = true; say('Valid code. Loading replaces this device\u2019s progress. Tap Load code again to confirm.'); setTimeout(() => { armedLoad = false; }, 8000); return; }
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
      case 'acc-tog': { readShop(); const k = +v; S.accOff = S.accOff || []; const i = S.accOff.indexOf(k); if (i >= 0) S.accOff.splice(i, 1); else S.accOff.push(k); save(); World.setPharmacist(meSpec()); renderPanel(); return; }
      case 'vial': openVial(); return;
      case 'cyc': { readShop(); const k = t.dataset.k, d = +t.dataset.d, r = crows().find(x => x.k === k); if (!r || r.o.length < 2) return; const i = Math.max(0, r.o.findIndex(x => x.v === r.cur)), nx = r.o[(i + d + r.o.length) % r.o.length]; setCrow(k, nx.v); save(); World.setPharmacist(meSpec());
        const row = document.querySelector('.crow[data-k="' + k + '"]'), nr = crows().find(x => x.k === k); if (row && nr) { row.outerHTML = crowHTML(nr); const nb = document.querySelector('.crow[data-k="' + k + '"] [data-d="' + d + '"]'); if (nb) nb.focus(); } const pv = document.querySelector('.mepv'); if (pv) pv.innerHTML = mePreview(); return; }
      case 'create': openView(view === 'create' ? 'q' : 'create'); if (view === 'q') { resumeTimers(); renderPanel(); } return;
      case 'awards': openView(view === 'awards' ? 'q' : 'awards'); if (view === 'q') { resumeTimers(); renderPanel(); } return;
      case 'me': { readShop(); const k = t.dataset.k, v = t.dataset.v; S.me[k] = (k === 'hair' || k === 'hairColor' || k === 'skin' || k === 'scrub') ? +v : v; save(); World.setPharmacist(meSpec()); renderPanel(); return; }
      case 'ctab': readShop(); cTab = v === 'shop' ? 'shop' : 'me'; renderPanel(); return;
      case 'shopcat': shopCat = v; renderPanel(); return;
      case 'shop-buy': shopBuy(t.dataset.k, t.dataset.id); if (view === 'create') renderPanel(); return;
      case 'shop-use': shopUse(t.dataset.k, t.dataset.id); return;
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
      case 'dev-pill': { const ok = World.ok && World.devPill(); toast(ok ? 'A pill popped out. Tap it.' : 'Could not spawn one.'); return; }
      case 'dev-bottle': learnOff(); fp.cool = 0; return startBottles();
      case 'dev-shelve': learnOff(); return startShelve(false);
      case 'dev-prior': learnOff(); return startPrior();
      case 'dev-rush': learnOff(); rush.next = 0; if (!rush.on) { rush.on = true; rush.left = 45; World.setRush(true); toast('Rush hour!'); rushBadge(); } return;
      case 'dev-fast': learnOff(); toast('Slow start skipped. Events can happen now.'); return;
      case 'lab': return toggleLab();
      case 'syn': return synEnter();
      case 'syn-cat': SYN.cat = v; SYN.q = null; SYN.sel = null; synNewQ(); synSet(); renderPanel(); return;
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
      case 'dev-him-walk': learnOff(); forceHim = true; if (cur && (cur.done || cur.empty) && view === 'q') newCard(); else toast('Himothy is the next patient. Finish this one first (or use "skip to next patient").'); return;
      case 'dev-him-asc': { learnOff(); if (!World.ok || !World.himArrive) { toast('Needs the 3D pharmacy (turn off Focus mode).'); return; } if (!World.himAtCounter()) World.himArrive(); toast('Himothy is walking in. Watch the counter.'); setTimeout(() => himFarewell(true), 4500); return; }
      case 'dev-him-angel': { learnOff(); toast(World.ok && World.devHimAngel() ? 'The angel is up in the clouds. Click him!' : 'Could not start the flyover.'); return; }
      case 'dev-him-smash': { learnOff(); toast(World.ok && World.devHimSmash() ? 'Himothy is diving in...' : 'Could not start the smash.'); return; }
      case 'tour': return showTour();
      case 'shop-save': { const el = $('#shopname2'); const v = el ? el.value.replace(/\s+/g, ' ').trim().slice(0, 24) : ''; if (v) { S.shop = v; save(); syncBrand(); toast('Your pharmacy is now ' + v + '.'); renderPanel(); } return; }
      case 'tour-next': if (tourStep >= TOUR.length - 1) endTour(); else { tourStep++; drawTour(); } return;
      case 'tour-back': if (tourStep > 0) { tourStep--; drawTour(); } return;
      case 'tour-skip': return endTour();
      case 'fp-leave': return fpLeave();
      case 'fp-tip': return;
      case 'shelve': return startShelve(false);
      case 'ref': openView(view === 'ref' ? 'q' : 'ref'); if (view === 'q') { resumeTimers(); renderPanel(); } return;
      case 'retire-new': {
        S.retired = (S.retired || 0) + 1; S.cash = 0; S.franchises = 0; S.rep = 50; S.streak = 0; S.hintsLeft = 0; S.sinceHint = 0; S.up = defaults().up;
        save(); renderAll(); view = 'q'; newCard(); toast('Career #' + (S.retired + 1) + ' begins. Income +50% per retirement.'); return;
      }
      case 'jim-go': endInterrupt(); renderPanel(); return;
      case 'topic': st.topics[v] = !st.topics[v]; break;
      case 'topics-all': CATS.forEach(c => st.topics[c[0]] = true); break;
      case 'topics-none': CATS.forEach(c => st.topics[c[0]] = false); break;
      case 'diff': { const i = st.diffs.indexOf(+v); if (i >= 0) { if (st.diffs.length > 1) st.diffs.splice(i, 1); } else st.diffs.push(+v); break; }
      case 'mode': st.mode = v; break;
      case 'timer': st.timer = !st.timer; break;
      case 'focus': st.focus = !st.focus; applyFocus(); toast(st.focus ? 'Focus mode on. No timer, events or 3D world.' : 'Focus mode off. The pharmacy is back.'); break;
      case 'tab-set': flipTab = true; openView('set'); return;
      case 'tab-studies': flipTab = true; openView('studies'); return;
      case 'wkonly': st.wkOnly = !st.wkOnly; break;
      case 'wkonly3': st.wkOnly3 = !st.wkOnly3; break;
      case 'ahead3': st.ahead3 = !st.ahead3; break;
      case 'p3wk': { st.p3off = st.p3off || {}; if (st.p3off[v]) delete st.p3off[v]; else st.p3off[v] = true; break; }
      case 'p3wk-all': st.p3off = {}; break;
      case 'p3wk-none': st.p3off = {}; P3WEEKS.forEach(w => { st.p3off[w.n] = true; }); break;
      case 'folder': st.folder = v === 'P1' || v === 'P3' ? v : 'P2'; break;
      case 'p3-only': CATS.forEach(c => st.topics[c[0]] = c[0] === 'TP3' || c[0] === 'T553'); break;
      case 'folder-only': {
        if (v === 'P1') { toast('P1 has no topics yet.'); break; }
        const inF = c => v === 'P3' ? (c[0] === 'TP3' || c[0] === 'T553') : !(c[0] === 'TP3' || c[0] === 'T553');
        const outs = CATS.filter(c => !inF(c)), isOn = outs.every(c => !st.topics[c[0]]);
        if (isOn) { const rs = st.restore || {}; outs.forEach(c => st.topics[c[0]] = rs[c[0]] !== false); delete st.restore; toast('Other folders are back on.'); }
        else { st.restore = {}; outs.forEach(c => { st.restore[c[0]] = !!st.topics[c[0]]; st.topics[c[0]] = false; }); toast('Only ' + v + ' topics are on.'); }
        break;
      }
      case 'wktype': { st.wkTypes = st.wkTypes || {}; const on = WK_TYPES.filter(x => st.wkTypes[x[0]] !== false).length; if (st.wkTypes[v] !== false && on <= 1) { toast('Keep at least one kind of weekly question on.'); return; } st.wkTypes[v] = st.wkTypes[v] === false; break; }
      case 'ahead': st.ahead = !st.ahead; break;
      case 'reset-set': S.set = defaults().set; break;
      case 'preview': readDraft(); $('#studyprev').innerHTML = previewHTML(parseStudy(draft.text, 'My notes')); return;
      case 'addstudy': return addStudy();
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
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.elder !== undefined) return elderPick();
    if (t.dataset.act) return act(t);
    if (t.dataset.ph !== undefined) return phoneAnswer(+t.dataset.ph);
    if (t.dataset.pa !== undefined) return paAnswer(+t.dataset.pa);
    if (t.dataset.panext) return paNext();
    if (t.id === 'retirebtn') { if (S.cash >= RETIRE_AT) openView('retire'); return; }
    if (t.id === 'hangbtn') return hangUp();
    if (t.id === 'msgo') return answer(-2);
    if (t.classList.contains('opt')) return cur && cur.q && cur.q.ms ? msToggle(+t.dataset.i) : answer(+t.dataset.i);
    if (t.id === 'nextbtn') { if (cur && cur.insp && cur.insp.n < cur.insp.of) return inspContinue(); if (cur && cur.visit) return endVisit(); if (shiftDue()) return openShift(); return newCard(); }
    if (t.id === 'hintbtn') return useHint();
    if (t.dataset.buy) { buyUp(t.dataset.buy); return; }
    if (t.id === 'frbtn') {
      if (S.cash < frCost()) return;
      if (armed !== 'fr') { armed = 'fr'; renderFranchise(); setTimeout(() => { if (armed === 'fr') { armed = null; renderFranchise(); } }, 4000); return; }
      armed = null; S.cash = 0; S.franchises++; S.rep = 50; S.streak = 0; S.hintsLeft = 0; S.sinceHint = 0;
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
    if (view === 'q' && !cur.done && !cur.empty && cur.q && cur.q.ms) { if (['1', '2', '3', '4', '5', '6'].indexOf(e.key) >= 0) msToggle(+e.key - 1); else if (e.key === 'Enter' && Object.keys(cur.sel).length) { e.preventDefault(); answer(-2); } return; }
    if (['1', '2', '3', '4'].indexOf(e.key) >= 0) { if (view === 'q' && !cur.done && !cur.empty) answer(+e.key - 1); }
    else if (e.key === 'Enter' && view === 'q' && cur.done && !e.target.closest('button')) newCard();
  });

  /* ---- loops ---- */
  setInterval(() => {
    if (S.up.tech > 0) { const g = passive() * 0.25; S.cash += g; S.earned += g; }
    const c = $('#cashv'); if (c) c.textContent = money(S.cash);
    document.querySelectorAll('[data-buy]').forEach(b => { const max = b.textContent === 'MAX'; b.disabled = max || S.cash < +b.dataset.cost; });
    const fb = $('#frbtn'); if (fb) fb.disabled = S.cash < frCost();
    const rb = $('#retirebtn'); if (rb) rb.disabled = S.cash < RETIRE_AT;
    if (!document.hidden && !tourEl) S.playSec = (S.playSec || 0) + 0.25;
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
  World.init({ host: $('#stage'), getS: () => S, tagInfo: tagInfo, onBuy: buyUp, onNotes: () => openView('studies'), notesInfo: customCount, karenRoll: karenRoll, sweatyRoll: sweatyRoll, elderRoll: elderRoll, eventRoll: eventRoll, onVisitor: visitClick, onVisitorArrive: visitArrive, capsuleOk: capsuleOk, onCapsule: onCapsule, onBrain: synEnter, onSynSite: onSynSite, onEvt: onEvt, pillOk: pillOk, onPill: onPill, onPhone: openPhone, onPolice: policeCome, himOk: himOk, onHimSpawn: onHimSpawn, onHimAngel: himAngelOk, onHimLand: himLand, onHimBless: onHimBless, onFp: fpClick, sign: () => shopName() + '|' + tierName() + ' #' + (S.franchises + 1) });
  window.__rxDbg = () => ({ fp: fp, S: S, view: view, rush: rush, phoneR: phone.ringing, TOPQ: TOPQ, pool: poolQs, cur: cur, synQ: () => (typeof SYN !== 'undefined' ? SYN.q : null), synTap: id => onSynSite(id), offer: k => offerEvt(k, 'test'), onEvt: onEvt, holiday: () => holNow(), holN: () => holCount(), renderStats: renderStats, passive: passive, techRate: techRate, buyUp: buyUp, openVial: openVial, tabletTake: tabletTake, capsuleOpen: capsuleOpen, buffOn: buffOn, COSM: COSM });
  if (!World.ok) $('#stage').classList.add('flat');
  else { document.body.classList.add('fx'); World.setPharmacist(meSpec()); World.setStore(S.store); World.setStaffLook(uniSpec()); World.setAwards(S.awards); World.setCalendar(Math.min(4, S.awards.calW || 0), false, S.awards.calW || 0); }
  applyFocus(); syncBrand(); sfxLabel();
  /* test tools: open the game with ?dev=1 on the end of the link to get extra menu buttons for trying events quickly */
  if (/[?&]dev=1/.test(location.search)) {
    const menu = $('#menu'), close = menu && menu.querySelector('.menuclose');
    if (menu && close) {
      const hr = document.createElement('hr'); menu.insertBefore(hr, close);
      [['dev-pill', 'Test: pop a pill'], ['dev-elder', 'Test: elder patient next'], ['dev-next', 'Test: skip to next patient'], ['dev-bottle', 'Test: bottle check'], ['dev-shelve', 'Test: restock'], ['dev-prior', 'Test: prior auth'], ['dev-rush', 'Test: rush hour'], ['dev-insp', 'Test: health inspector next'], ['dev-driver', 'Test: delivery next'], ['dev-sky', 'Test: sky capsule'], ['dev-him-walk', 'Test: Himothy walks in next'], ['dev-him-asc', 'Test: Himothy ascension'], ['dev-him-angel', 'Test: Himothy angel flyover'], ['dev-him-smash', 'Test: Himothy smash (skip click)'], ['dev-plant', 'Test: plant capsule'], ['dev-fast', 'Test: skip slow start']].forEach(b => {
        const el = document.createElement('button'); el.type = 'button'; el.dataset.act = b[0]; el.innerHTML = '<i aria-hidden="true">\u2699</i><span>' + b[1] + '</span>'; menu.insertBefore(el, close);
      });
    }
  }
  checkAwards(true);
  if (blessOn()) blessStart(false);
  if (S.lab && World.ok && World.setLab) World.setLab(true);
  syncLab();
  renderAll();
  newCard();
  if (!S.me.done) openView('create');
  maybeTour();
})();
