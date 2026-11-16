#!/usr/bin/env python3
"""Pack named top-level props of ITHappy Medical_Pack.glb into assets/med.bin + med.json (baked, pivot at the item's own origin).
usage: packmed.py <Medical_Pack.glb> <outdir> name [name ...]   (name = top-level scene node, or prefix ending in *)"""
import json,struct,sys,os
import numpy as np
CT={5126:'f4',5123:'u2',5121:'u1',5125:'u4',5120:'i1',5122:'i2'};NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
d=open(sys.argv[1],'rb').read();l=struct.unpack('<I',d[12:16])[0];j=json.loads(d[20:20+l]);bo=20+l;b=d[bo+8:bo+8+struct.unpack('<I',d[bo:bo+4])[0]]
def acc(i):
    a=j['accessors'][i];bv=j['bufferViews'][a['bufferView']];n=NC[a['type']];dt=np.dtype(CT[a['componentType']])
    o=bv.get('byteOffset',0)+a.get('byteOffset',0);st=bv.get('byteStride')
    if st and st!=n*dt.itemsize:
        raw=np.frombuffer(b,dtype='u1',count=st*a['count'],offset=o).reshape(a['count'],st)[:,:n*dt.itemsize];return np.ascontiguousarray(raw).view(dt).reshape(a['count'],n)
    return np.frombuffer(b,dtype=dt,count=a['count']*n,offset=o).reshape(a['count'],n)
def qm(q):
    x,y,z,w=q;return np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
def local(n):
    M=np.eye(4)
    if 'matrix' in n: return np.array(n['matrix']).reshape(4,4).T
    S=np.diag(list(n.get('scale',[1,1,1]))+[1]);R=np.eye(4);R[:3,:3]=qm(n.get('rotation',[0,0,0,1]));T=np.eye(4);T[:3,3]=n.get('translation',[0,0,0]);return T@R@S
MN=[m['name'] for m in j['materials']]
def collect(i,W,out):
    n=j['nodes'][i];M=W@local(n)
    if 'mesh' in n: out.append((M,n['mesh']))
    for c in n.get('children',[]): collect(c,M,out)
tops=j['scenes'][0]['nodes'];want=sys.argv[3:];sel=[]
for i in tops:
    nm=j['nodes'][i].get('name','')
    if any(nm==w or (w.endswith('*') and nm.startswith(w[:-1])) for w in want): sel.append(i)
blob=bytearray();items=[]
def pad(a):
    global blob;by=a.tobytes();o=len(blob);blob+=by+b'\0'*((-len(by))%4);return o
for i in sel:
    n=j['nodes'][i];T0=local(n);org=np.eye(4);org[:3,3]=T0[:3,3]  # item origin = its own translation
    lst=[];collect(i,np.linalg.inv(org),lst)
    # parent matrix for top node is org-inverse then node itself: handled since collect multiplies local(n) incl. translation -> subtract
    parts={}
    for M,mi in lst:
        for pr in j['meshes'][mi]['primitives']:
            at=pr['attributes'];p=acc(at['POSITION']).astype('f8');p=(M[:3,:3]@p.T).T+M[:3,3]
            nr=acc(at['NORMAL']).astype('f8');nr=(np.linalg.inv(M[:3,:3]).T@nr.T).T;nr/=np.maximum(np.linalg.norm(nr,axis=1,keepdims=True),1e-9)
            uv=acc(at['TEXCOORD_0']).astype('f4') if 'TEXCOORD_0' in at else np.zeros((len(p),2),'f4')
            ix=acc(pr['indices']).astype('u4').reshape(-1)
            if np.linalg.det(M[:3,:3])<0: ix=ix.reshape(-1,3)[:,::-1].reshape(-1)
            k=MN[pr['material']] if 'material' in pr else 'Color'
            P=parts.setdefault(k,[[],[],[],[],0]);P[0].append(p);P[1].append(nr);P[2].append(uv);P[3].append(ix+P[4]);P[4]+=len(p)
    ent=dict(name=n.get('name'),parts=[]);allp=np.concatenate([np.concatenate(v[0]) for v in parts.values()]);mn,mx=allp.min(0),allp.max(0);ent['bounds']=[[round(float(x),4) for x in mn],[round(float(x),4) for x in mx]]
    ctr=(mn+mx)/2;half=np.maximum((mx-mn)/2,1e-6);ent['ctr']=[float(x) for x in ctr];ent['half']=[float(x) for x in half]
    for k,v in parts.items():
        p=np.concatenate(v[0]);nr=np.concatenate(v[1]);uv=np.concatenate(v[2]);ix=np.concatenate(v[3])
        q=np.round((p-ctr)/half*32767).astype('<i2');nq=np.zeros((len(nr),4),'i1');nq[:,:3]=np.round(nr*127)
        uq=np.round(np.clip(uv,0,1)*65535).astype('<u2')
        ent['parts'].append(dict(mat=k,nv=len(p),ni=len(ix),p=pad(q),n=pad(nq),u=pad(uq),i=pad(ix.astype('<u2' if len(p)<65536 else '<u4')),i32=len(p)>=65536))
    items.append(ent)
os.makedirs(sys.argv[2],exist_ok=True)
open(os.path.join(sys.argv[2],'med.bin'),'wb').write(blob);json.dump(dict(items=items),open(os.path.join(sys.argv[2],'med.json'),'w'),separators=(',',':'))
print(len(items),'items',len(blob)/1e6,'MB');[print(e['name'],[round(x,2) for x in e['bounds'][1]]) for e in items[:80]]
