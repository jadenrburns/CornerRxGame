#!/bin/sh
cd "$(dirname "$0")"
python3 - <<'PY'
g=open('game.js').read(); e=open('ext.js').read(); m=open('mic.js').read()
assert g.count('/*@EXT@*/')==1 and g.count('/*@MIC@*/')==1
open('game.full.js','w').write(g.replace('/*@EXT@*/',e).replace('/*@MIC@*/',m))
PY
{ cat head.html; echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'; echo '<script>'; cat net.js bank.js pt3.js pt3b.js pt3c.js pt3d.js pt4.js pt4q.js pt4s.js bio1.js bio4x.js bio4p.js cycle.js mol.js mc3.js mc3x.js micdata.js th3.js th3c.js ger.js th553.js him.js lab.js ind.js drugs.js shop.js gear.js deck.js crowd.js world.js game.full.js; echo '</script>'; } > corner-rx.html
