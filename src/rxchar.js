/* ITHappy City Characters (assets/chars.bin, chars.json, atlas.png; packed by tools/packchars.py). RXC.load() fetches them once;
   RXC.person(seed, o, rnd) returns a Group whose userData.P has the same proxies the game animates (legs, arms, knees, eyes, skinM, shirtM),
   and a skinned mesh whose bones follow those proxies. Without the files (offline, file://) ready() stays false and the old bodies are used. */
const RXC = (function () {
  let DB = null, BIN = null, TEX = null, state = 0, byKind = null;
  const ATL = 'assets/';
  function load(cb) {
    if (state) return; state = 1;
    Promise.all([fetch(ATL + 'chars.json').then(r => r.json()), fetch(ATL + 'chars.bin').then(r => r.arrayBuffer()), new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = ATL + 'atlas.png'; })])
      .then(a => { DB = a[0]; BIN = a[1]; TEX = new THREE.Texture(a[2]); TEX.flipY = false; TEX.magFilter = THREE.NearestFilter; TEX.minFilter = THREE.NearestFilter; TEX.generateMipmaps = false; TEX.needsUpdate = true; index(); state = 2; if (cb) cb(); })
      .catch(() => { state = -1; });
  }
  function index() {
    byKind = {};
    DB.chars.forEach(c => {
      const m = c.meshes[0], k = /^(Adult|PlusSize|Pumped|Senior|Teen|Child)_(Male|Female)/.exec(m); if (!k) return;
      c.cat = k[1]; c.sex = k[2] === 'Male' ? 'm' : 'f'; (byKind[c.cat + c.sex] = byKind[c.cat + c.sex] || []).push(c);
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
    const nv = c.nv, o = c.off, g = new THREE.BufferGeometry();
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
    const body = o.body, sex = o.gender || (rnd(36) < 0.5 ? 'f' : 'm');
    const r = rnd(41);
    let cat = body === 'jacked' ? 'Pumped' : body === 'obese' ? 'PlusSize' : r < 0.12 ? 'Teen' : r < 0.2 ? 'Senior' : r < 0.33 ? 'PlusSize' : 'Adult';
    let list = byKind[cat + sex]; if (!list || !list.length) { cat = 'Adult'; list = byKind['Adult' + sex] || byKind.Adult + 'm'; }
    if (!list || !list.length) list = DB.chars;
    const hx = (Math.imul((seed | 0) ^ 0x9E3779B9, 2246822519) >>> 0) / 4294967296, c = list[Math.floor(hx * list.length) % list.length], R = rest(c);
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
    mesh.onBeforeRender = () => { set.forEach(s => { for (let i = 0; i < 2; i++) drive(idx[s[0][i]], s[1][i], s[2]); }); };
    drive(idx.RightArm, P.arms[0], true); drive(idx.LeftArm, P.arms[1], true);
    const gs = 0.92 + 0.16 * rnd(9); g.scale.set(gs, gs, gs);
    g.userData.P = P; g.rotation.order = 'YXZ'; return g;
  }
  return { load, ready, person, get db() { return DB; } };
})();
