#!/usr/bin/env python3
"""Build one self-contained play-test file (assets inlined, works from file://): python3 tools/playtest.py <out.html>
Needs src/corner-rx.html (cd src && sh build.sh). Internet is still needed for the three.js CDN tag."""
import base64,json,os,sys
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html=open(os.path.join(root,'src','corner-rx.html'),encoding='utf-8').read()
mime={'.json':'application/json','.bin':'application/octet-stream','.png':'image/png'}
m={}
for f in sorted(os.listdir(os.path.join(root,'assets'))):
    e=os.path.splitext(f)[1]
    if e in mime: m['assets/'+f]='data:'+mime[e]+';base64,'+base64.b64encode(open(os.path.join(root,'assets',f),'rb').read()).decode()
shim="<script>(function(){var A="+json.dumps(m,separators=(',',':'))+";var F=window.fetch;window.fetch=function(u,o){var k=typeof u==='string'?u:(u&&u.url);return A[k]?F(A[k],o):F(u,o)};var d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{get:d.get,set:function(v){d.set.call(this,A[v]||v)}})})();</script>"
i=html.index('<script')
html='<meta charset="utf-8">'+html if 'charset' not in html[:2000].lower() else html
i=html.index('<script')
open(sys.argv[1],'w',encoding='utf-8').write(html[:i]+shim+html[i:])
print(len(m),'assets inlined')
