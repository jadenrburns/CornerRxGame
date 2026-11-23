/* Microbe lab data (trash can menu): the "human body microbes" map and the "Resistant organisms and important antibiotics 2026" handout.
   MICSETS: sets of groups. A group is a list of items to place (drag mode) or type (fill-in mode).
   Helpers (global, no game state): micNorm, micAliases, micMatch, micTags, micDecoys. */
const MICSETS = [
  { id: 'body', name: 'Body map', sub: 'Usual bugs by body site', src: 'Human body microbes map', groups: [
    { id: 'cns', name: 'CNS / Meningitis', sterile: true, items: ['Streptococcus pneumoniae', 'Neisseria meningitidis', 'Haemophilus influenzae', 'Streptococcus agalactiae (Group B Strep)'] },
    { id: 'ear', name: 'Ear', items: ['Streptococcus pneumoniae', 'Haemophilus influenzae', 'Moraxella catarrhalis'] },
    { id: 'upper', name: 'Upper respiratory', items: ['Streptococcus pneumoniae', 'Streptococcus pyogenes', 'Haemophilus influenzae', 'Moraxella catarrhalis'] },
    { id: 'mouth', name: 'Mouth', items: ['Viridans group Streptococci', 'Anaerobes'] },
    { id: 'lower', name: 'Lower respiratory', sterile: true, items: ['Streptococcus pneumoniae', 'Haemophilus influenzae', 'Atypicals'] },
    { id: 'heart', name: 'Heart / Endocarditis', sterile: true, items: ['Staphylococcus aureus', 'Viridans group Streptococci', 'Staphylococcus epidermidis', 'Enterococci'] },
    { id: 'intra', name: 'Intra-abdominal', items: ['Enteric gram negative rods', 'Bacteroides species', 'Enterococci'] },
    { id: 'gi', name: 'Gastrointestinal', items: ['Clostridioides difficile', 'Campylobacter jejuni', 'Helicobacter pylori (stomach)'] },
    { id: 'bone', name: 'Bone and joint', sterile: true, items: ['Staphylococcus aureus', 'Staphylococcus epidermidis', 'Streptococcus species', 'Enteric gram negative rods'],
      al: [[], [], ['streptococcus pneumoniae', 'strep pneumoniae', 'streptococcus pyogenes', 'strep pyogenes', 'streptococcus agalactiae', 'group b strep', 'viridans strep', 'viridans streptococci', 'strep'], ['escherichia coli', 'e coli', 'klebsiella', 'klebsiella pneumoniae', 'enterobacter cloacae', 'citrobacter', 'proteus', 'proteus mirabilis']] },
    { id: 'uti', name: 'Urinary tract', items: ['Escherichia coli', 'Klebsiella species', 'Proteus mirabilis', 'Enterococci', 'Staphylococcus saprophyticus'] },
    { id: 'skin', name: 'Skin / Soft tissue', items: ['Staphylococcus species', 'Streptococcus species'],
      al: [['staphylococcus aureus', 'staph aureus', 's aureus', 'staphylococcus epidermidis', 'staph epidermidis', 's epidermidis', 'staphylococcus saprophyticus', 'staph saprophyticus', 'mrsa', 'staph'], ['streptococcus pneumoniae', 'strep pneumoniae', 's pneumoniae', 'streptococcus pyogenes', 'strep pyogenes', 's pyogenes', 'group a strep', 'streptococcus agalactiae', 'strep agalactiae', 'group b strep', 'viridans strep', 'viridans streptococci', 'strep']] },
    { id: 'sti', name: 'Sexually transmitted diseases', items: ['Neisseria gonorrhoeae', 'Chlamydia trachomatis'] },
    { id: 'egnr', name: 'Enteric gram negative rods', fam: true, items: ['Escherichia coli', 'Klebsiella species', 'Enterobacter cloacae', 'Citrobacter species', 'Proteus species'] },
    { id: 'aty', name: 'Atypicals', fam: true, items: ['Chlamydia species', 'Mycoplasma species', 'Legionella species'] }
  ] },
  { id: 'res', name: 'Resistant bugs', sub: 'Resistant organisms and their drugs', src: 'Resistant organisms and important antibiotics 2026', groups: [
    { id: 'rp', name: 'Common resistant pathogens', bug: 'rp', items: ['MRSA (methicillin-resistant S. aureus)', 'E. faecalis, E. faecium (VRE)', 'E. coli (ESBL, CRE)', 'K. pneumoniae (ESBL, CRE)', 'Pseudomonas aeruginosa', 'Acinetobacter baumannii'],
      al: [['mrsa', 'methicillin resistant staph aureus', 'methicillin resistant s aureus'], ['vre', 'vancomycin resistant enterococcus', 'e faecalis', 'e faecium', 'enterococcus faecalis', 'enterococcus faecium'], ['e coli esbl', 'e coli cre', 'esbl e coli', 'escherichia coli'], ['k pneumoniae esbl', 'k pneumoniae cre', 'klebsiella pneumoniae', 'klebsiella'], ['p aeruginosa', 'pseudomonas'], ['a baumannii', 'acinetobacter']], decoyFree: true },
    { id: 'paiv', name: 'Pseudomonas: IV', bug: 'pa', items: ['Piperacillin/Tazobactam', 'Ticarcillin/Clavulanate', 'Ceftazidime', 'Cefepime', 'Ceftolozane/Tazobactam', 'Aztreonam', 'Imipenem/Cilastatin', 'Meropenem', 'Ciprofloxacin', 'Levofloxacin', 'Gentamicin', 'Tobramycin'], ban: ['Carbapenems', 'Fosfomycin'] },
    { id: 'papo', name: 'Pseudomonas: PO', bug: 'pa', items: ['Ciprofloxacin', 'Levofloxacin'], ban: ['Moxifloxacin', 'Carbapenems', 'Fosfomycin'] },
    { id: 'mrsaiv', name: 'MRSA: IV', bug: 'mrsa', items: ['Vancomycin', 'Daptomycin', 'Linezolid', 'Ceftaroline'], ban: ['Tigecycline', 'Doxycycline', 'Minocycline', 'Trimethoprim/Sulfamethoxazole', 'Rifampin'] },
    { id: 'mrsapo', name: 'MRSA: PO', bug: 'mrsa', items: ['Trimethoprim/Sulfamethoxazole', 'Doxycycline', 'Minocycline', 'Linezolid', 'Rifampin (only with other antibiotics)'], al: [['tmp smx', 'tmpsmx', 'sulfamethoxazole trimethoprim', 'bactrim'], [], [], [], ['rifampin']], ban: ['Tetracyclines', 'Tigecycline'] },
    { id: 'vreiv', name: 'VRE: IV', bug: 'vre', items: ['Linezolid', 'Daptomycin', 'Tigecycline'], ban: ['Doxycycline', 'Minocycline'] },
    { id: 'vrepo', name: 'VRE: PO', bug: 'vre', items: ['Linezolid', 'Nitrofurantoin (UTI only)', 'Fosfomycin (UTI only)'], al: [[], ['nitrofurantoin'], ['fosfomycin']] },
    { id: 'anaiv', name: 'Anaerobes: IV', bug: 'ana', items: ['Metronidazole', 'Carbapenems', 'Piperacillin/Tazobactam', 'Ampicillin/Sulbactam', 'Moxifloxacin', 'Cefoxitin'], ban: ['Imipenem/Cilastatin', 'Meropenem', 'Linezolid', 'Tigecycline', 'Levofloxacin', 'Ciprofloxacin', 'Amoxicillin/Clavulanate', 'Clindamycin'] },
    { id: 'anapo', name: 'Anaerobes: PO', bug: 'ana', items: ['Metronidazole', 'Amoxicillin/Clavulanate'], ban: ['Ampicillin/Sulbactam', 'Clindamycin', 'Moxifloxacin', 'Linezolid', 'Tigecycline', 'Doxycycline', 'Carbapenems', 'Piperacillin/Tazobactam'] },
    { id: 'atyd', name: 'Atypical organisms', bug: 'aty', items: ['Azithromycin', 'Ciprofloxacin', 'Levofloxacin', 'Moxifloxacin', 'Tetracyclines', 'Tigecycline'], ban: ['Doxycycline', 'Minocycline', 'Clindamycin', 'Linezolid', 'Erythromycin'] }
  ] },
  { id: 'pk', name: 'Antibiotic traits', sub: 'Killing pattern and kidney dosing', src: 'Resistant organisms and important antibiotics 2026, last page', groups: [
    { id: 'time', name: 'Time-dependent antibiotics', items: ['Beta-lactams', 'Carbapenems', 'Tetracyclines', 'Macrolides', 'Clindamycin', 'Linezolid'], ban: ['Nafcillin', 'Ceftriaxone', 'Doxycycline'] },
    { id: 'conc', name: 'Concentration-dependent antibiotics', items: ['Fluoroquinolones', 'Aminoglycosides', 'Nitrofurantoin', 'Fosfomycin', 'Daptomycin', 'Metronidazole'], ban: ['Moxifloxacin'] },
    { id: 'norenal', name: 'Antibiotics that are NOT renally adjusted', items: ['Nafcillin', 'Ceftriaxone', 'Doxycycline', 'Macrolides', 'Moxifloxacin'], ban: ['Beta-lactams', 'Tetracyclines', 'Clindamycin', 'Linezolid', 'Metronidazole', 'Fluoroquinolones', 'Nitrofurantoin', 'Fosfomycin'] }
  ] },
  { id: 'gram', name: 'Gram tree', sub: 'Gram-positive and gram-negative bacteria', src: 'Survival guide: bacterial class 2026', groups: [
    { id: 'gpba', name: 'Gram-positive: anaerobic bacilli', items: ['Clostridioides difficile'] },
    { id: 'gpca', name: 'Gram-positive: anaerobic cocci', items: ['Peptostreptococci'], al: [['peptostreptococcus', 'peptostrep']] },
    { id: 'gpch', name: 'Gram-positive: aerobic cocci in chains', items: ['Streptococcus pneumoniae', 'Streptococcus agalactiae', 'Streptococcus pyogenes', 'Viridans streptococci', 'Enterococcus faecium', 'Enterococcus faecalis'] },
    { id: 'gpcp', name: 'Gram-positive: clusters, coagulase positive', items: ['Staphylococcus aureus'] },
    { id: 'gpcn', name: 'Gram-positive: clusters, coagulase negative (CoNS)', items: ['Staphylococcus epidermidis', 'Staphylococcus saprophyticus'] },
    { id: 'gndi', name: 'Gram-negative: aerobic diplococci', items: ['Neisseria gonorrhoeae', 'Moraxella catarrhalis'] },
    { id: 'gncc', name: 'Gram-negative: aerobic coccobacilli', items: ['Haemophilus influenzae'] },
    { id: 'gnnl', name: 'Gram-negative aerobic bacilli: not lactose fermenting', items: ['Pseudomonas aeruginosa', 'Proteus mirabilis'] },
    { id: 'gnlf', name: 'Gram-negative aerobic bacilli: lactose fermenting', items: ['Escherichia coli', 'Klebsiella pneumoniae', 'Enterobacter cloacae'] },
    { id: 'gnan', name: 'Gram-negative: anaerobic bacilli', items: ['Bacteroides fragilis'] }
  ] }
];

/* generic menu entries such as "Staphylococcus species" cover every species of that genus; "Enteric gram negative rods" covers the family */
function micCovers(item, k) {
  const i = micNorm(item); if (i === k) return true;
  if (i === 'staphylococcus species') return /^(staphylococcus|staph) /.test(k);
  if (i === 'streptococcus species') return /^(streptococcus|strep) /.test(k) || /viridans/.test(k);
  if (i === 'enteric gram negative rods') return /^(escherichia|klebsiella|enterobacter|citrobacter|proteus) /.test(k) || /^(klebsiella|proteus) species$/.test(k);
  return false;
}

const micNorm = s => String(s || '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const micInner = s => { const m = String(s).match(/\(([^)]*)\)/); return m ? m[1] : ''; };
/* every spelling that counts for an item: the full text, the text without brackets, the bracket text, "Genus species" shortened to "G species",
   a genus alone for "... species", and any aliases given in the data (list of strings) */
function micAliases(t, extra) {
  const out = new Set(), add = x => { const n = String(x).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); if (n) out.add(n); };
  add(t); add(micNorm(t)); const inn = micInner(t); if (inn && !/^(esbl|cre|esbl, cre|group b strep|stomach|uti only|only with other antibiotics)$/i.test(inn.trim())) add(inn);
  const base = micNorm(t), w = base.split(' ');
  if (w.length === 2 && w[1] !== 'species') { add(w[0][0] + ' ' + w[1]); add(w[0][0] + w[1]); }
  if (w.length === 2 && w[1] === 'species') { add(w[0]); add(w[0] + ' spp'); add(w[0] + ' sp'); }
  if (/enterococci/.test(base)) add('enterococcus');
  if (/viridans/.test(base)) { add('viridans strep'); add('viridans streptococci'); add('viridans streptococcus'); add('viridans group strep'); }
  if (/gram negative rods/.test(base)) { add('enteric gnr'); add('gnr'); add('enteric gram negative bacilli'); add('enteric gram negatives'); }
  if (/^anaerobes$/.test(base)) add('anaerobe');
  if (/^atypicals$/.test(base)) { add('atypical'); add('atypical organisms'); }
  if (/trimethoprim sulfamethoxazole/.test(base)) { add('tmp smx'); add('tmpsmx'); add('tmp sulfa'); }
  if (/ampicillin sulbactam/.test(base)) add('unasyn');
  if (/streptococcus agalactiae/.test(base)) { add('group b strep'); add('group b streptococcus'); add('s agalactiae'); add('strep agalactiae'); add('gbs'); }
  if (/helicobacter pylori/.test(base)) { add('h pylori'); add('helicobacter pylori'); }
  if (/clostridioides difficile/.test(base)) { add('c diff'); add('c difficile'); add('clostridium difficile'); add('clostridium difficille'); }
  if (/^bacteroides species$/.test(base)) add('bacterioides');
  (extra || []).forEach(add);
  return [...out];
}
function micLev(a, b) { const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 3; let p = []; for (let j = 0; j <= n; j++) p[j] = j; for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; }
/* does typed text match this item? exact on an alias, or one typo for 6 to 11 letters, two for longer */
function micMatch(typed, item, extra) {
  const x = String(typed || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); if (!x) return false;
  return micAliases(item, extra).some(a => { if (a === x) return true; const L = Math.max(a.length, x.length); if (L < 6 || /\d/.test(a)) return false; return micLev(a, x) <= (L >= 12 ? 2 : 1); });
}
/* tags used to keep decoys from being arguably right (a different staph species for a Staphylococcus box, and so on) */
function micTags(t) {
  const s = String(t).toLowerCase(), g = [];
  if (/staphylococc|^staph/.test(s)) g.push('staph');
  if (/streptococc|^strep|viridans/.test(s)) g.push('strep');
  if (/enterococc|e\. faecalis|faecium/.test(s)) g.push('ent');
  if (/escherichia|e\. coli|klebsiella|k\. pneumoniae|enterobacter|citrobacter|proteus|enteric gram/.test(s)) g.push('egnr');
  if (/chlamydia|mycoplasma|legionella|atypical/.test(s)) g.push('aty');
  if (/bacteroides|clostridioides|anaerobes/.test(s)) g.push('ana');
  if (/haemophilus|moraxella/.test(s)) g.push('hm');
  if (/neisseria/.test(s)) g.push('neis');
  if (/pseudomonas|acinetobacter|mrsa/.test(s)) g.push('res');
  return g;
}
/* chips for a drag round: all the group's items plus a few decoys that are plainly wrong for this group */
function micDecoys(set, grp, n, rnd) {
  if (grp.decoyFree) return [];
  const mine = new Set(grp.items.map(micNorm)), banned = new Set((grp.ban || []).map(micNorm)), myTags = new Set(); grp.items.forEach(t => micTags(t).forEach(g => myTags.add(g)));
  const pool = [], seen = new Set();
  set.groups.forEach(o => {
    if (o.id === grp.id || o.decoyFree) return; if (grp.bug && o.bug === grp.bug) return;
    o.items.forEach(t => { const k = micNorm(t); if (mine.has(k) || banned.has(k) || seen.has(k)) return; if (set.id === 'body' && micTags(t).some(g => myTags.has(g))) return; seen.add(k); pool.push(t.replace(/ \((UTI only|only with other antibiotics)\)$/, '')); });
  });
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const x = pool[i]; pool[i] = pool[j]; pool[j] = x; }
  return pool.slice(0, n);
}

export { MICSETS, micCovers, micNorm, micInner, micAliases, micLev, micMatch, micTags, micDecoys };
