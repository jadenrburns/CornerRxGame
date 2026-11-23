// Splits the game closure (game.js with ext.js and mic.js spliced in at the markers) into four ES modules:
//   core (before the markers), ext, mic, boot (after the markers).
// Every top-level declaration becomes a module-level `let` (or function); the statements that ran at load time
// move into an exported init(), and main.js calls the four inits in the original order. Cross-module
// reassignments of a variable become setters (set_X). Nothing else changes.
const NM = process.env.NM || '/opt/npm-tools/node_modules';
const acorn = require(NM + '/acorn'), walk = require(NM + '/acorn-walk'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');

module.exports = function splitGame(dataOwner /* name -> data file */) {
  const read = f => fs.readFileSync(path.join(root, f), 'utf8');
  const g = read('game.js'), e = read('ext.js'), m = read('mic.js');
  const i1 = g.indexOf('/*@EXT@*/'), i2 = g.indexOf('/*@MIC@*/');
  const full = g.slice(0, i1) + e + g.slice(i1 + 9, i2) + m + g.slice(i2 + 9);
  const eS = i1, eE = i1 + e.length, mS = eE + (i2 - i1 - 9), mE = mS + m.length;
  const seg = p => p >= eS && p < eE ? 'ext' : p >= mS && p < mE ? 'mic' : p < eS ? 'core' : 'boot';
  const ast = acorn.parse(full, { ecmaVersion: 'latest', sourceType: 'module' });
  // the IIFE
  let fn = null;
  for (const n of ast.body) if (n.type === 'ExpressionStatement' && n.expression.type === 'CallExpression' && n.expression.callee.body && n.expression.callee.body.type === 'BlockStatement') fn = n.expression.callee;
  if (!fn) throw new Error('IIFE not found');
  const body = fn.body.body.filter(s => !(s.type === 'ExpressionStatement' && s.directive));
  const SEGS = ['core', 'ext', 'mic', 'boot'];
  // ---- top-level declarations
  const decl = {};
  const patNames = (p, out) => { walk.simple(p, { Identifier(i) { out.push(i.name); } }); return out; };
  for (const s of body) {
    if (s.type === 'VariableDeclaration') for (const d of s.declarations) for (const n of patNames(d.id, [])) decl[n] = { seg: seg(s.start), kind: s.kind };
    else if (s.type === 'FunctionDeclaration') decl[s.id.name] = { seg: seg(s.start), kind: 'fn' };
    else if (s.type === 'ClassDeclaration') decl[s.id.name] = { seg: seg(s.start), kind: 'class' };
  }
  // ---- scope helpers: is `name` declared in a scope between the node and the IIFE?
  const declCache = new Map();
  const varNames = (node, out) => { // var + function declarations hoisted in a function body (not entering nested functions)
    (function rec(n, top) {
      if (!n || typeof n.type !== 'string') return;
      if (!top && /Function/.test(n.type)) return;
      if (n.type === 'VariableDeclaration' && n.kind === 'var') n.declarations.forEach(d => patNames(d.id, out));
      for (const k in n) { const v = n[k]; if (k === 'type' || k === 'start' || k === 'end') continue; if (Array.isArray(v)) v.forEach(x => x && typeof x.type === 'string' && rec(x, false)); else if (v && typeof v.type === 'string') rec(v, false); }
    })(node, true);
    return out;
  };
  const blockDecls = (stmts, out) => { for (const s of stmts) { if (s.type === 'VariableDeclaration' && s.kind !== 'var') s.declarations.forEach(d => patNames(d.id, out)); else if (s.type === 'FunctionDeclaration' || s.type === 'ClassDeclaration') out.push(s.id.name); } return out; };
  function scopeNames(a) {
    if (declCache.has(a)) return declCache.get(a);
    let out = [];
    if (/Function/.test(a.type)) { a.params.forEach(p => patNames(p, out)); if (a.type === 'FunctionExpression' && a.id) out.push(a.id.name); varNames(a.body.type === 'BlockStatement' ? a.body : { type: 'X' }, out); if (a.body.type === 'BlockStatement') blockDecls(a.body.body, out); }
    else if (a.type === 'BlockStatement') blockDecls(a.body, out);
    else if (a.type === 'ForStatement' && a.init && a.init.type === 'VariableDeclaration') a.init.declarations.forEach(d => patNames(d.id, out));
    else if ((a.type === 'ForInStatement' || a.type === 'ForOfStatement') && a.left.type === 'VariableDeclaration') a.left.declarations.forEach(d => patNames(d.id, out));
    else if (a.type === 'CatchClause' && a.param) patNames(a.param, out);
    else if (a.type === 'SwitchStatement') a.cases.forEach(c => blockDecls(c.consequent, out));
    else if (a.type === 'ClassExpression' && a.id) out.push(a.id.name);
    const set = new Set(out); declCache.set(a, set); return set;
  }
  const isLocal = (name, anc) => { // anc: ancestors incl. the node; stop at the IIFE function
    for (let i = anc.length - 2; i >= 0; i--) { const a = anc[i]; if (a === fn || a === fn.body) return false; if (scopeNames(a).has(name)) return true; }
    return false;
  };
  // ---- references, writes
  const used = {}; SEGS.forEach(s => used[s] = new Set());
  const dataUsed = {}; SEGS.forEach(s => dataUsed[s] = new Set());
  const edits = []; // {start,end,text}
  const setters = new Set();
  const errors = [];
  const stmtOf = pos => body.find(s => pos >= s.start && pos < s.end);
  walk.fullAncestor(fn.body, (n, st, anc) => {
    if (n.type !== 'Identifier') return;
    const s0 = stmtOf(n.start); if (!s0) return;
    const sg = seg(s0.start);
    const local = isLocal(n.name, anc);
    if (local) return;
    const parent = anc[anc.length - 2];
    if (parent && ((parent.type === 'MemberExpression' && parent.property === n && !parent.computed) || (parent.type === 'Property' && parent.key === n && !parent.computed && !parent.shorthand) || ((parent.type === 'MethodDefinition' || parent.type === 'PropertyDefinition') && parent.key === n && !parent.computed) || ((parent.type === 'LabeledStatement' || parent.type === 'BreakStatement' || parent.type === 'ContinueStatement') && parent.label === n))) return;
    const d = decl[n.name];
    const isDeclId = (parent && parent.type === 'VariableDeclarator' && parent.id === n && anc[anc.length - 3] === s0) || (parent === s0 && (parent.type === 'FunctionDeclaration' || parent.type === 'ClassDeclaration') && parent.id === n);
    if (d) {
      if (!isDeclId && d.seg !== sg) used[sg].add(n.name);
      // writes
      if (parent && !isDeclId) {
        const asg = parent.type === 'AssignmentExpression' && parent.left === n, upd = parent.type === 'UpdateExpression';
        if ((asg || upd) && d.seg !== sg) {
          if (d.kind === 'fn' || d.kind === 'class') errors.push('assignment to ' + d.kind + ' ' + n.name);
          setters.add(n.name);
          if (asg && parent.operator === '=') edits.push({ start: parent.start, end: parent.end, text: 'set_' + n.name + '(' + null + ')', node: parent, kind: 'asg' });
          else if (asg && /^[-+*\/%&|^]|<<|>>/.test(parent.operator) && !/^(\|\||&&|\?\?)=/.test(parent.operator)) edits.push({ node: parent, kind: 'cmp', name: n.name, start: parent.start, end: parent.end });
          else if (asg) errors.push('unsupported operator ' + parent.operator + ' on ' + n.name);
          else edits.push({ node: parent, kind: 'upd', name: n.name, start: parent.start, end: parent.end, stmtLevel: anc[anc.length - 3] && anc[anc.length - 3].type === 'ExpressionStatement' });
        } else if (parent.type === 'AssignmentExpression' && parent.left !== n && false) { /* noop */ }
      }
    } else if (dataOwner[n.name] && !isDeclId) dataUsed[sg].add(n.name);
  });
  // destructuring writes / for-of writes to cross-module names
  walk.simple(fn.body, {
    AssignmentExpression(n) { if (n.left.type !== 'Identifier') { const names = patNames(n.left, []).filter(x => decl[x] && decl[x].seg !== seg(n.start)); if (names.length && n.left.type !== 'MemberExpression') errors.push('pattern assignment to ' + names.join(',')); } }
  });
  if (process.env.SG_DBG) console.error(Object.fromEntries(SEGS.map(s=>[s,used[s].size])), Object.keys(decl).length, stmtOf(eS+5) && 1);
  if (errors.length) throw new Error('split-game: ' + errors.join('; '));
  // ---- text edit machinery (edits nest: build rewritten text recursively)
  const text = full;
  const asgEdits = edits.filter(x => x.kind);
  const byNode = new Map(asgEdits.map(x => [x.node, x]));
  // render a node range with all nested rewrites applied
  const inner = asgEdits.slice().sort((a, b) => a.start - b.start);
  function render(start, end) {
    // find top-most edits fully inside [start,end]
    let out = '', pos = start;
    const cands = inner.filter(x => x.start >= start && x.end <= end);
    for (const x of cands) {
      if (x.start < pos) continue; // nested inside an already rendered edit
      out += text.slice(pos, x.start);
      const n = x.node;
      if (x.kind === 'asg') out += 'set_' + n.left.name + '(' + render(n.right.start, n.right.end) + ')';
      else if (x.kind === 'cmp') out += 'set_' + x.name + '(' + x.name + ' ' + n.operator.slice(0, -1) + ' (' + render(n.right.start, n.right.end) + '))';
      else { const op = n.operator === '++' ? '+' : '-'; if (!x.stmtLevel && !n.prefix) throw new Error('postfix update used as a value: ' + x.name + ' at ' + n.start); out += 'set_' + x.name + '(' + x.name + ' ' + op + ' 1)'; }
      pos = x.end;
    }
    return out + text.slice(pos, end);
  }
  // ---- build module bodies
  const mods = {}; SEGS.forEach(s => mods[s] = { hoist: [], fns: [], init: [], exportsNeeded: new Set() });
  let prevEnd = body.length ? body[0].start : 0;
  // include comments before the first statement per segment boundary
  const bounds = { core: [0, eS], ext: [eS, eE], mic: [mS, mE], boot: [mE, full.length] };
  const lead = {}; // leading comment text before each statement
  let prev = {}; SEGS.forEach(s => prev[s] = null);
  for (const s of body) {
    const sg = seg(s.start), b = bounds[sg];
    const from = prev[sg] === null ? Math.max(b[0], fn.body.start + 1) : prev[sg];
    const pre = text.slice(from, s.start);
    prev[sg] = s.end;
    const M = mods[sg];
    if (s.type === 'FunctionDeclaration') M.fns.push(pre + render(s.start, s.end));
    else if (s.type === 'VariableDeclaration') {
      const parts = [];
      for (const d of s.declarations) {
        const names = patNames(d.id, []); M.hoist.push(...names);
        if (!d.init) continue;
        if (d.id.type === 'Identifier') parts.push(d.id.name + ' = ' + render(d.init.start, d.init.end) + ';');
        else parts.push(';(' + text.slice(d.id.start, d.id.end) + ' = ' + render(d.init.start, d.init.end) + ');');
      }
      M.init.push(pre + parts.join('\n  '));
    } else if (s.type === 'ClassDeclaration') { M.hoist.push(s.id.name); M.init.push(pre + s.id.name + ' = ' + render(s.start, s.end).replace(/^class\s+/, 'class ') + ';'); }
    else M.init.push(pre + render(s.start, s.end));
  }
  // closing comments after the last statement of each segment
  for (const sg of SEGS) { const tail = text.slice(prev[sg] === null ? bounds[sg][0] : prev[sg], sg === 'boot' ? fn.body.end - 1 : bounds[sg][1]); if (tail.trim()) mods[sg].init.push(tail); }
  // ---- imports/exports
  const out = {};
  const exportsOf = {}; SEGS.forEach(s => exportsOf[s] = new Set());
  for (const sg of SEGS) for (const n of used[sg]) exportsOf[decl[n].seg].add(n);
  for (const sg of SEGS) {
    const M = mods[sg]; const lines = ['// generated by tools/to-esm.js (tools/split-game.js) from game.js + ext.js + mic.js; edit the originals'];
    const byFile = {}; for (const n of dataUsed[sg]) (byFile[dataOwner[n]] = byFile[dataOwner[n]] || []).push(n);
    for (const f of Object.keys(byFile)) lines.push("import { " + byFile[f].sort().join(', ') + " } from './" + f + ".js';");
    const byMod = {};
    for (const n of used[sg]) (byMod[decl[n].seg] = byMod[decl[n].seg] || new Set()).add(n);
    for (const n of setters) { /* only if this segment writes it */ }
    const wr = new Set(); for (const x of asgEdits) { const nm = x.kind === 'asg' ? x.node.left.name : x.name; if (seg(x.start) === sg) wr.add(nm); }
    for (const n of wr) (byMod[decl[n].seg] = byMod[decl[n].seg] || new Set()).add('set_' + n);
    for (const mm of Object.keys(byMod)) lines.push("import { " + [...byMod[mm]].sort().join(', ') + " } from './" + (mm === 'core' ? 'core' : mm === 'boot' ? 'boot' : mm) + ".js';");
    const hoist = [...new Set(M.hoist)]; if (hoist.length) lines.push('let ' + hoist.join(', ') + ';');
    lines.push(M.fns.join('\n'));
    lines.push('export function init() {' + M.init.join('\n') + '\n}');
    const ex = [...exportsOf[sg]]; const myset = [...wrAll(sg)]; 
    function wrAll(s0) { const r = new Set(); for (const x of asgEdits) { const nm = x.kind === 'asg' ? x.node.left.name : x.name; if (decl[nm].seg === s0) r.add(nm); } return r; }
    for (const n of myset) lines.push('export function set_' + n + '(v) { ' + n + ' = v; return v; }');
    if (ex.length) lines.push('export { ' + ex.sort().join(', ') + ' };');
    out[sg] = lines.join('\n') + '\n';
  }
  return { out, stats: { statements: body.length, decl: Object.keys(decl).length, setters: [...setters] } };
};
