const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const p = await b.newPage({ viewport:{width:1200,height:900} });
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType:'application/javascript', body: fs.readFileSync('three-stub2.js','utf8') }));
  await p.addInitScript(()=>{ localStorage.setItem('cornerRx.v1', JSON.stringify({me:{done:true,body:"jacked",gender:"m",hair:0,hairColor:0,skin:1,scrub:0},cash:0,correct:30,served:2,karenCd:999,sweatyCd:999,up:{shelf:4,tech:6,counsel:3,library:5,robot:2}})); });
  await p.clock.install();
  await p.goto('file://'+process.cwd()+'/corner-rx.html'); await p.clock.runFor(500);
  const OB=[[-9.6,4.15,-1.0,1.05],[-7.8,-4.6,1.8,5.0],[-9.6,-8.4,-5.8,-2.2],[8.3,9.9,-5.8,-4.6],[5.5,8.1,-6.7,-4.1],[-6.2,6.2,-7.1,-6.0]];
  let inside=0, maxStill=0, samples=0, last=null, still=new Array(6).fill(0), worst=0;
  for(let i=0;i<240;i++){ await p.clock.runFor(500);
    const pos=await p.evaluate(()=>World._dbg().staff.map(s=>[s.g.position.x,s.g.position.z]));
    pos.forEach((q,k)=>{ samples++; OB.forEach(o=>{ if(q[0]>o[0]+0.15&&q[0]<o[1]-0.15&&q[1]>o[2]+0.15&&q[1]<o[3]-0.15) inside++; });
      if(last&&Math.hypot(q[0]-last[k][0],q[1]-last[k][1])<0.01) still[k]+=0.5; else still[k]=0; worst=Math.max(worst,still[k]); });
    last=pos; }
  console.log('staff',last.length,'samples',samples,'inside obstacles',inside,'longest idle s',worst);
  console.log(JSON.stringify(last.map(q=>q.map(v=>+v.toFixed(1)))));
  console.log('ERR',errs); await b.close();
})();
