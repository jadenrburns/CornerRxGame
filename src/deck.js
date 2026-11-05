/* ---------------- Study decks: standard format, parser, exporter ---------------- */
const STUDY_TEMPLATE =
`# Deck: Cardiology week 3

Q: Which drug class ends in -pril?
A: ACE inhibitor
W: Angiotensin receptor blocker
W: Beta-blocker
W: Calcium channel blocker
E: -pril drugs block angiotensin converting enzyme and can cause a dry cough.
D: 1
T: Antihypertensives

Q: What is the antidote for heparin?
A: Protamine sulfate
W: Vitamin K
W: Idarucizumab
W: Flumazenil
E: Protamine binds and neutralizes heparin.
D: 2
T: Antidotes
`;

const STUDY_HELP =
`FIELDS (one per line, blocks separated by a blank line or ---)
Q:  the question                      (required)
A:  the correct answer                (required)
W:  a wrong answer, up to 3 lines     (optional)
E:  explanation shown after answering (optional)
D:  difficulty 1, 2 or 3              (optional, default 2)
T:  topic label                       (optional)
S:  date it unlocks, YYYY-MM-DD       (optional, per question)
# Start: 2026-11-02                   (optional, unlocks the whole paste)
# Deck: name                          (optional, first line)

QUICK CARDS (one per line, from Quizlet, Anki or a spreadsheet)
question | answer | optional explanation
Tab-separated lines work too.

Missing wrong answers are filled in from the other answers in the same paste,
so quick cards need at least 4 lines. JSON also works: [{"q":"","a":"","w":["","",""],"e":"","d":2,"t":""}]`;

const STUDY_AI_PROMPT =
`Turn my study notes below into multiple-choice questions using EXACTLY this format, and output only the formatted text in one code block.

# Deck: <short deck name>

Q: <question>
A: <the one correct answer>
W: <plausible wrong answer>
W: <plausible wrong answer>
W: <plausible wrong answer>
E: <one or two sentence explanation>
D: <1 easy, 2 medium, 3 hard>
T: <topic label>

Rules: leave a blank line between questions; exactly 3 W lines per question; wrong answers must be plausible and similar in length to the correct answer; keep every fact faithful to my notes; write one question per testable fact.

My notes:
<paste notes here>`;

function parseStudy(text, defaultDeckName) {
  const out = { deckName: defaultDeckName || 'My notes', deckFrom: '', items: [], errors: [], warnings: [] };
  const raw = String(text || '').replace(/\r\n?/g, '\n').trim();
  if (!raw) { out.errors.push({ line: 0, msg: 'Nothing to add yet. Paste questions in the standard format.' }); return out; }
  let drafts = [];
  if (raw[0] === '[' || raw[0] === '{') {
    try {
      let arr = JSON.parse(raw); if (!Array.isArray(arr)) arr = arr.questions || arr.items || [arr];
      if (!Array.isArray(arr)) throw new Error('not a list');
      arr.forEach((o, i) => drafts.push({ q: o.q || o.question, a: o.a || o.answer, w: (o.w || o.wrong || []).slice(0, 3), e: o.e || o.explanation, d: o.d || o.difficulty, t: o.t || o.topic, s: o.s || o.start || o.from || '', line: i + 1 }));
    } catch (e) { out.errors.push({ line: 1, msg: 'Could not read JSON: ' + e.message }); return out; }
  } else {
    const lines = raw.split('\n'); let b = null, last = null;
    const flush = () => { if (b && (b.q || b.a || b.w.length || b.e)) drafts.push(b); b = null; last = null; };
    const fresh = (n) => ({ q: '', a: '', w: [], e: '', d: '', t: '', s: '', line: n });
    lines.forEach((ln, idx) => {
      const n = idx + 1, s = ln.trim();
      if (!s || /^-{3,}$/.test(s)) { flush(); return; }
      let m = s.match(/^#?\s*deck\s*[:：]\s*(.+)$/i);
      if (m) { out.deckName = m[1].trim().slice(0, 60); return; }
      m = s.match(/^#?\s*(?:start|from|date)\s*[:：]\s*(\d{4}-\d{2}-\d{2})\s*$/i);
      if (m) { out.deckFrom = m[1]; return; }
      if (s[0] === '#') return;
      m = s.match(/^(Q|A|W\d?|E|D|T|S)\s*[:：]\s*(.*)$/i);
      if (m) {
        const k = m[1][0].toUpperCase(), v = m[2].trim();
        if (k === 'Q' && b && b.q && (b.a || b.w.length)) flush();
        if (!b) b = fresh(n);
        if (k === 'Q') { b.q = v; last = 'q'; }
        else if (k === 'A') { b.a = v; last = 'a'; }
        else if (k === 'W') { if (b.w.length >= 3) out.warnings.push({ line: n, msg: 'More than 3 wrong answers; extra ignored.' }); else b.w.push(v); last = 'w'; }
        else if (k === 'E') { b.e = v; last = 'e'; }
        else if (k === 'D') { b.d = v; last = 'd'; }
        else if (k === 'S') { b.s = v; last = 's'; }
        else { b.t = v; last = 't'; }
        return;
      }
      if ((s.indexOf(' | ') > 0 || s.indexOf('\t') > 0) && !b) {
        const p = s.split(s.indexOf('\t') > 0 ? '\t' : ' | ').map(x => x.trim());
        drafts.push({ q: p[0], a: p[1], w: [], e: p[2] || '', d: '', t: '', s: '', line: n }); return;
      }
      if (b && last) {
        if (last === 'w') b.w[b.w.length - 1] += ' ' + s; else b[last] += ' ' + s; return;
      }
      out.errors.push({ line: n, msg: 'Line not recognized (start with Q:, A:, W:, E:, D: or T:, or use "question | answer").' });
    });
    flush();
  }
  const ok = drafts.filter(d => {
    if (!d.q || !d.a) { out.errors.push({ line: d.line, msg: 'Each question needs both a Q: and an A: line.' }); return false; }
    return true;
  });
  ok.forEach(d => {
    d.w = d.w.filter(Boolean);
    const need = 3 - d.w.length;
    if (need > 0) {
      const same = ok.filter(o => o !== d && o.a && o.a.toLowerCase() !== d.a.toLowerCase() && d.t && o.t === d.t).map(o => o.a);
      const any = ok.filter(o => o !== d && o.a && o.a.toLowerCase() !== d.a.toLowerCase()).map(o => o.a);
      const seen = new Set([d.a.toLowerCase()].concat(d.w.map(x => x.toLowerCase())));
      const pool = [];
      same.concat(any).forEach(x => { if (!seen.has(x.toLowerCase())) { seen.add(x.toLowerCase()); pool.push(x); } });
      if (pool.length < need) { d.bad = true; out.errors.push({ line: d.line, msg: 'Needs 3 wrong answers (W:) or at least 4 questions in this paste so wrong answers can be filled in.' }); return; }
      // prefer same-topic answers, then random others
      const pref = pool.slice(0, same.length), rest = pool.slice(same.length);
      for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
      for (let i = pref.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pref[i], pref[j]] = [pref[j], pref[i]]; }
      d.w = d.w.concat(pref.concat(rest).slice(0, need)); d.auto = true;
    }
    const set = new Set([d.a].concat(d.w).map(x => x.toLowerCase()));
    if (set.size !== 4) { d.bad = true; out.errors.push({ line: d.line, msg: 'Answer choices must all be different.' }); }
  });
  ok.filter(d => !d.bad).forEach(d => {
    let diff = parseInt(d.d, 10); if (!(diff >= 1 && diff <= 3)) diff = 2;
    out.items.push({ c: 'MY', d: diff, q: d.q.trim(), a: d.a.trim(), w: d.w.slice(0, 3).map(x => x.trim()), e: (d.e || 'From your notes.').trim(), t: (d.t || '').trim(), from: /^\d{4}-\d{2}-\d{2}$/.test(String(d.s || '').trim()) ? String(d.s).trim() : (out.deckFrom || ''), auto: !!d.auto });
  });
  return out;
}

function deckToText(deck) {
  let s = '# Deck: ' + deck.name + '\n';
  deck.items.forEach(q => {
    s += '\nQ: ' + q.q + '\nA: ' + q.a + '\n' + q.w.map(w => 'W: ' + w).join('\n') + '\nE: ' + q.e + '\nD: ' + q.d + '\n' + (q.t ? 'T: ' + q.t + '\n' : '') + (q.from ? 'S: ' + q.from + '\n' : '');
  });
  return s;
}

if (typeof module !== 'undefined') module.exports = Object.assign(module.exports || {}, { parseStudy, deckToText, STUDY_TEMPLATE });
