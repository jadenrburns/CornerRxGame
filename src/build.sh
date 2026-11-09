#!/bin/sh
cd "$(dirname "$0")"
python3 - <<'PY'
g=open('game.js').read(); e=open('ext.js').read()
assert g.count('/*@EXT@*/')==1
open('game.full.js','w').write(g.replace('/*@EXT@*/',e))
PY
{ cat head.html; echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'; echo '<script>'; cat bank.js pt3.js pt3b.js pt3c.js pt3d.js pt4.js cycle.js th3.js th3c.js th553.js him.js lab.js ind.js drugs.js shop.js deck.js crowd.js world.js game.full.js; echo '</script>'; } > corner-rx.html
