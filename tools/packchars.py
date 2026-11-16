#!/usr/bin/env python3
"""Pack ITHappy City Characters .glb files into assets/chars.bin + chars.json + atlas.png.
usage: packchars.py <dir with Skeleton_N.glb> <out dir> id id id ...
Per character (all little endian, 4-byte aligned): pos int16x3, nrm int8x4, uv uint16x2, joints uint8x4,
weights uint8x4, indices uint16. Skeleton (parent, local TRS, inverse bind) goes in the json."""
import json,struct,sys,os,re
import numpy as np
CT={5126:'f4',5123:'u2',5121:'u1',5125:'u4',5120:'i1',5122:'i2'};NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def load(p):
    d=open(p,'rb').read();l=struct.unpack('<I',d[12:16])[0]
    j=json.loads(d[20:20+l]);bo=20+l;bl=struct.unpack('<I',d[bo:bo+4])[0];return j,d[bo+8:bo+8+bl]
def acc(j,b,i):
    a=j['accessors'][i];bv=j['bufferViews'][a['bufferView']];n=NC[a['type']];dt=np.dtype(CT[a['componentType']])
    o=bv.get('byteOffset',0)+a.get('byteOffset',0);st=bv.get('byteStride')
    if st and st!=n*dt.itemsize:
        raw=np.frombuffer(b,dtype='u1',count=st*a['count'],offset=o).reshape(a['count'],st)[:,:n*dt.itemsize]
        return np.ascontiguousarray(raw).view(dt).reshape(a['count'],n)
    return np.frombuffer(b,dtype=dt,count=a['count']*n,offset=o).reshape(a['count'],n)
def pad4(x): return x+b'\0'*((-len(x))%4)
src,out=sys.argv[1],sys.argv[2];ids=sys.argv[3:]
os.makedirs(out,exist_ok=True)
blob=bytearray();index=[];atlas_done=False
for cid in ids:
    f=[x for x in os.listdir(src) if re.match(r'Skeleton_%s(_|\.)'%cid,x)][0]
    j,b=load(os.path.join(src,f))
    if not atlas_done:
        iv=j['bufferViews'][j['images'][0]['bufferView']]
        open(os.path.join(out,'atlas.png'),'wb').write(b[iv.get('byteOffset',0):iv.get('byteOffset',0)+iv['byteLength']]);atlas_done=True
    sk=j['skins'][0];jn=sk['joints'];pos={n:i for i,n in enumerate(jn)}
    par=[-1]*len(jn)
    for ni,n in enumerate(j['nodes']):
        for c in n.get('children',[]):
            if c in pos and ni in pos: par[pos[c]]=pos[ni]
    trs=[]
    for n in jn:
        nd=j['nodes'][n];trs.append(list(nd.get('translation',[0,0,0]))+list(nd.get('rotation',[0,0,0,1]))+list(nd.get('scale',[1,1,1])))
    ibm=acc(j,b,sk['inverseBindMatrices']).astype('f4').reshape(-1,16)
    P=[];N=[];U=[];J=[];W=[];I=[];base=0;kinds=[];names=[]
    for nd in j['nodes']:
        if 'mesh' not in nd: continue
        names.append(nd['name'])
        for pr in j['meshes'][nd['mesh']]['primitives']:
            at=pr['attributes'];p=acc(j,b,at['POSITION']).astype('f4')
            P.append(p);N.append(acc(j,b,at['NORMAL']).astype('f4'));U.append(acc(j,b,at['TEXCOORD_0']).astype('f4'))
            J.append(acc(j,b,at['JOINTS_0']).astype('u1'));W.append(acc(j,b,at['WEIGHTS_0']).astype('f4'))
            I.append(acc(j,b,pr['indices']).astype('u4').reshape(-1)+base);base+=len(p)
    P=np.concatenate(P);N=np.concatenate(N);U=np.concatenate(U);J=np.concatenate(J);W=np.concatenate(W);I=np.concatenate(I)
    W=W/np.maximum(W.sum(1,keepdims=True),1e-6)
    mn,mx=P.min(0),P.max(0);ctr=(mn+mx)/2;half=np.maximum((mx-mn)/2,1e-6)
    q=np.round((P-ctr)/half*32767).astype('<i2')
    nq=np.zeros((len(N),4),'i1');nq[:,:3]=np.round(N/np.maximum(np.linalg.norm(N,axis=1,keepdims=True),1e-6)*127)
    uq=np.round(np.clip(U,0,1)*65535).astype('<u2')
    wq=np.round(W*255).astype('u1')
    off=len(blob)
    for a in (q,nq,uq,J,wq,I.astype('<u2')):
        blob+=pad4(a.tobytes())
    # recompute offsets
    o=off;secs={}
    for k,a in (('p',q),('n',nq),('u',uq),('j',J),('w',wq),('i',I.astype('<u2'))):
        secs[k]=o;o+=len(a.tobytes())+(-len(a.tobytes()))%4
    index.append(dict(id=int(cid),file=f,meshes=names,nv=int(len(P)),ni=int(len(I)),off=secs,ctr=[float(x) for x in ctr],half=[float(x) for x in half],par=par,trs=[[round(float(x),6) for x in t] for t in trs],ibm=[[round(float(x),6) for x in m] for m in ibm],bounds=[[float(x) for x in mn],[float(x) for x in mx]]))
    print(cid,f,len(P),len(I)//3,round(len(blob)/1e6,2),'MB')
open(os.path.join(out,'chars.bin'),'wb').write(blob)
json.dump(dict(joints=[j['nodes'][n]['name'] for n in jn],chars=index),open(os.path.join(out,'chars.json'),'w'),separators=(',',':'))
print('bin',len(blob),'json',os.path.getsize(os.path.join(out,'chars.json')),'atlas',os.path.getsize(os.path.join(out,'atlas.png')))
