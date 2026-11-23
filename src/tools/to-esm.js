// Generates src/esm/*.js (ES modules) from the classic-script sources, preserving build.sh order.
// usage: node tools/to-esm.js   (needs acorn + acorn-walk; set NODE_PATH or edit NM)
const NM = process.env.NM || '/opt/npm-tools/node_modules';
const acorn = require(NM + '/acorn'), walk = require(NM + '/acorn-walk'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(root, 'esm');
const files = 'net bank pt3 pt3b pt3c pt3d pt4 pt4q pt4s bio1 bio4x bio4p cycle mol mc3 mc3x micdata th3 th3c ger th553 him lab ind drugs shop gear deck crowd world'.split(' ');
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out);
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
function topDecls(ast) {
  const names = [];
  for (const n of ast.body) {
    if (n.type === 'VariableDeclaration') for (const d of n.declarations) walk.simple(d.id, { Identifier(i) { names.push(i.name); } });
    else if (n.type === 'FunctionDeclaration' || n.type === 'ClassDeclaration') names.push(n.id.name);
  }
  return names;
}
function idents(ast) { const u = new Set(); walk.full(ast, n => { if (n.type === 'Identifier') u.add(n.name); }); return u; }
const src = {}, ast = {}, decl = {}, owner = {};
for (const f of files) {
  src[f] = read(f + '.js');
  ast[f] = acorn.parse(src[f], { ecmaVersion: 'latest', sourceType: 'module', allowReturnOutsideFunction: false });
  decl[f] = topDecls(ast[f]);
  for (const n of decl[f]) { if (owner[n]) throw new Error('duplicate top-level name ' + n + ' in ' + owner[n] + ' and ' + f); owner[n] = f; }
}
// game.js with ext.js and mic.js spliced in at the markers (same as build.sh)
let game = read('game.js'), ext = read('ext.js'), mic = read('mic.js');
if (game.split('/*@EXT@*/').length !== 2 || game.split('/*@MIC@*/').length !== 2) throw new Error('marker count');
game = game.replace('/*@EXT@*/', () => ext).replace('/*@MIC@*/', () => mic);
src.game = game; ast.game = acorn.parse(game, { ecmaVersion: 'latest', sourceType: 'module' });
function imports(f) {
  const u = idents(ast[f]), by = {};
  for (const n of u) if (owner[n] && owner[n] !== f) (by[owner[n]] = by[owner[n]] || []).push(n);
  return Object.keys(by).map(g => 'import { ' + by[g].sort().join(', ') + " } from './" + g + ".js';").join('\n');
}
let report = [];
for (const f of files) {
  const imp = imports(f), exp = decl[f].length ? '\nexport { ' + decl[f].join(', ') + ' };\n' : '\n';
  fs.writeFileSync(path.join(out, f + '.js'), (imp ? imp + '\n' : '') + src[f] + exp);
  report.push(f + ': ' + decl[f].length + ' exports');
}
const split = require('./split-game.js')(owner);
for (const k of Object.keys(split.out)) fs.writeFileSync(path.join(out, k + '.js'), split.out[k]);
console.log('split:', JSON.stringify(split.stats));
const main = files.map(f => "import * as m_" + f + " from './" + f + ".js';").join('\n') +
  "\n// compatibility: the old scripts shared globals; tests and any inline handlers still read them from window\nObject.assign(window, " + files.map(f => 'm_' + f).join(', ') + ");\nimport { init as init_core } from './core.js';\nimport { init as init_ext } from './ext.js';\nimport { init as init_mic } from './mic.js';\nimport { init as init_boot } from './boot.js';\ninit_core(); init_ext(); init_mic(); init_boot();\n";
fs.writeFileSync(path.join(out, 'main.js'), main);
console.log(report.join('\n')); console.log('game imports:', ''.split('\n').length, 'lines');
