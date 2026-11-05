(function(){
  function mk(){ const f=function(){}; return new Proxy(f,{
    get(t,k){ if(k===Symbol.toPrimitive) return ()=>0.5; if(k===Symbol.iterator) return function*(){}; if(k==='then') return undefined; if(k==='length') return 0; if(k==='children') return [];
      if(k==='domElement') return t.__c||(t.__c=document.createElement('canvas')); if(k in t) return t[k];
      if(['x','y','z','r','g','b','opacity','intensity'].includes(k)) return 0.5; return mk(); },
    set(t,k,v){t[k]=v;return true;}, apply(){return mk();}, construct(){return mk();} }); }
  const wrap=o=>new Proxy(o,{get(t,k){ if(k in t||typeof k==='symbol') return t[k]; return mk(); }, set(t,k,v){t[k]=v;return true;}});
  class V3{ constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;return wrap(this);} set(x,y,z){this.x=x;this.y=y;this.z=z;return this;} copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;} clone(){return new V3(this.x,this.y,this.z);} project(){return this;}
    lerpVectors(a,b,k){this.x=a.x+(b.x-a.x)*k;this.y=a.y+(b.y-a.y)*k;this.z=a.z+(b.z-a.z)*k;return this;} addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;} }
  window.__objs=[];
  class O3{ constructor(){ this.position=new V3(); this.rotation={x:0,y:0,z:0,order:'XYZ'}; this.scale=new V3(1,1,1); this.children=[]; this.parent=null; this.userData={}; this.visible=true; window.__objs.push(this); return wrap(this);}
    add(...cs){ cs.forEach(c=>{ c.parent=this; this.children.push(c); }); return this; } remove(c){ const i=this.children.indexOf(c); if(i>=0){this.children.splice(i,1); c.parent=null;} return this; }
    traverse(f){ f(this); this.children.forEach(c=>c.traverse&&c.traverse(f)); } }
  const lib={ Vector3:V3, Group:O3, Mesh:O3, Object3D:O3, Raycaster:function(){ return {setFromCamera(){}, intersectObjects(){ return window.__hit?[{object:window.__hit}]:[]; }}; } };
  window.THREE=new Proxy({}, {get(_,k){ if(lib[k]) return lib[k]; return function(){ return mk(); }; }});
  window.__stub=true;
})();
