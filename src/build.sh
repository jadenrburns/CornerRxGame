#!/bin/sh
# Real build (ES modules + esbuild). The old single-script build is kept as build-classic.sh.
cd "$(dirname "$0")"
python3 - <<'PY'
g=open('game.js').read(); e=open('ext.js').read(); m=open('mic.js').read()
assert g.count('/*@EXT@*/')==1 and g.count('/*@MIC@*/')==1
open('game.full.js','w').write(g.replace('/*@EXT@*/',e).replace('/*@MIC@*/',m))
PY
node tools/to-esm.js > /dev/null && node build-esm.js corner-rx.html 2>&1 | grep -E "^wrote|ERROR|error:" 
