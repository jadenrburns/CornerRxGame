/* ITHappy City Characters (assets/chars.bin, chars.json, atlas.png; packed by tools/packchars.py). RXC.load() fetches them once;
   RXC.person(seed, o, rnd) returns a Group whose userData.P has the same proxies the game animates (legs, arms, knees, eyes, skinM, shirtM),
   and a skinned mesh whose bones follow those proxies. Without the files (offline, file://) ready() stays false and the old bodies are used. */
const RXC = (function () {
  let DB = null, BINS = null, TEX = null, state = 0, byKind = null, byId = {};
  const ATL = 'assets/';
  function load(cb) {
    if (state) return; state = 1;
    Promise.all([Promise.all([fetch(ATL + 'chars.json').then(r => r.json()), fetch(ATL + 'outfits.json').then(r => r.json())]).then(a => { a[0].chars.forEach(c => { c.b = 0; }); a[1].chars.forEach(c => { c.b = 1; }); a[0].chars = a[0].chars.concat(a[1].chars); return a[0]; }), Promise.all([fetch(ATL + 'chars.bin').then(r => r.arrayBuffer()), fetch(ATL + 'outfits.bin').then(r => r.arrayBuffer())]), new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = ATL + 'atlas.png'; })])
      .then(a => { DB = a[0]; BINS = a[1]; TEX = new THREE.Texture(a[2]); TEX.flipY = false; TEX.magFilter = THREE.NearestFilter; TEX.minFilter = THREE.NearestFilter; TEX.generateMipmaps = false; TEX.needsUpdate = true; index(); state = 2; if (cb) cb(); })
      .catch(() => { state = -1; });
  }
  function index() {
    byKind = {};
    DB.chars.forEach(c => {
      byId[c.id] = c; const m = c.meshes[0], k = /^(Adult|PlusSize|Pumped|Senior|Teen|Child)_(Male|Female)/.exec(m); if (!k) return;
      c.cat = k[1]; c.sex = k[2] === 'Male' ? 'm' : 'f'; if (c.pro) return; (byKind[c.cat + c.sex] = byKind[c.cat + c.sex] || []).push(c);
    });
  }
  const ready = () => state === 2;
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  /* rest data per character: world rotation of every joint and the direction of the arm chain, cached */
  function rest(c) {
    if (c._rest) return c._rest;
    const n = c.par.length, q = c.trs.map(t => new THREE.Quaternion(t[3], t[4], t[5], t[6])), W = [], pos = [];
    for (let i = 0; i < n; i++) { W[i] = c.par[i] < 0 ? q[i].clone() : W[c.par[i]].clone().multiply(q[i]); const m = new THREE.Matrix4().fromArray(c.ibm[i]).invert(); pos[i] = new THREE.Vector3().setFromMatrixPosition(m); }
    return (c._rest = { q, W, pos });
  }
  function geo(c) {
    if (c._geo) return c._geo;
    const nv = c.nv, o = c.off, g = new THREE.BufferGeometry(), BIN = BINS[c.b || 0];
    const p16 = new Int16Array(BIN, o.p, nv * 3), pos = new Float32Array(nv * 3);
    for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) pos[i * 3 + k] = c.ctr[k] + p16[i * 3 + k] / 32767 * c.half[k];
    const n8 = new Int8Array(BIN, o.n, nv * 4), nor = new Float32Array(nv * 3); for (let i = 0; i < nv; i++) { nor[i * 3] = n8[i * 4] / 127; nor[i * 3 + 1] = n8[i * 4 + 1] / 127; nor[i * 3 + 2] = n8[i * 4 + 2] / 127; }
    const u16 = new Uint16Array(BIN, o.u, nv * 2), uv = new Float32Array(nv * 2); for (let i = 0; i < nv * 2; i++) uv[i] = u16[i] / 65535;
    const w8 = new Uint8Array(BIN, o.w, nv * 4), wt = new Float32Array(nv * 4); for (let i = 0; i < nv * 4; i++) wt[i] = w8[i] / 255;
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setAttribute('skinIndex', new THREE.BufferAttribute(new Uint16Array(new Uint8Array(BIN, o.j, nv * 4)), 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(wt, 4));
    g.setIndex(new THREE.BufferAttribute(new Uint16Array(BIN, o.i, c.ni), 1)); g.computeBoundingSphere(); g.boundingSphere.radius *= 1.6;
    return (c._geo = g);
  }
  const Sx = 1.12;
  const JN = () => DB.joints;
  function person(seed, o, rnd) {
    const J = JN(), idx = {}; J.forEach((n, i) => { idx[n] = i; });
    const body = o.body, sex = (o.gender === 'm' || o.gender === 'f') ? o.gender : (rnd(36) < 0.5 ? 'f' : 'm');
    const r = rnd(41);
    let cat = body === 'jacked' ? 'Pumped' : body === 'obese' ? 'PlusSize' : r < 0.12 ? 'Teen' : r < 0.2 ? 'Senior' : r < 0.33 ? 'PlusSize' : 'Adult';
    if (o.cat) cat = o.cat;
    let list = byKind[cat + sex]; if (!list || !list.length) { cat = 'Adult'; list = byKind['Adult' + sex] || byKind.Adultm; }
    if (!list || !list.length) list = DB.chars;
    const hx = (Math.imul((seed | 0) ^ 0x9E3779B9, 2246822519) >>> 0) / 4294967296, c = (o.id && byId[o.id]) || list[Math.floor(hx * list.length) % list.length], R = rest(c);
    const g = new THREE.Group(), root = new THREE.Group(); g.add(root); root.scale.setScalar(Sx);
    const bones = c.par.map((p, i) => { const b = new THREE.Bone(); b.name = J[i]; b.position.set(c.trs[i][0], c.trs[i][1], c.trs[i][2]); b.quaternion.copy(R.q[i]); b.scale.set(c.trs[i][7], c.trs[i][8], c.trs[i][9]); return b; });
    bones.forEach((b, i) => { if (c.par[i] >= 0) bones[c.par[i]].add(b); }); root.add(bones[0]);
    const inv = c.ibm.map(m => new THREE.Matrix4().fromArray(m));
    const mat = new THREE.MeshLambertMaterial({ map: TEX, skinning: true, emissive: new THREE.Color(0x000000), side: THREE.DoubleSide });
    const mesh = new THREE.SkinnedMesh(geo(c), mat); mesh.frustumCulled = false; mesh.castShadow = true; root.add(mesh);
    const skel = new THREE.Skeleton(bones, inv); mesh.bind(skel, new THREE.Matrix4());
    /* proxies the game animates: rotation.x (and y, z) on each limb is a rotation of that limb about its own joint, in character space */
    const px = () => ({ rotation: new THREE.Euler(0, 0, 0, 'XYZ') });
    const P = { legs: [px(), px()], arms: [px(), px()], knees: [px(), px()], shirtM: mat, skinM: mat, eyes: [{ scale: new THREE.Vector3(1, 1, 1), visible: true }, { scale: new THREE.Vector3(1, 1, 1), visible: true }], kneeFollow: true, rx: c.id };
    P.up = px(); P.head = { rotation: new THREE.Euler(0, 0, 0, 'XYZ'), position: new THREE.Vector3() };
    const L = { leg: ['RightUpLeg', 'LeftUpLeg'], knee: ['RightLeg', 'LeftLeg'], arm: ['RightArm', 'LeftArm'] };
    /* hanging arms: swing each arm chain from the rest (T) direction down along -y, tilted a little outward */
    const down = (bi, ci, side) => { const d = R.pos[ci].clone().sub(R.pos[bi]).normalize(), to = new THREE.Vector3(side * 0.1, -1, 0).normalize(); return new THREE.Quaternion().setFromUnitVectors(d, to); };
    const base = {}; ['RightArm', 'LeftArm'].forEach((n, k) => { base[idx[n]] = down(idx[n], idx[n.replace('Arm', 'ForeArm')], k ? 1 : -1); });
    const E = new THREE.Quaternion(), D = new THREE.Quaternion(), Wp = new THREE.Quaternion();
    const drive = (bi, pr, withBase) => {
      const e = pr.rotation; D.setFromEuler(e); if (withBase && base[bi]) D.multiply(base[bi]);
      const pi = c.par[bi]; Wp.copy(R.W[pi]); E.copy(Wp).invert().multiply(D).multiply(Wp).multiply(R.q[bi]); bones[bi].quaternion.copy(E);
    };
    const set = [[L.leg, P.legs, false], [L.knee, P.knees, false], [L.arm, P.arms, true]];
    mesh.onBeforeRender = () => { set.forEach(s => { for (let i = 0; i < 2; i++) drive(idx[s[0][i]], s[1][i], s[2]); }); drive(idx.Spine, P.up, false); drive(idx.Head, P.head, false); };
    drive(idx.RightArm, P.arms[0], true); drive(idx.LeftArm, P.arms[1], true);
    const gs = o.fixed ? 1 : 0.92 + 0.16 * rnd(9); g.scale.set(gs, gs, gs);
    g.userData.P = P; g.rotation.order = 'YXZ'; return g;
  }
  return { load, ready, person, get db() { return DB; }, outfits: () => DB ? DB.chars.filter(c => c.pro) : [], byId: (id) => byId[id] };
})();
/* Medical Pack props (assets/med.bin, med.json; tools/packmed.py): RXM.make(name, scale) -> Group (pivot at the item's own origin, +y up, metres) */
const RXM = (function () {
  let DB = null, BINS = null, TEX = null, st = 0; const M = {}, cache = {};
  function load(cb) {
    if (st) return; st = 1;
    const base = ['med', 'furn'];
    Promise.all([Promise.all(base.map(n => fetch('assets/' + n + '.json').then(r => r.json()))).then(a => { a.forEach((d, i) => d.items.forEach(e => { e.b = i; })); return { items: a[0].items.concat(a[1].items) }; }), Promise.all(base.map(n => fetch('assets/' + n + '.bin').then(r => r.arrayBuffer()))), new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = 'assets/atlas.png'; })])
      .then(a => { DB = a[0]; BINS = a[1]; TEX = new THREE.Texture(a[2]); TEX.flipY = false; TEX.magFilter = THREE.NearestFilter; TEX.minFilter = THREE.NearestFilter; TEX.generateMipmaps = false; TEX.needsUpdate = true; DB.items.forEach(e => { M[e.name] = e; }); st = 2; if (cb) cb(); try { if (typeof World !== 'undefined' && World.packDecor) World.packDecor(); } catch (e) { /* decor */ } }).catch(() => { st = -1; });
  }
  const mat = (k) => {
    if (cache[k]) return cache[k];
    const o = { map: TEX }; if (k === 'Glass' || k === 'Glass_CAR') { o.transparent = true; o.opacity = 0.35; o.depthWrite = false; }
    const m = k === 'Metal' ? new THREE.MeshStandardMaterial(Object.assign(o, { metalness: 0.3, roughness: 0.45 })) : new THREE.MeshLambertMaterial(o); m.side = THREE.DoubleSide;
    if (k === 'Emission') { m.emissive = new THREE.Color(0xFF9500); m.emissiveMap = TEX; m.emissiveIntensity = 0.9; } return (cache[k] = m);
  };
  function make(name, scale) {
    const e = M[name]; if (!e) return null; const g = new THREE.Group(), BIN = BINS[e.b || 0]; g.name = name;
    e.parts.forEach(p => {
      const nv = p.nv, q = new Int16Array(BIN, p.p, nv * 3), pos = new Float32Array(nv * 3); for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) pos[i * 3 + k] = e.ctr[k] + q[i * 3 + k] / 32767 * e.half[k];
      const n8 = new Int8Array(BIN, p.n, nv * 4), nor = new Float32Array(nv * 3); for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) nor[i * 3 + k] = n8[i * 4 + k] / 127;
      const u16 = new Uint16Array(BIN, p.u, nv * 2), uv = new Float32Array(nv * 2); for (let i = 0; i < nv * 2; i++) uv[i] = u16[i] / 65535;
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      geo.setIndex(new THREE.BufferAttribute(p.i32 ? new Uint32Array(BIN, p.i, p.ni) : new Uint16Array(BIN, p.i, p.ni), 1));
      const m = new THREE.Mesh(geo, mat(p.mat)); m.castShadow = true; g.add(m);
    });
    if (scale) g.scale.setScalar(scale); return g;
  }
  return { load, make, ready: () => st === 2, names: () => Object.keys(M) };
})();
/* Animals (assets/animals.*; tools/packanimals.py): skinned dog and kitty with idle, walk and run clips. RXA.make('dog'|'cat', orange) -> Group that plays walk while it moves and idle when it stands */
const RXA = (function () {
  let DB = null, BIN = null, TEX = null, st = 0; const by = {};
  function load() {
    if (st) return; st = 1;
    Promise.all([fetch('assets/animals.json').then(r => r.json()), fetch('assets/animals.bin').then(r => r.arrayBuffer()), new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = 'assets/animals.png'; })])
      .then(a => { DB = a[0]; BIN = a[1]; TEX = new THREE.Texture(a[2]); TEX.flipY = false; TEX.magFilter = THREE.NearestFilter; TEX.minFilter = THREE.NearestFilter; TEX.generateMipmaps = false; TEX.needsUpdate = true; DB.animals.forEach(e => { by[e.name] = e; }); st = 2; try { if (typeof World !== 'undefined' && World.refreshPets) World.refreshPets(); } catch (e) { /* pets */ } }).catch(() => { st = -1; });
  }
  function geo(c) {
    if (c._geo) return c._geo; const nv = c.nv, o = c.off, g = new THREE.BufferGeometry();
    const p = new Int16Array(BIN, o.p, nv * 3), pos = new Float32Array(nv * 3); for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) pos[i * 3 + k] = c.ctr[k] + p[i * 3 + k] / 32767 * c.half[k];
    const n8 = new Int8Array(BIN, o.n, nv * 4), nor = new Float32Array(nv * 3); for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) nor[i * 3 + k] = n8[i * 4 + k] / 127;
    const u = new Uint16Array(BIN, o.u, nv * 2), uv = new Float32Array(nv * 2); for (let i = 0; i < nv * 2; i++) uv[i] = u[i] / 65535;
    const w8 = new Uint8Array(BIN, o.w, nv * 4), wt = new Float32Array(nv * 4); for (let i = 0; i < nv * 4; i++) wt[i] = w8[i] / 255;
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setAttribute('skinIndex', new THREE.BufferAttribute(new Uint16Array(new Uint8Array(BIN, o.j, nv * 4)), 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(wt, 4)); g.setIndex(new THREE.BufferAttribute(new Uint16Array(BIN, o.i, c.ni), 1));
    g.computeBoundingSphere(); g.boundingSphere.radius *= 2; return (c._geo = g);
  }
  const ready = () => st === 2;
  /* orange cat: a copy of the animal palette with the kitty's grey and black body colors repainted orange (eyes, nose and white paws stay) */
  let ORT = null;
  function orangeTex() {
    if (ORT) return ORT;
    try {
      const im = TEX.image, cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0); const id = cx.getImageData(0, 0, cv.width, cv.height), d = id.data;
      for (let i = 0; i < d.length; i += 4) { const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]); if (mx - mn < 40 && mx < 215) { const k = mx / 215; d[i] = 190 + 50 * k; d[i + 1] = 95 + 55 * k; d[i + 2] = 25 + 30 * k; } }
      cx.putImageData(id, 0, 0); ORT = new THREE.CanvasTexture(cv); ORT.flipY = false; ORT.magFilter = THREE.NearestFilter; ORT.minFilter = THREE.NearestFilter; ORT.generateMipmaps = false;
    } catch (e) { ORT = TEX; }
    return ORT;
  }
  function make(kind, orange) {
    const c = by[kind === 'dog' ? 'Dog_001' : 'Kitty_001']; if (!c) return null;
    const g = new THREE.Group(), root = new THREE.Group(); g.add(root);
    const bones = c.par.map((p, i) => { const b = new THREE.Bone(); b.name = c.joints[i]; b.position.set(c.trs[i][0], c.trs[i][1], c.trs[i][2]); b.quaternion.set(c.trs[i][3], c.trs[i][4], c.trs[i][5], c.trs[i][6]); b.scale.set(c.trs[i][7], c.trs[i][8], c.trs[i][9]); return b; });
    bones.forEach((b, i) => { if (c.par[i] >= 0) bones[c.par[i]].add(b); }); root.add(bones[0]);
    const mat = new THREE.MeshLambertMaterial({ map: orange ? orangeTex() : TEX, skinning: true, side: THREE.DoubleSide }); 
    const mesh = new THREE.SkinnedMesh(geo(c), mat); mesh.frustumCulled = false; mesh.castShadow = true; root.add(mesh);
    mesh.bind(new THREE.Skeleton(bones, c.ibm.map(m => new THREE.Matrix4().fromArray(m))), new THREE.Matrix4());
    const mx = new THREE.AnimationMixer(root), act = {};
    Object.keys(c.clips).forEach(k => { const tr = c.clips[k].map(t => { const nm = c.joints[t.j] + '.' + (t.path === 'rotation' ? 'quaternion' : t.path), C = t.path === 'rotation' ? THREE.QuaternionKeyframeTrack : THREE.VectorKeyframeTrack; return new C(nm, t.t, t.v); }); act[k] = mx.clipAction(new THREE.AnimationClip(k, -1, tr)); });
    let cur = 'idle'; act.idle.play(); const last = new THREE.Vector3(), now = new THREE.Vector3(); let t0 = 0, init = false, still = 0;
    mesh.onBeforeRender = () => {
      const t = performance.now() / 1000, dt = t0 ? Math.min(0.1, t - t0) : 0; t0 = t; g.getWorldPosition(now); const mv = init ? Math.hypot(now.x - last.x, now.z - last.z) / Math.max(dt, 1e-3) : 0; init = true; last.copy(now);
      still = mv > 0.25 ? 0 : still + dt; const want = mv > 0.25 ? 'walk' : still > 0.2 ? 'idle' : cur;
      if (want !== cur && act[want]) { act[want].reset().play(); act[cur].crossFadeTo(act[want], 0.25, false); cur = want; }
      mx.update(dt);
    };
    const bb = new THREE.Box3(new THREE.Vector3().fromArray(c.bounds[0]), new THREE.Vector3().fromArray(c.bounds[1])), len = Math.max(bb.max.z - bb.min.z, bb.max.x - bb.min.x);
    root.scale.setScalar((kind === 'dog' ? 1.0 : 0.8) / len); g.userData.rxa = true; return g;
  }
  return { load, ready, make };
})();
