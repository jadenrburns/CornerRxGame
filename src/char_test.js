/* dev: drop a rigged character pack (.glb) into the live pharmacy with walking/idle animation and screenshot it. THREE_JS=... node char_test.js <outdir> <glb> */
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const out=process.argv[2],glb=process.argv[3];const b=await chromium.launch({args:['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1100,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load/.test(m.text()))errs.push(m.text())});
await p.route('**/three.min.js',r=>r.fulfill({path:process.env.THREE_JS,contentType:'text/javascript'}));
await p.route('**/rxchar.glb',r=>r.fulfill({body:fs.readFileSync(glb),contentType:'model/gltf-binary',headers:{'access-control-allow-origin':'*'}}));
await p.addInitScript(()=>{localStorage.setItem('cornerRx.v1',JSON.stringify({me:{done:true,name:'T',look:{}},served:30,correct:25,tutDone:true,playSec:999,boardAsked:true,set:{topics:{}}}));localStorage.setItem('rxNet','{"off":1}')});
await p.goto('file://'+process.cwd()+'/corner-rx.html?dev=1&noconf=1');await p.waitForTimeout(9000);
await p.evaluate(()=>document.querySelectorAll('.tour,.unlock').forEach(e=>e.remove()));
await p.evaluate(()=>World.devCam(-0.3,1.0,3.6,0.35,1.25,8.5));await p.waitForTimeout(600);await p.screenshot({path:out+'/now.png',clip:{x:0,y:100,width:620,height:560}});
await p.addScriptTag({path:'glbskin.js'});
const info=await p.evaluate(async()=>{
 const L=await loadGLB('https://rx.local/rxchar.glb');window.__L=L;
 World.devHideCust(true);
 const look=[
  ['Body_010','Male_emotion_usual_001','Hairstyle_male_010','T_Shirt_009','Pants_010','Shoe_Sneakers_009'],
  ['Body_010','Male_emotion_happy_002','Hairstyle_male_012','Outerwear_029','Pants_014','Shoe_Sneakers_009','Glasses_004'],
  ['Body_010','Male_emotion_usual_001','Hat_010','Costume_6_001','Shoe_Slippers_002'],
  ['Body_010','Male_emotion_angry_003','Hairstyle_male_012','Outerwear_036','Shorts_003','Socks_008','Shoe_Slippers_005','Moustache_001'],
  ['Body_010','Male_emotion_happy_002','Costume_10_001','Hat_049','Glasses_006','Headphones_002'],
  ['Body_010','Male_emotion_usual_001','Hat_057','T_Shirt_009','Shorts_003','Shoe_Sneakers_009','Moustache_002']];
 const slots=[[-1.5,1.9,'Idle_Relaxed'],[0.1,2.6,'Idle_Breathing'],[-1.9,3.2,'Idle_Relaxed'],[1.5,3.3,'Idle_Look_Around'],[-0.3,6.2,'Walk_Forward'],[2.9,7.4,'Walk_Forward']];
 window.__mx=[];window.__walk=[];let h0=0;
 look.forEach((l,i)=>{const c=L.build();Object.keys(c.parts).forEach(k=>c.parts[k].forEach(m=>m.visible=l.indexOf(k)>=0));
  const bb=new THREE.Box3().setFromBufferAttribute(c.parts.Body_010[0].geometry.attributes.position);h0=bb.max.y-bb.min.y;
  const sc=2.15/h0;c.root.parent;const g=new THREE.Group();g.add(c.root.parent||c.root);
  g.scale.set(sc,sc,sc);g.position.set(slots[i][0],0,slots[i][1]);g.rotation.y=Math.PI;
  const mx=new THREE.AnimationMixer(c.root.parent||c.root);const clip=c.clips.find(a=>a.name===slots[i][2]);mx.clipAction(clip).play();mx.update(i*0.37);
  window.__mx.push(mx);if(slots[i][2]==='Walk_Forward')window.__walk.push({g,tz:i===4?3.9:4.6});
  World.devAdd(g);});
 let last=performance.now();(function tick(){const n=performance.now(),dt=(n-last)/1000;last=n;window.__mx.forEach(m=>m.update(dt));window.__walk.forEach(w=>{if(w.g.position.z>w.tz)w.g.position.z-=dt*1.1;});requestAnimationFrame(tick)})();
 return {h0,sc:2.15/h0};});
console.log(JSON.stringify(info));
await p.evaluate(()=>World.devCam(-0.3,1.0,3.6,0.35,1.25,8.5));
for(let i=0;i<4;i++){await p.waitForTimeout(i?900:700);await p.screenshot({path:out+'/pack_'+i+'.png',clip:{x:0,y:100,width:620,height:560}})}
console.log(JSON.stringify(await p.evaluate(()=>{const m=window.__mx[4],r=m.getRoot();const a=r.getObjectByName('LeftArm');const t=m._actions.length;return {actions:t,time:m._actions[0]&&m._actions[0].time,q:a.quaternion.toArray(),mw:a.matrixWorld.elements.slice(12,15),auto:a.matrixAutoUpdate,sceneAuto:r.parent?null:'noparent'}})));
console.log('errs',JSON.stringify(errs));await b.close()})();
