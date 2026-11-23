// Bundles src/esm/main.js with esbuild and wraps it in head.html, producing the same single-file page as build.sh.
// usage: node tools/to-esm.js && node build-esm.js [outfile]
const NM = process.env.NM || '/opt/npm-tools/node_modules';
const esbuild = require(NM + '/esbuild'), fs = require('fs'), path = require('path');
const out = process.argv[2] || path.join(__dirname, 'corner-rx-esm.html');
const r = esbuild.buildSync({ entryPoints: [path.join(__dirname, 'esm/main.js')], bundle: true, write: false, format: 'iife', target: 'es2020', charset: 'utf8', logLevel: 'warning' });
let js = r.outputFiles[0].text;
if (/<\/script/i.test(js)) js = js.replace(/<\/script/gi, '<\\/script');
const head = fs.readFileSync(path.join(__dirname, 'head.html'), 'utf8');
fs.writeFileSync(out, head + '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script>\n' + js + '\n</script>\n');
console.log('wrote', out, (fs.statSync(out).size / 1e6).toFixed(2) + ' MB');
