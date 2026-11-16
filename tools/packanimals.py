#!/usr/bin/env python3
"""Pack ITHappy Animals (skinned, with run/walk/idle clips) into assets/animals.bin + animals.json + animals.png.
usage: packanimals.py <dir with Name_001.glb> <outdir> Dog_001 Kitty_001"""
import json,struct,sys,os
import numpy as np
CT={5126:'f4',5123:'u2',5121:'u1',5125:'u4',5120:'i1',5122:'i2'};NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def load(p):
    d=open(p,'rb').read();l=struct.unpack('<I',d[12:16])[0];j=json.loads(d[20:20+l]);bo=20+l;bl=struct.unpack('<I',d[bo:bo+4])[0];return j,d[bo+8:bo+8+bl]
def acc(j,b,i):
    a=j['accessors'][i];bv=j['bufferViews'][a['bufferView']];n=NC[a['type']];dt=np.dtype(CT[a['componentType']])
    o=bv.get('byteOffset',0)+a.get('byteOffset',0);st=bv.get('byteStride')
    if st and st!=n*dt.itemsize:
        raw=np.frombuffer(b,dtype='u1',count=st*a['count'],offset=o).reshape(a['count'],st)[:,:n*dt.itemsize];return np.ascontiguousarray(raw).view(dt).reshape(a['count'],n)
    return np.frombuffer(b,dtype=dt,count=a['count']*n,offset=o).reshape(a['count'],n)
src,out=sys.argv[1],sys.argv[2];names=sys.argv[3:];os.makedirs(out,exist_ok=True)
blob=bytearray();res=[]
def pad(a):
    global blob;by=a.tobytes();o=len(blob);blob+=by+b'\0'*((-len(by))%4);return o
for nm in names:
    j,b=load(os.path.join(src,nm+'.glb'))
    if not os.path.exists(os.path.join(out,'animals.png')):
        iv=j['bufferViews'][j['images'][0]['bufferView']];open(os.path.join(out,'animals.png'),'wb').write(b[iv.get('byteOffset',0):iv.get('byteOffset',0)+iv['byteLength']])
    sk=j['skins'][0];jn=sk['joints'];pos={n:i for i,n in enumerate(jn)};par=[-1]*len(jn)
    for ni,n in enumerate(j['nodes']):
        for c in n.get('children',[]):
            if c in pos and ni in pos: par[pos[c]]=pos[ni]
    trs=[list(j['nodes'][n].get('translation',[0,0,0]))+list(j['nodes'][n].get('rotation',[0,0,0,1]))+list(j['nodes'][n].get('scale',[1,1,1])) for n in jn]
    ibm=acc(j,b,sk['inverseBindMatrices']).astype('f4').reshape(-1,16)
    mi=[n['mesh'] for n in j['nodes'] if 'mesh' in n][0];P=[];N=[];U=[];J=[];W=[];I=[];base=0
    for pr in j['meshes'][mi]['primitives']:
        at=pr['attributes'];p=acc(j,b,at['POSITION']).astype('f4');P.append(p);N.append(acc(j,b,at['NORMAL']).astype('f4'));U.append(acc(j,b,at['TEXCOORD_0']).astype('f4'));J.append(acc(j,b,at['JOINTS_0']).astype('u1'));W.append(acc(j,b,at['WEIGHTS_0']).astype('f4'));I.append(acc(j,b,pr['indices']).astype('u4').reshape(-1)+base);base+=len(p)
    P=np.concatenate(P);N=np.concatenate(N);U=np.concatenate(U);J=np.concatenate(J);W=np.concatenate(W);I=np.concatenate(I);W=W/np.maximum(W.sum(1,keepdims=True),1e-6)
    mn,mx=P.min(0),P.max(0);ctr=(mn+mx)/2;half=np.maximum((mx-mn)/2,1e-6)
    nq=np.zeros((len(N),4),'i1');nq[:,:3]=np.round(N/np.maximum(np.linalg.norm(N,axis=1,keepdims=True),1e-6)*127)
    ent=dict(name=nm,nv=len(P),ni=len(I),ctr=[float(x) for x in ctr],half=[float(x) for x in half],par=par,trs=[[round(float(x),6) for x in t] for t in trs],ibm=[[round(float(x),6) for x in m] for m in ibm],bounds=[[float(x) for x in mn],[float(x) for x in mx]],joints=[j['nodes'][n]['name'] for n in jn],
        off=dict(p=pad(np.round((P-ctr)/half*32767).astype('<i2')),n=pad(nq),u=pad(np.round(np.clip(U,0,1)*65535).astype('<u2')),j=pad(J),w=pad(np.round(W*255).astype('u1')),i=pad(I.astype('<u2'))),clips={})
    for a in j['animations']:
        tr=[]
        for ch in a['channels']:
            t=ch['target'];nd=t['node']
            if nd not in pos or t['path'] not in('translation','rotation','scale'): continue
            s=a['samplers'][ch['sampler']];ts=acc(j,b,s['input']).astype('f4').reshape(-1);vs=acc(j,b,s['output']).astype('f4').reshape(-1)
            tr.append(dict(j=pos[nd],path=t['path'],t=[round(float(x),4) for x in ts],v=[round(float(x),5) for x in vs]))
        short=a['name'].split('_')[-1];ent['clips'][short]=tr
    res.append(ent);print(nm,len(P),len(I)//3,{k:len(v) for k,v in ent['clips'].items()})
open(os.path.join(out,'animals.bin'),'wb').write(blob);json.dump(dict(animals=res),open(os.path.join(out,'animals.json'),'w'),separators=(',',':'))
print(len(blob),os.path.getsize(os.path.join(out,'animals.json')))
