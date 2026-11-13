/* ---------------- Low-poly 3D pharmacy (three.js r128) ---------------- */
const World = (function () {
  'use strict';
  const api = { ok: false };
  let T, renderer, scene, camera, host, canvas, tagsEl, bubEl, lineEl, lineN = -1, B;
  let hemi, sun, clock, raycaster, running = false, last = 0, time = 0;
  const PI = Math.PI;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const UPIDS = ['shelf', 'tech', 'counsel', 'robot'];
  const CLICK = UPIDS;
  const BASE = { shelf: [-1.5, 0, -6.5], tech: [-6.9, 0, 0], counsel: [-11.55, 0, 3.85], mast: [-9.0, 0, -4.0], robot: [8.7, 0, -5.4] };
  const TAGY = { notes: 2.5, shelf: 4.7, tech: 2.7, counsel: 3.3, robot: 3.6 };
  const SKIN = ['#F2C9A5', '#E0A97E', '#C48A5E', '#8D5A3B', '#F6D7BD', '#6F4429'];
  const HAIR = ['#2B1B12', '#6B3A1E', '#B5651D', '#D9B25A', '#A8A8A8', '#1E1E2E'];
  const SHIRT = ['#0E9A8E', '#F1A20E', '#E04F3A', '#5B7FD1', '#8A63C9', '#3E8E41'];
  const BOT = ['#0E9A8E', '#F2A516', '#E04F3A', '#4C7BD9', '#8A63C9', '#F4F7F7'];
  // Loose waiting crowd, front of the line first. Up to MAXQ people.
  const SLOTS = [[-1.5, 1.9], [0.1, 2.6], [-1.9, 3.2], [1.5, 3.3], [-0.3, 4.0], [2.9, 2.6], [3.0, 4.2], [1.2, 5.0], [-1.4, 5.0], [4.4, 5.0]];
  const maxq = () => (rushOn ? 8 : 5);
  const OBST = [
    { x0: -9.6, x1: 4.15, z0: -1.0, z1: 1.05 },    // counter, wall to wall, with the computer stations
    { x0: -13.3, x1: -10.0, z0: 2.2, z1: 5.5 },    // counseling room (outside the left wall)
    { x0: -9.6, x1: -8.4, z0: -5.8, z1: -2.2 },    // mastery shelf (left wall)
    { x0: 7.4, x1: 10.0, z0: -6.7, z1: -4.1 },     // robot (back-right corner)
    { x0: -6.2, x1: 6.2, z0: -7.1, z1: -6.0 },     // shelves
    { x0: 3.3, x1: 7.3, z0: -5.7, z1: -4.1 }       // event table
  ];
  const EXIT = [[-3.4, 2.8], [-3.4, 6.3], [4.4, 6.4], [5, 7.2], [5, 10.8]];

  const mats = {}, hl = {}, built = {}, ug = {}, tags = {}, ghosts = [], tweens = [], coins = [];
  const shopSurf = { back: [], side: [], fa: [], fb: [] };
  let pharmG = null, awardsG = null, petG = null, pharm = null, awardState = { frames: [], pets: [] }, frameGroups = [], notesStar = null, phoneG = null, phoneHS = null, phoneLamp = null, phoneRinging = false, phoneObj = null, ringSayT = 0, staffGroup, custGroup, shelfBottles = [], robotRef = null, clouds = [], sign = null, signKey = '', cur = null;
  const queue = [], leaving = [], staff = [];
  let hovered = null, hintGone = false;
  const keysDown = { l: false, r: false, u: false, d: false };
  let th = 0.55, ph = 1.05, rad = 19, gth = 0.55, gph = 1.05, grad = 19, baseRad = 19, shake = 0;
  let TX = 0.5, TY = 1.8, TZ = -0.2;

  /* ---- builders ---- */
  function mat(color, up, extra) {
    const key = (up || '') + '|' + color + (extra ? JSON.stringify(extra) : '');
    if (mats[key]) return mats[key];
    const m = new T.MeshStandardMaterial(Object.assign({ color: color, flatShading: true, roughness: 0.85, metalness: 0.05 }, extra || {}));
    m.userData.base = extra && extra.emissive ? extra.emissive.getHex() : 0;
    mats[key] = m; if (up) (hl[up] = hl[up] || []).push(m);
    return m;
  }
  function add(parent, geo, color, x, y, z, up, extra) {
    const m = new T.Mesh(geo, mat(color, up, extra));
    m.position.set(x, y, z); m.castShadow = !(extra && extra.transparent); m.receiveShadow = true;
    if (up) m.userData.up = up;
    parent.add(m); return m;
  }
  const bx = (p, w, h, d, c, x, y, z, up, ex) => add(p, new T.BoxGeometry(w, h, d), c, x, y, z, up, ex);
  const cy = (p, rt, rb, h, seg, c, x, y, z, up, ex) => add(p, new T.CylinderGeometry(rt, rb, h, seg), c, x, y, z, up, ex);
  const ico = (p, r, c, x, y, z, up) => add(p, new T.IcosahedronGeometry(r, 0), c, x, y, z, up);
  function clear(g) {
    while (g.children.length) {
      const o = g.children[0]; g.remove(o);
      o.traverse(n => { if (n.geometry) n.geometry.dispose(); const i = ghosts.indexOf(n); if (i >= 0) ghosts.splice(i, 1); });
    }
  }
  function ghostBox(parent, w, h, d, up) {
    const g = new T.Group(); g.userData.up = up;
    const fill = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshBasicMaterial({ color: 0x2CCDBB, transparent: true, opacity: 0.16, depthWrite: false }));
    fill.userData.up = up; fill.position.y = h / 2;
    const ed = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(w, h, d)), new T.LineBasicMaterial({ color: 0x0E9A8E }));
    ed.position.y = h / 2;
    g.add(fill); g.add(ed); parent.add(g); ghosts.push(fill);
    return g;
  }

  /* cosmetic items for the pharmacist: facial hair, hats, glasses and extras. put(geom, mat, x, y, z, onTorso) places a piece. */
  function buildCosm(C, put, own, hairM, P, bz) {
    const G = (a, b, c) => new T.BoxGeometry(a, b, c), mk = (col) => own(col), tw = (...a) => new T.TorusGeometry(...a), glass = (m) => { m.material.transparent = true; m.material.opacity = 0.4; return m; };
    // facial hair (uses the hair colour)
    if (C.face) {
      const f = C.face, must = () => put(G(0.2, 0.05, 0.05), hairM, 0, 1.775, 0.318);
      if (f === 'mustache') must();
      else if (f === 'handlebar') { must(); [-1, 1].forEach(s => { const c = put(G(0.08, 0.04, 0.05), hairM, s * 0.135, 1.805, 0.318); c.rotation.z = s * 0.7; }); }
      else if (f === 'goatee') put(G(0.1, 0.13, 0.05), hairM, 0, 1.655, 0.3);
      else if (f === 'beard') { put(G(0.36, 0.2, 0.12), hairM, 0, 1.675, 0.27); [-1, 1].forEach(s => put(G(0.05, 0.3, 0.14), hairM, s * 0.29, 1.77, 0.2)); must(); }
      else if (f === 'soulpatch') put(G(0.05, 0.06, 0.04), hairM, 0, 1.695, 0.318);
      else if (f === 'chops') { [-1, 1].forEach(s => put(G(0.08, 0.3, 0.15), hairM, s * 0.29, 1.77, 0.2)); must(); }
    }
    // hats
    if (C.hat) {
      const h = C.hat;
      if (h === 'beanie') { put(new T.CylinderGeometry(0.33, 0.34, 0.2, 8), mk('#D9467A'), 0, 2.12, 0); put(new T.CylinderGeometry(0.35, 0.35, 0.07, 8), mk('#8E2A52'), 0, 2.03, 0); put(new T.IcosahedronGeometry(0.07, 0), mk('#F4F4F0'), 0, 2.27, 0); }
      else if (h === 'tophat') { put(new T.CylinderGeometry(0.44, 0.44, 0.03, 10), mk('#15151C'), 0, 2.06, 0); put(new T.CylinderGeometry(0.27, 0.28, 0.4, 10), mk('#15151C'), 0, 2.27, 0); put(new T.CylinderGeometry(0.285, 0.285, 0.07, 10), mk('#B32635'), 0, 2.13, 0); }
      else if (h === 'cowboy') { const br = put(new T.CylinderGeometry(0.5, 0.5, 0.03, 10), mk('#A8743C'), 0, 2.07, 0); br.scale.set(1, 1, 0.9); put(new T.CylinderGeometry(0.22, 0.31, 0.2, 8), mk('#A8743C'), 0, 2.18, 0); put(new T.CylinderGeometry(0.315, 0.315, 0.05, 8), mk('#5B3A21'), 0, 2.1, 0); }
      else if (h === 'party') { put(new T.ConeGeometry(0.2, 0.5, 7), mk('#7C4DDB'), 0, 2.33, 0); put(new T.IcosahedronGeometry(0.06, 0), mk('#F2C94C'), 0, 2.6, 0); [0.0, 0.14, -0.14].forEach((x, i) => put(new T.IcosahedronGeometry(0.03, 0), mk(['#F2C94C', '#3FD07F', '#E04F3A'][i]), x, 2.2 + i * 0.05, 0.14)); }
      else if (h === 'crown') { put(new T.CylinderGeometry(0.3, 0.3, 0.12, 8), mk('#F2C94C'), 0, 2.12, 0); for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; put(new T.ConeGeometry(0.06, 0.16, 4), mk('#F2C94C'), Math.cos(a) * 0.26, 2.26, Math.sin(a) * 0.26); put(new T.IcosahedronGeometry(0.03, 0), mk(['#E04F3A', '#3E72D9', '#2FAE66', '#8A63C9', '#E04F3A'][i]), Math.cos(a) * 0.26, 2.36, Math.sin(a) * 0.26); } }
      else if (h === 'chef') { put(new T.CylinderGeometry(0.3, 0.32, 0.18, 8), mk('#FFFFFF'), 0, 2.1, 0); const pf = put(new T.IcosahedronGeometry(0.3, 0), mk('#FFFFFF'), 0, 2.32, 0); pf.scale.set(1.05, 0.85, 1.05); }
      else if (h === 'propeller') { put(new T.CylinderGeometry(0.3, 0.33, 0.12, 8), mk('#3E72D9'), 0, 2.11, 0); put(new T.CylinderGeometry(0.02, 0.02, 0.14, 5), mk('#F4F4F0'), 0, 2.24, 0); const rot = put(G(0.5, 0.025, 0.08), mk('#E04F3A'), 0, 2.32, 0); const r2 = put(G(0.08, 0.025, 0.5), mk('#F2C94C'), 0, 2.32, 0); P.spin = [rot, r2]; }
      else if (h === 'wizard') { put(new T.CylinderGeometry(0.46, 0.46, 0.03, 10), mk('#4A2E86'), 0, 2.07, 0); const cn = put(new T.ConeGeometry(0.3, 0.7, 8), mk('#4A2E86'), 0, 2.42, 0); cn.rotation.z = -0.12; put(new T.IcosahedronGeometry(0.045, 0), mk('#F2C94C'), 0.08, 2.5, 0.28); put(new T.IcosahedronGeometry(0.035, 0), mk('#F2C94C'), -0.1, 2.3, 0.26); }
    }
    if (C.eyes) {
      const x = C.eyes, fr = mk('#2B2B33');
      if (x === 'round') { [-1, 1].forEach(s => { put(tw(0.085, 0.014, 4, 12), fr, s * 0.11, 1.88, 0.318); const gl = put(new T.CylinderGeometry(0.078, 0.078, 0.01, 10), mk('#BFE3F0'), s * 0.11, 1.88, 0.318); gl.rotation.x = PI / 2; glass(gl); }); put(G(0.07, 0.014, 0.014), fr, 0, 1.9, 0.318); }
      else if (x === 'square') { [-1, 1].forEach(s => { const cx = s * 0.11; put(G(0.17, 0.014, 0.016), fr, cx, 1.96, 0.318); put(G(0.17, 0.014, 0.016), fr, cx, 1.8, 0.318); put(G(0.014, 0.16, 0.016), fr, cx - 0.085, 1.88, 0.318); put(G(0.014, 0.16, 0.016), fr, cx + 0.085, 1.88, 0.318); glass(put(G(0.16, 0.15, 0.008), mk('#BFE3F0'), cx, 1.88, 0.318)); }); put(G(0.07, 0.014, 0.014), fr, 0, 1.91, 0.318); }
      else if (x === 'monocle') { put(tw(0.08, 0.013, 4, 12), mk('#F2C94C'), 0.11, 1.88, 0.325); put(G(0.012, 0.22, 0.012), mk('#F2C94C'), 0.2, 1.74, 0.322); }
      else if (x === 'eyepatch') { put(G(0.16, 0.14, 0.03), mk('#101018'), -0.11, 1.88, 0.318); const sd = put(G(0.025, 0.34, 0.02), mk('#101018'), -0.04, 1.97, 0.3); sd.rotation.z = -0.95; }
      else if (x === 'goggles') { [-1, 1].forEach(s => { put(tw(0.085, 0.022, 5, 10), fr, s * 0.115, 2.0, 0.31); const gl = put(new T.CylinderGeometry(0.075, 0.075, 0.02, 8), mk('#7FD6E8'), s * 0.115, 2.0, 0.315); gl.rotation.x = PI / 2; }); const bd = put(tw(0.31, 0.022, 5, 12), fr, 0, 2.0, 0); bd.rotation.x = PI / 2; }
    }
    if (C.cyber) {
      const y = C.cyber, kit = y === 'cykit', metal = mk('#9AA7B5'), dk = mk('#2B3340'), red = mk('#FF4A4A'), teal = mk('#2CCDBB'), org = mk('#FF9A2E');
      [red, teal, org].forEach(m => { if (m.emissive && m.emissive.setHex) { m.emissive.setHex(m === red ? 0xFF2A2A : m === teal ? 0x1FB5A5 : 0xFF7A00); m.emissiveIntensity = 0.9; } });
      if (y === 'cyeye' || kit) { put(G(0.2, 0.15, 0.03), dk, -0.11, 1.88, 0.31); const ln = put(new T.CylinderGeometry(0.052, 0.052, 0.04, 8), red, -0.11, 1.88, 0.328); ln.rotation.x = PI / 2; put(G(0.025, 0.2, 0.03), metal, -0.235, 1.86, 0.2).rotation.y = 0.5; }
      if (y === 'cyant' || kit) { [[0.13, 0.4, -0.25], [-0.1, 0.32, 0.18]].forEach(a => { put(new T.CylinderGeometry(0.014, 0.014, a[1], 5), metal, a[0], 2.12 + a[1] / 2, -0.04).rotation.z = a[2]; put(new T.IcosahedronGeometry(0.045, 0), red, a[0] + Math.sin(-a[2]) * a[1] * 0.5, 2.12 + a[1] * 0.95, -0.04); }); put(new T.CylinderGeometry(0.06, 0.07, 0.05, 6), dk, 0, 2.1, -0.04); }
      if (y === 'cyjet' || kit) { [-1, 1].forEach(sd => { put(new T.CylinderGeometry(0.09, 0.09, 0.5, 7), metal, sd * 0.11, 1.18, -(bz + 0.09), true); put(new T.ConeGeometry(0.075, 0.14, 7), org, sd * 0.11, 0.86, -(bz + 0.09), true).rotation.x = PI; }); put(G(0.34, 0.12, 0.1), dk, 0, 1.38, -(bz + 0.06), true); }
    }
    if (C.extra) {
      const x = C.extra;
      if (x === 'clownnose') put(new T.IcosahedronGeometry(0.065, 0), mk('#E0262F'), 0, 1.8, 0.345);
      else if (x === 'headphones') { const bd = put(tw(0.33, 0.03, 5, 14, PI), mk('#2B2B33'), 0, 1.87, 0); bd.scale.set(1, 0.72, 1); [-1, 1].forEach(s => { const cup = put(new T.CylinderGeometry(0.11, 0.11, 0.09, 8), mk('#E04F3A'), s * 0.335, 1.87, 0); cup.rotation.z = PI / 2; }); }
      else if (x === 'earring') { [-1, 1].forEach(s => put(new T.IcosahedronGeometry(0.035, 0), mk('#F2C94C'), s * 0.31, 1.73, 0.04)); }
      else if (x === 'bowtie') { put(G(0.06, 0.07, 0.04), mk('#B32635'), 0, 1.55, bz, true); [-1, 1].forEach(s => { const fl = put(G(0.13, 0.09, 0.03), mk('#D9374A'), s * 0.095, 1.55, bz, true); fl.rotation.z = s * 0.28; }); }
    }
  }
  function person(seed, isStaff, karen, sweaty, body, o) {
    o = o || {};
    const g = new T.Group();
    let skin = karen ? '#E8745F' : sweaty ? '#D4DAAE' : SKIN[seed % 6], hair = karen ? '#E8C766' : sweaty ? '#2E2420' : HAIR[(seed >> 3) % 6], shirt = karen ? '#D9467A' : sweaty ? '#8A97A8' : isStaff ? '#F4FAFA' : SHIRT[(seed >> 5) % 6], style = karen ? 3 : sweaty ? 4 : (seed >> 7) % 3;
    if (o.elder) { hair = '#E6E6EE'; shirt = o.gender === 'f' ? '#B79CD6' : '#7C9CB8'; style = o.gender === 'f' ? 6 : 8; }
    if (o.skin) skin = o.skin; if (o.hair) hair = o.hair; if (o.shirt) shirt = o.shirt; if (o.hairStyle !== undefined) style = o.hairStyle;
    const varied = !karen && !sweaty && !o.elder && !o.inspector && !o.driver && !o.cap && o.hairStyle === undefined;
    const rnd = (n) => (Math.imul((seed | 0) + 977 * n + 13, 2654435761) >>> 8) % 1000 / 1000;
    let costume = null;
    if (varied && !isStaff && hol) {
      const cr = rnd(12);
      if (hol === 'halloween') { if (cr < 0.13) { costume = 'witch'; skin = '#8DBF6A'; shirt = '#2B2438'; } else if (cr < 0.24) { costume = 'vampire'; skin = '#E9E4F0'; shirt = '#1C1826'; } else if (cr < 0.32) costume = 'pumpkin'; }
      else if (hol === 'christmas') { if (cr < 0.2) costume = 'santa'; else if (cr < 0.3) costume = 'antlers'; else if (cr < 0.4) costume = 'scarf'; }
    }
    if (varied) { const STY = [0, 1, 2, 5, 6, 7, 8, 9, 10, 11]; style = STY[Math.floor(rnd(1) * STY.length)]; if (style === 8 && o.gender === 'f') style = 5; }
    const own = (c) => new T.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.85 });
    const goldM0 = () => own('#F2C94C');
    const P = { legs: [], arms: [], shirtM: own(shirt), skinM: own(skin) }, pants = own(o.scrub || '#27384F'), hairM = own(hair), dark = own('#1b1b24');
    const tag = o.tag || (isStaff ? { up: 'tech' } : { cust: true });
    // Body types: normal, jacked (huge upper body, tiny legs), obese. Upper body and head live in their own groups.
    const jacked = body === 'jacked', obese = body === 'obese', slim = body === 'slim';
    const tr = o.gender === 'f' ? [0.3, 0.43] : o.gender === 'm' ? [0.42, 0.35] : [0.34, 0.4];
    const legL = o.him ? 1.12 : jacked ? 0.5 + 0.2 * rnd(7) : 0.68, legW = jacked || obese ? 0.3 : slim ? 0.15 : 0.2, headS = jacked ? 0.82 : obese ? 1.12 : 1;
    const up = new T.Group(); up.position.y = legL - 0.68; g.add(up);
    const hd = new T.Group(); hd.position.y = 1.85 * (1 - headS); hd.scale.set(headS, headS, headS); up.add(hd); P.head = hd; P.up = up; P.him = !!o.him;
    let par = up;
    const put = (geo, m, x, y, z, parent) => { const o = new T.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; Object.assign(o.userData, tag); (parent || par).add(o); return o; };
    const tor = put(jacked ? new T.CylinderGeometry(0.46, 0.15, 0.95, 6) : new T.CylinderGeometry(tr[0], tr[1], 0.95, 6), P.shirtM, 0, 1.12, 0);
    if (slim) tor.scale.set(o.him ? 0.6 : 0.8, 1, o.him ? 0.6 : 0.8);
    if (jacked) tor.scale.set(2.0, 1.12, 1.5);
    if (obese) { tor.scale.set(1.8, 1, 1.75); const belly = put(new T.IcosahedronGeometry(0.62, 0), P.shirtM, 0, 0.95, 0.3); belly.scale.set(1.25, 1, 1.05); }
    if (o.coat) put(new T.BoxGeometry(0.2, 0.62, 0.03), own(o.scrub), 0, 1.22, Math.max(tr[0], tr[1]) * tor.scale.z + 0.005);
    if (varied && !isStaff && !o.coat) {
      const rt = jacked ? 0.46 : tr[0], rb = jacked ? 0.15 : tr[1], sz = tor.scale.z, fz = (y) => (rb + (rt - rb) * (y - 0.645) / 0.95) * sz + 0.012, cl = Math.floor(rnd(8) * 6);
      if (cl === 1) { const bc = own('#F4FAFA'); [0.85, 1.07, 1.29].forEach(y => put(new T.BoxGeometry(0.44, 0.07, 0.03), bc, 0, y, fz(y))); }
      else if (cl === 2) { const hc = own(shirt); const hood = put(new T.TorusGeometry(0.2, 0.09, 5, 8), hc, 0, 1.6, -0.1); hood.rotation.x = PI / 2 - 0.4; put(new T.BoxGeometry(0.38, 0.2, 0.03), own('#3A4658'), 0, 0.85, fz(0.85)); [-0.08, 0.08].forEach(x => put(new T.BoxGeometry(0.02, 0.2, 0.02), own('#FFFFFF'), x, 1.4, fz(1.4))); }
      else if (cl === 3) { const wc = own('#FFFFFF'); [-1, 1].forEach(s => { const c = put(new T.BoxGeometry(0.13, 0.11, 0.03), wc, s * 0.07, 1.55, fz(1.55)); c.rotation.z = s * 0.7; }); put(new T.BoxGeometry(0.07, 0.5, 0.03), own('#B91C1C'), 0, 1.25, fz(1.25) + 0.005); put(new T.BoxGeometry(0.1, 0.08, 0.04), own('#B91C1C'), 0, 1.5, fz(1.5) + 0.005); }
      else if (cl === 4) { const jc = own('#2F3B52'); [-1, 1].forEach(s => put(new T.BoxGeometry(0.09, 0.85, 0.03), jc, s * 0.17, 1.1, fz(1.1))); [1.35, 1.1, 0.85].forEach(y => put(new T.IcosahedronGeometry(0.035, 0), goldM0(), 0, y, fz(y) + 0.01)); }
      else if (cl === 5) { const oc = own('#27384F'); [-1, 1].forEach(s => put(new T.BoxGeometry(0.07, 0.75, 0.03), oc, s * 0.15, 1.2, fz(1.2))); put(new T.BoxGeometry(0.34, 0.26, 0.03), oc, 0, 0.95, fz(0.95)); }
    }
    par = hd;
    put(new T.IcosahedronGeometry(0.32, 0), P.skinM, 0, 1.85, 0);
    if (style === 3) { put(new T.SphereGeometry(0.37, 6, 4, 0, PI * 2, 0, PI / 2), hairM, 0, 1.9, 0); put(new T.BoxGeometry(0.14, 0.55, 0.42), hairM, -0.31, 1.68, -0.02); put(new T.BoxGeometry(0.14, 0.55, 0.42), hairM, 0.31, 1.68, -0.02); put(new T.BoxGeometry(0.64, 0.5, 0.14), hairM, 0, 1.7, -0.28); }
    else if (style === 4) { put(new T.SphereGeometry(0.34, 6, 4, 0, PI * 2, 0, PI / 2), hairM, 0, 1.9, 0); [[-0.2, 0.25], [0, 0.32], [0.2, 0.25], [0.1, 0.18]].forEach((q, i) => { const sp = put(new T.ConeGeometry(0.08, 0.3, 4), hairM, q[0], 2.2 + (i % 2) * 0.03, 0.05 - i * 0.05); sp.rotation.z = -q[0] * 2.4; }); }
    else if (style === 5) { put(new T.SphereGeometry(0.35, 6, 4, 0, PI * 2, 0, PI / 2), hairM, 0, 1.9, 0); put(new T.BoxGeometry(0.7, 0.95, 0.16), hairM, 0, 1.45, -0.28); put(new T.BoxGeometry(0.14, 0.7, 0.32), hairM, -0.34, 1.58, -0.06); put(new T.BoxGeometry(0.14, 0.7, 0.32), hairM, 0.34, 1.58, -0.06); }
    else if (style === 6) { put(new T.SphereGeometry(0.35, 6, 4, 0, PI * 2, 0, PI / 2), hairM, 0, 1.9, 0); put(new T.IcosahedronGeometry(0.17, 0), hairM, 0, 2.27, -0.06); }
    else if (style === 7) { const cu = put(new T.IcosahedronGeometry(0.46, 0), hairM, 0, 2.08, -0.14); cu.scale.set(1.1, 0.9, 0.8); }
    else if (style === 9) { put(new T.BoxGeometry(0.11, 0.24, 0.62), hairM, 0, 2.15, -0.02); put(new T.BoxGeometry(0.11, 0.14, 0.5), hairM, 0, 2.04, -0.02); }
    else if (style === 10) { const af = put(new T.SphereGeometry(0.48, 7, 5), hairM, 0, 1.98, -0.08); af.scale.set(1.05, 0.95, 1); }
    else if (style === 11) { put(new T.SphereGeometry(0.35, 6, 4, 0, PI * 2, 0, PI / 2), hairM, 0, 1.9, 0); const tl = put(new T.BoxGeometry(0.11, 0.5, 0.11), hairM, 0, 1.78, -0.38); tl.rotation.x = 0.35; put(new T.IcosahedronGeometry(0.1, 0), own('#E04F3A'), 0, 2.02, -0.33); }
    else if (style === 12) { put(new T.SphereGeometry(0.35, 6, 4, 0, PI * 2, 0, PI / 2), hairM, 0, 1.9, 0); const pf = put(new T.BoxGeometry(0.5, 0.22, 0.42), hairM, 0, 2.14, 0.08); pf.rotation.x = -0.28; put(new T.BoxGeometry(0.14, 0.2, 0.3), hairM, -0.3, 1.95, -0.02); put(new T.BoxGeometry(0.14, 0.2, 0.3), hairM, 0.3, 1.95, -0.02); }
    else if (style === 13) { put(new T.SphereGeometry(0.35, 6, 4, 0, PI * 2, 0, PI / 2), hairM, 0, 1.9, 0); [-1, 1].forEach(sd => put(new T.IcosahedronGeometry(0.17, 0), hairM, sd * 0.27, 2.2, -0.04)); }
    else if (style === 8) { /* bald */ }
    else if (style === 2) put(new T.CylinderGeometry(0.34, 0.34, 0.14, 6), hairM, 0, 2.08, 0);
    else {
      put(new T.SphereGeometry(0.35, 6, 4, 0, PI * 2, 0, PI / 2), hairM, 0, 1.9, 0);
      if (style === 1) put(new T.IcosahedronGeometry(0.15, 0), hairM, 0, 2.28, -0.12);
    }
    if (!karen && !sweaty) { const wh = own('#FFFFFF'); put(new T.BoxGeometry(0.105, 0.085, 0.03), wh, -0.11, 1.88, 0.283); put(new T.BoxGeometry(0.105, 0.085, 0.03), wh, 0.11, 1.88, 0.283); }
    if (costume) {
      if (costume === 'witch') { put(new T.CylinderGeometry(0.52, 0.52, 0.04, 9), own('#1F1B2E'), 0, 2.06, 0); const wc = put(new T.ConeGeometry(0.27, 0.72, 7), own('#1F1B2E'), 0, 2.42, 0); wc.rotation.z = 0.12; put(new T.CylinderGeometry(0.285, 0.3, 0.08, 7), own('#7B3FA0'), 0, 2.12, 0); put(new T.BoxGeometry(0.1, 0.09, 0.03), own('#F2C94C'), 0, 2.12, 0.29); put(new T.ConeGeometry(0.06, 0.16, 4), skin ? own('#6FA051') : dark, 0, 1.78, 0.37).rotation.x = PI / 2; }
      else if (costume === 'vampire') { put(new T.BoxGeometry(0.1, 0.12, 0.04), own('#FFFFFF'), -0.06, 1.675, 0.31); put(new T.BoxGeometry(0.1, 0.12, 0.04), own('#FFFFFF'), 0.06, 1.675, 0.31); put(new T.BoxGeometry(0.6, 0.12, 0.06), own('#1C1826'), 0, 2.06, 0.22); }
      else if (costume === 'pumpkin') { const pk = put(new T.IcosahedronGeometry(0.2, 0), own('#F28A1E'), 0, 2.2, -0.02); pk.scale.set(1.2, 0.9, 1.2); put(new T.BoxGeometry(0.06, 0.12, 0.06), own('#3E8E41'), 0, 2.36, -0.02); }
      else if (costume === 'santa') { put(new T.ConeGeometry(0.3, 0.55, 7), own('#D8283A'), 0, 2.27, -0.04).rotation.x = -0.25; put(new T.CylinderGeometry(0.34, 0.34, 0.1, 8), own('#FFFFFF'), 0, 2.04, 0); put(new T.IcosahedronGeometry(0.09, 0), own('#FFFFFF'), 0, 2.46, -0.2); }
      else if (costume === 'antlers') { const br = own('#8A5A2B'); [-1, 1].forEach(s => { const a = put(new T.BoxGeometry(0.05, 0.36, 0.05), br, s * 0.2, 2.2, 0); a.rotation.z = -s * 0.35; const b = put(new T.BoxGeometry(0.05, 0.2, 0.05), br, s * 0.3, 2.28, 0); b.rotation.z = s * 0.6; }); put(new T.IcosahedronGeometry(0.06, 0), own('#E04F3A'), 0, 1.82, 0.35); }
      else if (costume === 'scarf') { const sf = put(new T.TorusGeometry(0.27, 0.075, 5, 8), own(rnd(12) < 0.5 ? '#D8283A' : '#3E8E41'), 0, 1.58, 0); sf.rotation.x = PI / 2; put(new T.BoxGeometry(0.12, 0.4, 0.05), own('#D8283A'), 0.15, 1.35, 0.3, up); }
    }
    P.dark = dark; P.eyes = [put(new T.BoxGeometry(0.06, 0.065, 0.04), dark, -0.11, 1.88, 0.295), put(new T.BoxGeometry(0.06, 0.065, 0.04), dark, 0.11, 1.88, 0.295)];
    {
      const DSK = { '#F2C9A5': '#D9A883', '#E0A97E': '#C48A60', '#C48A5E': '#A8704A', '#8D5A3B': '#74472C', '#F6D7BD': '#DDB596', '#6F4429': '#59351F' }, noseM = own(DSK[skin] || skin);
      put(new T.BoxGeometry(0.07, 0.11, 0.1), noseM, 0, 1.815, 0.325);
      if (!karen && !sweaty && o.gender !== 'f') {
        const mm = own('#6E2A2A'), mt = rnd(2);
        put(new T.BoxGeometry(0.14, 0.028, 0.04), mm, 0, 1.715, 0.3);
        if (mt < 0.4) { const a = put(new T.BoxGeometry(0.04, 0.03, 0.04), mm, -0.085, 1.735, 0.29); a.rotation.z = -0.5; const b = put(new T.BoxGeometry(0.04, 0.03, 0.04), mm, 0.085, 1.735, 0.29); b.rotation.z = 0.5; }
        else if (mt > 0.85) { const a = put(new T.BoxGeometry(0.04, 0.03, 0.04), mm, -0.085, 1.7, 0.29); a.rotation.z = 0.5; const b = put(new T.BoxGeometry(0.04, 0.03, 0.04), mm, 0.085, 1.7, 0.29); b.rotation.z = -0.5; }
      }
      if (!karen && !sweaty && o.gender !== 'f') { const br = rnd(3) * 0.3 - 0.1; [-1, 1].forEach(s => { const bb = put(new T.BoxGeometry(0.11, 0.032, 0.03), hairM, s * 0.11, 1.965, 0.295); bb.rotation.z = -s * br; }); }
      if (varied) {
        const fh = rnd(4);
        if (o.gender !== 'f' && fh < 0.55) {
          if (fh < 0.1) put(new T.BoxGeometry(0.3, 0.15, 0.04), own('#8A7466'), 0, 1.66, 0.25);
          else if (fh < 0.22) put(new T.BoxGeometry(0.24, 0.05, 0.06), hairM, 0, 1.765, 0.315);
          else if (fh < 0.3) { put(new T.BoxGeometry(0.24, 0.05, 0.06), hairM, 0, 1.765, 0.315); put(new T.BoxGeometry(0.1, 0.15, 0.07), hairM, 0, 1.63, 0.27); }
          else if (fh < 0.43) { put(new T.BoxGeometry(0.38, 0.2, 0.14), hairM, 0, 1.64, 0.18); put(new T.BoxGeometry(0.24, 0.05, 0.06), hairM, 0, 1.765, 0.31); }
          else { put(new T.BoxGeometry(0.06, 0.2, 0.1), hairM, -0.3, 1.74, 0.08); put(new T.BoxGeometry(0.06, 0.2, 0.1), hairM, 0.3, 1.74, 0.08); put(new T.BoxGeometry(0.24, 0.05, 0.06), hairM, 0, 1.765, 0.315); }
        }
        const sc = rnd(5);
        if (sc < 0.22) {
          const sm = own('#B3504A'), side = rnd(6) < 0.5 ? -1 : 1;
          if (sc < 0.12) { const c = put(new T.BoxGeometry(0.025, 0.22, 0.03), sm, side * 0.17, 1.82, 0.27); c.rotation.z = side * 0.55; }
          else { put(new T.BoxGeometry(0.03, 0.1, 0.03), own('#E8C9C0'), side * 0.11, 1.955, 0.31); }
        }
      }
    }
    if (o.elder) {
      const fr = own('#6B6B78'); [-0.11, 0.11].forEach(x => put(new T.TorusGeometry(0.08, 0.014, 4, 10), fr, x, 1.88, 0.3)); put(new T.BoxGeometry(0.08, 0.015, 0.02), fr, 0, 1.9, 0.3);
      P.scl = [-0.11, 0.11].map(x => { const m = put(new T.BoxGeometry(0.15, 0.15, 0.03), own('#FFFFFF'), x, 1.88, 0.272); m.visible = false; return m; });
      if (o.gender !== 'f') { put(new T.BoxGeometry(0.1, 0.24, 0.2), hairM, -0.3, 1.82, -0.02); put(new T.BoxGeometry(0.1, 0.24, 0.2), hairM, 0.3, 1.82, -0.02); put(new T.BoxGeometry(0.2, 0.04, 0.04), hairM, 0, 1.79, 0.31); }
    }
    if (o.inspector) { const fr = own('#1b1b24'); [-0.11, 0.11].forEach(x => put(new T.TorusGeometry(0.075, 0.016, 4, 10), fr, x, 1.88, 0.3)); put(new T.BoxGeometry(0.08, 0.015, 0.02), fr, 0, 1.9, 0.3); }
    if (o.him) {
      const fr = own('#CFE3F2'); fr.transparent = true; fr.opacity = 0.8; const gl = own('#BFE3F0'); gl.transparent = true; gl.opacity = 0.3; const wh2 = own('#FFFFFF');
      [-1, 1].forEach(s => {
        put(new T.BoxGeometry(0.15, 0.125, 0.03), wh2, s * 0.11, 1.88, 0.284);
        const fx = s * 0.11;
        put(new T.BoxGeometry(0.225, 0.034, 0.034), fr, fx, 1.88 + 0.085, 0.3); put(new T.BoxGeometry(0.225, 0.034, 0.034), fr, fx, 1.88 - 0.085, 0.3);
        put(new T.BoxGeometry(0.034, 0.17, 0.034), fr, fx - 0.1, 1.88, 0.3); put(new T.BoxGeometry(0.034, 0.17, 0.034), fr, fx + 0.1, 1.88, 0.3);
        put(new T.BoxGeometry(0.17, 0.13, 0.01), gl, fx, 1.88, 0.305);
        put(new T.BoxGeometry(0.03, 0.03, 0.34), fr, s * 0.225, 1.9, 0.14);
      });
      put(new T.BoxGeometry(0.07, 0.03, 0.03), fr, 0, 1.9, 0.305);
      P.eyes.forEach(m => { m.scale.set(1.5, 1.5, 1); m.position.z = 0.31; });
    }
    if (o.driver) { const cp = own('#5B3A21'); put(new T.CylinderGeometry(0.36, 0.4, 0.17, 8), cp, 0, 2.12, 0); put(new T.BoxGeometry(0.52, 0.04, 0.3), own('#3E2615'), 0, 2.03, 0.3); }
    if (o.cap) {
      const capM = own('#1C2F5A'), gold = own('#F2C94C');
      put(new T.CylinderGeometry(0.36, 0.4, 0.17, 8), capM, 0, 2.12, 0); put(new T.BoxGeometry(0.52, 0.04, 0.3), own('#0E1A36'), 0, 2.03, 0.3); put(new T.BoxGeometry(0.1, 0.1, 0.03), gold, 0, 2.12, 0.4);
    }
    if (o.gender === 'f') { put(new T.BoxGeometry(0.12, 0.04, 0.03), own('#D9677A'), 0, 1.74, 0.3); put(new T.BoxGeometry(0.1, 0.025, 0.03), dark, -0.11, 1.94, 0.29); put(new T.BoxGeometry(0.1, 0.025, 0.03), dark, 0.11, 1.94, 0.29); }
    if (karen) {
      const b1 = put(new T.BoxGeometry(0.2, 0.05, 0.05), dark, -0.11, 1.99, 0.3); b1.rotation.z = -0.5;
      const b2 = put(new T.BoxGeometry(0.2, 0.05, 0.05), dark, 0.11, 1.99, 0.3); b2.rotation.z = 0.5;
      put(new T.BoxGeometry(0.17, 0.08, 0.04), dark, 0, 1.73, 0.3);
      P.skinM.emissive.setHex(0x4a0f06);
    }
    if (sweaty) {
      const wh = own('#FFFFFF'), damp = own('#5E6B7C');
      put(new T.BoxGeometry(0.14, 0.14, 0.03), wh, -0.11, 1.88, 0.275); put(new T.BoxGeometry(0.14, 0.14, 0.03), wh, 0.11, 1.88, 0.275);
      const w1 = put(new T.BoxGeometry(0.2, 0.05, 0.05), dark, -0.11, 2.0, 0.3); w1.rotation.z = 0.35;
      const w2 = put(new T.BoxGeometry(0.2, 0.05, 0.05), dark, 0.11, 2.0, 0.3); w2.rotation.z = -0.35;
      put(new T.BoxGeometry(0.13, 0.04, 0.04), dark, 0, 1.72, 0.3);
      put(new T.BoxGeometry(0.34, 0.4, 0.03), damp, 0, 1.12, 0.39, up); put(new T.BoxGeometry(0.08, 0.28, 0.3), damp, -0.38, 1.3, 0.04, up); put(new T.BoxGeometry(0.08, 0.28, 0.3), damp, 0.38, 1.3, 0.04, up);
      P.skinM.emissive.setHex(0x1c1e0a); P.sweaty = true;
    }
    const A = o.acc || 0, goldM = own('#F2C94C');
    const on = k => o.accOn ? o.accOn.indexOf(k) >= 0 : A >= k;
    if (on(2) && !(o.cosm && o.cosm.eyes)) { const blk = own('#101018'); put(new T.BoxGeometry(0.17, 0.1, 0.05), blk, -0.11, 1.88, 0.31); put(new T.BoxGeometry(0.17, 0.1, 0.05), blk, 0.11, 1.88, 0.31); put(new T.BoxGeometry(0.1, 0.025, 0.05), blk, 0, 1.9, 0.31); }
    if (on(4)) put(new T.BoxGeometry(0.17, 0.05, 0.04), goldM, 0, 1.735, 0.318);
    if (on(5) && !(o.cosm && o.cosm.hat)) { const fm = own('#2B2B33'); put(new T.CylinderGeometry(0.5, 0.5, 0.03, 10), fm, 0, 2.06, 0); put(new T.CylinderGeometry(0.27, 0.3, 0.24, 8), fm, 0, 2.19, 0); put(new T.CylinderGeometry(0.305, 0.305, 0.05, 8), own('#8B1E2D'), 0, 2.1, 0); }
    if (o.cosm) buildCosm(o.cosm, (g, m, x, y, z, u) => put(g, m, x, y, z, u ? up : undefined), own, hairM, P, Math.max(tr[0], tr[1]) * tor.scale.z + 0.03);
    par = up;
    if (o.him) {
      const fzh = (y) => (tr[1] + (tr[0] - tr[1]) * (y - 0.645) / 0.95) * tor.scale.z + 0.012, colM = own('#24508F');
      put(new T.BoxGeometry(0.8, 0.17, 0.3), P.shirtM, 0, 1.51, 0); // broader shoulders
      put(new T.BoxGeometry(0.035, 0.56, 0.03), own('#E4ECF4'), 0, 1.3, fzh(1.3) + 0.004);
      put(new T.BoxGeometry(0.075, 0.09, 0.04), dark, 0, 1.55, fzh(1.55) + 0.012);
      put(new T.CylinderGeometry(0.19, 0.25, 0.16, 8), colM, 0, 1.64, 0);
    }
    if (o.inspector) { put(new T.BoxGeometry(0.07, 0.46, 0.03), own('#B91C1C'), 0, 1.18, Math.max(tr[0], tr[1]) + 0.02); put(new T.BoxGeometry(0.2, 0.05, 0.04), own('#E8EDF2'), 0, 1.45, Math.max(tr[0], tr[1]) + 0.01); }
    if (o.driver) { put(new T.BoxGeometry(0.56, 0.42, 0.4), own('#C9A06A'), 0, 1.0, 0.5); put(new T.BoxGeometry(0.1, 0.43, 0.41), own('#8A5A2B'), 0, 1.0, 0.5); }
    if (on(7)) {
      const cm = own('#7B3FA0'), fur = own('#9A5CC4'), c1 = put(new T.CylinderGeometry(tr[0] + 0.09, tr[1] + 0.1, 1.0, 7), cm, 0, 1.1, 0); c1.scale.copy(tor.scale);
      [-1, 1].forEach(s => put(new T.IcosahedronGeometry(0.2, 0), fur, s * (jacked ? 0.8 : obese ? 0.62 : slim ? 0.34 : 0.4), 1.58, 0));
      const col = put(new T.TorusGeometry(0.3, 0.1, 5, 9), fur, 0, 1.6, 0); col.rotation.x = PI / 2; col.scale.set(tor.scale.x, tor.scale.z, 1);
    }
    if (on(1)) { const ch = put(new T.TorusGeometry(on(7) ? 0.5 : 0.31, 0.03, 5, 10), goldM, 0, on(7) ? 1.66 : 1.56, 0.02); ch.rotation.x = PI / 2; if (!on(7)) ch.scale.set(tor.scale.x, tor.scale.z, 1); put(new T.BoxGeometry(0.11, 0.11, 0.03), goldM, 0, on(7) ? 1.3 : 1.26, on(7) ? 0.56 : 0.4); }
    [-1, 1].forEach(s => {
      const leg = new T.Group(); leg.position.set(s * (jacked ? 0.2 : obese ? 0.24 : slim ? 0.12 : 0.15), legL, 0); g.add(leg);
      if (o.him) {
        put(new T.BoxGeometry(legW, legL / 2, legW + 0.04), pants, 0, -legL / 4, 0, leg);
        const sh = new T.Group(); sh.position.y = -legL / 2; leg.add(sh); (P.knees = P.knees || []).push(sh);
        put(new T.BoxGeometry(legW * 0.94, legL / 2, legW + 0.03), pants, 0, -legL / 4, 0, sh);
        put(new T.BoxGeometry(legW + 0.06, 0.1, legW + 0.22), own(o.shoes), 0, -legL / 2 + 0.05, 0.07, sh);
      } else {
        put(new T.BoxGeometry(legW, legL, legW + 0.04), pants, 0, -legL / 2, 0, leg);
        if (o.shoes) put(new T.BoxGeometry(legW + 0.06, 0.1, legW + 0.22), own(o.shoes), 0, -legL + 0.05, 0.07, leg);
      }
      P.legs.push(leg);
      const arm = new T.Group(); arm.position.set(s * (jacked ? 0.86 : obese ? 0.78 : slim ? (o.him ? 0.37 : 0.38) : 0.46), 1.5, 0); up.add(arm);
      if (jacked) arm.scale.set(2.3, 1.15, 2.3); else if (obese) arm.scale.set(1.6, 1, 1.6); else if (slim) arm.scale.set(0.8, 1, 0.8);
      put(new T.BoxGeometry(0.15, 0.62, 0.16), jacked ? P.skinM : P.shirtM, 0, -0.3, 0, arm);
      put(new T.IcosahedronGeometry(0.09, 0), P.skinM, 0, -0.66, 0, arm); P.arms.push(arm);
      if (o.him) put(new T.BoxGeometry(0.17, 0.07, 0.18), own('#24508F'), 0, -0.585, 0, arm);
      if (on(3)) put(new T.BoxGeometry(0.2, 0.09, 0.13), goldM, 0, -0.7, 0.02, arm);
      if ((on(6) || o.elder) && s === 1) { put(new T.CylinderGeometry(0.025, 0.025, 1.05, 5), own('#5B3A21'), 0, -1.02, 0.06, arm); put(new T.IcosahedronGeometry(0.07, 0), goldM, 0, -0.5, 0.06, arm); }
      if (o.cosm && (o.cosm.cyber === 'cyarm' || o.cosm.cyber === 'cykit') && s === 1) { const mt = own('#9AA7B5'), dk2 = own('#2B3340'), gl = own('#2CCDBB'); if (gl.emissive && gl.emissive.setHex) { gl.emissive.setHex(0x1FB5A5); gl.emissiveIntensity = 0.9; } put(new T.BoxGeometry(0.2, 0.36, 0.21), mt, 0, -0.44, 0, arm); put(new T.BoxGeometry(0.22, 0.06, 0.23), dk2, 0, -0.25, 0, arm); put(new T.BoxGeometry(0.21, 0.04, 0.22), gl, 0, -0.62, 0, arm); [-1, 1].forEach(cs => put(new T.BoxGeometry(0.05, 0.14, 0.06), dk2, cs * 0.05, -0.76, 0.03, arm)); }
      if (karen && s === 1) put(new T.BoxGeometry(0.34, 0.27, 0.13), own('#8A63C9'), 0, -0.82, 0.06, arm);
      if (o.inspector && s === 1) { put(new T.BoxGeometry(0.3, 0.38, 0.04), own('#C9A06A'), 0, -0.8, 0.1, arm); put(new T.BoxGeometry(0.24, 0.3, 0.02), own('#FFFFFF'), 0, -0.8, 0.125, arm); }
    });
    if (isStaff || o.cap) put(new T.BoxGeometry(0.13, 0.13, 0.04), own(o.cap ? '#F2C94C' : '#0E9A8E'), 0.17, 1.35, 0.36);
    if (o.elder) g.scale.set(0.95, 0.9, 0.95);
    if (o.him) g.scale.set(1.06, 1.06, 1.06);
    if (karen) g.scale.set(1.08, 1.08, 1.08);
    if (sweaty) g.scale.set(0.66, 1.1, 0.66);
    if (varied && !o.elder) { const gs = 0.9 + 0.24 * rnd(9); g.scale.set(gs, gs, gs); }
    P.waddle = obese; g.rotation.order = 'YXZ'; g.userData.P = P; return g;
  }
  function walkAnim(p, t, walking, dt) {
    const P = p.userData.P, k = Math.min(1, dt * 10);
    if (P.him) {
      // Andy marches with his knees up high, opposite arm swinging back
      const k2 = Math.min(1, dt * 14);
      for (let i = 0; i < 2; i++) {
        const u = walking ? Math.sin(t * 9 + i * PI) : 0, th = u > 0 ? -1.25 * u : -0.4 * u, sh = u > 0 ? 1.45 * u : -0.25 * u;
        P.legs[i].rotation.x = lerp(P.legs[i].rotation.x, th, k2); P.knees[i].rotation.x = lerp(P.knees[i].rotation.x, sh, k2);
        P.arms[i].rotation.x = lerp(P.arms[i].rotation.x, -th * 0.9, k2);
      }
      return;
    }
    const a = walking ? Math.sin(t * 9) * 0.7 : 0;
    P.legs[0].rotation.x = lerp(P.legs[0].rotation.x, a, k); P.legs[1].rotation.x = lerp(P.legs[1].rotation.x, -a, k);
    P.arms[0].rotation.x = lerp(P.arms[0].rotation.x, -a * 0.8, k); P.arms[1].rotation.x = lerp(P.arms[1].rotation.x, a * 0.8, k);
    if (P.waddle) p.rotation.z = lerp(p.rotation.z, walking ? Math.sin(t * 9) * 0.07 : 0, k);
  }

  // A computer station: keyboard on the staff side, monitor with its screen turned toward the staff.
  function station(p, x, z, up, glow) {
    bx(p, 0.55, 0.05, 0.28, '#DDE8E8', x, 1.3, z - 0.28, up);
    bx(p, 0.12, 0.3, 0.12, '#27384F', x, 1.42, z, up);
    bx(p, 0.85, 0.56, 0.07, '#27384F', x, 1.84, z, up);
    return bx(p, 0.72, 0.44, 0.03, '#2CCDBB', x, 1.84, z - 0.05, up, { emissive: new T.Color(0x1FB5A5), emissiveIntensity: glow });
  }
  function buildStatic() {
    const g = new T.Group(); scene.add(g);
    bx(g, 20, 0.7, 14.2, '#2F5256', 0, -0.35, -0.6);
    bx(g, 3.6, 0.5, 4, '#2F5256', 5, -0.25, 7.6);
    for (let i = 0; i < 9; i++) for (let j = 0; j < 7; j++) shopSurf[(i + j) % 2 ? 'fa' : 'fb'].push(bx(g, 2, 0.06, 2, (i + j) % 2 ? '#E4F1F0' : '#D2E7E5', -8 + i * 2, 0.03, -6.2 + j * 2));
    shopSurf.back.push(bx(g, 20, 6.4, 0.4, '#A5D6D0', 0, 3.2, -7.5));
    bx(g, 20, 0.5, 0.5, '#0E9A8E', 0, 0.25, -7.2);
    // left wall, with a doorway (z 3.4 to 5.0) into the counseling room outside
    shopSurf.side.push(bx(g, 0.4, 6.4, 11.1, '#8FC9C3', -9.8, 3.2, -2.15), bx(g, 0.4, 6.4, 1.5, '#8FC9C3', -9.8, 3.2, 5.75), bx(g, 0.4, 3.8, 1.6, '#8FC9C3', -9.8, 4.5, 4.2));
    bx(g, 0.5, 0.5, 11.1, '#0E9A8E', -9.5, 0.25, -2.15); bx(g, 0.5, 0.5, 1.5, '#0E9A8E', -9.5, 0.25, 5.75);
    bx(g, 0.55, 0.14, 1.7, '#F2A516', -9.8, 2.6, 4.2); bx(g, 0.5, 0.05, 1.6, '#2F5256', -9.8, 0.03, 4.2);
    // sign + cross
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 256;
    const tex = new T.CanvasTexture(cv);
    sign = { cv, tex };
    const sg = new T.Mesh(new T.PlaneGeometry(8.4, 2.1), new T.MeshBasicMaterial({ map: tex }));
    sg.position.set(-2.2, 5.45, -7.25); g.add(sg);
    bx(g, 8.6, 2.3, 0.15, '#073F3B', -2.2, 5.45, -7.32);
    const crossM = { emissive: new T.Color(0x1FB5A5), emissiveIntensity: 0.6 };
    bx(g, 0.5, 1.6, 0.4, '#2CCDBB', -7.7, 5.45, -7.2, null, crossM);
    bx(g, 1.6, 0.5, 0.4, '#2CCDBB', -7.7, 5.45, -7.2, null, crossM);
    // counter: runs wall to wall, with computer stations along it
    const c = new T.Group(); c.position.set(-2.725, 0, 0); g.add(c);
    const cx = (w) => w + 2.725;
    bx(c, 13.25, 1.1, 1.3, '#0A6F66', 0, 0.55, -0.1);
    bx(c, 13.75, 0.16, 1.9, '#F4F9F9', 0, 1.18, 0);
    bx(c, 13.75, 0.1, 0.12, '#F2A516', 0, 1.2, 0.93);
    for (let i = 0; i < 11; i++) bx(c, 0.9, 0.7, 0.05, '#0E9A8E', -6 + i * 1.2, 0.55, 0.57);
    station(c, cx(2.2), -0.25, null, 0.5); station(c, cx(3.5), -0.25, null, 0.5);
    cy(c, 0.25, 0.3, 0.5, 6, '#F2A516', cx(-2.8), 1.5, 0.1);
    // desk phone (clickable while it rings)
    phoneG = new T.Group(); phoneG.position.set(0.9, 1.26, 0.3); g.add(phoneG);
    bx(phoneG, 0.8, 0.18, 0.6, '#27384F', 0, 0.09, 0, 'phone'); bx(phoneG, 0.5, 0.04, 0.3, '#DDE8E8', 0, 0.2, 0.12, 'phone');
    phoneHS = new T.Group(); phoneHS.position.set(0, 0.3, -0.12); phoneG.add(phoneHS);
    bx(phoneHS, 0.95, 0.1, 0.18, '#1B2733', 0, 0, 0, 'phone'); bx(phoneHS, 0.2, 0.2, 0.22, '#1B2733', -0.4, -0.07, 0, 'phone'); bx(phoneHS, 0.2, 0.2, 0.22, '#1B2733', 0.4, -0.07, 0, 'phone');
    phoneLamp = bx(phoneG, 0.14, 0.1, 0.14, '#F2A516', 0.3, 0.22, -0.2, 'phone', { emissive: new T.Color(0xF2A516), emissiveIntensity: 0.1 });
    // porch rug, plants
    bx(g, 2.4, 0.04, 3.6, '#F2A516', 5, 0.08, 6.9);
    bx(g, 2.9, 0.12, 0.2, '#0E9A8E', 5, 0.18, 5.2);
    [[8.4, 4.5], [-8.6, 6.2]].forEach((p, pi) => { cy(g, 0.4, 0.3, 0.6, 6, '#E04F3A', p[0], 0.3, p[1]); const l1 = ico(g, 0.65, '#3E8E41', p[0], 1.1, p[1]), l2 = ico(g, 0.45, '#56A85A', p[0] + 0.2, 1.6, p[1]); if (pi === 1) { l1.userData.x0 = l1.position.x; l2.userData.x0 = l2.position.x; plantL = [l1, l2]; } });
    // waiting room seating: a bench along the right wall and two chairs near the door
    bx(g, 0.75, 0.12, 2.7, '#8A5A3B', 9.0, 0.5, 2.2); bx(g, 0.6, 0.1, 2.55, '#0E9A8E', 8.98, 0.6, 2.2); bx(g, 0.12, 0.8, 2.7, '#8A5A3B', 9.4, 0.95, 2.2);
    [[0.9, 1.0], [0.9, 3.4]].forEach(l => { bx(g, 0.6, 0.45, 0.1, '#6D4630', 9.0, 0.22, l[0] + (l[1] > 3 ? 0.0 : 0.4)); });
    [6.6, 7.7].forEach(x => { bx(g, 0.75, 0.1, 0.75, '#F2A516', x, 0.5, 5.45); bx(g, 0.75, 0.75, 0.1, '#F2A516', x, 0.9, 5.82); [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].forEach(o => bx(g, 0.08, 0.45, 0.08, '#6D4630', x + o[0], 0.22, 5.45 + o[1])); });
    bx(g, 0.6, 0.05, 0.6, '#F4F9F9', 7.15, 0.6, 6.7); cy(g, 0.05, 0.05, 0.55, 6, '#6D4630', 7.15, 0.3, 6.7);
    // scenery
    [[-12.5, -2, 1.1], [13, -4, 1.4], [-12, 7, 0.9], [13.5, 6, 1]].forEach(p => {
      cy(g, 0.25 * p[2], 0.3 * p[2], 1.2 * p[2], 5, '#6C4C3A', p[0], 0.6 * p[2], p[1]);
      add(g, new T.ConeGeometry(1.2 * p[2], 2.4 * p[2], 5), '#3E9E6A', p[0], 2.2 * p[2], p[1]);
      add(g, new T.ConeGeometry(0.9 * p[2], 1.8 * p[2], 5), '#4DB57B', p[0], 3.2 * p[2], p[1]);
    });
    for (let i = 0; i < 4; i++) {
      const cl = new T.Group();
      [[0, 0, 1], [1, 0.2, 0.8], [-1, 0.1, 0.7]].forEach(q => ico(cl, 0.9 * q[2], '#FFFFFF', q[0], q[1], 0));
      cl.position.set(-14 + i * 9, 9 + (i % 2) * 1.4, -6 + i * 3); cl.scale.set(1.3, 1, 1); scene.add(cl); clouds.push(cl);
    }
    // groups for dynamic content
    UPIDS.forEach(id => { const u = new T.Group(); u.position.set(BASE[id][0], BASE[id][1], BASE[id][2]); scene.add(u); ug[id] = u; });
    staffGroup = new T.Group(); scene.add(staffGroup); decorG = new T.Group(); scene.add(decorG);
    pharmG = new T.Group(); scene.add(pharmG); awardsG = new T.Group(); scene.add(awardsG); petG = new T.Group(); scene.add(petG);
    custGroup = new T.Group(); scene.add(custGroup); capG = new T.Group(); scene.add(capG); pillG = new T.Group(); scene.add(pillG);
    // floor receives shadow only on tiles via meshes already
    // coin pool
    for (let i = 0; i < 36; i++) {
      const m = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.07, 8), new T.MeshStandardMaterial({ color: 0xF2A516, flatShading: true, roughness: 0.5, metalness: 0.3, transparent: true }));
      m.visible = false; m.userData.fx = true; scene.add(m); coins.push({ m, v: new T.Vector3(), life: 0 });
    }
    for (let i = 0; i < 30; i++) {
      const m = new T.Mesh(new T.OctahedronGeometry(0.14, 0), new T.MeshStandardMaterial({ color: 0xFFFFFF, flatShading: true, roughness: 1, transparent: true }));
      m.visible = false; m.userData.fx = true; scene.add(m); puffs.push({ m, life: 0, vx: 0, vz: 0 });
    }
    for (let i = 0; i < 40; i++) {
      const m = new T.Mesh(new T.OctahedronGeometry(0.075, 0), new T.MeshStandardMaterial({ color: 0x8FD8FF, flatShading: true, roughness: 0.2, metalness: 0.1, transparent: true }));
      m.scale.set(0.8, 1.4, 0.8); m.visible = false; m.userData.fx = true; scene.add(m); drops.push({ m, life: 0, vx: 0, vz: 0, vy: 0 });
    }
    buildBrain(g); buildEvt(g);
  }
  function drawSign(txt) {
    const x = sign.cv.getContext('2d'); x.clearRect(0, 0, 1024, 256);
    x.fillStyle = '#0E9A8E'; x.fillRect(0, 0, 1024, 256);
    x.fillStyle = '#0B7D73'; x.fillRect(0, 196, 1024, 60);
    x.fillStyle = '#FFFFFF'; x.font = '800 118px "Bricolage Grotesque", Trebuchet MS, sans-serif'; x.textAlign = 'center';
    const parts = String(txt).split('|'), nm = (parts.length > 1 ? parts[0] : 'Corner Rx'), sub = parts.length > 1 ? parts[1] : parts[0];
    let fs = 118; x.font = '800 ' + fs + 'px "Bricolage Grotesque", Trebuchet MS, sans-serif';
    while (x.measureText(nm).width > 940 && fs > 40) { fs -= 4; x.font = '800 ' + fs + 'px "Bricolage Grotesque", Trebuchet MS, sans-serif'; }
    x.fillText(nm, 512, 128 + (118 - fs) * 0.12);
    x.fillStyle = '#FDEBC4'; x.font = '700 40px "JetBrains Mono", monospace'; x.fillText(sub.toUpperCase(), 512, 240);
    sign.tex.needsUpdate = true;
  }

  function buildShelves(lv) {
    const G = ug.shelf; clear(G); shelfBottles = [];
    const n = 2 + Math.min(2, Math.floor(lv / 6)), ys = [0.35, 1.3, 2.25, 3.2]; shelfN = n;
    const slots = [];
    for (let u = 0; u < n; u++) {
      const cx = -(n - 1) * 1.5 + u * 3;
      bx(G, 3.0, 4.1, 0.1, '#CBE5E2', cx, 2.05, -0.4, 'shelf');
      bx(G, 0.14, 4.1, 0.9, '#F1F6F6', cx - 1.5, 2.05, 0, 'shelf'); bx(G, 0.14, 4.1, 0.9, '#F1F6F6', cx + 1.5, 2.05, 0, 'shelf');
      bx(G, 3.1, 0.14, 0.9, '#F1F6F6', cx, 4.1, 0, 'shelf');
      ys.forEach(y => { bx(G, 2.9, 0.12, 0.9, '#F1F6F6', cx, y, 0, 'shelf'); for (let i = 0; i < 6; i++) slots.push([cx - 1.2 + i * 0.48, y + 0.06, 0]); });
    }
    const order = slots.map((s, i) => i).sort((a, b) => ((a * 37 + 11) % slots.length) - ((b * 37 + 11) % slots.length));
    const nb = Math.min(slots.length, 6 + lv * 4);
    for (let k = 0; k < nb; k++) {
      const s = slots[order[k]], col = BOT[(order[k] * 5 + 2) % 6];
      const b = new T.Group(); b.position.set(s[0], s[1], s[2]); G.add(b);
      cy(b, 0.17, 0.17, 0.42, 6, col, 0, 0.21, 0, 'shelf'); cy(b, 0.175, 0.175, 0.14, 6, '#FFFFFF', 0, 0.2, 0, 'shelf'); cy(b, 0.12, 0.12, 0.12, 6, '#27384F', 0, 0.48, 0, 'shelf');
      shelfBottles.push(b);
    }
  }
  function buildTech(lv) {
    const G = ug.tech; clear(G);
    if (lv < 1) { ghostBox(G, 4.8, 2.5, 1.6, 'tech'); return; }
    [-1.5, 0, 1.5].forEach((x, i) => {
      station(G, x, -0.25, 'tech', i < lv ? 0.8 : 0.08);
      if (i < lv) bx(G, 0.1, 0.1, 0.1, '#3FD07F', x + 0.5, 1.36, -0.28, 'tech', { emissive: new T.Color(0x3FD07F), emissiveIntensity: 1 });
    });
    for (let i = 0; i < Math.min(lv, 5); i++) cy(G, 0.15, 0.15, 0.3, 6, BOT[i], -1.9 + i * 0.95, 1.4, 0.55, 'tech');
  }
  function buildCounsel(lv) {
    const G = ug.counsel; clear(G);
    // the room sticks out past the left wall of the pharmacy, on its own little platform
    bx(G, 3.5, 0.7, 3.5, '#2F5256', 0, -0.35, 0);
    if (lv < 1) { ghostBox(G, 3.2, 2.8, 3.2, 'counsel'); return; }
    bx(G, 3.2, 0.05, 3.2, '#BFE3DF', 0, 0.04, 0, 'counsel');
    const glass = { transparent: true, opacity: 0.22, roughness: 0.2 };
    // glass walls: back, left and front are solid; the DOORWAY is the gap in the right wall, leading into the pharmacy
    bx(G, 3.2, 2.7, 0.06, '#9FE8E0', 0, 1.35, -1.55, 'counsel', glass); bx(G, 0.06, 2.7, 3.2, '#9FE8E0', -1.55, 1.35, 0, 'counsel', glass);
    bx(G, 3.2, 2.7, 0.06, '#9FE8E0', 0, 1.35, 1.55, 'counsel', glass);
    bx(G, 0.06, 2.7, 1.1, '#9FE8E0', 1.55, 1.35, -1.0, 'counsel', glass); bx(G, 0.06, 2.7, 0.4, '#9FE8E0', 1.55, 1.35, 1.35, 'counsel', glass);
    [[-1.55, -1.55], [1.55, -1.55], [-1.55, 1.55], [1.55, 1.55]].forEach(p => bx(G, 0.12, 2.8, 0.12, '#0E9A8E', p[0], 1.4, p[1], 'counsel'));
    bx(G, 0.14, 2.1, 0.1, '#F2A516', 1.55, 1.05, -0.45, 'counsel'); bx(G, 0.14, 2.1, 0.1, '#F2A516', 1.55, 1.05, 1.15, 'counsel');
    bx(G, 0.14, 0.18, 1.8, '#F2A516', 1.55, 2.2, 0.35, 'counsel');
    bx(G, 0.08, 0.34, 1.1, '#0E9A8E', 1.0, 2.5, 0.35, 'counsel', { emissive: new T.Color(0x1FB5A5), emissiveIntensity: 0.5 });
    bx(G, 0.9, 0.03, 1.5, '#E04F3A', 1.5, 0.07, 0.35, 'counsel');
    bx(G, 3.3, 0.12, 3.3, '#0E9A8E', 0, 2.82, 0, 'counsel', { transparent: true, opacity: 0.35 });
    bx(G, 1.3, 0.7, 0.7, '#F1F6F6', -0.2, 0.38, -1.0, 'counsel');
    bx(G, 0.7, 0.14, 0.7, '#F2A516', -0.5, 0.55, 0.3, 'counsel'); bx(G, 0.12, 0.8, 0.7, '#F2A516', -0.9, 0.95, 0.3, 'counsel');
    bx(G, 0.7, 0.14, 0.7, '#E04F3A', -0.5, 0.55, 1.0, 'counsel'); bx(G, 0.12, 0.8, 0.7, '#E04F3A', -0.9, 0.95, 1.0, 'counsel');
    cy(G, 0.22, 0.17, 0.35, 6, '#E04F3A', -1.2, 0.18, -1.2, 'counsel'); ico(G, 0.4, '#3E8E41', -1.2, 0.65, -1.2, 'counsel');
    for (let i = 0; i < Math.min(lv, 6); i++) bx(G, 0.14, 0.14, 0.14, '#F2A516', 0.6 - i * 0.25, 1.4, -1.45, 'counsel', { emissive: new T.Color(0xF2A516), emissiveIntensity: 0.8 });
  }
  /* mastery shelf: one jar per fully mastered week, on the left wall. Empty slots stay as faint outlines. */
  let mastG = null, mastList = [];
  function buildMastery() {
    if (!mastG) { mastG = new T.Group(); mastG.position.set(BASE.mast[0], 0, BASE.mast[2]); scene.add(mastG); }
    clear(mastG);
    const wood = '#B98A5C', board = '#8B6239', ROWS = 4, COLS = 11, L = 3.5, dz = L / COLS;
    bx(mastG, 0.08, 3.5, L + 0.2, '#5E412A', -0.46, 1.75, 0);
    for (let r = 0; r < ROWS; r++) bx(mastG, 0.6, 0.08, L + 0.2, board, -0.18, 0.55 + r * 0.8, 0);
    bx(mastG, 0.7, 0.14, L + 0.3, wood, -0.12, 3.6, 0);
    bx(mastG, 0.1, 3.5, 0.1, wood, -0.12, 1.75, -(L + 0.2) / 2); bx(mastG, 0.1, 3.5, 0.1, wood, -0.12, 1.75, (L + 0.2) / 2);
    for (let r = 0; r < ROWS; r++) for (let k = 0; k < COLS; k++) {
      const idx = (ROWS - 1 - r) * COLS + k, z = -L / 2 + dz * (k + 0.5), y = 0.59 + r * 0.8, m = mastList[idx];
      if (m) {
        cy(mastG, 0.14, 0.15, 0.42, 8, m.c, -0.1, y + 0.21, z, undefined, { emissive: new T.Color(m.c), emissiveIntensity: 0.35 });
        cy(mastG, 0.12, 0.12, 0.1, 8, '#FFFFFF', -0.1, y + 0.47, z);
        bx(mastG, 0.02, 0.18, 0.16, '#FFFFFF', 0.06, y + 0.2, z);
      } else {
        cy(mastG, 0.1, 0.11, 0.32, 8, '#FFFFFF', -0.1, y + 0.16, z, undefined, { transparent: true, opacity: 0.16 });
      }
    }
  }
  api.setMastery = function (list) { mastList = list || []; try { buildMastery(); } catch (e) { /* decor is cosmetic */ } };
  function buildRobot(lv) {
    const G = ug.robot; clear(G); robotRef = null;
    if (lv < 1) { ghostBox(G, 2.4, 3.6, 2.4, 'robot'); return; }
    const R = new T.Group(); R.scale.set(1 + lv * 0.05, 1 + lv * 0.05, 1 + lv * 0.05); G.add(R);
    cy(R, 1.0, 1.2, 0.3, 8, '#27384F', 0, 0.15, 0, 'robot');
    bx(R, 1.3, 1.5, 1.0, '#0E9A8E', 0, 1.2, 0, 'robot'); bx(R, 0.9, 0.5, 0.05, '#FDEBC4', 0, 1.3, 0.52, 'robot', { emissive: new T.Color(0xF2A516), emissiveIntensity: 0.3 });
    const head = new T.Group(); head.position.y = 2.4; R.add(head);
    bx(head, 1.1, 0.8, 0.9, '#F4F9F9', 0, 0, 0, 'robot');
    bx(head, 0.22, 0.22, 0.06, '#F2A516', -0.25, 0.05, 0.47, 'robot', { emissive: new T.Color(0xF2A516), emissiveIntensity: 1 });
    bx(head, 0.22, 0.22, 0.06, '#F2A516', 0.25, 0.05, 0.47, 'robot', { emissive: new T.Color(0xF2A516), emissiveIntensity: 1 });
    cy(head, 0.04, 0.04, 0.5, 5, '#27384F', 0, 0.62, 0, 'robot'); ico(head, 0.1, '#E04F3A', 0, 0.9, 0, 'robot');
    const arms = [-1, 1].map(s => { const a = new T.Group(); a.position.set(s * 0.85, 1.8, 0); R.add(a); bx(a, 0.25, 1.1, 0.25, '#F4F9F9', 0, -0.5, 0, 'robot'); ico(a, 0.2, '#27384F', 0, -1.1, 0, 'robot'); return a; });
    robotRef = { head, arms };
  }
  function buildNotes() {
    const G = ug.notes; clear(G);
    bx(G, 1.0, 0.1, 0.72, '#0E9A8E', 0, 0.05, 0, 'notes', { emissive: new T.Color(0x0E9A8E), emissiveIntensity: 0.35 });
    bx(G, 0.9, 0.08, 0.62, '#FFFFFF', 0.02, 0.13, 0, 'notes'); bx(G, 0.04, 0.1, 0.62, '#0A6F66', 0, 0.12, 0, 'notes'); bx(G, 0.12, 0.02, 0.5, '#F2A516', 0.35, 0.19, 0, 'notes');
    const pen = cy(G, 0.03, 0.03, 0.6, 5, '#E04F3A', -0.3, 0.2, 0.42, 'notes'); pen.rotation.z = PI / 2;
    notesStar = ico(G, 0.13, '#F2A516', 0, 0.8, 0, 'notes');
  }
  /* A small plaque bolted to each upgrade that shows its level. It lives inside the upgrade's group, so it stays with the model. */
  const MAXLV = { shelf: 20, tech: 20, counsel: 10, robot: 5 };
  const PLATE = { shelf: [0, 4.65, 0.5, 0], tech: [0, 2.75, -0.3, 0], counsel: [0, 3.4, 0, 0], robot: [0, 4.7, 0.2, 0] };
  function addPlate(id, lv) {
    const G = ug[id], P = PLATE[id]; if (!G || !P) return;
    const max = MAXLV[id], full = lv >= max, cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
    const x = cv.getContext('2d'), r = 22;
    x.fillStyle = full ? '#F2A516' : lv < 1 ? '#6B8286' : '#0E9A8E';
    x.strokeStyle = '#10292C'; x.lineWidth = 8;
    x.beginPath(); x.moveTo(r + 4, 4); x.arcTo(252, 4, 252, 124, r); x.arcTo(252, 124, 4, 124, r); x.arcTo(4, 124, 4, 4, r); x.arcTo(4, 4, 252, 4, r); x.closePath(); x.fill(); x.stroke();
    x.textAlign = 'center'; x.fillStyle = full ? '#2B1D00' : '#FFFFFF';
    x.font = '800 30px "JetBrains Mono", monospace'; x.fillText(full ? 'MAX' : 'LEVEL', 128, 42);
    x.font = '800 66px "Bricolage Grotesque", Trebuchet MS, sans-serif'; x.fillText(String(lv), 128, 106);
    const tex = new T.CanvasTexture(cv); if (renderer && renderer.capabilities && renderer.capabilities.getMaxAnisotropy) tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const m = new T.Mesh(new T.PlaneGeometry(1.5, 0.75), new T.MeshBasicMaterial({ map: tex, transparent: true, side: T.DoubleSide }));
    m.position.set(P[0], P[1], P[2]); m.rotation.y = P[3]; m.userData.plate = true; G.add(m);
  }
  const BUILD = { shelf: buildShelves, tech: buildTech, counsel: buildCounsel, robot: buildRobot };

  /* ---- staff & customers ---- */
  Crowd.setBoxes(OBST);
  // The pharmacist's station is off limits to technicians: no targets inside it, and paths bend around it.
  const PZ = { x: -1.5, z: -1.85 };
  function inPharmZone(x, z, r) { return Math.hypot(x - PZ.x, z - PZ.z) < r; }
  function segDist(ax, az, bx, bz) { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1e-6, t = Math.max(0, Math.min(1, ((PZ.x - ax) * dx + (PZ.z - az) * dz) / l2)); return Math.hypot(ax + dx * t - PZ.x, az + dz * t - PZ.z); }
  function keepOffPharm(s) {
    const p = s.g.position;
    const d = Math.hypot(p.x - PZ.x, p.z - PZ.z);
    if (d < 1.15) { const u = d < 1e-3 ? [0, -1] : [(p.x - PZ.x) / d, (p.z - PZ.z) / d]; p.x = PZ.x + u[0] * 1.15; p.z = PZ.z + u[1] * 1.15; }
    const w = s.wp[0];
    if (w && !w.pz) {
      if (inPharmZone(w.x, w.z, 1.5)) { s.wp.shift(); return; }
      if (segDist(p.x, p.z, w.x, w.z) < 1.3) {
        const side = -1;
        const dx = Math.sign(w.x - p.x) || 1;
        const mid = new T.Vector3(PZ.x - dx * 0.0, 0, PZ.z + side * 1.6); mid.pz = true;
        const pre = new T.Vector3(PZ.x - dx * 1.7, 0, PZ.z + side * 1.6); pre.pz = true;
        s.wp.unshift(pre, mid);
      }
    }
  }
  // Pick a spot behind the counter that is clear of furniture.
  function staffTarget() {
    let v;
    const ST = [-8.4, -6.9, -5.4];
    for (let tries = 0; tries < 12; tries++) {
      const r = Math.random();
      v = r < 0.35 ? new T.Vector3(-8 + Math.random() * 11, 0, -4.5) : r < 0.8 ? new T.Vector3(ST[Math.floor(Math.random() * 3)] + (Math.random() - 0.5) * 0.4, 0, -1.95) : new T.Vector3(-3.4 + Math.random() * 7, 0, -2.2);
      if (Crowd.clearance(v.x, v.z) > 0.65 && !inPharmZone(v.x, v.z, 1.5)) break;
    }
    if (inPharmZone(v.x, v.z, 1.5)) v.set(-8 + Math.random() * 5, 0, -4.5);
    return v;
  }
  // After 3 failed attempts to reach a spot, give up and choose somewhere else.
  function giveUpStaff(st) { st.wp = [staffTarget()]; st.idle = 0.3; }
  function syncStaff(n) {
    n = Math.min(6, n);
    while (staff.length < n) {
      const p = person(Math.floor(Math.random() * 99999), true, false, false, 'normal', uniOpts || undefined), t = staffTarget();
      p.position.set(t.x, 0, -2.4); staffGroup.add(p);
      staff.push({ g: p, r: 0.5, wp: [staffTarget()], idle: Math.random() * 2, phase: Math.random() * 6, work: 0, onStuck: giveUpStaff });
    }
    while (staff.length > n) { const s = staff.pop(); staffGroup.remove(s.g); }
  }
  function pickBody() { const r = Math.random(); return r < 0.15 ? 'jacked' : r < 0.3 ? 'obese' : 'normal'; }
  function bodyR(b) { return b === 'obese' ? 0.85 : b === 'jacked' ? 0.8 : 0.575; }
  const HIM_SPOT = [4.9, 1.3];
  function slotPos(i, c) { if (c && c.him) return new T.Vector3(HIM_SPOT[0], 0, HIM_SPOT[1]); if (queue.length && queue[0].him) i = Math.max(0, i - 1); if (rushOn) { if (i <= 2) return new T.Vector3(-1.5 + (c ? c.jx * 0.2 : 0), 0, 1.9 + i * 1.2); if (i <= 4) return new T.Vector3(-0.3 + (i - 3) * 1.25, 0, 4.3 + (c ? c.jz * 0.2 : 0)); const k = Math.min(i - 5, SEATS.length - 1); return new T.Vector3(SEATS[k][0], 0, SEATS[k][1]); } const s = SLOTS[Math.min(i, SLOTS.length - 1)]; return new T.Vector3(s[0] + (c ? c.jx : 0), 0, s[1] + (c ? c.jz : 0)); }
  function rollEvt() { const k = B.eventRoll(); if (k === 'inspector' || k === 'driver') { spawnVisitor(k); return null; } return k; }
  /* inspector and delivery driver: walk in, go behind the counter and wait to be clicked */
  let visitor = null; const VIS_AT = [2.4, -2.1];
  function spawnVisitor(kind) {
    if (!api.ok || !custGroup) return false;
    if (visitor) custGroup.remove(visitor.g);
    const seed = Math.floor(Math.random() * 100000), p = person(seed, false, false, false, 'normal', evtOpts(kind, seed));
    p.position.set(5, 0, 9.6); custGroup.add(p);
    const V = (x, z) => new T.Vector3(x, 0, z);
    visitor = { g: p, kind, seed, r: 0.5, wp: [V(5, 6.2), V(5, 1.5), V(5, -2.1), V(VIS_AT[0], VIS_AT[1])], phase: 0, state: 'in', dy: 3.0, speed: 2.5, sayT: 0, heading: 0 };
    return true;
  }
  function visitorTick(dt) {
    const v = visitor; if (!v) return;
    const w = moveTo(v, v.speed, dt, queue.concat(leaving, extras, cops, staff)); v.phase += dt; walkAnim(v.g, v.phase, w, dt);
    const P = v.g.userData.P, p = v.g.position;
    if (!w && !v.wp.length) {
      if (v.state === 'in') { v.state = 'wait'; v.sayT = 0; if (B.onVisitorArrive) B.onVisitorArrive(v.kind); }
      else if (v.state === 'out') { custGroup.remove(v.g); visitor = null; return; }
    }
    if (v.state === 'wait') {
      v.g.rotation.y = lerpAngle(v.g.rotation.y, Math.atan2(PZ.x - p.x, PZ.z - p.z), Math.min(1, dt * 4));
      P.arms[0].rotation.x = -2.2 + Math.sin(time * 6) * 0.25; p.y = Math.abs(Math.sin(time * 3)) * 0.05;
      v.sayT -= dt; if (v.sayT <= 0) { v.sayT = 2.4; say(v, v.kind === 'driver' ? '\uD83D\uDCE6' : '\uD83D\uDCCB', 'emo'); }
    } else p.y = 0;
  }
  api.visitorInfo = function () { return visitor ? { kind: visitor.kind, seed: visitor.seed, state: visitor.state } : null; };
  api.visitorLeave = function () {
    const v = visitor; if (!v || v.state === 'out') return;
    const V = (x, z) => new T.Vector3(x, 0, z); v.state = 'out'; v.g.position.y = 0;
    v.wp = [V(5, -2.1), V(5, 1.5), V(5, 6.2), V(5, 10.8)];
  };
  api.visitorReact = function (ok) { if (visitor) say(visitor, ok ? '\uD83D\uDC4D' : '\uD83D\uDE20', 'emo'); };
  api.visitorClick = function () { if (B.onVisitor) B.onVisitor(); };
  function evtOpts(k, seed) {
    if (k === 'inspector') return { inspector: true, shirt: '#4B5563', scrub: '#1F2937', gender: seed % 2 === 0 ? 'f' : 'm', tag: { vis: true } };
    if (k === 'driver') return { driver: true, shirt: '#8B5A2B', scrub: '#4B3621', gender: 'm', tag: { vis: true } };
    return undefined;
  }
  function spawnCustomer(instant, i) {
    const seed0 = Math.floor(Math.random() * 100000), special = queue.some(q => q.karen || q.sweaty || q.elder || q.evt || q.recall || q.regular), karen = !instant && !special && !!B.karenRoll(), sweaty = !instant && !special && !karen && !!B.sweatyRoll(), elder = !instant && !special && !karen && !sweaty && !!(B.elderRoll && B.elderRoll()), evt = !instant && !special && !karen && !sweaty && !elder && !visitor && !!(B.eventRoll) ? rollEvt() : null, sp = !instant && !special && !karen && !sweaty && !elder && !evt && !visitor && B.specialRoll ? B.specialRoll() : null, seed = sp ? sp.seed : seed0, body = karen || sweaty || elder || evt ? 'normal' : sp ? sp.body : pickBody(), p = person(seed, false, karen, sweaty, body, elder ? { elder: true, gender: seed % 2 === 0 ? 'f' : 'm' } : evtOpts(evt, seed));
    const c = { g: p, seed, wp: [], mood: null, moodT: 0, phase: Math.random() * 6, hop: 0, face: 0, karen, sweaty, elder, evt, recall: sp && sp.kind === 'recall' ? sp.k : null, regular: sp && sp.kind === 'regular' ? sp.n : null, body, r: bodyR(body), angry: karen, puffT: 0, dripT: 0, jx: (Math.random() - 0.5) * 0.3, jz: (Math.random() - 0.5) * 0.3, faceJit: (Math.random() - 0.5) * 0.8, wait: 0, emoteT: 3 + Math.random() * 8 };
    custGroup.add(p);
    if (instant) { const s = slotPos(i, c); p.position.set(s.x, 0, s.z); p.rotation.y = PI + c.faceJit; }
    else { p.position.set(5, 0, 9.6); c.wp.push(new T.Vector3(5, 0, 6.2)); }
    return c;
  }
  /* ---- waiting room: seats, and a few people who sit or wander while they wait ---- */
  const SEATS = [[8.8, 1.35, -PI / 2], [8.8, 2.2, -PI / 2], [8.8, 3.05, -PI / 2], [6.6, 5.45, PI], [7.7, 5.45, PI]];
  const IDLE_PTS = [[-2.8, 4.6], [3.4, 3.4], [6.0, 3.2], [6.9, 4.4], [0.9, 6.0], [-3.0, 6.1], [5.4, 2.0], [2.2, 5.6]];
  const idleCap = () => 3 + (Math.floor(time / 35) % 2);
  function endIdle(c) { c.idl = null; c.sit = false; c.seat = -1; }
  function idleTick(c, i, w, dt) {
    const special = c.karen || c.sweaty || c.elder || c.evt || c.caller || c.pusher || c.recall || c.regular;
    const P = c.g.userData.P;
    if (rushOn && i >= 5 && !special) {
      const k = Math.min(i - 5, SEATS.length - 1);
      if (!c.idl || c.idl.type !== 'sit' || c.seat !== k) { c.seat = k; c.sit = false; c.idl = { type: 'sit', seat: SEATS[k], t: 999 }; c.wp = [new T.Vector3(SEATS[k][0], 0, SEATS[k][1])]; }
      if (!c.sit && !w && !c.wp.length) c.sit = true;
      if (c.sit) { c.idl.t = 999; P.legs[0].rotation.x = P.legs[1].rotation.x = -1.45; P.arms[0].rotation.x = P.arms[1].rotation.x = -0.6; c.g.rotation.y = lerpAngle(c.g.rotation.y, SEATS[k][2], Math.min(1, dt * 6)); }
      return;
    }
    if (i === 0 || special || rushOn) { if (c.idl) { endIdle(c); c.wp = [slotPos(i, c)]; } return; }
    if (c.idl) {
      const d = c.idl;
      if (d.type === 'sit') {
        if (!c.sit && !w && !c.wp.length) { c.sit = true; d.t = 7 + Math.random() * 14; }
        if (c.sit) { P.legs[0].rotation.x = P.legs[1].rotation.x = -1.45; P.arms[0].rotation.x = P.arms[1].rotation.x = -0.6; c.g.rotation.y = lerpAngle(c.g.rotation.y, d.seat[2], Math.min(1, dt * 6)); d.t -= dt; }
      } else if (!w && !c.wp.length) { d.t -= dt; c.g.rotation.y = lerpAngle(c.g.rotation.y, d.yaw + Math.sin(time * 0.8 + c.phase) * 0.9, Math.min(1, dt * 3)); }
      if (d.t <= 0) { endIdle(c); c.wp = [slotPos(i, c)]; }
      return;
    }
    c.idleCd = (c.idleCd === undefined ? 2 + Math.random() * 5 : c.idleCd) - dt;
    if (c.idleCd > 0 || c.wp.length || w || c.wait < 3) return;
    c.idleCd = 3 + Math.random() * 7;
    if (queue.filter(q => q.idl).length >= idleCap()) return;
    const free = SEATS.map((s, k) => k).filter(k => !queue.some(q => q.seat === k));
    if (free.length && Math.random() < 0.55) { const k = free[Math.floor(Math.random() * free.length)]; c.seat = k; c.idl = { type: 'sit', seat: SEATS[k], t: 999 }; c.wp = [new T.Vector3(SEATS[k][0], 0, SEATS[k][1])]; }
    else { const q = IDLE_PTS[Math.floor(Math.random() * IDLE_PTS.length)]; c.idl = { type: 'walk', t: 5 + Math.random() * 7, yaw: Math.random() * 6.28 }; c.wp = [new T.Vector3(q[0], 0, q[1])]; }
  }
  function assignSlots() { queue.forEach((c, i) => { if (c.idl && i > 0) return; c.wp = c.wp.filter(w => w.z > 6); c.wp.push(slotPos(i, c)); }); }
  function setBubble(ch, cls) { if (!bubEl) return; bubEl.textContent = ch; bubEl.className = 'bub3d' + (cls ? ' ' + cls : ''); }
  api.nextCustomer = function () {
    if (!api.ok) return { seed: Math.floor(Math.random() * 100000), karen: false, sweaty: false };
    if (!queue.length) { for (let i = 0; i < 3; i++) queue.push(spawnCustomer(true, i)); }
    else {
      const c = queue.shift(); c.wp = EXIT.map(e => new T.Vector3(e[0], 0, e[1])); c.leaveFrom = c.g.position.clone();
      if (c.gone) custGroup.remove(c.g); else { if (c.mood === 'happy') c.hop = 0.6; leaving.push(c); }
      if (!queue.length) queue.push(spawnCustomer(false, 0));
      assignSlots();
    }
    cur = queue[0]; cur.mood = null; if (cur.karen) setBubble('!', 'kar'); else if (cur.recall) setBubble('\u21A9', 'rec'); else if (cur.regular) setBubble('\u2605', 'reg'); else setBubble(cur.evt === 'inspector' ? '\u2714' : cur.evt === 'driver' ? '\uD83D\uDCE6' : '?', '');
    return { seed: cur.seed, karen: !!cur.karen, sweaty: !!cur.sweaty, elder: !!cur.elder, evt: cur.evt || null, caller: !!cur.caller, body: cur.body || 'normal', recall: cur.recall || null, regular: cur.regular || null };
  };
  /* hard-of-hearing patient: eyes widen and question marks float off her head */
  function floatQ(c) {
    if (!host || !camera || paused || !c || !c.g) return;
    tmp.set(c.g.position.x + (Math.random() - 0.5) * 0.7, 2.55, c.g.position.z).project(camera); if (tmp.z > 1 || tmp.z < -1) return;
    const e = document.createElement('span'); e.className = 'q3d'; e.textContent = Math.random() < 0.3 ? '?!' : '?';
    e.style.left = Math.round((tmp.x * 0.5 + 0.5) * host.clientWidth) + 'px'; e.style.top = Math.round((-tmp.y * 0.5 + 0.5) * host.clientHeight) + 'px';
    e.style.setProperty('--dx', Math.round((Math.random() - 0.5) * 70) + 'px'); e.style.setProperty('--rot', Math.round((Math.random() - 0.5) * 50) + 'deg');
    host.appendChild(e); setTimeout(() => { if (e.parentNode) e.parentNode.removeChild(e); }, 1800);
  }
  api.elderConfuse = function (on) {
    const c = queue[0]; if (!api.ok || !c || !c.elder) return;
    const P = c.g.userData.P; if (P.scl) P.scl.forEach(m => { m.visible = !!on; }); P.eyes.forEach(m => m.scale.set(on ? 1.5 : 1, on ? 1.5 : 1, 1));
    if (on) { setBubble('??', 'kar'); for (let k = 0; k < 7; k++) setTimeout(() => floatQ(queue[0]), k * 320); }
    else setBubble('?', '');
  };
  // test helper: turn the next patient in line into the hard-of-hearing visitor
  api.devElder = function () {
    if (!api.ok || !queue.length) return false;
    if (queue.length < 2) { queue.push(spawnCustomer(false, 0)); assignSlots(); }
    const c = queue[1]; c.karen = c.sweaty = c.angry = false; c.evt = null;
    const old = c.g, p = person(c.seed, false, false, false, 'normal', { elder: true, gender: c.seed % 2 === 0 ? 'f' : 'm' });
    p.position.copy(old.position); p.rotation.y = old.rotation.y; custGroup.remove(old); custGroup.add(p); c.g = p; c.elder = true; c.body = 'normal'; c.r = bodyR('normal'); return true;
  };
  api.devEvent = function (kind) {
    if (kind === 'inspector' || kind === 'driver') return spawnVisitor(kind);
    if (!api.ok || !queue.length) return false;
    if (queue.length < 2) { queue.push(spawnCustomer(false, 0)); assignSlots(); }
    const c = queue[1]; c.karen = c.sweaty = c.elder = c.angry = false; c.evt = null;
    const old = c.g, p = person(c.seed, false, false, false, 'normal', evtOpts(kind, c.seed));
    p.position.copy(old.position); p.rotation.y = old.rotation.y; custGroup.remove(old); custGroup.add(p); c.g = p; c.evt = kind; c.body = 'normal'; c.r = bodyR('normal'); return true;
  };
  let arriveT = 9, rushOn = false, slowOn = false;
  api.setSlow = function (on) { slowOn = !!on; };
  api.setRush = function (on) { rushOn = !!on; if (on) arriveT = Math.min(arriveT, 1.5); if (api.ok && queue.length) assignSlots(); };
  function arrive() {
    if (queue.length >= maxq()) { spawnRejected(); return; }
    queue.push(spawnCustomer(false, 0)); assignSlots();
  }
  // The line is full: the newest patient takes one look and walks out frustrated.
  function spawnRejected() {
    const seed = Math.floor(Math.random() * 100000), body = pickBody(), p = person(seed, false, false, false, body);
    p.position.set(5, 0, 9.6); custGroup.add(p);
    leaving.push({ g: p, seed, body, r: bodyR(body), wp: [new T.Vector3(5, 0, 7.4)], phase: Math.random() * 6, rejected: true, turned: false, mood: null, moodT: 0, wait: 0 });
  }
  api.phoneRing = function (on) {
    if (!api.ok) return;
    phoneRinging = on; ringSayT = 0; if (!phoneObj) phoneObj = { g: phoneG, dy: 1.3 };
    if (!on && phoneG) { phoneG.rotation.z = 0; phoneHS.position.y = 0.3; phoneLamp.material.emissiveIntensity = 0.1; }
  };
  // A missed call: an angry caller storms in and cuts to the front of the line (right after the current patient).
  api.missedCall = function () {
    if (!api.ok) return;
    const seed = Math.floor(Math.random() * 100000), p = person(seed, false, true, false, 'normal');
    p.position.set(5, 0, 9.6); custGroup.add(p);
    const c = { g: p, seed, wp: [new T.Vector3(5, 0, 6.2)], mood: null, moodT: 0, phase: Math.random() * 6, hop: 0, face: 0, karen: true, sweaty: false, caller: true, pusher: true, speed: 3.8, body: 'normal', r: 0.65, angry: true, puffT: 0, dripT: 0, jx: 0, jz: 0, faceJit: 0, wait: 0, emoteT: 999 };
    queue.splice(Math.min(1, queue.length), 0, c); assignSlots();
    say(c, 'I tried to call!');
    let u = 0; tweens.push(function (dt) { u += dt; if (u > 2.4) { say(c, '😠', 'emo'); return true; } return false; });
  };
  api.react = function (ok, pay) {
    if (!api.ok || !cur) return;
    cur.mood = ok ? 'happy' : 'sad'; cur.moodT = 0;
    if (cur.karen) { if (ok) cur.angry = false; else { shake = 0.9; } }
    setBubble(ok ? '✓' : '✕', ok ? 'ok' : 'bad');
    if (pharm && (!pharm.fx || pharm.fx.type === 'bump')) startFx(pharm, ok ? (Math.random() < 0.5 ? 'smile' : 'wave') : 'sad');
    if (!cur.karen && !cur.sweaty) { if (ok && Math.random() < 0.4) say(cur, 'God bless!'); else say(cur, ok ? '😊' : (Math.random() < 0.5 ? '😢' : '😠'), 'emo'); }
    const cp = new T.Vector3(cur.g.position.x, 1.5, 0.3);
    if (ok) {
      if (shelfBottles.length) {
        const sb = shelfBottles[Math.floor(Math.random() * shelfBottles.length)], from = new T.Vector3();
        sb.getWorldPosition(from);
        const bt = new T.Group(); cy(bt, 0.2, 0.2, 0.5, 6, BOT[Math.floor(Math.random() * 5)], 0, 0, 0); cy(bt, 0.14, 0.14, 0.14, 6, '#27384F', 0, 0.3, 0); bt.scale.set(1.4, 1.4, 1.4); scene.add(bt);
        const to = new T.Vector3(cur.g.position.x, 1.5, 0.5); let u = 0;
        tweens.push(function (dt) { u += dt / 0.8; const k = Math.min(1, u); bt.position.lerpVectors(from, to, k); bt.position.y += Math.sin(k * PI) * 2.2; bt.rotation.y += dt * 8; if (u >= 1) { scene.remove(bt); burst(to, Math.min(14, 5 + Math.round(pay / 8)), 0xF2A516, 1); return true; } return false; });
      }
    } else { burst(cp, 8, 0xE04F3A, 0.6); shake = 0.5; }
  };
  api.built = function () { };
  api.karenLoss = function (id) {
    if (!api.ok || !ug[id]) return;
    const b = BASE[id]; burst(new T.Vector3(b[0], 2, b[2]), 14, 0xE04F3A, 1.2); shake = 0.9;
    const mm = hl[id] || []; mm.forEach(m => { if (!m.userData.base) m.emissive.setHex(0x8a1c0c); });
    let u = 0;
    tweens.push(function (dt) { u += dt; const g = ug[id], sc = 1 - Math.sin(Math.min(1, u / 0.5) * PI) * 0.25; g.scale.set(sc, sc, sc); if (u >= 0.9) { g.scale.set(1, 1, 1); mm.forEach(m => m.emissive.setHex(m.userData.base || 0)); return true; } return false; });
  };

  /* ---- effects ---- */
  const puffs = [], drops = [], extras = [];
  function emitPuff(x, y, z) {
    if (synOn || labOn) return;
    for (const p of puffs) { if (p.life > 0) continue; p.life = 0.9; p.m.visible = true; p.m.position.set(x, y, z); p.m.scale.set(1, 1, 1); p.m.material.opacity = 0.9; p.vx = (Math.random() - 0.5) * 0.8; p.vz = (Math.random() - 0.5) * 0.8; return; }
  }
  function emitDrop(x, y, z) {
    if (synOn || labOn) return;
    for (const d of drops) { if (d.life > 0) continue; d.life = 1.1; d.m.visible = true; d.m.position.set(x, y, z); d.m.scale.set(1, 1, 1); d.m.material.opacity = 0.95; d.vy = 0.5 + Math.random(); d.vx = (Math.random() - 0.5) * 1.6; d.vz = Math.random() * 0.8; return; }
  }
  function sweatyFx(c, dt) {
    if (!c.sweaty) return;
    const P = c.g.userData.P;
    c.dripT -= dt; if (c.dripT <= 0) { c.dripT = 0.07; emitDrop(c.g.position.x + (Math.random() - 0.5) * 0.4, c.g.position.y + 2.15, c.g.position.z + 0.15); }
    c.g.rotation.z = Math.sin(time * 47) * 0.035;
    if (!c.wp.length) { P.arms[0].rotation.x = -1.0 + Math.sin(time * 11) * 0.25; P.arms[1].rotation.x = -1.0 + Math.sin(time * 11 + 2) * 0.25; }
  }
  api.interrupt = function (on) {
    if (!api.ok) return;
    if (on) {
      extras.forEach(e => custGroup.remove(e.g)); extras.length = 0;
      const p = person(Math.floor(Math.random() * 99999), false, false, true); p.position.set(5, 0, 9.6); custGroup.add(p);
      const V = (x, z) => new T.Vector3(x, 0, z);
      extras.push({ g: p, sweaty: true, r: 0.5, wp: [V(5, 6.2), V(-3.5, 6.2), V(-3.5, 1.7)], phase: 0, dripT: 0, leaving: false });
    } else extras.forEach(e => { if (!e.leaving) { e.leaving = true; e.wp = [new T.Vector3(-3.5, 0, 6.2), new T.Vector3(5, 0, 6.2), new T.Vector3(5, 0, 10.5)]; } });
  };
  /* ---- bumping and clicked-patient reactions (cosmetic only) ---- */
  const says = [];
  function say(o, text, cls) {
    if (!tagsEl || says.length > 6) return;
    const el = document.createElement('div'); el.className = 'say3d'; el.setAttribute('aria-hidden', 'true');
    const sp = document.createElement('span'); sp.textContent = text; if (cls) sp.className = cls; el.appendChild(sp); tagsEl.appendChild(el);
    says.push({ el, o, t: 0 });
  }
  let lastBumpSay = -99;
  const BUMP_SAY = ['Oof!', 'Oops!', 'Sorry!', 'Hey!', 'Watch it!'];
  function onBump(a, b) {
    if (a.pet || b.pet) return;
    let said = false;
    [a, b].forEach(o => {
      if (o.bumpCd > 0 || o.noFx) return;
      o.bumpCd = 1.6; o.dodge = 1.8; o.stall = Math.max(o.stall || 0, 0.45);
      if (!o.fx) o.fx = { type: 'bump', t: 0, dur: 0.5 };
      if (!said && says.length < 2 && time - lastBumpSay > 7 && Math.random() < 0.1) { said = true; lastBumpSay = time; say(o, BUMP_SAY[Math.floor(Math.random() * BUMP_SAY.length)]); }
    });
  }
  // Little personality moments. Purely cosmetic.
  const FX_DUR = { energy: 1.3, wave: 1.6, hop: 0.9, sneeze: 1.1, cough: 1.0, smile: 0.8, sad: 1.4, angry: 1.2, tired: 1.6 };
  const FX_SAY = { energy: ['⚡ I feel so sharp!', '🧠 It all makes sense!', '🚀 So much energy!', '✨ I can see the whole formulary!', '💡 I get it now!', '🤩 Wow, I am on fire!'], wave: ['👋'], sneeze: ['🤧 Achoo!'], cough: ['😷 *cough*'], smile: ['😊'], sad: ['😢'], angry: ['😠'], tired: ['😴'], hop: ['Boing!', 'Wheee!', 'Hop!'] };
  function startFx(o, type) {
    if (o.fx && o.fx.type !== 'bump') return false;
    const dur = FX_DUR[type]; o.fx = { type, t: 0, dur }; o.lastFx = type;
    if (type === 'hop' || type === 'sneeze' || type === 'cough') o.stall = Math.max(o.stall || 0, dur);
    const t = FX_SAY[type]; say(o, t[Math.floor(Math.random() * t.length)], /^[^\w]*$/.test(t[0]) ? 'emo' : '');
    return true;
  }
  const CHAT = ["My text says it's ready!", 'My doctor already sent it!', 'God bless', 'Is it ready yet?', 'It should be under Smith.', 'Do you take my insurance?', 'I only need a refill!', 'Can I just pick it up?'];
  const CHAT_MAD = ["I've been here forever!", 'This is taking too long!', "My text says it's ready!", 'My doctor already sent it!', 'Hello? Anyone?'];
  function idleEmote(c) {
    const w = c.wait, r = Math.random();
    if (Math.random() < 0.4 && says.length < 3) { const L = w > 30 ? CHAT_MAD : CHAT; say(c, L[Math.floor(Math.random() * L.length)]); return; }
    let t;
    if (w < 14) t = r < 0.65 ? 'smile' : 'cough';
    else if (w < 35) t = r < 0.3 ? 'tired' : r < 0.55 ? 'sad' : r < 0.8 ? 'cough' : 'smile';
    else t = r < 0.6 ? 'angry' : r < 0.85 ? 'sad' : 'tired';
    startFx(c, t);
  }
  function fxPass(o, dt) {
    const f = o.fx; if (!f || o.noFx) return;
    f.t += dt; const k = Math.min(1, f.t / f.dur), g = o.g, P = g.userData.P, arms = v => { P.arms[0].rotation.x = P.arms[1].rotation.x = v; };
    switch (f.type) {
      case 'bump': g.position.y = Math.abs(Math.sin(k * PI)) * 0.2; g.rotation.z = Math.sin(k * PI * 3) * 0.2 * (1 - k); break;
      case 'wave': arms(-0.7); P.arms[1].rotation.x = -2.7 + Math.sin(f.t * 11) * 0.45; break;
      case 'energy': g.position.y = Math.abs(Math.sin(k * PI * 3)) * 0.45; g.rotation.y = Math.sin(f.t * 12) * 0.35; g.rotation.z = Math.sin(f.t * 22) * 0.06; arms(-2.7 + Math.sin(f.t * 20) * 0.4); break;
      case 'hop': g.position.y = Math.abs(Math.sin(k * PI * 2)) * (o.hopH || 0.7); g.rotation.z = Math.sin(f.t * 18) * 0.05 * (1 - k); arms(-2.6 + Math.sin(f.t * 14) * 0.3); break;
      case 'smile': g.position.y = Math.abs(Math.sin(k * PI * 2)) * 0.12; arms(-0.6 + Math.sin(f.t * 10) * 0.2); break;
      case 'sad': g.rotation.x = 0.32 * Math.sin(k * PI); g.position.y = -0.04 * Math.sin(k * PI); arms(0.15); break;
      case 'tired': g.rotation.x = 0.26 * Math.sin(k * PI); g.rotation.z = Math.sin(f.t * 2.2) * 0.08; arms(0.1); break;
      case 'angry': g.rotation.z = Math.sin(f.t * 40) * 0.07; g.position.y = Math.abs(Math.sin(f.t * 12)) * 0.08; arms(-2.3 + Math.sin(f.t * 16) * 0.35); P.shirtM.emissive.setHex(0x5a1208); break;
      case 'cough': g.rotation.x = 0.32 * Math.abs(Math.sin(k * PI * 2)); arms(-2.0); break;
      default: // sneeze
        if (k < 0.45) { const u = k / 0.45; g.rotation.x = -0.28 * u; g.position.y = u * 0.08; arms(-2.1); }
        else {
          if (!f.did) {
            f.did = true; const fx = Math.sin(g.rotation.y), fz = Math.cos(g.rotation.y);
            for (let i = 0; i < 5; i++) emitPuff(g.position.x + fx * 0.55 + (Math.random() - 0.5) * 0.3, 1.8, g.position.z + fz * 0.55 + (Math.random() - 0.5) * 0.3);
          }
          const u = (k - 0.45) / 0.55; g.rotation.x = 0.4 * (1 - u) * (1 - u); g.position.y = 0; arms(-1.2);
        }
    }
    if (k >= 1) { g.position.y = 0; g.rotation.x = 0; if (!o.karen && !o.sweaty) g.rotation.z = 0; if (f.type === 'angry' && !o.mood) P.shirtM.emissive.setHex(0); o.fx = null; }
  }
  function react(g) {
    if (pharm && g === pharm.g) { if (!pharm.fx || pharm.fx.type === 'bump') startFx(pharm, ['wave', 'smile', 'hop'][Math.floor(Math.random() * 3)]); return; }
    const o = queue.concat(leaving, extras, pets, cops).find(c => c.g === g);
    if (!o) return;
    if (o.pet) { petReact(o); return; }
    if (o.fx && o.fx.type !== 'bump') return;
    const bag = ['hop', 'hop', 'sneeze', 'cough', 'smile', 'sad', 'angry', 'tired'].filter(t => t !== o.lastFx);
    startFx(o, bag[Math.floor(Math.random() * bag.length)]);
  }
  /* ---- the player's pharmacist ---- */
  const HAIR_MAP = [0, 3, 5, 6, 7, 4, 8, 9, 10, 11, 12, 13];
  api.setPharmacist = function (me) {
    if (!api.ok || !pharmG) return;
    if (pharm) pharmG.remove(pharm.g);
    const g = person(1, false, false, false, me.body === 'normal' ? undefined : me.body, { skin: me.skin, hair: me.hairCol, shirt: me.shirtCol || '#F7FBFB', shoes: me.shoes || null, hairStyle: HAIR_MAP[me.hair] === undefined ? 0 : HAIR_MAP[me.hair], gender: me.gender, coat: true, scrub: me.scrub, acc: me.acc, accOn: me.accOn || 0, cosm: me.cosm || null, tag: { pharm: true } });
    g.position.set(-1.5, 0, -1.85); pharmG.add(g);
    lastMe = me; if (labOn) buildLabPerson();
    pharm = { g, wp: [], r: 0.5, phase: 0, dy: 3.1 };
    startFx(pharm, 'wave');
  };


  /* ---- shop: wall paint, floor tiles, decorations, technician uniforms ---- */
  let uniOpts = null, decorG = null, surfReady = false;
  const decorBuilt = {}, decorObst = {}, decorAnim = [];
  function surfMat(list) { if (!list.length) return null; const m = list[0].material.clone ? list[0].material.clone() : list[0].material; list.forEach(x => { x.material = m; }); return m; }
  const DECOR_OBST = { cooler: { x0: -9.45, x1: -8.7, z0: 2.65, z1: 3.35 }, vend: { x0: -9.5, x1: -8.5, z0: 1.35, z1: 2.45 } };
  function buildDecor(id) {
    const g = new T.Group();
    if (id === 'rug') {
      g.position.set(-7.3, 0, 4.2);
      bx(g, 3.2, 0.04, 2.0, '#B5543F', 0, 0.08, 0); bx(g, 2.8, 0.05, 1.6, '#E8C07A', 0, 0.085, 0); bx(g, 2.4, 0.06, 1.2, '#2C7A8C', 0, 0.09, 0); bx(g, 1.4, 0.07, 0.4, '#E8C07A', 0, 0.095, 0);
    } else if (id === 'bell') {
      g.position.set(-0.5, 1.26, 0.55);
      cy(g, 0.17, 0.19, 0.04, 10, '#27384F', 0, 0.02, 0); const d = ico(g, 0.14, '#F2C94C', 0, 0.1, 0); d.scale.set(1, 0.7, 1); cy(g, 0.025, 0.025, 0.05, 6, '#F2C94C', 0, 0.2, 0);
    } else if (id === 'cactus') {
      g.position.set(3.6, 1.26, 0.6);
      cy(g, 0.15, 0.12, 0.2, 7, '#E07A4F', 0, 0.1, 0); cy(g, 0.1, 0.1, 0.34, 6, '#3E8E41', 0, 0.37, 0); bx(g, 0.2, 0.06, 0.06, '#3E8E41', -0.13, 0.36, 0); bx(g, 0.06, 0.2, 0.06, '#3E8E41', -0.22, 0.46, 0); bx(g, 0.2, 0.06, 0.06, '#3E8E41', 0.13, 0.28, 0); bx(g, 0.06, 0.18, 0.06, '#3E8E41', 0.22, 0.36, 0); ico(g, 0.04, '#F29BC1', 0, 0.58, 0);
    } else if (id === 'lava') {
      g.position.set(-8.7, 1.26, 0.5);
      cy(g, 0.14, 0.17, 0.12, 8, '#27384F', 0, 0.06, 0); const gl = cy(g, 0.08, 0.13, 0.46, 8, '#E04F3A', 0, 0.35, 0, null, { emissive: new T.Color(0xE04F3A), emissiveIntensity: 0.7, transparent: true, opacity: 0.85 }); cy(g, 0.05, 0.08, 0.08, 8, '#27384F', 0, 0.62, 0);
      const bl = [0, 1, 2].map(i => ico(g, 0.045, '#FFC857', 0, 0.2 + i * 0.12, 0)); decorAnim.push(t => bl.forEach((b, i) => { b.position.y = 0.22 + (Math.sin(t * 0.9 + i * 2.1) * 0.5 + 0.5) * 0.3; b.position.x = Math.sin(t * 0.6 + i) * 0.03; }));
    } else if (id === 'fish') {
      g.position.set(-7.2, 1.26, 0.45);
      bx(g, 1.0, 0.05, 0.5, '#27384F', 0, 0.025, 0); bx(g, 0.96, 0.08, 0.46, '#E8D9A8', 0, 0.09, 0); bx(g, 0.96, 0.46, 0.46, '#BFE9F5', 0, 0.36, 0, null, { transparent: true, opacity: 0.35 }); bx(g, 1.02, 0.04, 0.52, '#27384F', 0, 0.62, 0);
      bx(g, 0.05, 0.22, 0.05, '#3E8E41', -0.3, 0.22, 0.05); bx(g, 0.05, 0.3, 0.05, '#56A85A', -0.22, 0.26, -0.05);
      const fs = [['#F28C28', 0], ['#4C7BD9', 2.1], ['#F2C94C', 4.2]].map(f => { const fg = new T.Group(); ico(fg, 0.06, f[0], 0, 0, 0); bx(fg, 0.05, 0.08, 0.02, f[0], -0.08, 0, 0); g.add(fg); return { fg, ph: f[1] }; });
      decorAnim.push(t => fs.forEach((f, i) => { const u = t * 0.5 + f.ph; f.fg.position.set(Math.sin(u) * 0.36, 0.3 + i * 0.07 + Math.sin(u * 1.7) * 0.04, -0.08 + i * 0.07); f.fg.rotation.y = Math.cos(u) > 0 ? 0 : PI; }));
    } else if (id === 'cooler') {
      g.position.set(-9.1, 0, 3.0); g.rotation.y = PI / 2;
      bx(g, 0.5, 0.95, 0.45, '#F4F9F9', 0, 0.475, 0); bx(g, 0.52, 0.05, 0.47, '#27384F', 0, 0.97, 0); cy(g, 0.2, 0.2, 0.42, 9, '#8FD3F4', 0, 1.22, 0, null, { transparent: true, opacity: 0.6 }); cy(g, 0.08, 0.2, 0.08, 9, '#8FD3F4', 0, 1.47, 0, null, { transparent: true, opacity: 0.6 }); bx(g, 0.1, 0.06, 0.06, '#4C7BD9', -0.1, 0.72, 0.25); bx(g, 0.1, 0.06, 0.06, '#E04F3A', 0.1, 0.72, 0.25); bx(g, 0.34, 0.2, 0.02, '#27384F', 0, 0.35, 0.23);
    } else if (id === 'vend') {
      g.position.set(-9.0, 0, 1.9); g.rotation.y = PI / 2;
      bx(g, 1.05, 1.9, 0.85, '#D9374A', 0, 0.95, 0); bx(g, 0.72, 1.2, 0.04, '#1F3B4A', -0.1, 1.15, 0.44, null, { emissive: new T.Color(0x1B5F73), emissiveIntensity: 0.4 });
      const cols = ['#F2C94C', '#4C7BD9', '#E04F3A', '#2FAE66', '#F29BC1'];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) bx(g, 0.14, 0.2, 0.1, cols[(r + c) % 5], -0.31 + c * 0.17, 0.78 + r * 0.28, 0.4);
      bx(g, 0.2, 0.5, 0.04, '#27384F', 0.39, 1.2, 0.44); [0, 1, 2].forEach(i => bx(g, 0.1, 0.06, 0.03, '#F4F9F9', 0.39, 1.35 - i * 0.12, 0.47)); bx(g, 0.7, 0.2, 0.04, '#27384F', -0.1, 0.32, 0.44);
      bx(g, 0.9, 0.18, 0.03, '#F2C94C', 0, 1.8, 0.44);
    } else if (id === 'neon') {
      g.position.set(-9.55, 3.55, 2.2); g.rotation.y = PI / 2;
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96; const cx = cv.getContext('2d');
      cx.fillStyle = '#101018'; cx.fillRect(0, 0, 256, 96); cx.strokeStyle = '#FF5FA2'; cx.lineWidth = 4; cx.strokeRect(6, 6, 244, 84);
      cx.font = '800 54px sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.shadowColor = '#FF5FA2'; cx.shadowBlur = 14; cx.fillStyle = '#FFD6E8'; cx.fillText('OPEN', 128, 52);
      const tx = new T.CanvasTexture(cv), pl = new T.Mesh(new T.PlaneGeometry(1.3, 0.49), new T.MeshBasicMaterial({ map: tx })); pl.position.z = 0.03; g.add(pl); bx(g, 1.36, 0.55, 0.05, '#101018', 0, 0, 0);
    } else return null;
    decorG.add(g); return g;
  }
  function applyStore(st) {
    if (!api.ok || !decorG) return;
    st = st || {};
    if (!surfReady) { surfReady = true; shopSurf.bm = surfMat(shopSurf.back); shopSurf.sm = surfMat(shopSurf.side); shopSurf.am = surfMat(shopSurf.fa); shopSurf.fm = surfMat(shopSurf.fb); }
    const wl = SHOP_WALLS.find(w => w[0] === st.walls) || SHOP_WALLS[0], fl = SHOP_FLOORS.find(f => f[0] === st.floor) || SHOP_FLOORS[0];
    if (shopSurf.bm) shopSurf.bm.color.set(wl[2]); if (shopSurf.sm) shopSurf.sm.color.set(wl[3]);
    if (shopSurf.am) shopSurf.am.color.set(fl[2]); if (shopSurf.fm) shopSurf.fm.color.set(fl[3]);
    const want = {}; (st.deco || []).forEach(id => { want[id] = true; });
    decorAnim.length = 0;
    Object.keys(decorBuilt).forEach(id => { decorG.remove(decorBuilt[id]); delete decorBuilt[id]; const o = decorObst[id]; if (o) { const i = OBST.indexOf(o); if (i >= 0) OBST.splice(i, 1); delete decorObst[id]; } });
    SHOP_DECOR.forEach(d => { const id = d[0]; if (!want[id]) return; const g = buildDecor(id); if (!g) return; decorBuilt[id] = g; if (DECOR_OBST[id]) { decorObst[id] = DECOR_OBST[id]; OBST.push(decorObst[id]); } });
  }
  function decorTick(t) { for (let i = 0; i < decorAnim.length; i++) decorAnim[i](t); }
  api.setStore = function (st) { try { applyStore(st); } catch (e) { /* cosmetic only */ } };
  api.setStaffLook = function (spec) {
    uniOpts = spec || null;
    if (!api.ok || !staffGroup) return;
    const n = staff.length; while (staff.length) { const s = staff.pop(); staffGroup.remove(s.g); } syncStaff(n);
  };

  /* ---- unlockable framed photos ---- */
  const WALL = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) WALL.push({ x: 3.1 + c * 1.25, y: r ? 5.85 : 4.95, z: -7.17, ry: 0 });
  for (let r = 0; r < 2; r++) for (let c = 0; c < (r ? 7 : 8); c++) WALL.push({ x: -9.48, y: r ? 5.85 : 4.95, z: -6.6 + c * 1.55, ry: PI / 2 });
  const rot = (m, z) => { m.rotation.z = z; return m; };
  const cone = (p, r, h, seg, c, x, y, z) => add(p, new T.ConeGeometry(r, h, seg), c, x, y, z);
  const flat = (m) => { m.rotation.x = PI / 2; return m; };
  const sc = (m, x, y, z) => { m.scale.set(x, y, z); return m; };
  const ART = [
    { n: 'Apple', e: '🍎', bg: '#F6E7C9', d: a => { ico(a, 0.2, '#D8392B', 0, -0.03, 0); cy(a, 0.015, 0.015, 0.12, 5, '#6C4C3A', 0, 0.19, 0); bx(a, 0.1, 0.03, 0.05, '#3E8E41', 0.07, 0.2, 0); } },
    { n: 'Capsule', e: '💊', bg: '#E6EEF8', d: a => { const c = new T.Group(); cy(c, 0.09, 0.09, 0.2, 8, '#E04F3A', 0, 0.1, 0); ico(c, 0.09, '#E04F3A', 0, 0.2, 0); cy(c, 0.09, 0.09, 0.2, 8, '#F4F7F7', 0, -0.1, 0); ico(c, 0.09, '#F4F7F7', 0, -0.2, 0); c.rotation.z = 0.8; a.add(c); } },
    { n: 'Banana', e: '🍌', bg: '#CFE8F5', d: a => { rot(bx(a, 0.16, 0.1, 0.08, '#F4D03F', -0.14, -0.02, 0), -0.6); bx(a, 0.2, 0.1, 0.08, '#F4D03F', 0, -0.1, 0); rot(bx(a, 0.16, 0.1, 0.08, '#F4D03F', 0.14, -0.02, 0), 0.6); bx(a, 0.04, 0.05, 0.05, '#6C4C3A', 0.2, 0.04, 0); } },
    { n: 'Tablet', e: '⚪', bg: '#F4E9F4', d: a => { flat(cy(a, 0.2, 0.2, 0.06, 12, '#FFFFFF', 0, 0, 0)); bx(a, 0.4, 0.02, 0.02, '#C9D0D4', 0, 0, 0.04); } },
    { n: 'Orange', e: '🍊', bg: '#E9F2D0', d: a => { ico(a, 0.21, '#F28C1C', 0, -0.02, 0); bx(a, 0.1, 0.03, 0.05, '#3E8E41', 0.04, 0.2, 0); } },
    { n: 'Blister pack', e: '💊', bg: '#E9F0F4', d: a => { bx(a, 0.46, 0.6, 0.03, '#C9D6DC', 0, 0, 0); for (let i = 0; i < 6; i++) ico(a, 0.07, i % 2 ? '#F2A516' : '#E04F3A', -0.1 + (i % 2) * 0.2, 0.18 - Math.floor(i / 2) * 0.18, 0.04); } },
    { n: 'Carrot', e: '🥕', bg: '#F5EAD7', d: a => { rot(cone(a, 0.1, 0.46, 5, '#F28C1C', 0, -0.04, 0), PI); cone(a, 0.04, 0.14, 4, '#3E8E41', -0.04, 0.26, 0); cone(a, 0.04, 0.16, 4, '#3E8E41', 0.04, 0.26, 0); } },
    { n: 'Pill bottle', e: '🧴', bg: '#F3EEDF', d: a => { cy(a, 0.17, 0.17, 0.4, 8, '#E8923A', 0, -0.04, 0); cy(a, 0.19, 0.19, 0.1, 8, '#FFFFFF', 0, 0.2, 0); bx(a, 0.22, 0.2, 0.02, '#FFFFFF', 0, -0.04, 0.17); } },
    { n: 'Broccoli', e: '🥦', bg: '#EAE4D2', d: a => { bx(a, 0.1, 0.22, 0.1, '#7DBE5E', 0, -0.14, 0); [[-0.1, 0.06], [0.1, 0.06], [0, 0.14], [0, 0]].forEach(p => ico(a, 0.12, '#2F8F46', p[0], p[1], 0)); } },
    { n: 'Syringe', e: '💉', bg: '#EAF2F0', d: a => { const c = new T.Group(); cy(c, 0.06, 0.06, 0.34, 8, '#F4F7F7', 0, 0, 0); cy(c, 0.015, 0.015, 0.16, 5, '#9FB0B5', 0, 0.25, 0); cy(c, 0.02, 0.02, 0.18, 5, '#27384F', 0, -0.2, 0); bx(c, 0.14, 0.03, 0.05, '#27384F', 0, -0.3, 0); c.rotation.z = 0.8; a.add(c); } },
    { n: 'Bread', e: '🍞', bg: '#D8EBF0', d: a => { bx(a, 0.42, 0.22, 0.16, '#D9A05B', 0, -0.06, 0); ico(a, 0.14, '#D9A05B', -0.1, 0.07, 0); ico(a, 0.14, '#D9A05B', 0.1, 0.07, 0); bx(a, 0.04, 0.02, 0.02, '#B87A38', 0, 0.1, 0.12); } },
    { n: 'Inhaler', e: '🌬️', bg: '#E9EEF8', d: a => { bx(a, 0.15, 0.36, 0.12, '#4C7BD9', 0, 0.02, 0); bx(a, 0.3, 0.13, 0.12, '#4C7BD9', 0.07, -0.2, 0); bx(a, 0.1, 0.1, 0.1, '#F4F7F7', 0.24, -0.2, 0); bx(a, 0.12, 0.05, 0.12, '#F4F7F7', 0, 0.22, 0); } },
    { n: 'Cheese', e: '🧀', bg: '#E4EEF8', d: a => { bx(a, 0.4, 0.22, 0.2, '#F4C430', 0, -0.05, 0); bx(a, 0.4, 0.06, 0.2, '#E0A920', 0, 0.08, 0); bx(a, 0.07, 0.07, 0.03, '#D9A520', -0.1, -0.04, 0.1); bx(a, 0.05, 0.05, 0.03, '#D9A520', 0.1, -0.08, 0.1); } },
    { n: 'Eye drops', e: '👁️', bg: '#EEF3E4', d: a => { cy(a, 0.08, 0.1, 0.28, 8, '#7FC8E8', 0, -0.07, 0); cone(a, 0.05, 0.12, 6, '#F4F7F7', 0, 0.13, 0); ico(a, 0.05, '#4CA3DD', 0.17, -0.12, 0); } },
    { n: 'Fried egg', e: '🍳', bg: '#F2E4E4', d: a => { flat(cy(a, 0.24, 0.24, 0.04, 9, '#FFFFFF', 0, 0, 0)); ico(a, 0.1, '#F6B21A', 0.02, 0.01, 0.05); } },
    { n: 'Caplet', e: '💊', bg: '#F2ECE0', d: a => { const c = new T.Group(); bx(c, 0.26, 0.12, 0.12, '#F2A516', 0, 0, 0); ico(c, 0.06, '#F2A516', -0.13, 0, 0); ico(c, 0.06, '#F2A516', 0.13, 0, 0); c.rotation.z = 0.5; a.add(c); } },
    { n: 'Pizza', e: '🍕', bg: '#F7E1D0', d: a => { sc(rot(cone(a, 0.3, 0.52, 3, '#F2C04E', 0, -0.03, 0), PI), 1, 1, 0.3); bx(a, 0.5, 0.07, 0.07, '#C98A3C', 0, 0.22, 0); [[-0.05, 0.12], [0.07, 0.04], [-0.02, -0.08]].forEach(p => flat(cy(a, 0.05, 0.05, 0.03, 6, '#C0392B', p[0], p[1], 0.05))); } },
    { n: 'Ointment', e: '🧪', bg: '#EDE7F4', d: a => { bx(a, 0.2, 0.42, 0.06, '#2CCDBB', 0, 0, 0); bx(a, 0.22, 0.04, 0.06, '#27384F', 0, -0.23, 0); cy(a, 0.06, 0.06, 0.1, 6, '#FFFFFF', 0, 0.26, 0); } },
    { n: 'Cake', e: '🍰', bg: '#E5F0F5', d: a => { cy(a, 0.22, 0.24, 0.2, 8, '#F4A6B8', 0, -0.1, 0); cy(a, 0.2, 0.2, 0.05, 8, '#FFFFFF', 0, 0.03, 0); ico(a, 0.05, '#C0392B', 0, 0.1, 0); } },
    { n: 'Cough syrup', e: '🍯', bg: '#F4E7E3', d: a => { cy(a, 0.13, 0.15, 0.36, 8, '#B03A48', 0, -0.05, 0); cy(a, 0.06, 0.06, 0.1, 6, '#B03A48', 0, 0.18, 0); cy(a, 0.08, 0.08, 0.06, 6, '#FFFFFF', 0, 0.25, 0); bx(a, 0.2, 0.16, 0.02, '#FFFFFF', 0, -0.05, 0.15); } },
    { n: 'Avocado', e: '🥑', bg: '#F3E8D4', d: a => { sc(ico(a, 0.2, '#3E7D3A', 0, 0, 0), 0.9, 1.2, 0.9); sc(ico(a, 0.14, '#C8E27A', 0, 0, 0.06), 0.9, 1.2, 0.7); ico(a, 0.07, '#7B4A2A', 0, -0.04, 0.1); } },
    { n: 'Gummy vitamins', e: '🐻', bg: '#F5EBD8', d: a => { [['#E04F3A', -0.11, -0.06], ['#4CAF50', 0.11, 0.02], ['#F2A516', -0.02, 0.14]].forEach(p => { ico(a, 0.1, p[0], p[1], p[2], 0); ico(a, 0.05, p[0], p[1] - 0.06, p[2] + 0.1, 0); ico(a, 0.04, p[0], p[1] + 0.08, p[2] + 0.08, 0); }); } },
    { n: 'Grapes', e: '🍇', bg: '#E7EAF6', d: a => { [[-0.1, 0.1], [0.1, 0.1], [0, 0.1], [-0.05, 0], [0.05, 0], [0, -0.1], [0, 0.2]].forEach(p => ico(a, 0.07, '#7B3FA0', p[0], p[1], 0)); bx(a, 0.03, 0.1, 0.03, '#6C4C3A', 0, 0.28, 0); } },
    { n: 'Nasal spray', e: '👃', bg: '#E4F0F6', d: a => { cy(a, 0.1, 0.1, 0.34, 8, '#F4F7F7', 0, -0.05, 0); cy(a, 0.03, 0.03, 0.12, 6, '#4C7BD9', 0, 0.24, 0); bx(a, 0.16, 0.05, 0.06, '#4C7BD9', 0, 0.17, 0); } },
    { n: 'Strawberry', e: '🍓', bg: '#F2E9D8', d: a => { rot(cone(a, 0.17, 0.34, 6, '#D8392B', 0, -0.03, 0), PI); cone(a, 0.1, 0.07, 5, '#3E8E41', 0, 0.17, 0); [[-0.06, 0.04], [0.06, 0.0], [0, -0.08]].forEach(p => bx(a, 0.02, 0.03, 0.02, '#F4D03F', p[0], p[1], 0.13)); } },
    { n: 'Mortar & pestle', e: '⚗️', bg: '#EFE9DE', d: a => { cy(a, 0.24, 0.16, 0.2, 10, '#8E9AA1', 0, -0.1, 0); cy(a, 0.25, 0.25, 0.03, 10, '#A9B4BA', 0, 0, 0); rot(cy(a, 0.04, 0.05, 0.4, 6, '#6C4C3A', 0.1, 0.14, 0.02), -0.6); } },
    { n: 'Watermelon', e: '🍉', bg: '#E8F2F2', d: a => { flat(cy(a, 0.28, 0.28, 0.05, 10, '#2E8B57', 0, 0, 0)); flat(cy(a, 0.24, 0.24, 0.06, 10, '#E8506A', 0, 0, 0.01)); [[-0.08, 0.05], [0.08, 0.02], [0, -0.08]].forEach(p => bx(a, 0.03, 0.05, 0.02, '#1B1B24', p[0], p[1], 0.05)); } }
  ];
  api.artMeta = ART.map(a => ({ n: a.n, e: a.e }));
  function frameMesh(i) {
    const f = new T.Group(), W = 0.72, H = 0.9;
    bx(f, W, H, 0.07, '#8A5A3B', 0, 0, 0); bx(f, W - 0.12, H - 0.12, 0.08, '#FBF7EE', 0, 0, 0.005); bx(f, W - 0.22, H - 0.22, 0.09, ART[i].bg, 0, 0, 0.01);
    const a = new T.Group(); a.position.z = 0.06; a.scale.set(0.95, 0.95, 0.95); f.add(a); ART[i].d(a);
    return f;
  }
  function emptySpot() {
    const f = new T.Group(), W = 0.72, H = 0.9;
    bx(f, W + 0.1, H + 0.1, 0.012, '#C4E9E4', 0, 0, 0); // cleaner patch where a photo used to hang
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(c => bx(f, 0.1, 0.012, 0.016, '#9ACBC4', c[0] * (W / 2 + 0.01), c[1] * (H / 2 + 0.01), 0.008));
    cy(f, 0.025, 0.025, 0.05, 5, '#7D8F92', 0, H / 2 - 0.1, 0.03).rotation.x = PI / 2;
    return f;
  }
  api.setAwards = function (a) {
    if (!api.ok || !awardsG) return;
    awardState = { frames: (a.frames || []).slice(), pets: (a.pets || []).slice() };
    clear(awardsG); frameGroups = [];
    WALL.forEach((w, i) => {
      const g = awardState.frames.indexOf(i) >= 0 ? frameMesh(i) : emptySpot();
      g.position.set(w.x, w.y, w.z); g.rotation.y = w.ry; awardsG.add(g); frameGroups[i] = g;
    });
    awardState.pets.forEach(k => { if (k === 'fish') buildFish(); else if (!pets.some(p => p.kind === k)) spawnPet(k, false); });
  };
  /* weekly-drug calendar on the back wall: grey until earned, then bronze, silver, gold, platinum */
  let calG = null;
  const CALC = [['#8E9AA0', 0], ['#B8733A', 5], ['#C9D2D8', 10], ['#F2B91B', 15], ['#DDF1FA', 20]];
  api.setCalendar = function (tier, anim, weeks) {
    if (!api.ok || !scene) return;
    if (calG) { clear(calG); scene.remove(calG); }
    const t = Math.max(0, Math.min(4, tier | 0)), col = CALC[t][0]; calG = new T.Group(); calG.position.set(-9.5, 3.0, 0.05); calG.rotation.y = PI / 2; scene.add(calG);
    const em = t === 4 ? { emissive: new T.Color(0x9FD8EE), emissiveIntensity: 0.55 } : t === 3 ? { emissive: new T.Color(0xF2A516), emissiveIntensity: 0.25 } : undefined;
    bx(calG, 1.4, 1.7, 0.07, '#FFFDF4', 0, 0, 0); bx(calG, 1.4, 0.46, 0.1, col, 0, 0.62, 0.03, null, em);
    [-0.4, 0.4].forEach(x => cy(calG, 0.05, 0.05, 0.2, 6, '#27384F', x, 0.88, 0.05));
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { const on = r * 5 + c < Math.min(20, weeks || 0); bx(calG, 0.2, 0.2, 0.04, on ? col : '#DCE6E8', -0.5 + c * 0.25, 0.24 - r * 0.27, 0.05, null, on ? em : undefined); }
    if (anim) { popGroup(calG); burst(new T.Vector3(-9.0, 3.0, 0.05), 16, 0xF2A516, 1.0); }
  };
  api.screenOf = function (x, y, z) {
    if (!api.ok || !camera || paused || !host) return null;
    tmp.set(x, y, z).project(camera); if (tmp.z > 1 || tmp.z < -1) return null;
    const r = host.getBoundingClientRect(), px = r.left + (tmp.x * 0.5 + 0.5) * r.width, py = r.top + (-tmp.y * 0.5 + 0.5) * r.height;
    return { x: Math.max(r.left + 24, Math.min(r.right - 24, px)), y: Math.max(r.top + 24, Math.min(r.bottom - 24, py)) };
  };
  api.targetPos = function (kind, id) {
    if (kind === 'frame') { const q = WALL[id]; return q ? api.screenOf(q.x + (q.ry ? 0.15 : 0), q.y, q.z + (q.ry ? 0 : 0.15)) : null; }
    if (kind === 'cal') return api.screenOf(-9.5, 3.0, 0.05);
    if (kind === 'pet') return api.screenOf(5, 0.8, 9.0);
    if (kind === 'fish') return api.screenOf(FISH_AT[0], 1.3, FISH_AT[1]);
    if (kind === 'pharm') { if (!pharm) return null; const p = pharm.g.position; return api.screenOf(p.x, p.y + ({ 1: 1.55, 2: 1.9, 3: 0.85, 4: 1.75, 5: 2.15, 6: 0.6, 7: 1.2 }[id] || 1.3), p.z); }
    return null;
  };
  api.unlockFrame = function (i) {
    const g = frameGroups[i], w = WALL[i]; if (!g || !w) return;
    popGroup(g); burst(new T.Vector3(w.x + (w.ry ? 0.6 : 0), w.y - 0.5, w.z + (w.ry ? 0 : 0.6)), 14, 0xF2A516, 0.9);
  };
  api.unlockPet = function (k) {
    if (k === 'fish') { if (fishG) { popGroup(fishG); burst(new T.Vector3(FISH_AT[0], 1.3, FISH_AT[1]), 12, 0x7FD6F0, 0.8); } return; }
    const p = pets.find(x => x.kind === k); if (!p) return;
    popGroup(p.g); say(p, '❤️', 'emo'); burst(new T.Vector3(p.g.position.x, 0.8, p.g.position.z), 12, 0xF2A8B8, 0.8);
  };

  /* ---- goldfish tank (unlocked by flashcard medals) ---- */
  const FISH_AT = [-8.4, 2.4]; let fishG = null; const fishes = [];
  function buildFish() {
    if (fishG || !scene) return;
    fishG = new T.Group(); fishG.position.set(FISH_AT[0], 0, FISH_AT[1]); scene.add(fishG);
    bx(fishG, 1.2, 0.9, 0.9, '#0A6F66', 0, 0.45, 0); bx(fishG, 1.26, 0.06, 0.96, '#F4F9F9', 0, 0.93, 0);
    const glass = new T.Mesh(new T.BoxGeometry(1.1, 0.8, 0.8), new T.MeshStandardMaterial({ color: 0x9FE3F0, transparent: true, opacity: 0.3, roughness: 0.1, depthWrite: false }));
    glass.position.y = 0.96 + 0.4; fishG.add(glass);
    bx(fishG, 1.06, 0.08, 0.76, '#E8D7A8', 0, 1.0, 0);
    [[-0.3, 0.2], [0.35, -0.2]].forEach(p => { add(fishG, new T.ConeGeometry(0.07, 0.4, 4), '#3E9E6A', p[0], 1.24, p[1]); });
    add(fishG, new T.IcosahedronGeometry(0.1, 0), '#8A9AA0', 0.1, 1.08, 0.25);
    for (let i = 0; i < 3; i++) {
      const f = new T.Group(); const body = add(f, new T.IcosahedronGeometry(0.1, 0), i === 1 ? '#F4C542' : '#F2762E', 0, 0, 0); body.scale.set(1.5, 0.9, 0.7);
      const tail = new T.Group(); f.add(tail); const tc = add(tail, new T.ConeGeometry(0.08, 0.16, 4), i === 1 ? '#F4C542' : '#F2762E', 0, 0, 0); tc.rotation.z = PI / 2; tail.position.set(-0.17, 0, 0);
      add(f, new T.BoxGeometry(0.03, 0.03, 0.03), '#1B1B24', 0.12, 0.04, 0.06);
      fishG.add(f); fishes.push({ g: f, tail: tail, a: i * 2.1, spd: 0.5 + i * 0.17, rx: 0.34 - i * 0.05, rz: 0.2 - i * 0.03, y: 1.2 + i * 0.12, ph: i });
    }
  }
  function fishTick(dt) {
    fishes.forEach(f => {
      f.a += f.spd * dt; const vx = -Math.sin(f.a) * f.rx, vz = Math.cos(f.a) * f.rz;
      f.g.position.set(Math.cos(f.a) * f.rx, f.y + Math.sin(time * 1.3 + f.ph) * 0.03, Math.sin(f.a) * f.rz);
      f.g.rotation.y = Math.atan2(-vz, vx); f.tail.rotation.y = Math.sin(time * 9 + f.ph) * 0.5;
    });
  }
  /* ---- pets ---- */
  const pets = [];
  function petModel(kind) {
    const g = new T.Group(), pe = (geo, c, x, y, z) => { const m = add(g, geo, c, x, y, z); m.userData.pet = true; return m; };
    const B = (w, h, d) => new T.BoxGeometry(w, h, d), I = (r) => new T.IcosahedronGeometry(r, 0);
    if (kind === 'bunny') {
      sc(pe(I(0.22), '#F7F3EE', 0, 0.24, 0), 1, 0.9, 1.25); pe(I(0.15), '#F7F3EE', 0, 0.4, 0.24);
      rot(pe(B(0.06, 0.3, 0.05), '#F7F3EE', -0.07, 0.66, 0.2), 0.12); rot(pe(B(0.06, 0.3, 0.05), '#F7F3EE', 0.07, 0.66, 0.2), -0.12);
      pe(B(0.04, 0.2, 0.03), '#F4B6C2', -0.07, 0.66, 0.23); pe(B(0.04, 0.2, 0.03), '#F4B6C2', 0.07, 0.66, 0.23);
      pe(I(0.08), '#FFFFFF', 0, 0.28, -0.27); pe(B(0.03, 0.03, 0.03), '#1B1B24', -0.06, 0.43, 0.37); pe(B(0.03, 0.03, 0.03), '#1B1B24', 0.06, 0.43, 0.37); pe(B(0.04, 0.03, 0.03), '#F08A9C', 0, 0.38, 0.39);
    } else if (kind === 'cat') {
      pe(B(0.26, 0.24, 0.5), '#E0953A', 0, 0.3, 0); pe(I(0.17), '#E0953A', 0, 0.46, 0.3);
      pe(new T.ConeGeometry(0.06, 0.13, 4), '#E0953A', -0.1, 0.63, 0.3); pe(new T.ConeGeometry(0.06, 0.13, 4), '#E0953A', 0.1, 0.63, 0.3);
      rot(pe(B(0.05, 0.05, 0.42), '#C9792A', 0, 0.46, -0.4), 0).rotation.x = -0.7;
      [[-0.09, 0.2], [0.09, 0.2], [-0.09, -0.2], [0.09, -0.2]].forEach(l => pe(B(0.07, 0.2, 0.07), '#C9792A', l[0], 0.1, l[1]));
      pe(B(0.04, 0.04, 0.03), '#1B1B24', -0.07, 0.49, 0.45); pe(B(0.04, 0.04, 0.03), '#1B1B24', 0.07, 0.49, 0.45); pe(B(0.04, 0.03, 0.03), '#F08A9C', 0, 0.44, 0.47);
      pe(B(0.27, 0.04, 0.12), '#C9792A', 0, 0.43, 0.04);
    } else {
      pe(B(0.3, 0.3, 0.6), '#9B6A3C', 0, 0.36, 0); pe(B(0.26, 0.26, 0.26), '#9B6A3C', 0, 0.56, 0.4); pe(B(0.16, 0.14, 0.18), '#C9A06A', 0, 0.5, 0.56);
      rot(pe(B(0.07, 0.2, 0.14), '#6B4426', -0.15, 0.54, 0.36), 0.2); rot(pe(B(0.07, 0.2, 0.14), '#6B4426', 0.15, 0.54, 0.36), -0.2);
      pe(B(0.06, 0.06, 0.06), '#1B1B24', 0, 0.54, 0.66); pe(B(0.04, 0.04, 0.03), '#1B1B24', -0.07, 0.62, 0.53); pe(B(0.04, 0.04, 0.03), '#1B1B24', 0.07, 0.62, 0.53);
      rot(pe(B(0.06, 0.28, 0.06), '#6B4426', 0, 0.52, -0.36), 0.7);
      [[-0.1, 0.22], [0.1, 0.22], [-0.1, -0.22], [0.1, -0.22]].forEach(l => pe(B(0.08, 0.22, 0.08), '#6B4426', l[0], 0.11, l[1]));
    }
    return g;
  }
  function petTarget() {
    let v;
    for (let k = 0; k < 10; k++) { v = { x: -3.4 + Math.random() * 11.4, z: 1.9 + Math.random() * 4.1 }; if (Crowd.clearance(v.x, v.z) > 0.6) break; }
    return v;
  }
  function spawnPet(kind, animate) {
    const g = petModel(kind); petG.add(g); const t = petTarget();
    g.position.set(animate ? 5 : t.x, 0, animate ? 8.6 : t.z);
    const p = { g, kind, pet: true, r: 0.32, dy: 1.15, wp: [t], idle: 1 + Math.random() * 2, phase: Math.random() * 6, speed: kind === 'bunny' ? 1.9 : kind === 'cat' ? 1.5 : 1.7, hopH: 0.3, onStuck: pp => { pp.wp = [petTarget()]; } };
    g.userData.P = { arms: [{ rotation: { x: 0 } }, { rotation: { x: 0 } }], legs: [], shirtM: { emissive: { setHex() { } } } };
    pets.push(p); return p;
  }
  const PET_SAY = { bunny: ['🐰', 'Boing!'], cat: ['Meow!', '😺'], dog: ['Woof!', '🐶'] };
  function petReact(o) {
    if (o.fx && o.fx.type !== 'bump') return;
    o.fx = { type: 'hop', t: 0, dur: 0.8 }; o.stall = Math.max(o.stall || 0, 0.8);
    const l = PET_SAY[o.kind]; say(o, l[Math.floor(Math.random() * l.length)], /^[^\w]*$/.test(l[0]) ? 'emo' : '');
  }

  function karenFx(c, dt) {
    if (!c.karen) return;
    const P = c.g.userData.P;
    if (c.angry) {
      c.puffT -= dt; if (c.puffT <= 0) { c.puffT = 0.09; emitPuff(c.g.position.x + (Math.random() - 0.5) * 0.4, c.g.position.y + 2.5, c.g.position.z); }
      c.g.rotation.z = Math.sin(time * 12) * 0.022;
      if (!c.wp.length) { P.arms[0].rotation.x = -2.3 + Math.sin(time * 6) * 0.2; P.arms[1].rotation.x = -2.1 + Math.sin(time * 6 + 1) * 0.2; c.g.position.y = Math.abs(Math.sin(time * 4)) * 0.04; }
      P.shirtM.emissive.setHex(0x2a0a10);
    } else { c.g.rotation.z = lerp(c.g.rotation.z, 0, 0.2); P.skinM.emissive.setHex(0x000000); }
  }
  function burst(pos, n, color, power) {
    let k = 0;
    for (const c of coins) {
      if (c.life > 0) continue;
      c.m.visible = true; c.m.material.color.setHex(color); c.m.position.copy(pos); c.m.scale.set(1, 1, 1); c.m.material.opacity = 1;
      c.v.set((Math.random() - 0.5) * 4 * power, 4 + Math.random() * 3 * power, (Math.random() - 0.3) * 3 * power); c.life = 1.4;
      if (++k >= n) break;
    }
  }
  function popGroup(g) { let u = 0; g.scale.set(0.6, 0.6, 0.6); tweens.push(function (dt) { u += dt / 0.5; const k = Math.min(1, u), s = 1 + Math.sin(k * PI) * 0.18 - (1 - k) * 0.4; g.scale.set(s, s, s); if (u >= 1) { g.scale.set(1, 1, 1); return true; } return false; }); }
  function celebrate(id) { popGroup(ug[id]); const b = BASE[id]; burst(new T.Vector3(b[0], TAGY[id] - 1.2, b[2]), 10, 0xF2A516, 1.1); shake = 0.35; }

  /* ---- sync with game state ---- */
  api.sync = function () {
    if (!api.ok) return;
    const S = B.getS();
    UPIDS.forEach(id => {
      const lv = S.up[id];
      if (lv !== built[id]) { const first = built[id] === undefined, grew = !first && lv > built[id]; if (id === 'tech') syncStaff(lv); BUILD[id](lv); try { addPlate(id, lv); } catch (e) { /* plaque is cosmetic */ } built[id] = lv; if (grew) celebrate(id); }
    });
    const sg = B.sign(); if (sg !== signKey) { signKey = sg; drawSign(sg); }
    api.refreshTags();
  };
  api.refreshTags = function () {
    if (!api.ok) return;
    const nt = tags.notes;
    if (nt) { const nn = B.notesInfo(), kk = 'n' + nn; if (nt.dataset.k !== kk) { nt.dataset.k = kk; nt.dataset.state = 'note'; nt.innerHTML = '<span>My studies</span><i>' + nn + '</i>'; nt.setAttribute('aria-label', 'My studies, ' + nn + ' custom questions. Open to add more'); } }
    UPIDS.forEach(id => {
      const t = tags[id]; if (!t) return;
      const i = B.tagInfo(id), html = (i.maxed ? 'MAX' : '$' + i.costText);
      t.dataset.state = i.maxed ? 'max' : i.can ? 'can' : 'no';
      const key = i.name + i.lvl + html; if (t.dataset.k !== key) { t.dataset.k = key; t.innerHTML = '<span>' + i.name + '</span><b>Lv ' + i.lvl + '</b><i>' + html + '</i>'; }
      t.setAttribute('aria-label', i.name + ' level ' + i.lvl + (i.maxed ? ', maxed' : ', upgrade for ' + html));
    });
  };

  /* ---- interaction ---- */
  const ndc = { x: 0, y: 0 };
  let pickObj = null;
  function pick(e) {
    const r = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1; ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(synOn ? synItems.filter(g => g.visible) : labOn ? labItems : [].concat(CLICK.map(i => ug[i]), [staffGroup, custGroup, petG, pharmG], phoneG ? [phoneG] : [], capG ? [capG] : [], pillG ? [pillG] : [], brainG ? [brainG] : [], evtG ? [evtG] : []), true);
    for (const h of hits) { let o = h.object; while (o) { if (o.userData && (o.userData.up || o.userData.cust || o.userData.pet || o.userData.pharm || o.userData.vis || o.userData.cap || o.userData.himA || o.userData.pill || o.userData.lab || o.userData.site || o.userData.brain || o.userData.evt)) { pickObj = h.object; return o.userData; } o = o.parent; } }
    return null;
  }
  function setHover(up) {
    if (hovered === up) return;
    if (hovered && hl[hovered]) hl[hovered].forEach(m => m.emissive.setHex(m.userData.base || 0));
    hovered = up;
    if (up && hl[up]) hl[up].forEach(m => { if (!m.userData.base) m.emissive.setHex(0x4a3400); });
    canvas.style.cursor = up ? 'pointer' : 'grab';
    CLICK.forEach(id => tags[id] && tags[id].classList.toggle('hover', id === up));
  }
  function dismissHint() { if (hintGone) return; hintGone = true; const h = host.querySelector('.hint3d'); if (h) h.classList.add('gone'); }
  function bind() {
    // Drag to look around (mouse, touch or pen). One finger orbits, two fingers pinch to zoom. A tap still clicks.
    const ptrs = new Map(); let drag = null, pinch = null, noClick = false;
    canvas.addEventListener('pointerdown', e => {
      if (fpT || (e.pointerType === 'mouse' && e.button !== 0)) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      if (ptrs.size === 1) drag = { sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, on: false };
      else if (ptrs.size === 2) { const v = [...ptrs.values()]; pinch = { d: Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y) || 1, g: grad }; if (drag) drag.on = true; canvas.classList.add('grabbing'); }
    });
    canvas.addEventListener('pointermove', e => {
      const p = ptrs.get(e.pointerId); if (!p || fpT) return;
      p.x = e.clientX; p.y = e.clientY;
      if (pinch && ptrs.size >= 2) {
        const v = [...ptrs.values()], d = Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y) || 1;
        grad = clamp(pinch.g * pinch.d / d, baseRad * 0.55, baseRad * 1.3); noClick = true; dismissHint(); return;
      }
      if (!drag) return;
      if (!drag.on && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 8) { drag.on = true; canvas.classList.add('grabbing'); dismissHint(); setHover(null); }
      if (drag.on) {
        gth = clamp(gth - (e.clientX - drag.lx) * 0.0055, -0.9, 1.5);
        gph = clamp(gph + (e.clientY - drag.ly) * 0.0042, 0.55, 1.4);
        noClick = true;
      }
      drag.lx = e.clientX; drag.ly = e.clientY;
    });
    const endPtr = e => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinch = null;
      if (ptrs.size === 0) { if (drag && drag.on) noClick = true; drag = null; canvas.classList.remove('grabbing'); setTimeout(() => { noClick = false; }, 350); }
    };
    canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
    canvas.addEventListener('wheel', e => { if (fpT) return; e.preventDefault(); grad = clamp(grad + Math.sign(e.deltaY) * 1.5, baseRad * 0.55, baseRad * 1.3); dismissHint(); }, { passive: false });
    canvas.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || (drag && drag.on)) return;
      if (fpT) { setFpHover(fpPick(e)); return; }
      const h = pick(e); setHover(h && h.up ? h.up : null);
      if (!hovered) canvas.style.cursor = h && (h.cust || h.pet || h.pharm || h.vis || h.cap || h.himA || h.lab || h.site || h.brain || h.evt) ? 'pointer' : 'default';
      if (synOn) synHover = h && h.site ? h.site : null;
    });
    canvas.addEventListener('click', e => {
      if (noClick) { noClick = false; return; }
      if (fpT) { const id = fpPick(e); if (id && B.onFp) B.onFp(id); return; }
      const h = pick(e); dismissHint();
      if (synOn) { if (h && h.site && B.onSynSite) B.onSynSite(h.site); return; }
      if (h && h.brain) { if (B.onBrain) B.onBrain(); return; }
      if (h && h.evt) { if (B.onEvt) B.onEvt(h.evt); return; }
      if (h && h.lab) { labClick(h); return; }
      if (h && h.cap) { capClick(); return; }
      if (h && h.himA) { himAngelClick(); return; }
      if (h && h.pill) { pillClick(h.pill); return; }
      if (h && h.vis) { if (B.onVisitor) B.onVisitor(); return; }
      if (h && h.up) { if (h.up === 'notes') B.onNotes(); else if (h.up === 'phone') { if (B.onPhone) B.onPhone(); } else B.onBuy(h.up); }
      else if (h && (h.cust || h.pet || h.pharm)) {
        let o = pickObj; while (o && o.parent && o.parent !== custGroup && o.parent !== petG && o.parent !== pharmG) o = o.parent;
        if (o) react(o);
        if (h.cust) { const rx = document.querySelector('.rx'); if (rx) rx.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
      }
    });
    canvas.addEventListener('pointerleave', () => setHover(null));
    const KEYMAP = { a: 'l', arrowleft: 'l', d: 'r', arrowright: 'r', w: 'u', arrowup: 'u', s: 'd', arrowdown: 'd' };
    const typing = e => e.target && e.target.closest && e.target.closest('input,textarea,select,[contenteditable]');
    document.addEventListener('keydown', e => {
      const k = KEYMAP[e.key.toLowerCase()];
      if (!k || e.metaKey || e.ctrlKey || e.altKey || typing(e)) return;
      if (e.key.indexOf('Arrow') === 0 && e.target.closest && e.target.closest('button')) { /* still steer the camera */ }
      keysDown[k] = true; dismissHint(); e.preventDefault();
    });
    document.addEventListener('keyup', e => { const k = KEYMAP[e.key.toLowerCase()]; if (k) keysDown[k] = false; });
    window.addEventListener('blur', () => { keysDown.l = keysDown.r = keysDown.u = keysDown.d = false; });
    host.querySelectorAll('[data-z]').forEach(b => b.addEventListener('click', () => {
      const z = b.dataset.z; dismissHint();
      if (z === 'in') grad = clamp(grad - 2.5, baseRad * 0.55, baseRad * 1.3);
      else if (z === 'out') grad = clamp(grad + 2.5, baseRad * 0.55, baseRad * 1.3);
      else if (z === 'fs') { const d = document, el = d.documentElement; if (d.fullscreenElement || d.webkitFullscreenElement) { try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (_) { /* ignore */ } (d.exitFullscreen || d.webkitExitFullscreen).call(d); } else { const f = el.requestFullscreen || el.webkitRequestFullscreen; if (f) { try { const r = f.call(el); const lock = () => { try { const o = screen.orientation; if (o && o.lock) { const pr = o.lock('portrait'); if (pr && pr.catch) pr.catch(() => {}); } } catch (_) { /* ignore */ } }; if (r && r.then) r.then(lock, () => {}); else lock(); } catch (_) { /* ignore */ } } } }
      else { gth = 0.55; gph = 1.05; grad = baseRad; }
    }));
    { const fsb = host.querySelector('#fsbtn'), D = document.documentElement; if (fsb && !(D.requestFullscreen || D.webkitRequestFullscreen)) fsb.style.display = 'none'; }
    CLICK.forEach(id => { const b = tags[id]; b.addEventListener('click', e => { e.stopPropagation(); dismissHint(); if (id === 'notes') B.onNotes(); else B.onBuy(id); }); b.addEventListener('mouseenter', () => setHover(id)); b.addEventListener('mouseleave', () => setHover(null)); });
  }


  /* ---- first-person bottle check, ragdoll, police ---- */
  let shelfN = 2, fpHidden = [], fpScreen = false, fpqEl = null;
  let fpHiddenG = [];
  let fpT = 0, fpK = 0, fpFov = 40, fpTF = 64, fpG = null, fpItems = [], fpHoverId = null, fpShakes = [], fpHeld = null;
  let fpEyeV = { x: -1.5, y: 2.05, z: -1.7 }, fpLookV = { x: -1.5, y: 1.2, z: 4 };
  const bodies = [], cops = [];
  let copJob = null;
  const pharmPos = () => pharm ? pharm.g.position : { x: -1.5, z: -1.85 };
  function labelTex(name, letter) {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 200; const x = cv.getContext('2d');
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 256, 200);
    x.fillStyle = '#0E9A8E'; x.fillRect(0, 0, 256, 48);
    x.fillStyle = '#FFFFFF'; x.font = '800 34px "Bricolage Grotesque", Trebuchet MS, sans-serif'; x.textAlign = 'left'; x.fillText('Rx', 14, 36);
    x.textAlign = 'right'; x.font = '700 24px "JetBrains Mono", monospace'; x.fillText(letter, 244, 34);
    x.fillStyle = '#16212B'; x.textAlign = 'center';
    let fs = 44; x.font = '800 ' + fs + 'px "Bricolage Grotesque", Trebuchet MS, sans-serif';
    while (x.measureText(name).width > 232 && fs > 18) { fs -= 2; x.font = '800 ' + fs + 'px "Bricolage Grotesque", Trebuchet MS, sans-serif'; }
    x.fillText(name, 128, 118);
    x.fillStyle = '#8A98A5'; x.font = '600 20px "JetBrains Mono", monospace'; x.fillText('TAKE AS DIRECTED', 128, 164);
    return new T.CanvasTexture(cv);
  }
  function brandTex(name) {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 80; const x = cv.getContext('2d');
    x.fillStyle = '#0E9A8E'; x.fillRect(0, 0, 256, 80); x.fillStyle = '#FFFFFF'; x.textAlign = 'center';
    let fs = 38; x.font = '800 ' + fs + 'px "Bricolage Grotesque", Trebuchet MS, sans-serif';
    while (x.measureText(name).width > 236 && fs > 16) { fs -= 2; x.font = '800 ' + fs + 'px "Bricolage Grotesque", Trebuchet MS, sans-serif'; }
    x.fillText(name, 128, 54);
    return new T.CanvasTexture(cv);
  }
  // face = +1 when the viewer stands on the +z side of the bottle, -1 for the -z side
  function makeBottle(name, letter, face) {
    const g = new T.Group();
    // amber-orange prescription vial with a white child-proof cap
    cy(g, 0.17, 0.17, 0.42, 10, '#E8851A', 0, 0.21, 0); cy(g, 0.185, 0.185, 0.14, 10, '#FFFFFF', 0, 0.49, 0); cy(g, 0.19, 0.19, 0.025, 10, '#E3EAEA', 0, 0.43, 0);
    const lab = new T.Mesh(new T.PlaneGeometry(0.3, 0.24), new T.MeshBasicMaterial({ map: labelTex(name, letter) }));
    lab.position.set(0, 0.22, 0.176 * face); if (face < 0) lab.rotation.y = PI; g.add(lab);
    return g;
  }
  function fpClear() { fpHidden.forEach(b => { b.visible = true; }); fpHidden = []; fpHiddenG.forEach(g => { g.visible = true; }); fpHiddenG = []; if (fpG) { scene.remove(fpG); fpG = null; } fpItems = []; fpHoverId = null; fpShakes = []; fpHeld = null; }
  function fpBegin(eye, look, fov) {
    fpClear(); fpG = new T.Group(); scene.add(fpG);
    fpEyeV = eye; fpLookV = look; fpTF = fov; fpT = 1; if (pharm) pharm.g.visible = false; dismissHint();
  }
  // A clickable thing in the first-person view: an invisible hit box, plus outline meshes (it.hov) that show on hover.
  function fpItem(id, w, h, d, x, y, z, face) {
    const grp = new T.Group(); grp.position.set(x, y, z); fpG.add(grp);
    const hit = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.userData.fpId = id; grp.add(hit);
    const it = { id, grp, hit, hov: [], off: false, face: face || 1, w, h, d }; fpItems.push(it); return it;
  }
  // Soft outline that follows the silhouette of the round parts (inverted-hull trick).
  function addSilhouette(it, src, color, grow) {
    const kids = []; src.traverse(m => { if (m.geometry && m.geometry.type === 'CylinderGeometry') kids.push(m); });
    const om = new T.MeshBasicMaterial({ color: color === undefined ? 0xFFF1B8 : color, side: T.BackSide }), g = grow || 1;
    kids.forEach(m => {
      const o = new T.Mesh(m.geometry, om); o.position.copy(m.position); o.rotation.copy(m.rotation); o.scale.set(m.scale.x * 1.2 * g, m.scale.y * 1.12 * g, m.scale.z * 1.2 * g);
      o.visible = false; m.parent.add(o); it.hov.push(o);
    });
    return kids;
  }
  const fpFind = (id) => fpItems.find(i => i.id === id);
  function setFpHover(id) {
    if (fpHoverId === id) return; fpHoverId = id;
    fpItems.forEach(it => { const on = (it.id === id && !it.off) || !!it.lock; it.hov.forEach(o => { o.visible = on; }); });
    if (canvas) canvas.style.cursor = id ? 'pointer' : 'default';
  }
  function fpPick(e) {
    const r = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1; ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const live = fpItems.filter(i => !i.off).map(i => i.hit); if (!live.length) return null;
    const hits = raycaster.intersectObjects(live, false);
    return hits.length ? hits[0].object.userData.fpId : null;
  }
  api.fpIndication = function (a, b) {
    if (!api.ok) return;
    const port = (camera.aspect || 1) < 0.85, p = pharmPos();
    fpBegin({ x: p.x, y: 2.05, z: p.z + 0.12 }, { x: p.x, y: 1.2, z: p.z + 6 }, port ? 90 : 64);
    [[a, 'A', port ? -0.36 : -0.55], [b, 'B', port ? 0.36 : 0.55]].forEach((q, i) => {
      const it = fpItem('b' + i, port ? 0.62 : 0.7, 1.05, port ? 0.62 : 0.7, p.x + q[2], 1.78, 0.15, -1);
      const bt = makeBottle(q[0], q[1], -1); bt.scale.set(1.8, 1.8, 1.8); bt.position.y = -0.52; it.grp.add(bt); addSilhouette(it, bt, 0x000000, 0.9);
    });
  };
  // Put-away drill on the real shelves: brand-name gaps open up in the stocked shelving.
  function plainBottle(parent, x, y, z, col) {
    const b = new T.Group(); b.position.set(x, y, z); parent.add(b);
    cy(b, 0.17, 0.17, 0.42, 6, col, 0, 0.21, 0); cy(b, 0.175, 0.175, 0.14, 6, '#FFFFFF', 0, 0.2, 0); cy(b, 0.12, 0.12, 0.12, 6, '#27384F', 0, 0.48, 0);
    return b;
  }
  api.fpShelve = function (brands) {
    if (!api.ok) return;
    const p = pharmPos(), sx = BASE.shelf[0], sz = BASE.shelf[2];
    const su = shelfN >= 3 && (camera.aspect || 1) < 0.85 ? 1 : 0; // level 6+ on a phone: use the next two units to the right
    const ux = [su, su + 1].map(u => sx + (-(shelfN - 1) * 1.5 + u * 3)), rows = [1.3, 2.25, 3.2];
    const asp = camera.aspect || 1, port = asp < 0.85;
    const hideCrowd = () => { [staffGroup, custGroup, petG].forEach(g => { if (g && g.visible) { g.visible = false; fpHiddenG.push(g); } }); };
    const wide = !port || shelfN >= 3; // with 3+ shelf units (level 6+) face the two left-hand units, centred between the two columns of spots
    if (port && wide) { const D = Math.max(4.4, 2.4 / (asp * 1.0355)), cxm = (ux[0] + ux[1]) / 2 - 0.24; fpBegin({ x: cxm, y: 2.05, z: sz + D }, { x: cxm, y: 2.3, z: sz }, Math.min(95, 2 * Math.atan(2.4 / (D * asp)) * 180 / PI)); }
    else if (port) fpBegin({ x: ux[0], y: 2.05, z: sz + 4.0 }, { x: ux[0], y: 2.3, z: sz }, Math.max(64, Math.min(92, 2 * Math.atan(1.5 / (4.0 * asp)) * 180 / PI)));
    else { const zc = (ux[0] + ux[1]) / 2 - 0.24; fpBegin({ x: zc, y: 2.05, z: p.z + 0.12 }, { x: zc, y: 2.35, z: sz }, 64); } // centred on the two columns of spots, so the held bottle never sits over one
    hideCrowd(); // staff stand at the spot the camera uses, so nobody may block a gap
    // on a tall phone screen both columns of spots sit side by side on the first shelf unit so nothing is cut off
    const zones = brands.map((nm, i) => ({ x: !wide ? ux[0] + (i % 2 ? 0.58 : -0.62) : ux[i % 2] - 0.24, y: rows[Math.floor(i / 2)] + 0.06 }));
    const near = (wx, wy, zn, r) => Math.abs(wx - zn.x) < r && Math.abs(wy - zn.y) < 0.2;
    shelfBottles.forEach(b => { const wx = sx + b.position.x, wy = b.position.y; if (zones.some(z => near(wx, wy, z, 0.78))) { b.visible = false; fpHidden.push(b); } });
    for (let u = 0; u < 2; u++) rows.forEach((ry, r) => {
      for (let i = 0; i < 6; i++) {
        const wx = ux[u] - 1.2 + i * 0.48, wy = ry + 0.06;
        if (zones.some(zn => near(wx, wy, zn, 0.78))) continue;
        if (!wide && u === 0 && (zones.some(zn => near(wx, wy, zn, 1.05)))) continue;
        if (shelfBottles.some(b => b.visible && Math.abs(sx + b.position.x - wx) < 0.2 && Math.abs(b.position.y - wy) < 0.2)) continue;
        if (((u * 7 + r * 3 + i * 5) % 5) === 0) continue;
        plainBottle(fpG, wx, wy, sz, BOT[(i * 5 + 2 + r * 3 + u) % 6]);
      }
    });
    brands.forEach((nm, i) => {
      const z = zones[i], bw = port ? 1.08 : 1.4, it = fpItem('bin' + i, bw, 0.8, 0.7, z.x, z.y + 0.42, sz, 1); it.bx = z.x;
      const lab = new T.Mesh(new T.PlaneGeometry(port ? 0.98 : 1.2, port ? 0.3 : 0.34), new T.MeshBasicMaterial({ map: brandTex(nm) })); lab.position.set(0, -0.22, 0.43); it.grp.add(lab);
      // hovering a spot shows the outline of a bottle sitting in that gap
      const gh = new T.Group(); gh.scale.set(1.25, 1.25, 1.25); gh.position.set(0, -0.42, 0.05); it.grp.add(gh);
      const gm = new T.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.22, depthWrite: false });
      [[0.17, 0.42, 0.21], [0.12, 0.12, 0.48]].forEach(q => { const c = new T.Mesh(new T.CylinderGeometry(q[0], q[0], q[1], 10), gm); c.position.y = q[2]; c.visible = false; gh.add(c); it.hov.push(c); });
      addSilhouette(it, gh);
    });
  };
  // keep the black outline on the bottle that was picked
  api.fpSelect = function (id) { const it = fpFind(id); if (!it) return; it.lock = true; it.hov.forEach(o => { o.visible = true; }); };
  api.fpHold = function (name) {
    if (!fpG) return;
    if (fpHeld) { fpG.remove(fpHeld.grp); fpItems.splice(fpItems.indexOf(fpHeld), 1); fpHeld = null; }
    const port = (camera.aspect || 1) < 0.85, p = pharmPos(), wideP = port && shelfN >= 3, s = wideP ? 1.1 : port ? 1.05 : 1.3;
    const tx = fpLookV.x, ty = port ? fpEyeV.y - (wideP ? 0.75 : 1.02) : 1.4, tz = port ? fpEyeV.z - 1.8 : p.z - 1.7;
    const it = fpItem('held', 0.75, 1.1, 0.75, tx, ty - 0.9, tz, 1); it.off = true;
    const bt = makeBottle(name, 'GENERIC', 1); bt.scale.set(s, s, s); bt.position.y = -0.275 * s; it.grp.add(bt); fpHeld = it;
    let t = 0; it.home = { x: tx, y: ty, z: tz, s };
    tweens.push(function (dt) { t += dt; const k = Math.min(1, t / 0.4), e = 1 - Math.pow(1 - k, 3); it.grp.position.y = ty - 0.9 * (1 - e); return k >= 1 || !fpG; });
  };
  api.fpFill = function (i, name) {
    const it = fpFind('bin' + i); if (!it || !fpG) return;
    it.off = true; it.hov.forEach(o => { o.visible = false; });
    const place = () => { const bt = makeBottle(name, '', 1); bt.scale.set(1.25, 1.25, 1.25); bt.position.set(0, -0.42, 0.05); it.grp.add(bt); };
    const fly = fpHeld;
    if (!fly || !fly.home) { place(); return; }
    // the bottle you are holding hops onto the shelf, then the real one settles into the gap
    fpHeld = null; fpItems.splice(fpItems.indexOf(fly), 1);
    const from = { x: fly.grp.position.x, y: fly.grp.position.y, z: fly.grp.position.z }, s0 = fly.home.s, bt = fly.grp.children.find(c => c.type === 'Group');
    const to = { x: it.grp.position.x, y: it.grp.position.y - 0.42, z: it.grp.position.z + 0.05 };
    let t = 0;
    tweens.push(function (dt) {
      t += dt; const k = Math.min(1, t / 0.55), e = k * k * (3 - 2 * k);
      fly.grp.position.set(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e + Math.sin(PI * k) * 0.55, from.z + (to.z - from.z) * e);
      if (bt) { const sc = s0 + (1.25 - s0) * e; bt.scale.set(sc, sc, sc); bt.position.y = 0; }
      fly.grp.rotation.z = Math.sin(PI * k) * -0.35;
      if (k >= 1 || !fpG) { if (fpG) { fpG.remove(fly.grp); place(); } return true; }
      return false;
    });
  };
  // Red X over an item with a small shake (wrong choice).
  const fpXs = [];
  api.fpMark = function (id) {
    const it = fpFind(id); if (!it || !fpG || !tagsEl) return;
    let c; try { c = new T.Box3().setFromObject(it.grp).getCenter(new T.Vector3()); } catch (e) { c = new T.Vector3(it.grp.position.x, it.grp.position.y + 0.5, it.grp.position.z); }
    const el = document.createElement('div'); el.className = 'fpx'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = '<span>\u2715</span>'; tagsEl.appendChild(el);
    fpXs.push({ el, c, t: 0 });
    fpShakes.push({ it, t: 0, x: it.grp.position.x });
  };
  /* A low-poly head-and-shoulders portrait of a patient, rendered from the same model the 3D world uses. */
  const portraitCache = {};
  api.portrait = function (seed, karen, sweaty, elder, him) {
    if (!api.ok || !renderer) return null;
    const key = seed + '|' + (karen ? 1 : 0) + (sweaty ? 1 : 0) + (elder ? 1 : 0) + (him ? 'H' : '');
    if (key in portraitCache) return portraitCache[key];
    let url = null, rt = null, p = null;
    try {
      const S = 256, ps = new T.Scene(), pc = new T.PerspectiveCamera(28, 1, 0.1, 30);
      ps.add(new T.HemisphereLight(0xffffff, 0x8899aa, 0.95)); const dl = new T.DirectionalLight(0xffffff, 0.75); dl.position.set(2.5, 4, 5); ps.add(dl);
      p = him ? person(4242, false, false, false, 'slim', himOpts()) : person(seed, false, !!karen, !!sweaty, 'normal', elder ? { elder: true, gender: seed % 2 === 0 ? 'f' : 'm' } : undefined); p.rotation.y = -0.4; ps.add(p);
      const ty = (him ? 2.42 : karen || sweaty ? 2.0 : 1.82) - 0.02;
      pc.position.set(0, ty + 0.12, 2.9); pc.lookAt(0, ty, 0);
      rt = new T.WebGLRenderTarget(S, S, { samples: 4 });
      const oldRT = renderer.getRenderTarget(), oc = renderer.getClearColor(new T.Color()), oa = renderer.getClearAlpha();
      renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(ps, pc);
      const buf = new Uint8Array(S * S * 4); renderer.readRenderTargetPixels(rt, 0, 0, S, S, buf);
      renderer.setRenderTarget(oldRT); renderer.setClearColor(oc, oa);
      let seen = 0; for (let i = 3; i < buf.length; i += 16) if (buf[i]) { seen++; if (seen > 20) break; }
      if (seen <= 20) throw new Error('empty portrait');
      const cv = document.createElement('canvas'); cv.width = cv.height = S; const cx = cv.getContext('2d'), id = cx.createImageData(S, S);
      for (let y = 0; y < S; y++) id.data.set(buf.subarray((S - 1 - y) * S * 4, (S - y) * S * 4), y * S * 4);
      cx.putImageData(id, 0, 0); url = cv.toDataURL('image/png');
    } catch (e) { url = null; try { renderer.setRenderTarget(null); } catch (_) { /* ignore */ } }
    try { if (rt) rt.dispose(); if (p) p.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); } catch (_) { /* ignore */ }
    portraitCache[key] = url; return url;
  };
  /* the pharmacist editor preview: the same 3D model as the shop, full length */
  const meCache = {};

  /* 3D render of one cosmetic item on a simple mannequin, as an image (cached) */
  const cosmCache = {};
  api.cosmIcon = function (slot, id) {
    if (!api.ok || !renderer) return null;
    const key = slot + ':' + id; if (key in cosmCache) return cosmCache[key];
    let url = null, rt = null, grp = null;
    try {
      const W = 176, H = 176, ps = new T.Scene(), pc = new T.PerspectiveCamera(27, W / H, 0.1, 40);
      ps.add(new T.HemisphereLight(0xffffff, 0x8899aa, 0.95)); const dl = new T.DirectionalLight(0xffffff, 0.8); dl.position.set(2.5, 4, 5); ps.add(dl);
      const own = (c) => new T.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.85 }), skin = own('#E8B890'), hairM = own('#5B3A21');
      grp = new T.Group();
      const put = (g, m, x, y, z) => { const o = new T.Mesh(g, m); o.position.set(x, y, z); grp.add(o); return o; };
      put(new T.BoxGeometry(0.6, 0.62, 0.6), skin, 0, 1.85, 0); put(new T.BoxGeometry(0.16, 0.16, 0.16), skin, 0, 1.52, 0);
      put(new T.CylinderGeometry(0.4, 0.43, 0.9, 6), own('#F4FAFA'), 0, 1.1, 0);
      [-1, 1].forEach(s => { put(new T.BoxGeometry(0.06, 0.06, 0.04), own('#2B2B33'), s * 0.12, 1.88, 0.31); });
      const C = {}; C[slot] = id; buildCosm(C, put, own, hairM, {}, 0.4);
      grp.rotation.y = -0.5; ps.add(grp); pc.position.set(0, 2.0, 3.5); pc.lookAt(0, 1.92, 0);
      rt = new T.WebGLRenderTarget(W, H, { samples: 4 });
      const oldRT = renderer.getRenderTarget(), oc = renderer.getClearColor(new T.Color()), oa = renderer.getClearAlpha();
      renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(ps, pc);
      const buf = new Uint8Array(W * H * 4); renderer.readRenderTargetPixels(rt, 0, 0, W, H, buf);
      renderer.setRenderTarget(oldRT); renderer.setClearColor(oc, oa);
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const cx = cv.getContext('2d'), im = cx.createImageData(W, H);
      for (let y = 0; y < H; y++) im.data.set(buf.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
      cx.putImageData(im, 0, 0); url = cv.toDataURL('image/png');
    } catch (e) { url = null; try { renderer.setRenderTarget(null); } catch (_) { /* ignore */ } }
    try { if (rt) rt.dispose(); if (grp) grp.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); } catch (_) { /* ignore */ }
    cosmCache[key] = url; return url;
  };
  api.pharmPortrait = function (me) {
    if (!api.ok || !renderer) return null;
    const key = JSON.stringify(me); if (key in meCache) return meCache[key];
    let url = null, rt = null, p = null;
    try {
      const W = 240, H = 300, ps = new T.Scene(), pc = new T.PerspectiveCamera(27, W / H, 0.1, 40);
      ps.add(new T.HemisphereLight(0xffffff, 0x8899aa, 0.95)); const dl = new T.DirectionalLight(0xffffff, 0.75); dl.position.set(2.5, 4, 5); ps.add(dl);
      p = person(1, false, false, false, me.body === 'normal' ? undefined : me.body, { skin: me.skin, hair: me.hairCol, shirt: me.shirtCol || '#F7FBFB', shoes: me.shoes || null, hairStyle: HAIR_MAP[me.hair] === undefined ? 0 : HAIR_MAP[me.hair], gender: me.gender, coat: true, scrub: me.scrub, acc: me.acc, accOn: me.accOn || 0, cosm: me.cosm || null, tag: { pharm: true } });
      p.rotation.y = -0.35; ps.add(p); pc.position.set(0, 1.35, 6.6); pc.lookAt(0, 1.2, 0);
      rt = new T.WebGLRenderTarget(W, H, { samples: 4 });
      const oldRT = renderer.getRenderTarget(), oc = renderer.getClearColor(new T.Color()), oa = renderer.getClearAlpha();
      renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(ps, pc);
      const buf = new Uint8Array(W * H * 4); renderer.readRenderTargetPixels(rt, 0, 0, W, H, buf);
      renderer.setRenderTarget(oldRT); renderer.setClearColor(oc, oa);
      let seen = 0; for (let i = 3; i < buf.length; i += 16) if (buf[i]) { seen++; if (seen > 20) break; }
      if (seen <= 20) throw new Error('empty preview');
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const cx = cv.getContext('2d'), id = cx.createImageData(W, H);
      for (let y = 0; y < H; y++) id.data.set(buf.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
      cx.putImageData(id, 0, 0); url = cv.toDataURL('image/png');
    } catch (e) { url = null; try { renderer.setRenderTarget(null); } catch (_) { /* ignore */ } }
    try { if (rt) rt.dispose(); if (p) p.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); } catch (_) { /* ignore */ }
    meCache[key] = url; return url;
  };
  api.fpPrior = function () {
    if (!api.ok) return;
    fpBegin({ x: 2.2, y: 1.84, z: -1.05 }, { x: 2.2, y: 1.84, z: -0.3 }, 36);
    fpScreen = true; fpqEl = host.querySelector('#fpq'); if (fpqEl) fpqEl.style.opacity = '0';
  };
  api.fpEnd = function () { fpT = 0; fpScreen = false; if (pharm) pharm.g.visible = true; setFpHover(null); };
  api.fpActive = function () { return fpT === 1; };
  let paused = false;
  api.setPaused = function (p) { paused = !!p; if (!paused && !running && api.ok && !document.hidden) { startLoop(); } };
  api._dbg = function () { return { visitor: visitor, fpEye: fpEyeV, shelfN: shelfN, gth: gth, gph: gph, grad: grad, bodies, cops, copJob, queue, staff, fpK, fpT, cam: camera.position.clone(), pharmVis: pharm && pharm.g.visible, bottles: !!fpG, ids: fpItems.map(i => i.id + (i.off ? '*' : '')) }; };
  api._click = function (id) { if (B.onFp) B.onFp(id); };
  // Wrong bottle: a random waiting patient collapses (X eyes). Police come in and drag the body out.
  function xEyes(g) {
    const P = g.userData.P; if (!P || !P.eyes || P.xed) return; P.xed = true;
    P.eyes.forEach(e => {
      e.visible = false;
      [-1, 1].forEach(sg => { const m = new T.Mesh(new T.BoxGeometry(0.17, 0.035, 0.035), P.dark); m.position.set(e.position.x, e.position.y, e.position.z + 0.02); m.rotation.z = sg * PI / 4; e.parent.add(m); });
    });
  }
  api.ragdoll = function () {
    if (!api.ok || copJob) return false;
    while (queue.length < 2) queue.push(spawnCustomer(true, queue.length));
    const i = 1 + Math.floor(Math.random() * (queue.length - 1)), v = queue.splice(i, 1)[0];
    assignSlots();
    xEyes(v.g); say(v, '😵', 'emo');
    const ang = Math.random() * PI * 2, big = v.body === 'obese' ? 0.78 : v.body === 'jacked' ? 0.72 : 0.36;
    const b = { g: v.g, t: 0, phase: 'fly', vy: 5.2, vx: Math.sin(ang) * 1.3, vz: Math.cos(ang) * 1.3, spin: Math.random() < 0.5 ? -1 : 1, restY: big, body: v.body };
    v.g.position.y = 0.05; bodies.push(b);
    queue.forEach(c => { if (c.g.userData.P && !c.fx && Math.random() < 0.7) say(c, ['😱', '😨', '❗'][Math.floor(Math.random() * 3)], 'emo'); c.stall = Math.max(c.stall || 0, 1.2); });
    shake = 0.4;
    copJob = { phase: 'wait', t: 0, body: b, cops: [], C: null, path: [], th: 0 };
    return true;
  };
  function spawnCop(x, z, k) {
    const p = person(Math.floor(Math.random() * 99999), false, false, false, k ? 'jacked' : 'normal', { skin: SKIN[(k * 2 + 1) % 6], hairStyle: 8, shirt: '#2F5AA8', scrub: '#16213A', gender: 'm', cap: true });
    p.position.set(x, 0, z); custGroup.add(p);
    const o = { g: p, r: 0.55, wp: [], phase: Math.random() * 6, cop: true, speed: 3.2, dy: 3.2 }; cops.push(o); return o;
  }
  function ragStep(dt) {
    bodies.forEach(b => {
      const g = b.g, P = g.userData.P; b.t += dt;
      if (b.dragged) return;
      if (b.phase === 'fly') {
        b.vy -= 15 * dt; g.position.x += b.vx * dt; g.position.z += b.vz * dt; g.position.y += b.vy * dt;
        const k = Math.min(1, b.t / 0.6);
        g.rotation.x = -(PI / 2) * k * (2 - k); g.rotation.z = b.spin * Math.sin(Math.min(1, b.t / 0.7) * PI) * 0.7;
        P.legs[0].rotation.x = Math.sin(b.t * 18) * 1.1; P.legs[1].rotation.x = Math.cos(b.t * 16) * 1.1;
        P.arms[0].rotation.z = -(1.4 + Math.sin(b.t * 20) * 0.4); P.arms[1].rotation.z = 1.4 + Math.cos(b.t * 19) * 0.4;
        if (g.position.y <= b.restY && b.vy < 0 && b.t > 0.2) {
          g.position.y = b.restY;
          if (b.vy < -3.5) { b.vy = -b.vy * 0.3; shake = Math.max(shake, 0.55); } else { b.phase = 'rest'; b.t = 0; b.vy = 0; }
        }
      } else {
        g.position.y = b.restY; g.rotation.x = -PI / 2; g.rotation.z = lerp(g.rotation.z, 0, 0.15);
        P.legs[0].rotation.x = lerp(P.legs[0].rotation.x, 0, 0.2); P.legs[1].rotation.x = lerp(P.legs[1].rotation.x, 0, 0.2);
        P.legs[0].rotation.z = lerp(P.legs[0].rotation.z, -0.22, 0.2); P.legs[1].rotation.z = lerp(P.legs[1].rotation.z, 0.22, 0.2);
        P.arms[0].rotation.z = lerp(P.arms[0].rotation.z, -0.9, 0.2); P.arms[1].rotation.z = lerp(P.arms[1].rotation.z, 0.9, 0.2);
        P.arms[0].rotation.x = lerp(P.arms[0].rotation.x, 0, 0.2); P.arms[1].rotation.x = lerp(P.arms[1].rotation.x, 0, 0.2);
      }
    });
  }
  function copStep(dt) {
    const j = copJob; if (!j) return;
    j.t += dt; const b = j.body, bp = b.g.position;
    if (j.phase === 'wait' && b.phase === 'rest' && j.t > 1.4) {
      j.phase = 'in'; j.t = 0; j.cops = [spawnCop(5, 9.6, 0), spawnCop(5.9, 10.6, 1)];
      const cx0 = bp.x, cz0 = bp.z - 0.9;
      j.cops[0].wp = [new T.Vector3(cx0 - 1.0, 0, cz0)]; j.cops[1].wp = [new T.Vector3(cx0 + 1.0, 0, cz0)];
      say(j.cops[0], 'Police! Make way!');
    }
    if (j.phase === 'in') {
      if ((!j.cops[0].wp.length && !j.cops[1].wp.length) || j.t > 14) {
        j.phase = 'grab'; j.t = 0; shake = 0.3;
        j.cops.forEach((c, i) => { c.g.rotation.y = lerpAngle(c.g.rotation.y, i ? -PI / 2 : PI / 2, 1); });
        say(j.cops[1], 'Step back, folks.');
        if (B.onPolice) B.onPolice();
      }
    }
    if (j.phase === 'grab' && j.t > 1.0) {
      j.phase = 'drag'; j.t = 0; b.dragged = true;
      j.C = new T.Vector3(bp.x, 0, bp.z - 0.9); j.path = [new T.Vector3(4.9, 0, 6.8), new T.Vector3(5, 0, 11.4)]; j.th = 0;
    }
    if (j.phase === 'drag') {
      const p = j.path[0];
      if (!p) { j.phase = 'out'; }
      else {
        const dx = p.x - j.C.x, dz = p.z - j.C.z, d = Math.hypot(dx, dz) || 1, st = Math.min(d, 1.5 * dt);
        j.C.x += dx / d * st; j.C.z += dz / d * st; if (d < 0.1) j.path.shift();
        j.th = lerpAngle(j.th, Math.atan2(dx, dz), Math.min(1, dt * 5));
        const sx = Math.sin(j.th), sz = Math.cos(j.th), px = sz, pz = -sx;
        // the body trails behind, cops stand at its shoulders
        b.g.position.set(j.C.x - sx * 0.95, b.restY, j.C.z - sz * 0.95); b.g.rotation.y = j.th + PI; b.g.rotation.x = -PI / 2;
        j.cops.forEach((c, i) => {
          const sg = i ? -1 : 1; c.g.position.set(j.C.x + sx * 0.7 + px * sg * 0.85, 0, j.C.z + sz * 0.7 + pz * sg * 0.85);
          c.g.rotation.y = j.th; c.phase += dt; const P = c.g.userData.P;
          P.legs[0].rotation.x = Math.sin(c.phase * 7) * 0.5; P.legs[1].rotation.x = -Math.sin(c.phase * 7) * 0.5;
          P.arms[0].rotation.x = P.arms[1].rotation.x = -1.0; P.arms[0].rotation.z = sg * 0.3; P.arms[1].rotation.z = sg * 0.3;
          c.g.position.y = Math.abs(Math.sin(c.phase * 7)) * 0.04;
        });
      }
    }
    if (j.phase === 'out') {
      bodies.splice(bodies.indexOf(b), 1); custGroup.remove(b.g);
      j.cops.forEach(c => { custGroup.remove(c.g); cops.splice(cops.indexOf(c), 1); });
      copJob = null;
    }
  }

  /* ---- frame loop ---- */
  const v3 = () => new T.Vector3();
  let tmp;
  function place(el, wx, wy, wz) {
    tmp.set(wx, wy, wz).project(camera);
    const w = host.clientWidth, h = host.clientHeight;
    if (tmp.z > 1 || tmp.z < -1) { el.style.display = 'none'; return; }
    el.style.display = ''; el.style.transform = 'translate(' + Math.round((tmp.x * 0.5 + 0.5) * w) + 'px,' + Math.round((-tmp.y * 0.5 + 0.5) * h) + 'px) translate(-50%,-50%)';
  }
  function moveTo(o, speed, dt, list) {
    const w = Crowd.move(o, speed, dt, list);
    if (w) o.g.rotation.y = lerpAngle(o.g.rotation.y, o.heading, Math.min(1, dt * 5));
    return w;
  }
  function lerpAngle(a, b, t) { let d = ((b - a + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI; return a + d * t; }
  // one render loop only: a hidden tab leaves a pending frame behind, and a second chain started on return would double the game speed
  let raf = 0;
  function startLoop() { if (raf) cancelAnimationFrame(raf); running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function frame(now) {
    raf = 0;
    if (!running) return;
    if (paused) { running = false; return; }
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; time += dt;
    if (labOn) labTick(dt);
    if (synOn) synTick(dt);
    // customers
    const crowd = queue.concat(leaving, extras, pets, cops, visitor ? [visitor] : []), stf = pharm ? staff.concat([pharm]) : staff;
    queue.forEach((c, i) => {
      if (c.asc) return;
      const w = moveTo(c, c.speed || 2.6, dt, crowd); c.phase += dt;
      walkAnim(c.g, c.phase, w, dt);
      c.wait += dt; idleTick(c, i, w, dt);
      if (!w && !c.idl) { const gp = c.g.position, face = Math.atan2(-1.5 - gp.x, 0.4 - gp.z) + c.faceJit + Math.sin(time * 0.5 + c.phase) * 0.12; c.g.rotation.y = lerpAngle(c.g.rotation.y, face, Math.min(1, dt * 6)); }
      c.emoteT -= dt;
      if (c.emoteT <= 0) { c.emoteT = 6 + Math.random() * 8; if (!c.karen && !c.sweaty && !c.fx && !c.mood && says.length < 4) idleEmote(c); }
      c.g.position.y = c.sit ? -0.3 : w ? Math.abs(Math.sin(c.phase * 9)) * 0.06 : 0;
      if (c.mood) {
        c.moodT += dt; const P = c.g.userData.P;
        if (c.mood === 'happy') { c.g.position.y = Math.abs(Math.sin(c.moodT * 7)) * 0.4 * Math.max(0, 1 - c.moodT / 1.6); P.arms[0].rotation.x = P.arms[1].rotation.x = -2.6 + Math.sin(c.moodT * 14) * 0.3; P.shirtM.emissive.setHex(0x1a1200); }
        else { c.g.position.x += Math.sin(c.moodT * 22) * 0.004 * Math.max(0, 1 - c.moodT / 0.6); P.shirtM.emissive.setHex(c.moodT < 0.9 ? 0x5a1208 : 0x000000); }
      }
    });
    queue.forEach(c => { karenFx(c, dt); sweatyFx(c, dt); });
    for (let i = leaving.length - 1; i >= 0; i--) {
      const c = leaving[i], w = moveTo(c, 3, dt, crowd); c.phase += dt; walkAnim(c.g, c.phase, w, dt);
      if (!c.karen) c.g.userData.P.shirtM.emissive.setHex(0x000000); karenFx(c, dt); sweatyFx(c, dt);
      if (c.rejected && !c.turned && !c.wp.length) { c.turned = true; startFx(c, 'angry'); say(c, 'Too busy!'); c.stall = 1.2; c.wp = [new T.Vector3(5, 0, 10.8)]; }
      if (!c.wp.length) { custGroup.remove(c.g); leaving.splice(i, 1); }
    }
    cops.forEach(c => { if (copJob && copJob.phase === 'in') { const w = moveTo(c, c.speed, dt, crowd); c.phase += dt; walkAnim(c.g, c.phase, w, dt); } });
    ragStep(dt); copStep(dt);
    // staff
    staffGroup.visible = !labOn && !synOn && !(fpT || fpK > 0.25);
    capTick(dt); pillTick(dt); brainTick(dt); evtTick(dt); holTick(dt);
    staff.forEach(s => {
      if (fpT || fpK > 0) return;
      keepOffPharm(s); const w = moveTo(s, 1.7, dt, stf); keepOffPharm(s); s.phase += dt; walkAnim(s.g, s.phase, w, dt);
      const P = s.g.userData.P;
      if (!w) { s.idle -= dt; P.arms[1].rotation.x = -1.2 + Math.sin(time * 5 + s.phase) * 0.5; s.g.rotation.y = lerpAngle(s.g.rotation.y, s.g.position.z < -3 ? PI : 0, dt * 4); if (s.idle <= 0) { s.idle = 1.5 + Math.random() * 3; s.wp.push(staffTarget()); } }
    });
    if (phoneG) {
      if (phoneRinging) {
        phoneG.rotation.z = Math.sin(time * 42) * 0.06; phoneHS.position.y = 0.3 + Math.abs(Math.sin(time * 22)) * 0.05;
        phoneLamp.material.emissiveIntensity = 0.3 + (Math.sin(time * 14) * 0.5 + 0.5) * 1.4;
        ringSayT -= dt; if (ringSayT <= 0) { ringSayT = 1.2; say(phoneObj, '📞', 'emo'); }
      }
    }
    if (notesStar) { notesStar.position.y = 0.8 + Math.sin(time * 2) * 0.08; notesStar.rotation.y += dt * 2; }
    if (robotRef) { robotRef.head.rotation.y = Math.sin(time * 0.9) * 0.5; robotRef.arms[0].rotation.x = Math.sin(time * 2) * 0.6; robotRef.arms[1].rotation.x = -Math.sin(time * 2) * 0.6; }
    ghosts.forEach(g => { g.material.opacity = 0.1 + (Math.sin(time * 3) * 0.5 + 0.5) * 0.18 + (hovered === g.userData.up ? 0.25 : 0); });
    clouds.forEach((c, i) => { c.position.x += dt * (0.35 + i * 0.05); if (c.position.x > 20) c.position.x = -20; });
    // particles & tweens
    coins.forEach(c => { if (c.life <= 0) return; c.life -= dt; c.v.y -= 11 * dt; c.m.position.addScaledVector(c.v, dt); c.m.rotation.x += dt * 9; c.m.rotation.z += dt * 6; if (c.m.position.y < 0.2) { c.m.position.y = 0.2; c.v.y *= -0.35; c.v.x *= 0.6; c.v.z *= 0.6; } c.m.material.opacity = Math.min(1, c.life * 2); if (c.life <= 0) c.m.visible = false; });
    for (let i = extras.length - 1; i >= 0; i--) {
      const e = extras[i], w = moveTo(e, 3, dt, crowd); e.phase += dt; walkAnim(e.g, e.phase, w, dt); sweatyFx(e, dt);
      if (!w && !e.leaving) e.g.rotation.y = lerpAngle(e.g.rotation.y, PI, Math.min(1, dt * 6));
      if (e.leaving && !e.wp.length) { custGroup.remove(e.g); extras.splice(i, 1); }
    }
    if (queue.length) { arriveT -= dt; if (arriveT <= 0) { arriveT = rushOn ? 5 + Math.random() * 4 : (15 + Math.random() * 9) * (slowOn ? 2.4 : 1); arrive(); } }
    const all = queue.concat(leaving, extras, pets, cops.filter(c => copJob && copJob.phase === 'in'), visitor ? [visitor] : [], himH ? [himH] : []);
    if (lineEl && queue.length !== lineN) { lineN = queue.length; lineEl.textContent = 'Line ' + lineN + '/' + maxq(); lineEl.className = 'line3d' + (lineN >= maxq() ? ' full' : lineN >= maxq() - 2 ? ' busy' : ''); }
    Crowd.separate(all, 1.15, onBump); Crowd.separate(stf, 1.0, onBump);
    Crowd.pushOut(all, 0.55); Crowd.pushOut(stf, 0.5);
    all.concat(stf).forEach(o => { if (o.bumpCd > 0) o.bumpCd -= dt; fxPass(o, dt); });
    for (let i = says.length - 1; i >= 0; i--) {
      const m = says[i]; m.t += dt; const q = m.o.g.position;
      if (m.t > 1.1) { m.el.remove(); says.splice(i, 1); } else place(m.el, q.x, q.y + (m.o.dy || 3.0), q.z);
    }
    if (fishG) fishTick(dt);
    visitorTick(dt); himTick(dt);
    pets.forEach(pt => {
      const w = moveTo(pt, pt.speed, dt, crowd); pt.phase += dt;
      if (!pt.fx) { pt.g.position.y = w ? Math.abs(Math.sin(pt.phase * (pt.kind === 'bunny' ? 10 : 13))) * (pt.kind === 'bunny' ? 0.16 : 0.05) : 0; pt.g.rotation.z = w ? Math.sin(pt.phase * 9) * 0.05 : 0; }
      if (!w) { pt.idle -= dt; if (pt.idle <= 0) { pt.idle = 1.5 + Math.random() * 4; pt.wp.push(petTarget()); if (Math.random() < 0.15) say(pt, '❤️', 'emo'); } }
    });
    if (pharm) {
      const P = pharm.g.userData.P, pp = pharm.g.position; pharm.phase += dt;
      if (P.spin) P.spin.forEach(m => { m.rotation.y += dt * 18; });
      if (buffOn) {
        const pu = 0.5 + 0.5 * Math.sin(time * 9); P.skinM.emissive.setRGB(0.34 + 0.22 * pu, 0.24 + 0.1 * pu, 0.02); buffCd -= dt;
        if (buffCd <= 0 && !pharm.fx) { buffCd = 2.6 + Math.random() * 1.6; startFx(pharm, Math.random() < 0.7 ? 'energy' : 'wave'); }
      } else if (buffWas) { P.skinM.emissive.setHex(0); }
      buffWas = buffOn;
      if (!pharm.fx) { P.arms[0].rotation.x = lerp(P.arms[0].rotation.x, -0.75 + Math.sin(pharm.phase * 5) * 0.12, 0.2); P.arms[1].rotation.x = lerp(P.arms[1].rotation.x, -0.75 + Math.sin(pharm.phase * 5 + 1.6) * 0.12, 0.2); }
      const tgt = queue[0] ? Math.atan2(queue[0].g.position.x - pp.x, queue[0].g.position.z - pp.z) : 0;
      pharm.g.rotation.y = lerpAngle(pharm.g.rotation.y, tgt * 0.7, Math.min(1, dt * 4));
    }
    drops.forEach(d => { if (d.life <= 0) return; d.life -= dt; d.vy -= 7 * dt; d.m.position.y += d.vy * dt; d.m.position.x += d.vx * dt; d.m.position.z += d.vz * dt; d.m.material.opacity = Math.min(0.95, d.life * 1.5); if (d.life <= 0 || d.m.position.y < 0.05) { d.life = 0; d.m.visible = false; } });
    puffs.forEach(p => { if (p.life <= 0) return; p.life -= dt; p.m.position.y += dt * 1.7; p.m.position.x += p.vx * dt; p.m.position.z += p.vz * dt; const k = 1 + (0.9 - p.life) * 2.2; p.m.scale.set(k, k, k); p.m.material.opacity = Math.max(0, p.life); if (p.life <= 0) p.m.visible = false; });
    for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i](dt)) tweens.splice(i, 1);
    // camera
    if (!fpT && keysDown.l !== keysDown.r) gth = clamp(gth + (keysDown.l ? -1 : 1) * dt * 1.4, -0.9, 1.5);
    if (!fpT && keysDown.u !== keysDown.d) gph = clamp(gph + (keysDown.u ? 1 : -1) * dt * 0.9, 0.55, 1.4);
    th = lerp(th, gth, 0.12); ph = lerp(ph, gph, 0.12); rad = lerp(rad, grad, 0.12); shake = Math.max(0, shake - dt);
    const sw = reduce ? 0 : Math.sin(time * 0.25) * 0.05, sk = reduce ? 0 : Math.sin(time * 60) * shake * 0.05, t2 = th + sw;
    camera.position.set(TX + rad * Math.sin(ph) * Math.sin(t2) + sk, TY + rad * Math.cos(ph), TZ + rad * Math.sin(ph) * Math.cos(t2));
    fpShakes = fpShakes.filter(k => { k.t += dt; if (k.t > 0.55) { k.it.grp.position.x = k.x; return false; } k.it.grp.position.x = k.x + Math.sin(k.t * 55) * 0.07 * (1 - k.t / 0.55); return true; });
    if (fpK !== fpT) { fpK = lerp(fpK, fpT, Math.min(1, dt * 2.6)); if (Math.abs(fpK - fpT) < 0.003) fpK = fpT; }
    if (fpK > 0) {
      const e = fpEyeV, l = fpLookV, s2 = fpK * fpK * (3 - 2 * fpK), px = camera.position.x, py = camera.position.y, pz = camera.position.z;
      camera.position.set(lerp(px, e.x, s2), lerp(py, e.y, s2), lerp(pz, e.z, s2));
      camera.lookAt(lerp(TX, l.x, s2), lerp(TY, l.y, s2), lerp(TZ, l.z, s2));
      const fv = 40 + (fpTF - 40) * s2; if (Math.abs(fv - fpFov) > 0.05) { fpFov = fv; camera.fov = fv; camera.updateProjectionMatrix(); }
    } else {
      if (hcam.k > 0.001) { const s = easeIO(hcam.k); camera.position.set(lerp(camera.position.x, hcam.ex, s), lerp(camera.position.y, hcam.ey, s), lerp(camera.position.z, hcam.ez, s)); camera.lookAt(lerp(TX, hcam.tx, s), lerp(TY, hcam.ty, s), lerp(TZ, hcam.tz, s)); } else camera.lookAt(TX, TY, TZ);
      if (fpFov !== 40) { fpFov = 40; camera.fov = 40; camera.updateProjectionMatrix(); } }
    if (fpG && fpK === 0 && !fpT) fpClear();
    if (synOn) {
      // nothing from the pharmacy (patient puffs, drips, coins) may draw over the synapse
      scene.children.forEach(c => { if (c !== synG && c !== hemi && c !== sun && c.visible) { c.visible = false; if (synHid.indexOf(c) < 0) synHid.push(c); } });
      camera.updateMatrixWorld(); synLabelPass();
    }
    renderer.render(scene, camera);
    if (fpScreen && fpqEl) {
      if (fpK > 0.985) {
        const w = host.clientWidth, h = host.clientHeight;
        let cx = w / 2, cy = h / 2, k = Math.min(w / 760, h / 470) * 0.94;   // safe default: centered and fitted to the stage
        try {
          camera.updateMatrixWorld();
          const pj = (x, y) => { tmp.set(x, y, -0.3).project(camera); return [(tmp.x * 0.5 + 0.5) * w, (-tmp.y * 0.5 + 0.5) * h]; };
          const a = pj(2.2 - 0.36, 1.84 + 0.22), b = pj(2.2 + 0.36, 1.84 - 0.22), sw = b[0] - a[0], sh = b[1] - a[1];
          const kk = Math.min(sw / 720, sh / 440) * 0.98, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
          if (isFinite(kk) && isFinite(mx) && isFinite(my) && kk > 0.25 && kk < 2.2 && mx > 0 && mx < w && my > 0 && my < h) { k = kk; cx = mx; cy = my; }
        } catch (e) { /* keep the safe default */ }
        fpqEl.style.left = cx + 'px'; fpqEl.style.top = cy + 'px'; fpqEl.style.transform = 'translate(-50%,-50%) scale(' + k.toFixed(4) + ')'; fpqEl.style.opacity = '1';
      } else fpqEl.style.opacity = '0';
    }
    for (let i = fpXs.length - 1; i >= 0; i--) { const x = fpXs[i]; x.t += 0.016; if (x.t > 1.4 || !fpT) { x.el.remove(); fpXs.splice(i, 1); } else place(x.el, x.c.x, x.c.y, x.c.z); }
    CLICK.forEach(id => place(tags[id], BASE[id][0], TAGY[id], BASE[id][2]));
    if (cur) { place(bubEl, cur.g.position.x, 3.0 + Math.abs(Math.sin(time * 3)) * 0.1, cur.g.position.z); }
    decorTick(time);
    if (bubEl) {
      let hide = !!(himH || himAsc);
      if (!hide && tagsEl) {
        const sy = tagsEl.querySelectorAll('.say3d');
        if (sy.length) { const b = bubEl.getBoundingClientRect(); for (let i = 0; i < sy.length && !hide; i++) { const r = sy[i].getBoundingClientRect(); if (r.width && r.right > b.left - 4 && r.left < b.right + 4 && r.bottom > b.top - 4 && r.top < b.bottom + 4) hide = true; } }
      }
      bubEl.style.visibility = hide ? 'hidden' : '';
    }
  }

  function applyTheme() {
    const cs = getComputedStyle(host), col = (cs.getPropertyValue('--stage') || '#CFE7E9').trim();
    scene.background = new T.Color(col);
    const c = new T.Color(col), dark = (c.r + c.g + c.b) / 3 < 0.35;
    hemi.intensity = dark ? 0.5 : 0.85; sun.intensity = dark ? 0.55 : 0.8;
    if (synOn) { scene.background = new T.Color(SYN_BG); hemi.intensity = 0.95; sun.intensity = 0.6; }
    else if (labOn) { scene.background = new T.Color(dark ? '#16282F' : '#E7F0F3'); hemi.intensity = dark ? 0.9 : 1.1; sun.intensity = 0.7; }
    else if (hol && HOLBG[hol]) { scene.background = new T.Color(HOLBG[hol][dark ? 1 : 0]); try { if (hol === 'halloween') { hemi.color.setHex(0xFFB26B); sun.color.setHex(0xFF9540); hemi.intensity = dark ? 0.7 : 0.95; } else { hemi.color.setHex(0xEAF3FF); sun.color.setHex(0xFFF2DD); } } catch (e) { /* stub */ } }
    if (!(hol && !synOn && !labOn)) { try { hemi.color.setHex(0xffffff); sun.color.setHex(0xffffff); } catch (e) { /* stub */ } }
  }
  let insR = 0, insB = 0;
  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const vw = Math.max(220, w - insR), vh = Math.max(180, h - insB);
    if (insR > 0 || insB > 0) camera.setViewOffset(w, h, insR / 2, insB / 2, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    const k = 2 * Math.tan(20 * PI / 180);
    const ratio = baseRad ? grad / baseRad : 1;
    baseRad = Math.min(58, Math.max(17 * h / vh, 21 / (k * vw / h))); grad = clamp(baseRad * ratio, baseRad * 0.55, baseRad * 1.3);
  }
  api.setInset = function (r, b) { insR = Math.round(r); insB = Math.round(b); if (api.ok) resize(); };

  /* ---- compounding pharmacy: a separate white lab room ---- */
  let labG = null, labOn = false, labHid = [], labBub = [], labPerson = null, lastMe = null, labT = 0, labBoil = 0; const labItems = [];
  const GLS = { transparent: true, opacity: 0.28, roughness: 0.1, metalness: 0.1, side: 2, depthWrite: false };
  const LQ = (o) => ({ transparent: true, opacity: o || 0.78, roughness: 0.2, depthWrite: false });
  const LSCRUB = ['#BFE3F0', '#F3E7A6', '#CDEFC9', '#F2C2D4', '#D9CCF2', '#FFD9A8'];
  const WORDS = { mortar: ['Ground fine!', 'Levigating...', 'Geometric mix'], beaker: ['Swirl...', 'Dissolved!', 'Mixing'], flask: ['Bubbling', 'Reaction!', 'Fizz'], round: ['Reflux...', 'Warming up', 'Stirring'], cyl: ['Meniscus!', 'Read at eye level', 'Measured'], bottle: ['Label check!', 'Keep capped', 'Stock bottle'], balance: ['Tared', 'Weighing...', 'Stable'], hood: ['Sash up!', 'Airflow OK', 'Hood on'], plate: ['Heating', 'Stirring', 'Warm'], ext: ['Class ABC', 'Pull the pin', 'In date'] };
  function lg(p, x, y, z, kind) { const G = new T.Group(); G.position.set(x, y, z); G.userData.lab = kind; G.userData.g = G; G.userData.busy = 0; p.add(G); labItems.push(G); return G; }
  function glRim(p, r, x, y, z) { const m = add(p, new T.TorusGeometry(r, 0.012, 4, 14), '#D4E9EE', x, y, z); m.rotation.x = PI / 2; return m; }
  function beaker(p, x, y, z, r, h, col, f) {
    const G = lg(p, x, y, z, 'beaker'); p = G; x = y = z = 0;
    cy(p, r, r * 0.94, h, 14, '#DDF2F7', 0, h / 2, 0, null, GLS);
    if (f > 0) G.userData.liq = cy(p, r * 0.93, r * 0.88, h * f, 14, col, 0, h * f / 2 + 0.01, 0, null, LQ());
    glRim(p, r, 0, h, 0); G.userData.h = h * f;
    for (let i = 1; i < 4; i++) bx(p, 0.05, 0.008, 0.01, '#8AA7B0', r * 0.78, h * i / 4.3, r * 0.62);
    return G;
  }
  function flask(p, x, y, z, s, col, f) {
    const G = lg(p, x, y, z, 'flask'); p = G; x = y = z = 0;
    cy(p, 0.07 * s, 0.24 * s, 0.34 * s, 14, '#DDF2F7', 0, 0.17 * s, 0, null, GLS);
    cy(p, 0.07 * s, 0.07 * s, 0.24 * s, 12, '#DDF2F7', 0, 0.34 * s + 0.12 * s, 0, null, GLS);
    if (f > 0) { const rt = 0.24 * s + (0.07 * s - 0.24 * s) * f; G.userData.liq = cy(p, rt * 0.94, 0.225 * s, 0.34 * s * f, 14, col, 0, 0.34 * s * f / 2 + 0.01, 0, null, LQ()); }
    glRim(p, 0.075 * s, 0, 0.58 * s, 0); G.userData.h = 0.34 * s * f;
    return G;
  }
  function roundFlask(p, x, y, z, s, col) {
    const G = lg(p, x, y, z, 'flask'); p = G; x = y = z = 0;
    add(p, new T.SphereGeometry(0.2 * s, 14, 10), '#DDF2F7', 0, 0.2 * s, 0, null, GLS);
    cy(p, 0.06 * s, 0.06 * s, 0.3 * s, 10, '#DDF2F7', 0, 0.4 * s + 0.1 * s, 0, null, GLS);
    const l = add(p, new T.SphereGeometry(0.17 * s, 12, 8), col, 0, 0.15 * s, 0, null, LQ()); l.scale.set(1, 0.62, 1); G.userData.liq = l; G.userData.h = 0.2 * s;
    glRim(p, 0.065 * s, 0, 0.65 * s, 0);
    return G;
  }
  function gradCyl(p, x, y, z, s, col, f) {
    const G = lg(p, x, y, z, 'cyl'); p = G; x = y = z = 0;
    cy(p, 0.09 * s, 0.1 * s, 0.03 * s, 12, '#CFE0E5', 0, 0.015 * s, 0);
    cy(p, 0.05 * s, 0.05 * s, 0.6 * s, 12, '#DDF2F7', 0, 0.33 * s, 0, null, GLS);
    if (f > 0) { G.userData.liq = cy(p, 0.045 * s, 0.045 * s, 0.58 * s * f, 12, col, 0, 0.04 * s + 0.29 * s * f, 0, null, LQ()); G.userData.h = 0.58 * s * f; }
    for (let i = 1; i < 6; i++) bx(p, 0.03 * s, 0.006, 0.01, '#5C7A85', 0.045 * s, 0.08 * s + i * 0.09 * s, 0.03 * s);
    return G;
  }
  function mortar(p, x, y, z, s, powder, tilt) {
    const G = lg(p, x, y, z, 'mortar'); p = G; x = y = z = 0;
    cy(p, 0.12 * s, 0.15 * s, 0.05 * s, 12, '#E4E1D8', 0, 0.025 * s, 0);
    cy(p, 0.27 * s, 0.17 * s, 0.2 * s, 14, '#F1EFE8', 0, 0.15 * s, 0);
    cy(p, 0.235 * s, 0.235 * s, 0.012, 14, powder ? '#FFFFFF' : '#D5D1C4', 0, 0.245 * s, 0);
    if (powder) G.userData.mound = cone(p, 0.15 * s, 0.1 * s, 9, '#FFFFFF', 0, 0.3 * s, 0);
    const g = new T.Group(); g.position.set(0.06 * s, 0.3 * s, tilt ? 0.02 : 0); g.rotation.z = tilt || 0.55; p.add(g);
    cy(g, 0.032 * s, 0.05 * s, 0.4 * s, 8, '#E8E4DA', 0, 0.1 * s, 0);
    add(g, new T.SphereGeometry(0.07 * s, 8, 6), '#E8E4DA', 0, 0.31 * s, 0);
    G.userData.pestle = g; G.userData.pz = g.rotation.z; G.userData.s = s;
    return G;
  }
  function balance(p, x, y, z) {
    const G = lg(p, x, y, z, 'balance'); p = G; x = y = z = 0;
    bx(p, 0.8, 0.12, 0.6, '#E6ECEE', 0, 0.06, 0);
    G.userData.disp = bx(p, 0.3, 0.1, 0.03, '#A8F5BA', 0, 0.1, 0.31, null, { emissive: new T.Color(0x5FD884), emissiveIntensity: 0.55 });
    G.userData.pan = cy(p, 0.2, 0.2, 0.03, 16, '#C8D1D4', 0, 0.14, -0.05);
    bx(p, 0.62, 0.4, 0.5, '#DDF2F7', 0, 0.34, -0.05, null, GLS);
    G.userData.boat = bx(p, 0.14, 0.015, 0.1, '#FFFFFF', 0, 0.165, -0.05);
    return G;
  }
  function bottle(p, x, y, z, col, h, lab) {
    const G = lg(p, x, y, z, 'bottle'); p = G; x = y = z = 0;
    cy(p, 0.09, 0.1, h, 10, col, 0, h / 2, 0);
    cy(p, 0.05, 0.07, 0.08, 10, col, 0, h + 0.04, 0);
    G.userData.cap = cy(p, 0.05, 0.05, 0.05, 10, '#2B3438', 0, h + 0.1, 0);
    cy(p, 0.102, 0.102, h * 0.36, 10, lab || '#F7F7F2', 0, h * 0.45, 0);
    return G;
  }
  function weighBoat(p, x, y, z) { bx(p, 0.16, 0.025, 0.1, '#FFFFFF', x, y + 0.013, z); bx(p, 0.1, 0.02, 0.07, '#F2F2F2', x, y + 0.03, z); }
  function spatula(p, x, y, z, r) { const m = bx(p, 0.26, 0.012, 0.03, '#B8C2C6', x, y + 0.007, z); m.rotation.y = r || 0; bx(p, 0.07, 0.012, 0.045, '#B8C2C6', x + Math.cos(r || 0) * 0.15, y + 0.007, z - Math.sin(r || 0) * 0.15).rotation.y = r || 0; }
  function benchTop(p, w, d, x, z) { bx(p, w, 0.95, d, '#E7EEF0', x, 0.475, z); for (let i = 0; i < Math.floor(w / 0.9); i++) bx(p, 0.82, 0.55, 0.03, '#D3E0E5', x - w / 2 + 0.55 + i * 0.9, 0.5, z + d / 2 + 0.005); bx(p, w + 0.1, 0.07, d + 0.1, '#39474D', x, 0.985, z); }
  function buildLab(g) {
    const px = 0.5;
    bx(g, 15, 0.7, 12.4, '#BFCACE', px, -0.35, -0.2);
    for (let i = 0; i < 7; i++) for (let j = 0; j < 6; j++) bx(g, 1.98, 0.06, 1.98, (i + j) % 2 ? '#FFFFFF' : '#EEF4F6', -5 + i * 2, 0.03, -5.2 + j * 2);
    bx(g, 15, 6.6, 0.4, '#F8FBFC', px, 3.3, -6.4);
    bx(g, 0.4, 6.6, 12.6, '#F3F8F9', -6.7, 3.3, -0.2);
    bx(g, 0.4, 6.6, 12.6, '#F3F8F9', 7.7, 3.3, -0.2);
    bx(g, 15, 1.2, 0.05, '#DCE8EC', px, 0.6, -6.18); bx(g, 15, 0.09, 0.07, '#5FB3CE', px, 1.28, -6.16); bx(g, 15, 0.14, 0.08, '#5FB3CE', px, 0.08, -6.16);
    bx(g, 0.05, 1.2, 12.4, '#DCE8EC', -6.48, 0.6, -0.2); bx(g, 0.07, 0.09, 12.4, '#5FB3CE', -6.46, 1.28, -0.2);
    bx(g, 0.05, 1.2, 12.4, '#DCE8EC', 7.48, 0.6, -0.2); bx(g, 0.07, 0.09, 12.4, '#5FB3CE', 7.46, 1.28, -0.2);
    bx(g, 3.9, 0.012, 0.14, '#F2C21B', px, 0.07, -3.55); bx(g, 0.14, 0.012, 1.8, '#F2C21B', px - 1.9, 0.07, -4.45); bx(g, 0.14, 0.012, 1.8, '#F2C21B', px + 1.9, 0.07, -4.45);
    // sign: text is measured so it always fits the plate
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 192; const c2 = cv.getContext('2d');
    if (c2) { c2.fillStyle = '#FFFFFF'; c2.fillRect(0, 0, 1024, 192); c2.fillStyle = '#0E6B7F'; c2.fillRect(0, 0, 1024, 14); c2.fillRect(0, 178, 1024, 14); c2.textAlign = 'center'; c2.textBaseline = 'middle'; let fs = 100; do { c2.font = '800 ' + fs + 'px system-ui, sans-serif'; fs -= 4; } while (c2.measureText && c2.measureText('COMPOUNDING PHARMACY').width > 900 && fs > 30); c2.fillText('COMPOUNDING PHARMACY', 512, 98); }
    const sg = new T.Mesh(new T.PlaneGeometry(4.2, 0.79), new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv) })); sg.position.set(-3.8, 4.4, -6.12); g.add(sg);
    bx(g, 4.4, 0.98, 0.06, '#0E6B7F', -3.8, 4.4, -6.17);
    // hood bench
    benchTop(g, 13.4, 1.7, px, -5.2);
    const h = new T.Group(); h.position.set(px, 1.02, -5.2); g.add(h);
    bx(h, 0.12, 2.75, 1.45, '#DCE4E7', -1.65, 1.375, -0.05); bx(h, 0.12, 2.75, 1.45, '#DCE4E7', 1.65, 1.375, -0.05);
    bx(h, 3.4, 2.75, 0.08, '#F4F8F9', 0, 1.375, -0.76);
    bx(h, 3.45, 0.3, 1.55, '#DCE4E7', 0, 2.9, -0.02);
    const hl = bx(h, 3.1, 0.05, 0.32, '#FFFFFF', 0, 2.72, -0.35, null, { emissive: new T.Color(0xFFFFFF), emissiveIntensity: 0.9 });
    const sash = lg(h, 0, 0, 0, 'hood'); sash.userData.light = hl;
    bx(sash, 3.1, 1.3, 0.03, '#CDEBF2', 0, 1.95, 0.62, null, GLS); bx(sash, 3.3, 0.1, 0.07, '#9AA7AC', 0, 1.3, 0.63); bx(sash, 3.3, 0.1, 0.07, '#9AA7AC', 0, 2.62, 0.63);
    bx(h, 3.1, 0.03, 1.3, '#B8C3C7', 0, 0.03, -0.1);
    bx(h, 0.34, 0.55, 0.05, '#1E2A2E', 1.65, 2.05, 0.7); bx(h, 0.24, 0.12, 0.02, '#8EF0A8', 1.65, 2.2, 0.73, null, { emissive: new T.Color(0x5FD884), emissiveIntensity: 0.7 });
    cy(g, 0.36, 0.36, 4.2, 12, '#C9D2D6', px, 5.0, -5.4); cy(g, 0.46, 0.46, 0.14, 12, '#9AA7AC', px, 4.1, -5.4);
    const plate = lg(h, -0.9, 0, -0.1, 'plate');
    cy(plate, 0.3, 0.3, 0.1, 16, '#38474D', 0, 0.1, 0); plate.userData.ring = cy(plate, 0.26, 0.26, 0.02, 16, '#6C7A80', 0, 0.16, 0);
    const pf = flask(plate, 0, 0.17, 0, 1.15, '#7FD4E8', 0.55); plate.userData.liq = pf.userData.liq;
    for (let i = 0; i < 5; i++) { const b = add(h, new T.SphereGeometry(0.025, 6, 5), '#FFFFFF', -0.9, 0.3, -0.1, null, { transparent: true, opacity: 0.75, depthWrite: false }); labBub.push({ m: b, x: -0.9, z: -0.1, y0: 0.22, hh: 0.32, p: i / 5, sp: 0.35 + i * 0.05, ph: i * 1.7 }); }
    bx(h, 0.45, 0.04, 0.3, '#38474D', 0.75, 0.05, -0.4); cy(h, 0.015, 0.015, 1.55, 6, '#8A969B', 0.75, 0.82, -0.4); bx(h, 0.32, 0.03, 0.03, '#8A969B', 0.6, 1.0, -0.4);
    roundFlask(h, 0.45, 0.78, -0.4, 1.0, '#F2C2D4');
    beaker(h, 0.2, 0.04, 0.25, 0.14, 0.26, '#B9E8C0', 0.6); beaker(h, -0.3, 0.04, 0.3, 0.1, 0.2, '#F3E7A6', 0.5); gradCyl(h, 1.2, 0.04, 0.1, 1, '#FFD9A8', 0.6);
    cy(h, 0.05, 0.05, 0.25, 8, '#FFFFFF', 1.35, 0.15, 0.35); cy(h, 0.025, 0.04, 0.07, 8, '#3F9FD6', 1.35, 0.3, 0.35);
    // bench items beside the hood
    mortar(g, -4.6, 1.02, -5.2, 1.0, true); mortar(g, -3.2, 1.02, -5.0, 0.8, false, 0.2); beaker(g, -2.4, 1.02, -5.3, 0.15, 0.28, '#BFE3F0', 0.7); flask(g, -2.0, 1.02, -4.9, 1.1, '#CDEFC9', 0.45);
    balance(g, -5.4, 1.02, -5.2); weighBoat(g, -4.0, 1.02, -4.7); spatula(g, -3.9, 1.02, -4.55, 0.3);
    flask(g, 3.1, 1.02, -5.3, 0.9, '#F2C2D4', 0.5); beaker(g, 3.7, 1.02, -5.0, 0.12, 0.22, '#D9CCF2', 0.65); beaker(g, 4.1, 1.02, -5.35, 0.18, 0.34, '#BFE3F0', 0.4); mortar(g, 5.0, 1.02, -5.1, 0.9, true); gradCyl(g, 5.9, 1.02, -5.3, 1.1, '#FFD9A8', 0.7);
    roundFlask(g, 6.4, 1.02, -4.9, 0.9, '#F3E7A6'); spatula(g, 4.6, 1.02, -4.65, -0.4);
    // wall shelves
    [[-4, 2.45], [-4, 3.25], [5, 2.45], [5, 3.25]].forEach((s, si) => {
      bx(g, 3.8, 0.06, 0.4, '#CBD5D9', s[0], s[1], -6.0);
      for (let i = 0; i < 9; i++) { const c = ['#B4651A', '#B4651A', '#3C7A8C', '#E8EEF0', '#B4651A', '#7A8F3C'][(i + si) % 6]; if ((i + si * 3) % 4 === 3) beaker(g, s[0] - 1.7 + i * 0.42, s[1] + 0.03, -6.0, 0.1, 0.22, LSCRUB[(i + si) % 6], 0.55); else bottle(g, s[0] - 1.7 + i * 0.42, s[1] + 0.03, -6.0, c, 0.28 + (i % 3) * 0.05, null); }
    });
    // island
    benchTop(g, 6.6, 1.5, px, -0.6);
    mortar(g, -2.2, 1.02, -0.3, 1.1, true); mortar(g, 2.9, 1.02, -0.1, 0.85, false); mortar(g, 3.5, 1.02, -0.7, 0.7, true, -0.3);
    beaker(g, -0.9, 1.02, -0.3, 0.17, 0.32, '#BFE3F0', 0.55); beaker(g, -0.5, 1.02, -0.05, 0.12, 0.22, '#F3E7A6', 0.6); beaker(g, -1.3, 1.02, -0.05, 0.1, 0.18, '#CDEFC9', 0.5);
    flask(g, -1.6, 1.02, -0.65, 1.3, '#F2C2D4', 0.4); flask(g, 1.9, 1.02, -0.6, 1.0, '#BFE3F0', 0.5); roundFlask(g, 2.2, 1.02, -0.05, 1.0, '#D9CCF2');
    gradCyl(g, 1.4, 1.02, -0.2, 1.2, '#CDEFC9', 0.65); gradCyl(g, 1.65, 1.02, 0.15, 0.9, '#FFD9A8', 0.4); balance(g, 0.7, 1.02, 0.05);
    weighBoat(g, -0.1, 1.02, -0.1); weighBoat(g, 0.15, 1.02, -0.35); spatula(g, -2.8, 1.02, 0.1, 0.5); spatula(g, 0.1, 1.02, 0.2, -0.2);
    // left bench and right storage
    benchTop(g, 1.5, 7.2, -5.6, -1.6);
    mortar(g, -5.6, 1.02, -4.2, 0.9, true); beaker(g, -5.5, 1.02, -3.0, 0.15, 0.3, '#BFE3F0', 0.6); flask(g, -5.7, 1.02, -2.2, 1.0, '#F3E7A6', 0.5); beaker(g, -5.3, 1.02, -1.5, 0.11, 0.2, '#F2C2D4', 0.6);
    roundFlask(g, -5.6, 1.02, -0.5, 1.0, '#CDEFC9'); gradCyl(g, -5.4, 1.02, 0.4, 1.1, '#D9CCF2', 0.6); mortar(g, -5.7, 1.02, 1.2, 0.8, false); weighBoat(g, -5.2, 1.02, 0.9);
    bx(g, 0.9, 3.6, 5.4, '#E3EBEE', 6.95, 1.8, -0.5); bx(g, 0.05, 3.2, 5.0, '#CDEBF2', 6.47, 1.85, -0.5, null, GLS);
    for (let r = 0; r < 4; r++) { bx(g, 0.05, 0.05, 5.0, '#9AA7AC', 6.45, 0.65 + r * 0.8, -0.5); for (let i = 0; i < 7; i++) { if ((i + r) % 3 === 0) beaker(g, 6.6, 0.68 + r * 0.8, -2.5 + i * 0.66, 0.1, 0.22, LSCRUB[(i + r) % 6], 0.5); else bottle(g, 6.6, 0.68 + r * 0.8, -2.5 + i * 0.66, ['#B4651A', '#3C7A8C', '#B4651A', '#E8EEF0'][(i + r) % 4], 0.3, null); } }
    bx(g, 0.5, 0.3, 0.3, '#2E8F4E', -6.2, 1.9, 4.4);
    const ex = lg(g, -6.25, 0, 5.0, 'ext'); cy(ex, 0.14, 0.14, 0.7, 10, '#C4332B', 0, 0.45, 0); cy(ex, 0.05, 0.05, 0.12, 8, '#222', 0, 0.85, 0); bx(ex, 0.16, 0.04, 0.04, '#222', 0.08, 0.92, 0);
    bx(g, 5.2, 0.01, 1.1, '#CFE2EA', px, 0.065, 1.35);
  }
  function buildLabPerson() {
    if (!lastMe || !labG) return;
    if (labPerson) { labG.remove(labPerson); const i = labItems.indexOf(labPerson); if (i >= 0) labItems.splice(i, 1); labPerson = null; }
    const me = lastMe;
    const g = person(1, false, false, false, me.body === 'normal' ? undefined : me.body, { skin: me.skin, hair: me.hairCol, shirt: me.shirtCol || '#F7FBFB', shoes: me.shoes || null, hairStyle: HAIR_MAP[me.hair] === undefined ? 0 : HAIR_MAP[me.hair], gender: me.gender, coat: true, scrub: me.scrub, acc: me.acc, accOn: me.accOn || 0, cosm: me.cosm || null, tag: { pharm: true } });
    g.position.set(0.5, 0, -1.9); labG.add(g); labPerson = g; g.userData.lab = 'pharm'; g.userData.g = g; g.userData.busy = 0; labItems.push(g);
  }
  function wpos(G) { let x = 0, y = 0, z = 0, o = G; while (o && o !== scene) { x = o.position.x + o.scale.x * x; y = o.position.y + o.scale.y * y; z = o.position.z + o.scale.z * z; o = o.parent; } return { x, y, z }; }
  function labSay(G, text, dy) { const w = wpos(G); say({ g: { position: { x: w.x, y: w.y, z: w.z } }, dy: dy || 0.7 }, text, 'emo'); }
  function anim(G, dur, fn, end) { let u = 0; G.userData.busy = 1; tweens.push(function (dt) { u += dt; const k = Math.min(1, u / dur); fn(k, u); if (k >= 1) { if (end) end(); G.userData.busy = 0; return true; } return false; }); }
  const wob = (k) => Math.sin(k * 26) * (1 - k);
  function recolor(G, col) {
    const L = G.userData.liq; if (!L) return;
    if (!G.userData.own) { L.material = L.material.clone(); G.userData.own = true; }
    L.material.color.set(col);
  }
  function labClick(ud) {
    const G = ud && ud.g; if (!G || G.userData.busy > 0) return;
    const k = G.userData.lab, w = wpos(G), U = G.userData, W = WORDS[k];
    if (W && Math.random() < 0.8) labSay(G, W[Math.floor(Math.random() * W.length)], k === 'hood' ? 3.4 : k === 'bottle' ? 0.7 : 0.9);
    if (k === 'mortar') {
      const pe = U.pestle, s = U.s; let n = 0;
      anim(G, 1.9, (t, u) => { pe.rotation.y = u * 7; pe.rotation.z = U.pz + Math.sin(u * 9) * 0.12; pe.position.x = 0.06 * s + Math.cos(u * 7) * 0.05 * s; pe.position.z = Math.sin(u * 7) * 0.05 * s; G.rotation.z = Math.sin(u * 22) * 0.01; if (u > n * 0.22) { n++; emitPuff(w.x + (Math.random() - 0.5) * 0.15, w.y + 0.35 * s, w.z + (Math.random() - 0.5) * 0.15); } if (U.mound) U.mound.scale.y = 1 - t * 0.6; },
        () => { pe.rotation.y = 0; pe.rotation.z = U.pz; pe.position.set(0.06 * s, 0.3 * s, 0); G.rotation.z = 0; if (U.mound) U.mound.scale.y = 1; });
    } else if (k === 'beaker' || k === 'flask') {
      const L = U.liq; let n = 0; recolor(G, LSCRUB[Math.floor(Math.random() * LSCRUB.length)]);
      anim(G, 1.5, (t, u) => { G.rotation.z = wob(t) * 0.1; if (L) { L.rotation.y = u * 6; L.scale.x = L.scale.z = 1 + Math.sin(u * 14) * 0.04 * (1 - t); } if (u > n * 0.2) { n++; emitPuff(w.x + (Math.random() - 0.5) * 0.12, w.y + (U.h || 0.2) + 0.1, w.z + (Math.random() - 0.5) * 0.12); } if (n < 4 && Math.random() < 0.3) emitDrop(w.x, w.y + (U.h || 0.2), w.z); },
        () => { G.rotation.z = 0; if (L) { L.rotation.y = 0; L.scale.x = L.scale.z = 1; } });
    } else if (k === 'cyl') {
      const L = U.liq, y0 = L ? L.position.y : 0, hh = U.h || 0.3;
      anim(G, 1.3, (t) => { if (!L) return; const s = 1 + Math.sin(t * PI) * 0.45 * (t < 0.5 ? 1 : 1 - (t - 0.5) * 0.4); L.scale.y = s; L.position.y = y0 + (s - 1) * hh / 2; }, () => { if (L) { L.scale.y = 1; L.position.y = y0; } });
      recolor(G, LSCRUB[Math.floor(Math.random() * LSCRUB.length)]);
    } else if (k === 'balance') {
      const d = U.disp, pan = U.pan, bt = U.boat, py = pan.position.y, by = bt.position.y; d.material = d.material.clone();
      anim(G, 1.4, (t, u) => { pan.position.y = py - Math.abs(Math.sin(u * 8)) * 0.02 * (1 - t); bt.position.y = by + (t < 0.2 ? t * 1.2 : Math.max(0, 0.24 - t * 0.3)) * (t < 0.6 ? 1 : 0.2) - (pan.position.y - py) * 0; d.material.emissiveIntensity = 0.55 + Math.sin(u * 30) * 0.4 * (1 - t); },
        () => { pan.position.y = py; bt.position.y = by; d.material.emissiveIntensity = 0.55; });
      labSay(G, (Math.round(Math.random() * 900) / 10 + 0.1).toFixed(1) + ' mg', 0.95);
    } else if (k === 'bottle') {
      const cap = U.cap, cy0 = cap.position.y, gy0 = G.position.y;
      anim(G, 1.0, (t) => { G.position.y = gy0 + Math.sin(Math.min(1, t * 1.6) * PI) * 0.18; G.rotation.y = t * PI * 2; cap.position.y = cy0 + Math.sin(Math.min(1, t * 2) * PI) * 0.22; G.rotation.z = wob(t) * 0.05; },
        () => { G.rotation.y = 0; G.rotation.z = 0; G.position.y = gy0; cap.position.y = cy0; });
    } else if (k === 'hood') {
      const hl = U.light;
      anim(G, 2.6, (t, u) => { const up = t < 0.25 ? t / 0.25 : t > 0.75 ? (1 - t) / 0.25 : 1; G.position.y = up * 0.85; hl.material.emissiveIntensity = 0.9 + Math.sin(u * 18) * 0.35; }, () => { G.position.y = 0; hl.material.emissiveIntensity = 0.9; });
    } else if (k === 'plate') {
      labBoil = 3.2; const ring = U.ring; ring.material = ring.material.clone(); let n = 0; recolor(G, '#FFB06B');
      anim(G, 3.2, (t, u) => { ring.material.color.setRGB(0.42 + (1 - t) * 0.5 * Math.min(1, t * 6), 0.48, 0.5); ring.material.emissive.setRGB(0.9 * (1 - t), 0.25 * (1 - t), 0); if (u > n * 0.25) { n++; emitPuff(w.x + (Math.random() - 0.5) * 0.15, w.y + 0.75, w.z + (Math.random() - 0.5) * 0.15); } }, () => { ring.material.emissive.setRGB(0, 0, 0); recolor(G, '#7FD4E8'); });
    } else if (k === 'ext') {
      anim(G, 1.0, (t) => { G.rotation.z = wob(t) * 0.18; G.rotation.x = wob(t) * 0.06; }, () => { G.rotation.z = 0; G.rotation.x = 0; });
    } else if (k === 'pharm' && labPerson) {
      const P = G.userData.P;
      anim(G, 1.6, (t, u) => { if (P) { P.arms[1].rotation.x = -2.5 + Math.sin(u * 12) * 0.35; } G.position.y = Math.abs(Math.sin(t * PI * 2)) * 0.12; }, () => { if (P) P.arms[1].rotation.x = 0; G.position.y = 0; });
      labSay(G, 'Check the math!', 3.0);
    }
  }
  function labTick(dt) {
    labT += dt; if (labBoil > 0) labBoil -= dt;
    const sp = labBoil > 0 ? 3 : 1;
    labBub.forEach(b => { b.p += dt * b.sp * sp; if (b.p > 1) b.p -= 1; b.m.position.set(b.x + Math.sin(labT * 3 + b.ph) * 0.03, b.y0 + b.p * b.hh, b.z + Math.cos(labT * 2 + b.ph) * 0.03); });
    scene.children.forEach(c => { if (c !== labG && c !== synG && c !== hemi && c !== sun && c.visible && !(c.userData && c.userData.fx)) { c.visible = false; if (labHid.indexOf(c) < 0) labHid.push(c); } });
    if (labPerson && labPerson.userData.busy <= 0) { labPerson.rotation.y = Math.sin(labT * 0.4) * 0.12; labPerson.position.y = Math.sin(labT * 1.6) * 0.01; }
  }
  api.setLab = function (on) {
    if (!api.ok || !scene) return false;
    on = !!on; if (on === labOn) return on;
    if (on) {
      if (!labG) { labG = new T.Group(); buildLab(labG); scene.add(labG); }
      labHid = []; scene.children.forEach(c => { if (c !== labG && c !== hemi && c !== sun && c.visible && !(c.userData && c.userData.fx)) { c.visible = false; labHid.push(c); } });
      labG.visible = true; labOn = true; buildLabPerson();
    } else {
      labOn = false; labHid.forEach(c => { c.visible = true; }); labHid = []; if (labG) labG.visible = false;
    }
    document.body.classList.toggle('lab', on); applyTheme(); return on;
  };
  api.labOn = () => labOn;
  api.devLabClick = function (i) { const G = labItems[i]; if (G) labClick(G.userData); return labItems.length; };
  /* ---- secret capsules: a pill drifting across the clouds, and one that pops out of the left plant ---- */
  let capG = null, capObj = null, capT = 35 + Math.random() * 40, plantT = 70 + Math.random() * 60, plantL = null;
  const CAPCOL = [['#E04F3A', '#FFFFFF'], ['#3E72D9', '#FFFFFF'], ['#2FAE66', '#FFFFFF'], ['#F2A516', '#FFFFFF'], ['#8A63C9', '#FFFFFF']];
  function capModel(ci) {
    const g = new T.Group(), c = CAPCOL[ci % 5], gl = { emissive: new T.Color(0xFFFFFF), emissiveIntensity: 0.18 };
    const a = cy(g, 0.26, 0.26, 0.5, 10, c[0], -0.25, 0, 0, null, gl); a.rotation.z = PI / 2; const b = cy(g, 0.26, 0.26, 0.5, 10, c[1], 0.25, 0, 0, null, gl); b.rotation.z = PI / 2;
    add(g, new T.SphereGeometry(0.26, 10, 8), c[0], -0.5, 0, 0, null, gl); add(g, new T.SphereGeometry(0.26, 10, 8), c[1], 0.5, 0, 0, null, gl);
    const hit = new T.Mesh(new T.SphereGeometry(2.1, 6, 5), new T.MeshBasicMaterial({ visible: false })); g.add(hit);
    g.userData.cap = true; return g;
  }
  function capRemove() { if (capObj) { capG.remove(capObj.g); capObj = null; } }
  function spawnCap(kind) {
    if (!capG || capObj) return false;
    const g = capModel(Math.floor(Math.random() * 5)); capG.add(g);
    if (kind === 'sky') { g.scale.set(0.55, 0.55, 0.55); g.position.set(-22, 9.7, -1); capObj = { kind, g, t: 0, sp: 1.7 + Math.random() * 0.5 }; }
    else { g.scale.set(0.01, 0.01, 0.01); g.position.set(-8.6, 1.5, 5); capObj = { kind: 'plant', g, t: 0, phase: 'pop', stay: 14 + Math.random() * 6 }; }
    return true;
  }
  function capTick(dt) {
    if (!capG) return;
    const ok = !labOn && !synOn && !paused && !fpT && (!B.capsuleOk || B.capsuleOk());
    if (!capObj) {
      if (!ok) return;
      capT -= dt; plantT -= dt;
      if (capT <= 0) { capT = 100 + Math.random() * 120; spawnCap('sky'); }
      else if (plantT <= 0) { plantT = 110 + Math.random() * 140; spawnCap('plant'); }
      return;
    }
    const o = capObj, g = o.g; o.t += dt;
    if (o.kind === 'sky') {
      g.position.x += o.sp * dt; g.position.y = 9.7 + Math.sin(o.t * 1.3) * 0.5; g.rotation.z = Math.sin(o.t * 0.9) * 0.4; g.rotation.y += dt * 1.6;
      if (g.position.x > 22) capRemove();
      return;
    }
    const FROM = [-8.6, 1.5, 5], TO = [-7.2, 0.32, 4.1];
    if (o.phase === 'pop') {
      const k = Math.min(1, o.t / 0.95), s = 0.5 * Math.min(1, k * 3);
      g.scale.set(s, s, s); g.position.set(FROM[0] + (TO[0] - FROM[0]) * k, FROM[1] + (TO[1] - FROM[1]) * k + Math.sin(k * PI) * 1.7, FROM[2] + (TO[2] - FROM[2]) * k); g.rotation.z += dt * 9; g.rotation.y += dt * 4;
      if (plantL) plantL.forEach((l, i) => { l.rotation.z = Math.sin(o.t * 30 + i) * 0.12 * (1 - k); l.position.x = l.userData.x0 + Math.sin(o.t * 26 + i) * 0.04 * (1 - k); });
      if (k >= 1) { o.phase = 'sit'; o.t = 0; g.rotation.x = 0; g.rotation.y = 0.6; g.rotation.z = 0; if (plantL) plantL.forEach(l => { l.rotation.z = 0; l.position.x = l.userData.x0; }); }
    } else if (o.phase === 'sit') {
      g.position.y = TO[1] + Math.abs(Math.sin(o.t * 3)) * 0.12; g.rotation.y = 0.6 + Math.sin(o.t * 1.5) * 0.5; g.rotation.z = Math.sin(o.t * 6) * 0.1;
      if (o.t > o.stay) { o.phase = 'back'; o.t = 0; }
    } else {
      const k = Math.min(1, o.t / 0.7), s = 0.5 * (1 - Math.max(0, k - 0.6) / 0.4);
      g.scale.set(Math.max(0.01, s), Math.max(0.01, s), Math.max(0.01, s)); g.position.set(TO[0] + (FROM[0] - TO[0]) * k, TO[1] + (FROM[1] - TO[1]) * k + Math.sin(k * PI) * 1.0, TO[2] + (FROM[2] - TO[2]) * k); g.rotation.z += dt * 8;
      if (k >= 1) capRemove();
    }
  }
  function capClick() {
    if (!capObj) return;
    const o = capObj, p = o.g.position, pos = new T.Vector3(p.x, p.y, p.z); capRemove();
    burst(pos, 14, 0xFFD54A, 1.1);
    if (B.onCapsule) B.onCapsule(o.kind);
  }
  api._capClick = function () { const had = !!capObj; capClick(); return had; };
  api.devCapsule = function (kind) { if (!api.ok || !capG) return false; capRemove(); return spawnCap(kind === 'plant' ? 'plant' : 'sky'); };

  /* ---- Andy: the heart failure event character ----
     walk: he strides in with high knees and takes the next question
     ascend: when his questions are mastered he says goodbye and a golden light carries him up
     angel: every 10 minutes (after he has ascended) he passes over in the clouds; click him
     smash: he dives into the pharmacy with a question; a correct answer earns a blessing */
  const HIM_GOLD = 0xFFD54A, HIM_SEED = 4242;
  function himOpts(extra) { return Object.assign({ him: true, skin: '#F1C9A8', hair: '#D4AE55', hairStyle: 0, shirt: '#2F5FA8', scrub: '#C2A878', shoes: '#5B4A38', gender: 'm' }, extra || {}); }
  const glowM = (col, op) => new T.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
  // tilt the head about the neck (not the body origin) so it stays attached
  function headX(P, a) { P.head.rotation.x = a; P.head.position.y = 1.65 * (1 - Math.cos(a)); P.head.position.z = -1.65 * Math.sin(a); }
  const easeIO = (k) => k * k * (3 - 2 * k);
  const hcam = { sup: 0, k: 0, want: 0, ex: 0, ey: 0, ez: 0, tx: 0, ty: 0, tz: 0 };
  // zoom the camera in on Andy, in front of him (on the side the normal camera looks from)
  function himCam(p, on) {
    hcam.want = on && hcam.sup <= 0 ? 1 : 0; if (!on) return;
    hcam.tx = p.x; hcam.ty = p.y + 1.7; hcam.tz = p.z; hcam.ex = p.x + Math.sin(th) * 6.4; hcam.ey = p.y + 2.8; hcam.ez = p.z + Math.cos(th) * 6.4;
  }
  let himH = null, himA = null, himAsc = null, himT = 600;
  function himBubble(text) {
    if (!tagsEl) return null;
    const el = document.createElement('div'); el.className = 'say3d'; el.setAttribute('aria-hidden', 'true');
    const sp = document.createElement('span'); sp.textContent = text; sp.style.animation = 'none'; el.appendChild(sp); tagsEl.appendChild(el); return el;
  }
  function himDom(cls, text, ms) {
    if (!host) return;
    const e = document.createElement('div'); e.className = cls; e.setAttribute('aria-hidden', 'true'); if (text) e.textContent = text; host.appendChild(e);
    setTimeout(() => { if (e.parentNode) e.parentNode.removeChild(e); }, ms);
  }
  // halo + wings that are parented to a Andy figure (figure space: shoulders about y 1.8, head top about y 2.5)
  function angelParts(fig) {
    const grp = new T.Group(), wing = []; fig.add(grp);
    [-1, 1].forEach(s => {
      const w = new T.Group(); w.position.set(s * 0.22, 1.86, -0.34); grp.add(w);
      [1.5, 1.35, 1.15, 0.9].forEach((L, i) => {
        const f = new T.Group(); f.rotation.z = -s * (0.2 + i * 0.42); w.add(f);
        bx(f, 0.17, L, 0.05, i % 2 ? '#F4F7FB' : '#FFFFFF', 0, L / 2, 0, null, { emissive: new T.Color(0xFFF2C0), emissiveIntensity: 0.25 });
      });
      wing.push(w);
    });
    const halo = new T.Mesh(new T.TorusGeometry(0.27, 0.04, 6, 16), new T.MeshBasicMaterial({ color: HIM_GOLD })); halo.rotation.x = PI / 2 - 0.15; halo.position.set(0, 2.72, -0.05); grp.add(halo);
    return { grp, wing, halo };
  }
  function flapWings(ap, t, amp) {
    ap.wing.forEach((w, i) => { const s = i ? 1 : -1; w.rotation.z = -s * (0.25 + Math.sin(t * 3.2) * amp); w.rotation.y = s * 0.45; });
    ap.halo.rotation.z += 0.03;
  }

  /* ---- 1. walking in as a patient ---- */
  api.himArrive = function () {
    if (!api.ok || !custGroup || himAsc) return false;
    const p = person(HIM_SEED, false, false, false, 'slim', himOpts());
    p.position.set(5, 0, 9.6); custGroup.add(p);
    const c = { g: p, seed: HIM_SEED, wp: [new T.Vector3(5, 0, 6.2)], mood: null, moodT: 0, phase: 0, hop: 0, face: 0, karen: false, sweaty: false, him: true, pusher: true, speed: 3.6, body: 'normal', r: 0.6, angry: false, puffT: 0, dripT: 0, jx: 0, jz: 0, faceJit: 0, wait: 0, emoteT: 999 };
    queue.splice(0, 0, c); assignSlots(); cur = c; setBubble('?', '');
    let u = 0; tweens.push(function (dt) { u += dt; if (u > 0.5) { say(c, 'Heart failure!'); return true; } return false; });
    return true;
  };
  api.himAtCounter = function () { const c = queue[0]; return !!(c && c.him && !c.asc); };

  /* ---- 2. ascension ---- */
  api.himAscend = function (done) {
    const c = queue[0];
    if (!api.ok || !c || !c.him || himAsc) { if (done) done(); return false; }
    c.mood = null; c.asc = true; c.wp = []; c.g.position.y = 0;
    const p = c.g.position, fig = c.g;
    const beam = new T.Mesh(new T.CylinderGeometry(1.0, 1.0, 34, 16, 1, true), glowM(HIM_GOLD, 0)); beam.position.set(p.x, 17, p.z); scene.add(beam);
    const ring = new T.Mesh(new T.RingGeometry(0.4, 1.5, 24), glowM(HIM_GOLD, 0)); ring.rotation.x = -PI / 2; ring.position.set(p.x, 0.09, p.z); scene.add(ring);
    const ap = angelParts(fig); ap.grp.scale.set(0.01, 0.01, 0.01);
    himAsc = { c, t: 0, beam, ring, ap, done, bub: himBubble('My work here is done.'), spark: 0 };
    return true;
  };
  function ascTick(dt) {
    const a = himAsc; if (!a) return;
    a.t += dt; const t = a.t, c = a.c, g = c.g, P = g.userData.P, p = g.position;
    const settle = easeIO(clamp(t / 0.8, 0, 1)), look = easeIO(clamp((t - 1.2) / 1.2, 0, 1)), rise = Math.max(0, t - 2.6), spread = easeIO(clamp((t - 2.2) / 1.4, 0, 1));
    // turn to the camera, relax, then look up
    g.rotation.y = lerpAngle(g.rotation.y, th + (rise > 0 ? rise * 0.5 : 0), Math.min(1, dt * 5)); himCam(p, t < 11 && p.y < 12);
    for (let i = 0; i < 2; i++) {
      P.legs[i].rotation.x = lerp(P.legs[i].rotation.x, 0, Math.min(1, dt * 8)); P.knees[i].rotation.x = lerp(P.knees[i].rotation.x, rise > 0 ? 0.3 + Math.sin(t * 2 + i) * 0.1 : 0, Math.min(1, dt * 8));
      P.arms[i].rotation.x = lerp(P.arms[i].rotation.x, 0, Math.min(1, dt * 8)); P.arms[i].rotation.z = (i ? 1 : -1) * (0.08 * settle + 1.0 * spread);
    }
    headX(P, -0.75 * look);
    // wings and halo appear as the light takes hold
    const wk = easeIO(clamp((t - 2.0) / 1.2, 0, 1)); a.ap.grp.scale.set(Math.max(0.01, wk), Math.max(0.01, wk), Math.max(0.01, wk)); if (wk > 0) flapWings(a.ap, t, 0.18 + 0.12 * wk);
    // light
    const bk = easeIO(clamp((t - 1.3) / 1.0, 0, 1)), fade = rise > 0 ? 1 - clamp((p.y - 8) / 5, 0, 1) : 1;
    a.beam.material.opacity = 0.42 * bk * fade * (0.85 + 0.15 * Math.sin(t * 9)); a.beam.rotation.y += dt * 0.7;
    a.ring.material.opacity = 0.55 * bk * fade; const rs = 1 + 0.15 * Math.sin(t * 6); a.ring.scale.set(rs, rs, rs); a.ring.rotation.z += dt;
    a.spark -= dt; if (a.spark <= 0 && bk > 0) { a.spark = 0.1; burst(new T.Vector3(p.x + (Math.random() - 0.5) * 1.6, p.y + 0.4 + Math.random() * 1.6, p.z + (Math.random() - 0.5) * 1.6), 2, HIM_GOLD, 0.35); }
    // rise slowly, then faster
    p.y = 0.3 * rise * rise;
    // goodbye bubble
    if (a.bub) {
      if (t > 4.6) { a.bub.remove(); a.bub = null; } else { a.bub.style.opacity = t < 0.3 ? String(t / 0.3) : t > 4.0 ? String(Math.max(0, (4.6 - t) / 0.6)) : '1'; place(a.bub, p.x, p.y + 3.6, p.z); }
    }
    if (p.y > 13.5 || t > 14) {
      scene.remove(a.beam); scene.remove(a.ring); if (a.bub) a.bub.remove();
      c.gone = true; custGroup.remove(g); himAsc = null; himCam(p, false);
      if (a.done) a.done();
    }
  }

  /* ---- 3. the angel in the clouds ---- */
  function spawnAngel() {
    if (!capG || himA || himH || himAsc) return false;
    const root = new T.Group(), fig = person(HIM_SEED, false, false, false, 'slim', himOpts({ tag: { himA: true } }));
    fig.rotation.y = PI / 2; fig.rotation.x = PI / 2; fig.position.set(-1.3, 0, 0); root.add(fig);
    const ap = angelParts(fig);
    const hit = new T.Mesh(new T.SphereGeometry(2.8, 6, 5), new T.MeshBasicMaterial({ visible: false })); hit.userData.himA = true; root.add(hit);
    const P = fig.userData.P; P.arms[0].rotation.x = P.arms[1].rotation.x = -3.0; P.legs[0].rotation.x = 0.1; P.legs[1].rotation.x = 0.3; P.knees[1].rotation.x = 0.3; headX(P, -0.35);
    root.scale.set(1.15, 1.15, 1.15); root.position.set(-24, 10.6, -2.5); capG.add(root);
    himA = { root, fig, ap, t: 0, sp: 1.8, spark: 0 };
    if (B.onHimSpawn) B.onHimSpawn();
    return true;
  }
  function angelTick(dt) {
    const a = himA; if (!a) return;
    a.t += dt; const r = a.root;
    r.position.x += a.sp * dt; r.position.y = 10.6 + Math.sin(a.t * 1.1) * 0.45; r.rotation.z = Math.sin(a.t * 0.8) * 0.05;
    flapWings(a.ap, a.t, 0.3);
    a.spark -= dt; if (a.spark <= 0) { a.spark = 0.35; burst(new T.Vector3(r.position.x + (Math.random() - 0.5) * 2, r.position.y - 0.3, r.position.z), 1, HIM_GOLD, 0.2); }
    if (r.position.x > 24) { capG.remove(r); himA = null; }
  }
  function himAngelClick() {
    const a = himA; if (!a) return;
    if (B.onHimAngel && B.onHimAngel() === false) return;
    const wp = new T.Vector3(); a.root.getWorldPosition(wp); wp.y += 0.4;
    capG.remove(a.root); himA = null; burst(wp, 14, HIM_GOLD, 1.1);
    startDive(wp);
  }

  /* ---- 4. the superhero smash ---- */
  function startDive(from) {
    if (!api.ok || !custGroup || himH) return false;
    const g = person(HIM_SEED, false, false, false, 'slim', himOpts({ tag: { himH: true } }));
    g.position.copy(from); custGroup.add(g);
    const to = new T.Vector3(2.5, 0, 2.3);
    g.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
    himH = { g: g, r: 0.75, wp: [], pusher: true, noFx: true, state: 'dive', t: 0, from: from.clone(), to: to, leave: false, spark: 0 };
    return true;
  }
  function himImpact(h) {
    const p = h.to; shake = 1.6;
    burst(new T.Vector3(p.x, 0.3, p.z), 18, 0xCFCFD6, 1.8); burst(new T.Vector3(p.x, 0.3, p.z), 12, HIM_GOLD, 1.5);
    const ring = new T.Mesh(new T.RingGeometry(0.4, 0.8, 24), glowM(0xFFFFFF, 0.8)); ring.rotation.x = -PI / 2; ring.position.set(p.x, 0.1, p.z); scene.add(ring);
    let u = 0; tweens.push(function (dt) { u += dt / 0.8; const s = 1 + Math.min(1, u) * 7; ring.scale.set(s, s, s); ring.material.opacity = 0.8 * (1 - Math.min(1, u)); if (u >= 1) { scene.remove(ring); return true; } return false; });
    const cr = new T.Group(); cr.position.set(p.x, 0.08, p.z); scene.add(cr);
    for (let i = 0; i < 7; i++) { const L = 0.9 + Math.random() * 1.2, an = i / 7 * PI * 2 + Math.random() * 0.4, b = bx(cr, 0.08, 0.02, L, '#26323A', Math.sin(an) * L / 2, 0, Math.cos(an) * L / 2); b.rotation.y = an; b.castShadow = false; }
    let uc = 0; tweens.push(function (dt) { uc += dt; if (uc > 3.5) cr.position.y = 0.08 - (uc - 3.5) * 0.06; if (uc > 5) { scene.remove(cr); return true; } return false; });
    queue.concat(extras, leaving).forEach(c => { if (c.g && Math.hypot(c.g.position.x - p.x, c.g.position.z - p.z) < 6) { c.stall = Math.max(c.stall || 0, 1.0); if (says.length < 5) say(c, '😱', 'emo'); } });
    himDom('himfx smash', 'SMASH!', 1400);
  }
  function himStand(h, blend) {
    // superhero landing, blended out by blend 0 (crouched) to 1 (standing)
    const g = h.g, P = g.userData.P, c = 1 - blend;
    P.legs[0].rotation.x = -1.35 * c; P.knees[0].rotation.x = 1.5 * c; P.legs[1].rotation.x = 0.55 * c; P.knees[1].rotation.x = 1.7 * c;
    g.position.y = -0.38 * c; P.up.rotation.x = 0.5 * c; headX(P, 0.3 * c - 0.1 * blend);
    P.arms[0].rotation.x = -0.4 * c; P.arms[1].rotation.x = 0.9 * c; P.arms[0].rotation.z = -0.6 * blend; P.arms[1].rotation.z = 0.6 * blend;
  }
  function himFly(h, k) {
    // head-first flight along the line from h.fp to h.fq; k runs 0 to 1
    const g = h.g, P = g.userData.P, vx = h.fq.x - h.fp.x, vy = h.fq.y - h.fp.y, vz = h.fq.z - h.fp.z, hv = Math.hypot(vx, vz);
    g.position.set(h.fp.x + vx * k, h.fp.y + vy * k, h.fp.z + vz * k);
    g.rotation.y = Math.atan2(vx, vz); g.rotation.x = Math.atan2(hv, vy);
    P.arms[0].rotation.x = P.arms[1].rotation.x = -3.0; P.arms[0].rotation.z = P.arms[1].rotation.z = 0; P.legs[0].rotation.x = 0.1; P.legs[1].rotation.x = 0.25; P.knees[0].rotation.x = 0.15; P.knees[1].rotation.x = 0.35; headX(P, 0);
  }
  function heroTick(dt) {
    const h = himH; if (!h) return;
    h.t += dt; const g = h.g, P = g.userData.P, p = g.position, t = h.t;
    if (h.state === 'dive') {
      const D = 1.0, k = Math.min(1, t / D), e = k * k, to = h.to;
      p.set(lerp(h.from.x, to.x, k), lerp(h.from.y, 0, e), lerp(h.from.z, to.z, k));
      const dy = h.from.y * (2 * k) / 1, hv = Math.hypot(to.x - h.from.x, to.z - h.from.z) + 0.001;
      g.rotation.y = Math.atan2(to.x - h.from.x, to.z - h.from.z); g.rotation.x = lerp(0.4, Math.atan2(hv, -dy - 0.001), Math.min(1, t / 0.25));
      P.arms[0].rotation.x = P.arms[1].rotation.x = -3.0; P.legs[0].rotation.x = 0.15; P.legs[1].rotation.x = 0.3; P.knees[0].rotation.x = 0.2; P.knees[1].rotation.x = 0.4;
      h.spark -= dt; if (h.spark <= 0) { h.spark = 0.04; burst(new T.Vector3(p.x, p.y + 1, p.z), 1, 0xFFFFFF, 0.4); }
      if (k >= 1) { h.state = 'land'; h.t = 0; g.rotation.x = 0; himImpact(h); }
    } else if (h.state === 'land') {
      g.rotation.y = lerpAngle(g.rotation.y, t > 0.9 ? th : Math.atan2(PZ.x - p.x, PZ.z - p.z), Math.min(1, dt * 3)); if (t > 0.9) himCam(p, true);
      himStand(h, t < 1.1 ? 0 : easeIO(clamp((t - 1.1) / 0.6, 0, 1)));
      if (t > 1.8) {
        h.state = 'ask'; h.t = 0; say(h, 'Quick question!');
        if (B.onHimLand && B.onHimLand() === false) h.leave = true;
      }
    } else if (h.state === 'ask' || h.state === 'wait2') {
      g.rotation.y = lerpAngle(g.rotation.y, th, Math.min(1, dt * 4)); himCam(p, true);
      himStand(h, 1); p.y = Math.abs(Math.sin(t * 3)) * 0.04; P.arms[1].rotation.x = -0.3 + Math.sin(t * 2) * 0.1;
      if (h.state === 'ask' && h.leave) { h.state = 'wait2'; }
      if (h.state === 'wait2' && h.leave) startTakeoff(h);
    } else if (h.state === 'bless') {
      const k = easeIO(clamp(t / 0.7, 0, 1)), fadeOut = 1 - easeIO(clamp((t - 2.6) / 0.8, 0, 1));
      p.y = 0.9 * k * fadeOut + Math.sin(t * 3) * 0.08 * k; g.rotation.y = lerpAngle(g.rotation.y, th, Math.min(1, dt * 3)) + 0 * k; himCam(p, true);
      P.arms[0].rotation.x = P.arms[1].rotation.x = -2.8 * k; P.arms[0].rotation.z = -0.35 * k; P.arms[1].rotation.z = 0.35 * k; headX(P, -0.5 * k); P.legs[0].rotation.x = P.legs[1].rotation.x = 0; P.knees[0].rotation.x = P.knees[1].rotation.x = 0.2 * k;
      if (h.beam) { h.beam.material.opacity = 0.38 * k * fadeOut * (0.85 + 0.15 * Math.sin(t * 10)); h.beam.rotation.y += dt; h.ring.material.opacity = 0.5 * k * fadeOut; const rs = 1 + 0.2 * Math.sin(t * 5); h.ring.scale.set(rs, rs, rs); }
      h.spark -= dt; if (h.spark <= 0) { h.spark = 0.07; burst(new T.Vector3(-8 + Math.random() * 16, 5 + Math.random() * 2, -5 + Math.random() * 11), 2, HIM_GOLD, 0.15); }
      if (t > 3.4) { if (h.beam) { scene.remove(h.beam); scene.remove(h.ring); h.beam = null; } h.state = 'wait2'; h.t = 0; p.y = 0; }
    } else if (h.state === 'shrug') {
      const k = easeIO(clamp(t / 0.4, 0, 1));
      P.arms[0].rotation.x = P.arms[1].rotation.x = -0.5 * k; P.arms[0].rotation.z = -0.9 * k; P.arms[1].rotation.z = 0.9 * k; P.head.rotation.y = Math.sin(t * 4) * 0.3 * k;
      if (t > 1.8) { P.head.rotation.y = 0; h.state = 'wait2'; h.t = 0; }
    } else if (h.state === 'crouch') {
      himCam(p, false);
      himStand(h, 1 - easeIO(clamp(t / 0.45, 0, 1)) * 0.75);
      if (t > 0.5) { h.state = 'off'; h.t = 0; h.fp = p.clone(); h.fq = new T.Vector3(p.x + 15, 17, p.z - 9); burst(new T.Vector3(p.x, 0.3, p.z), 10, 0xFFFFFF, 1.2); shake = 0.4; P.up.rotation.x = 0; p.y = 0; }
    } else if (h.state === 'off') {
      const k = Math.min(1, t / 1.9), e = k * k;
      himFly(h, e); h.spark -= dt; if (h.spark <= 0) { h.spark = 0.04; burst(new T.Vector3(p.x, p.y + 1, p.z), 1, HIM_GOLD, 0.4); }
      if (k >= 1) { custGroup.remove(g); himH = null; himCam(p, false); if (B.onHimGone) B.onHimGone(); }
    }
  }
  function startTakeoff(h) { h.state = 'crouch'; h.t = 0; }
  // the answer is in: a blessing for a correct answer, a shrug otherwise
  api.himReact = function (ok) {
    const h = himH; if (!h || h.state !== 'ask') return;
    h.t = 0;
    if (!ok) { h.state = 'shrug'; say(h, 'Hmm...'); return; }
    h.state = 'bless';
    const p = h.g.position;
    h.beam = new T.Mesh(new T.CylinderGeometry(2.2, 2.2, 34, 20, 1, true), glowM(HIM_GOLD, 0)); h.beam.position.set(p.x, 17, p.z); scene.add(h.beam);
    h.ring = new T.Mesh(new T.RingGeometry(0.6, 3.2, 28), glowM(HIM_GOLD, 0)); h.ring.rotation.x = -PI / 2; h.ring.position.set(p.x, 0.1, p.z); scene.add(h.ring);
    himDom('himfx flash', '', 2600); himDom('himfx bless', 'BLESSED!', 2400);
    if (B.onHimBless) B.onHimBless();
  };
  // the player pressed Next: he flies off as soon as he is done
  api.himFinish = function () { if (himH) himH.leave = true; };
  api.himBusy = function () { return !!(himH || himAsc); };
  api.devHimAngel = function () { if (!api.ok || !capG || himH || himAsc) return false; if (himA) { capG.remove(himA.root); himA = null; } return spawnAngel(); };
  api.devHimSmash = function () { if (!api.ok || !capG || himH || himAsc) return false; if (himA) { capG.remove(himA.root); himA = null; } return startDive(new T.Vector3(-7, 13, -4)); };
  function himTick(dt) {
    if (himAsc) ascTick(dt);
    if (himA) angelTick(dt);
    else if (!himH && !himAsc && B.himOk && B.himOk() && !labOn && !synOn && !paused && !fpT) { himT -= dt; if (himT <= 0) { himT = 600; spawnAngel(); } }
    if (himH) heroTick(dt);
    if (!himH && !himAsc) hcam.want = 0;
    // someone else is talking: pull the camera back out until they are done
    const mine = himH ? himH.g : himAsc ? himAsc.c.g : null;
    if (mine && says.some(m => m.o.g !== mine)) hcam.sup = 1.0; else if (hcam.sup > 0) hcam.sup -= dt;
    hcam.k += (hcam.want - hcam.k) * Math.min(1, dt * 2.5); if (hcam.want === 0 && hcam.k < 0.002) hcam.k = 0;
  }

  /* ---- lost pills: tablets and capsules pop out of bottles and other things; tap one to put it in the lost-pills vial ---- */
  let pillG = null, pillT = 200 + Math.random() * 160, buffOn = false, buffWas = false, buffCd = 0;
  const pills = [];
  const TCOL = ['#F4F4F0', '#F2A516', '#E04F3A', '#4C7BD9', '#2FAE66', '#F29BC1', '#8A63C9', '#7FD6E8', '#F6E27A'];
  const rndi = (n) => Math.floor(Math.random() * n);
  function pillSpec() {
    if (Math.random() < 0.55) return { k: 't', c: TCOL[rndi(TCOL.length)], c2: '', s: ['disc', 'oval', 'caplet', 'sq'][rndi(4)] };
    const s = ['two', 'band', 'gel'][rndi(3)], a = TCOL[1 + rndi(TCOL.length - 1)]; let b = TCOL[rndi(TCOL.length)]; if (b === a) b = '#F4F4F0';
    return { k: 'c', c: s === 'gel' ? '#F2A516' : a, c2: s === 'gel' ? '' : b, s };
  }
  function pillModel(sp) {
    const g = new T.Group(), gl = (c) => ({ emissive: new T.Color(c), emissiveIntensity: 0.22 });
    if (sp.k === 't') {
      if (sp.s === 'disc') { const d = cy(g, 0.34, 0.34, 0.13, 14, sp.c, 0, 0, 0, null, gl(sp.c)); d.rotation.x = 0.35; }
      else if (sp.s === 'oval') { const m = add(g, new T.SphereGeometry(0.3, 12, 9), sp.c, 0, 0, 0, null, gl(sp.c)); m.scale.set(1.5, 0.55, 0.85); m.rotation.y = 0.5; }
      else if (sp.s === 'caplet') { const a = cy(g, 0.17, 0.17, 0.5, 10, sp.c, 0, 0, 0, null, gl(sp.c)); a.rotation.z = PI / 2; [-1, 1].forEach(s => add(g, new T.SphereGeometry(0.17, 10, 8), sp.c, s * 0.25, 0, 0, null, gl(sp.c))); g.rotation.y = 0.5; }
      else { const b = bx(g, 0.5, 0.15, 0.5, sp.c, 0, 0, 0, null, gl(sp.c)); b.rotation.y = 0.6; }
    } else {
      const L = 0.52, r = 0.2;
      if (sp.s === 'gel') { const m = add(g, new T.SphereGeometry(0.26, 12, 9), sp.c, 0, 0, 0, null, Object.assign(gl(sp.c), { transparent: true, opacity: 0.9 })); m.scale.set(1.55, 0.85, 0.85); add(g, new T.SphereGeometry(0.06, 6, 5), '#FFFFFF', -0.12, 0.13, 0.12); }
      else {
        const a = cy(g, r, r, L, 10, sp.c, -L / 2, 0, 0, null, gl(sp.c)); a.rotation.z = PI / 2; const b = cy(g, r, r, L, 10, sp.c2, L / 2, 0, 0, null, gl(sp.c2)); b.rotation.z = PI / 2;
        add(g, new T.SphereGeometry(r, 10, 8), sp.c, -L, 0, 0, null, gl(sp.c)); add(g, new T.SphereGeometry(r, 10, 8), sp.c2, L, 0, 0, null, gl(sp.c2));
        if (sp.s === 'band') { const bd = cy(g, r + 0.02, r + 0.02, 0.1, 10, '#F4F4F0', 0, 0, 0); bd.rotation.z = PI / 2; }
      }
      g.scale.set(0.8, 0.8, 0.8);
    }
    const hit = new T.Mesh(new T.SphereGeometry(0.95, 6, 5), new T.MeshBasicMaterial({ visible: false })); g.add(hit);
    const ring = new T.Mesh(new T.RingGeometry(0.55, 0.7, 20), new T.MeshBasicMaterial({ color: 0xFFE27A, transparent: true, opacity: 0.8, side: T.DoubleSide, depthWrite: false })); ring.rotation.x = -PI / 2; ring.position.y = -0.13; g.add(ring);
    const root = new T.Group(); root.add(g); root.userData.ring = ring; root.userData.body = g; return root;
  }
  function pillSources() {
    const out = [];
    const vis = shelfBottles.filter(b => b.visible);
    if (vis.length) { const b = vis[rndi(vis.length)], sx = BASE.shelf[0], sz = BASE.shelf[2]; out.push({ w: 6, bottle: b, from: [sx + b.position.x, b.position.y + 0.55, sz + 0.2], land: [sx + b.position.x + (Math.random() - 0.5) * 2.6, 0.2, -4.7 + Math.random() * 1.8] }); }
    out.push({ w: 1.5, from: [BASE.robot[0], 2.6, BASE.robot[2] + 0.5], land: [BASE.robot[0] - 1.4 - Math.random() * 1.6, 0.2, -3.8 + Math.random() * 1.5] });
    out.push({ w: 1, from: [-8.6, 1.5, 5], land: [-7.2, 0.2, 4.1] });
    out.push({ w: 1.2, from: [-3.2, 1.3, -2.4], land: [-2 + Math.random() * 3, 0.2, -3.2 - Math.random() * 1.2] });
    return out;
  }
  function spawnPill(spec) {
    if (!pillG) return false;
    const src = pillSources(); let r = Math.random() * src.reduce((a, s) => a + s.w, 0), s = src[0];
    for (const x of src) { r -= x.w; if (r <= 0) { s = x; break; } }
    const sp = spec || pillSpec(), root = pillModel(sp); pillG.add(root); root.visible = false;
    const o = { sp, g: root, from: s.from.slice(), to: s.land.slice(), t: -0.35, phase: 'pop', life: 30 + Math.random() * 8, bottle: s.bottle || null, id: 0 };
    o.id = ++pillSeq; root.userData.pill = o.id; root.userData.body.traverse(m => { if (m.isMesh) m.userData.pill = o.id; });
    root.traverse(m => { m.userData.pill = o.id; });
    pills.push(o); root.position.set(o.from[0], o.from[1], o.from[2]); root.scale.set(0.01, 0.01, 0.01);
    if (o.bottle) { const b = o.bottle, y0 = b.position.y; let u = 0; tweens.push(function (dt) { u += dt; const k = Math.min(1, u / 0.8); b.position.y = y0 + Math.abs(Math.sin(k * PI * 2)) * 0.18; b.rotation.z = Math.sin(k * PI * 7) * 0.35 * (1 - k); if (k >= 1) { b.position.y = y0; b.rotation.z = 0; return true; } return false; }); }
    return true;
  }
  let pillSeq = 0;
  function pillRemove(o) { pillG.remove(o.g); const i = pills.indexOf(o); if (i >= 0) pills.splice(i, 1); }
  function pillTick(dt) {
    if (!pillG) return;
    const ok = !labOn && !synOn && !paused && !fpT && (!B.pillOk || B.pillOk());
    if (ok && pills.length < 2) { pillT -= dt; if (pillT <= 0) { pillT = 480 + Math.random() * 120; spawnPill(); } }
    for (let i = pills.length - 1; i >= 0; i--) {
      const o = pills[i], g = o.g, body = g.userData.body; o.t += dt;
      if (o.t < 0) continue; g.visible = true;
      if (o.phase === 'pop') {
        const k = Math.min(1, o.t / 0.95), e = k, s = Math.min(1, k * 4) * 0.62;
        g.scale.set(s, s, s);
        g.position.set(o.from[0] + (o.to[0] - o.from[0]) * e, o.from[1] + (o.to[1] - o.from[1]) * e + Math.sin(k * PI) * 1.9, o.from[2] + (o.to[2] - o.from[2]) * e);
        body.rotation.z += dt * 11; body.rotation.x += dt * 5; g.userData.ring.visible = false;
        if (k >= 1) { o.phase = 'bounce'; o.t = 0; body.rotation.x = 0; body.rotation.y = 0; body.rotation.z = 0; }
      } else if (o.phase === 'bounce') {
        const k = Math.min(1, o.t / 0.5); g.position.set(o.to[0], o.to[1] + Math.abs(Math.sin(k * PI * 2)) * 0.45 * (1 - k), o.to[2]);
        if (k >= 1) { o.phase = 'sit'; o.t = 0; g.userData.ring.visible = true; }
      } else {
        const pu = 0.5 + 0.5 * Math.sin(o.t * 4); g.position.y = o.to[1] + 0.08 + Math.abs(Math.sin(o.t * 2.6)) * 0.1; body.rotation.y += dt * 1.4;
        g.userData.ring.scale.set(1 + pu * 0.35, 1 + pu * 0.35, 1); g.userData.ring.material.opacity = 0.45 + 0.45 * pu;
        if (o.t > o.life - 5) g.visible = Math.sin(o.t * 14) > -0.4;
        if (o.t > o.life) pillRemove(o);
      }
    }
  }
  function pillClick(id) {
    const o = pills.find(p => p.id === id); if (!o) return;
    const p = o.g.position, pos = new T.Vector3(p.x, p.y + 0.3, p.z), spec = o.sp; pillRemove(o);
    burst(pos, 12, 0xFFE27A, 1.0);
    if (B.onPill) B.onPill(spec);
  }
  api.devPill = function (kind) { if (!api.ok || !pillG) return false; return spawnPill(kind === 'c' ? Object.assign(pillSpec(), { k: 'c', s: 'two', c: '#E04F3A', c2: '#F4F4F0' }) : kind === 't' ? { k: 't', c: '#4C7BD9', c2: '', s: 'disc' } : null); };
  api._pillClick = function () { const o = pills.find(p => p.phase === 'sit') || pills[0]; if (!o) return false; pillClick(o.id); return true; };
  api.pillCount = () => pills.length;
  api.setBuff = function (on) { buffOn = !!on; buffCd = 0.3; };
  /* ---- synapse lab: a low-poly cross-section of a synapse ---- */
  let synDrugPos = null, synG = null, synOn = false, synHid = [], synCat = 'epi', synLabelsOn = true, synT = 0, synSaved = null, synWrap = null, synHLids = null, synHover = null, synRetro = 0;
  const synItems = [], synSite = {}, synVes = [], synParts = [], synLabs = [], synFlow = [];
  const SX = 0.5, SG = [-2.8, 4.3];
  const SYN_BG = '#171638';
  // id: [short label, categories, location, x or angle, kind, colour]
  const SSITES = {
    sert: ['SERT', ['ad'], 'pre', -2.8, 'trans', '#B26CF0'], net: ['NET', ['ad'], 'pre', -2.25, 'trans', '#F08A3C'], dat: ['DAT', ['ad'], 'pre', -1.7, 'trans', '#E85D7A'],
    kcnq: ['KCNQ K⁺', ['epi'], 'pre', -1.15, 'chan', '#C9A7FF'],
    vgcc: ['VGCC Ca²⁺', ['epi', 'cbd'], 'pre', -0.5, 'chan', '#FFD23F'], a2d: ['α2δ', ['epi'], 'pre', 0.35, 'enz', '#FF7AC8'],
    cb1: ['CB1', ['cbd'], 'pre', 1.7, 'rec', '#7DDC6B'], gat1: ['GAT-1', ['epi'], 'pre', 2.3, 'trans', '#6EE38A'], a2auto: ['α2 auto', ['ad'], 'pre', 2.9, 'rec', '#F2A516'],
    nav: ['Voltage-gated Na⁺ channel', ['epi'], 'dome', 0.55, 'chan', '#F2A516'], cavt: ['T-type Ca²⁺', ['epi'], 'dome', 2.55, 'chan', '#FF7A59'], ent1: ['ENT1', ['cbd'], 'dome', 0.14, 'trans', '#5ED3F3'],
    mao: ['MAO', ['ad'], 'int', [-1.1, 3.95], 'mito', '#E8905A'], gabat: ['GABA-T', ['epi'], 'int', [0.9, 4.35], 'enz', '#6EE38A'], sv2a: ['SV2A', ['epi'], 'int', [1.9, 3.75], 'sv2a', '#FFC46B'], magl: ['MAGL', ['cbd'], 'int', [1.55, 3.45], 'enz', '#E5B34A'],
    ht2a: ['5-HT2A', ['ad'], 'post', -2.9, 'rec', '#C28BFF'], ht1a: ['5-HT1A', ['ad', 'cbd'], 'post', -2.3, 'rec', '#9B7BFF'], gabaa: ['GABA-A Cl⁻', ['epi', 'cbd'], 'post', -1.6, 'chan', '#5FE08A'],
    ampa: ['AMPA', ['epi'], 'post', -0.7, 'chan', '#FFB347'], nmda: ['NMDA', ['ad', 'epi'], 'post', 2.2, 'chan', '#FF6B6B'], trpv1: ['TRPV1', ['cbd'], 'post', 2.0, 'chan', '#FF8F5A'], gpr55: ['GPR55', ['cbd'], 'post', 2.7, 'rec', '#5ED3F3'],
    faah: ['FAAH', ['cbd'], 'pint', [-0.9, 0.55], 'enz', '#E5E266'], dagl: ['DAGL', ['cbd'], 'pint', [1.9, 0.65], 'enz', '#C7E86A']
  };
  const ION = { kcnq: ['K⁺', '#C9A7FF'], vgcc: ['Ca²⁺', '#FFD23F'], nav: ['Na⁺', '#F2A516'], cavt: ['Ca²⁺', '#FF7A59'], gabaa: ['Cl⁻', '#5FE08A'], ampa: ['Na⁺', '#FFB347'], nmda: ['Ca²⁺', '#FF6B6B'], trpv1: ['Ca²⁺', '#FF8F5A'], sert: ['5-HT', '#B26CF0'], net: ['NE', '#F08A3C'], dat: ['DA', '#E85D7A'], gat1: ['GABA', '#6EE38A'], ent1: ['AEA', '#5ED3F3'] };
  const synIonLabs = [], synInfo = {}; let synDrug = null, synDrugM = null, synDrugEl = null, tmpV = null;
  const SDECOR = [['vgcc', 'pre', 0.85], ['ampa', 'post', 1.2], ['gabaa', 'post', 3.1]];
  const SSTRUCT = [['Presynaptic terminal', SX - 1.0, 5.55], ['Synaptic cleft', SX - 3.6, 2.05], ['Postsynaptic spine', SX, -0.3], ['Vesicle forming', SX + SG[0], SG[1] + 0.75], ['Docked vesicles fuse and release', SX + 0.35, 3.85]];
  function sMat(g) { g.traverse(o => { if (o.material && o.material.clone) o.material = o.material.clone(); }); }
  function siteReg(id, g) { g.userData.site = id; g.userData.g = g; const s = synSite[id] = synSite[id] || { groups: [] }; s.groups.push(g); synItems.push(g); const h = new T.Mesh(new T.SphereGeometry(0.5, 6, 5), new T.MeshBasicMaterial({ visible: false })); g.add(h); }
  function prot(id, kind, col, x, y, rz, s) {
    const g = new T.Group(); g.position.set(x, y, 0); g.rotation.z = rz || 0; g.scale.set(s || 1, s || 1, s || 1); synG.add(g);
    const lite = '#FFFFFF';
    if (kind === 'chan') {
      cy(g, 0.21, 0.19, 0.3, 10, col, 0, 0.2, 0); cy(g, 0.19, 0.21, 0.3, 10, col, 0, -0.2, 0);
      const r = add(g, new T.TorusGeometry(0.2, 0.05, 5, 10), lite, 0, 0.36, 0); r.rotation.x = PI / 2;
      g.userData.ion = add(g, new T.SphereGeometry(0.06, 6, 5), '#FFE066', 0, 0.5, 0); g.userData.ph = Math.random();
    } else if (kind === 'trans') {
      cy(g, 0.17, 0.17, 0.66, 10, col, 0, 0, 0); g.userData.flap = bx(g, 0.26, 0.1, 0.06, lite, 0, 0.36, 0.14);
      g.userData.ion = add(g, new T.SphereGeometry(0.05, 6, 5), '#FFFFFF', 0, 0.5, 0); g.userData.ph = Math.random();
    } else if (kind === 'rec') {
      cy(g, 0.1, 0.12, 0.5, 8, col, 0, 0, 0);
      const a = bx(g, 0.1, 0.46, 0.12, col, -0.15, 0.42, 0); a.rotation.z = 0.5; const b = bx(g, 0.1, 0.46, 0.12, col, 0.15, 0.42, 0); b.rotation.z = -0.5;
      g.userData.knob = add(g, new T.SphereGeometry(0.07, 6, 5), lite, 0, 0.5, 0);
    } else if (kind === 'enz') {
      ico(g, 0.22, col, 0, 0, 0); ico(g, 0.15, col, 0.2, 0.14, 0.1); ico(g, 0.12, lite, -0.15, 0.17, -0.05); g.userData.bob = Math.random() * 6;
    } else if (kind === 'mito') {
      const m = ico(g, 0.9, col, 0, 0, 0); m.scale.set(1.3, 0.55, 0.6);
      for (let i = 0; i < 4; i++) { const c = bx(g, 0.06, 0.4, 0.5, '#B8652E', -0.8 + i * 0.5, 0, 0); c.rotation.z = 0.2; }
      ico(g, 0.2, '#FFE9B8', -0.25, 0.3, 0.3); ico(g, 0.16, '#FFE9B8', 0.4, 0.28, 0.32); g.userData.bob = Math.random() * 6;
    } else if (kind === 'sv2a') {
      ico(g, 0.3, col, 0, 0, 0); cy(g, 0.05, 0.05, 0.3, 6, '#FF7A59', 0.0, 0.34, 0); add(g, new T.SphereGeometry(0.1, 6, 5), '#FF7A59', 0, 0.54, 0); g.userData.bob = Math.random() * 6;
    }
    sMat(g); if (id) siteReg(id, g); return g;
  }
  function buildSyn() {
    synG = new T.Group(); synG.visible = false; scene.add(synG);
    const tm = { transparent: true, opacity: 0.42, side: 2, depthWrite: false };
    const td = add(synG, new T.SphereGeometry(3.4, 16, 8, 0, 2 * PI, 0, PI / 2), '#D88FD0', SX, 2.95, 0, null, tm); td.scale.set(1, 0.85, 0.75); td.castShadow = false;
    cy(synG, 3.4, 3.4, 0.22, 26, '#E7A8D8', SX, 2.95, 0).scale.z = 0.75;
    const pd = add(synG, new T.SphereGeometry(3.6, 16, 8, 0, 2 * PI, PI / 2, PI / 2), '#6BC4C9', SX, 1.15, 0, null, tm); pd.scale.set(1, 0.85, 0.75); pd.castShadow = false;
    cy(synG, 3.6, 3.6, 0.22, 26, '#8EC5F0', SX, 1.15, 0).scale.z = 0.75;
    [[-4.6, 2.3, -1.2, 0.9], [5.6, 2.8, -1.4, 0.7], [-5.2, 4.8, -2, 0.6], [6, 0.8, -1.2, 0.8]].forEach(q => { const b = ico(synG, q[3], '#3A3A78', q[0], q[1], q[2]); b.scale.set(1.5, 1, 0.8); });
    // proteins
    Object.keys(SSITES).forEach(id => {
      const d = SSITES[id], loc = d[2], v = d[3];
      if (loc === 'pre') prot(id, d[4], d[5], SX + v, 2.95, PI, id === 'a2d' ? 2.1 : undefined);
      else if (loc === 'post') prot(id, d[4], d[5], SX + v, 1.15, 0);
      else if (loc === 'dome') { const a = v; const X = SX + 3.4 * Math.cos(a), Y = 2.95 + 0.85 * 3.4 * Math.sin(a); prot(id, d[4], d[5], X, Y, a - PI / 2); }
      else prot(id, d[4], d[5], SX + v[0], v[1], 0, d[4] === 'mito' ? 1 : 1.1);
    });
    // a2d sits on the VGCC; ion sources
    SDECOR.forEach(q => { const d = SSITES[q[0]]; prot(q[0], d[4], d[5], SX + q[2], q[1] === 'pre' ? 2.95 : 1.15, q[1] === 'pre' ? PI : 0); });
    Object.keys(ION).forEach(id => { (synSite[id] ? synSite[id].groups : []).forEach((g, gi) => {
      const U = g.userData; if (!U.ion) return;
      const s1 = ionSprite(ION[id][0], ION[id][1]);
      if (s1) { g.remove(U.ion); U.ion = s1; g.add(s1); U.ion2 = ionSprite(ION[id][0], ION[id][1]); g.add(U.ion2); U.ion2.visible = false; }
      else { U.ion.material.color.setHex(parseInt(ION[id][1].slice(1), 16)); U.ion.scale.set(1.7, 1.7, 1.7); U.ion2 = add(g, new T.SphereGeometry(0.06, 6, 5), ION[id][1], 0, 0.5, 0); U.ion2.material = U.ion2.material.clone(); U.ion2.scale.set(1.7, 1.7, 1.7); U.ion2.visible = false; }
      U.blk = bx(g, 0.5, 0.07, 0.26, '#FF3B3B', 0, 0.5, 0.0); U.blk.rotation.z = 0.5; U.blk.material = U.blk.material.clone(); U.blk.visible = false;
      U.blk2 = bx(g, 0.5, 0.07, 0.26, '#FF3B3B', 0, 0.5, 0.0); U.blk2.rotation.z = -0.5; U.blk2.material = U.blk2.material.clone(); U.blk2.visible = false;
    }); });
    synDrugM = new T.Group(); synG.add(synDrugM); synDrugM.visible = false;
    cy(synDrugM, 0.09, 0.09, 0.2, 8, '#FFFFFF', 0, 0.1, 0); cy(synDrugM, 0.09, 0.09, 0.2, 8, '#FF5C8A', 0, -0.1, 0); add(synDrugM, new T.SphereGeometry(0.09, 8, 6), '#FFFFFF', 0, 0.2, 0); add(synDrugM, new T.SphereGeometry(0.09, 8, 6), '#FF5C8A', 0, -0.2, 0); synDrugM.scale.set(1.5, 1.5, 1.5);
    // vesicles + golgi
    for (let i = 0; i < 3; i++) { const gb = bx(synG, 1.0 - i * 0.12, 0.14, 0.7, '#B58AE0', SX + SG[0] - 0.1, SG[1] - 0.35 + i * 0.2, 0); gb.rotation.z = -0.12; }
    for (let i = 0; i < 8; i++) {
      const m = add(synG, new T.IcosahedronGeometry(0.24, 1), '#FFC46B', SX, 4, 0); m.material = m.material.clone(); m.castShadow = false;
      const v = { m, st: 'res', t: Math.random() * 3, dur: 2 + Math.random() * 4, slot: -1, rp: [0, 0, 0] }; pickRes(v); m.position.set(SX + v.rp[0], v.rp[1], v.rp[2]); synVes.push(v);
    }
    for (let i = 0; i < 44; i++) { const m = add(synG, new T.OctahedronGeometry(0.075, 0), '#FFFFFF', SX, 5, 0); m.material = m.material.clone(); m.visible = false; m.castShadow = false; synParts.push({ m, life: 0, v: [0, 0, 0] }); }
    // labels
    synWrap0();
    Object.keys(SSITES).forEach(id => { const el = document.createElement('span'); el.className = 'syn3d'; el.textContent = SSITES[id][0]; synWrap.appendChild(el); const g = synSite[id].groups[0]; synLabs.push({ el, id, cats: SSITES[id][1], g, dy: SSITES[id][2] === 'post' ? (SSITES[id][4] === 'chan' ? 0.72 : 0.68) + (synLabs.length % 2) * 0.3 : (SSITES[id][2] === 'pre' ? 0.8 : SSITES[id][2] === 'dome' ? 0.7 : 0.75) + (synLabs.length % 3) * 0.28, short: SSITES[id][0] }); });
    SSTRUCT.forEach(s => { const el = document.createElement('span'); el.className = 'syn3d struct'; el.textContent = s[0]; synWrap.appendChild(el); synLabs.push({ el, id: null, struct: true, x: s[1], y: s[2], dy: 0 }); });
  }
  /* ions are floating letters: a camera-facing sprite drawn from the ion's symbol */
  function ionSprite(txt, col) {
    try {
      if (!T.Sprite || !T.CanvasTexture || !T.SpriteMaterial) return null;
      const c = document.createElement('canvas'); c.width = 192; c.height = 96; const x = c.getContext('2d'); if (!x) return null;
      x.font = '800 56px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round'; x.lineWidth = 11; x.strokeStyle = '#120F2E'; x.strokeText(txt, 96, 52); x.fillStyle = col; x.fillText(txt, 96, 52);
      const s = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, depthTest: false, depthWrite: false }));
      s.scale.set(0.95, 0.475, 1); s.renderOrder = 20; s.userData.ionSprite = true; return s;
    } catch (e) { return null; }
  }
  function synWrap0() { if (!synWrap) { synWrap = document.createElement('div'); synWrap.className = 'synwrap'; synWrap.setAttribute('aria-hidden', 'true'); host.appendChild(synWrap); } return synWrap; }
  function pickRes(v) { v.rp = [-1.7 + Math.random() * 3.8, 3.55 + Math.random() * 1.25, (Math.random() - 0.5) * 1.0]; }
  const synNT = () => (synCat === 'ad' ? 0xC28BFF : synCat === 'cbd' ? 0xFFB347 : (Math.random() < 0.5 ? 0x6EE38A : 0xFFB347));
  const DOCKS = [-0.4, 0.3, 0.95];
  const docked = [false, false, false];
  function spawnPart(x, y, z, vx, vy, vz, col) {
    for (const p of synParts) { if (p.life > 0) continue; p.life = 2.6; p.m.visible = true; p.m.position.set(x, y, z); p.v = [vx, vy, vz]; p.m.material.color.setHex(col); p.m.scale.set(1, 1, 1); return p; }
    return null;
  }
  function vesStep(v, dt) {
    v.t += dt; const k = Math.min(1, v.t / v.dur), m = v.m, ease = k * k * (3 - 2 * k);
    if (v.st === 'bud') { const s = 0.15 + 0.85 * ease; m.scale.set(s, s, s); m.position.set(SX + SG[0] + 0.3 * ease, SG[1] + 0.05 - ease * 0.1, 0); m.material.color.setHex(0x7a6a9a); if (k > 0.5) m.material.color.setHex(synNT()); if (k >= 1) { v.st = 'move'; v.t = 0; v.dur = 2.2; pickRes(v); v.from = [m.position.x, m.position.y, m.position.z]; } }
    else if (v.st === 'move') { m.position.set(v.from[0] + (SX + v.rp[0] - v.from[0]) * ease, v.from[1] + (v.rp[1] - v.from[1]) * ease, v.from[2] + (v.rp[2] - v.from[2]) * ease); if (k >= 1) { v.st = 'res'; v.t = 0; v.dur = 2 + Math.random() * 6; } }
    else if (v.st === 'res') {
      m.position.set(SX + v.rp[0] + Math.sin(synT * 1.3 + v.rp[0]) * 0.12, v.rp[1] + Math.sin(synT * 1.7 + v.rp[2] * 3) * 0.1, v.rp[2]);
      if (k >= 1) { const f = docked.indexOf(false); if (f >= 0) { docked[f] = true; v.slot = f; v.st = 'dock'; v.t = 0; v.dur = 1.0; v.from = [m.position.x, m.position.y, m.position.z]; } else { v.t = 0; v.dur = 1.5; } }
    }
    else if (v.st === 'dock') { const tx = SX + DOCKS[v.slot], ty = 3.3; m.position.set(v.from[0] + (tx - v.from[0]) * ease, v.from[1] + (ty - v.from[1]) * ease, v.from[2] * (1 - ease)); if (k >= 1) { v.st = 'prime'; v.t = 0; v.dur = 1.0 + Math.random() * 2.2; } }
    else if (v.st === 'prime') { const p = 1 + Math.sin(synT * 10) * 0.05; m.scale.set(p, p, p); if (k >= 1) { v.st = 'fuse'; v.t = 0; v.dur = 0.7; v.rel = false; } }
    else if (v.st === 'fuse') {
      m.scale.set(1 + ease * 0.8, 1 - ease * 0.7, 1 + ease * 0.8); m.position.y = 3.3 - ease * 0.12;
      if (!v.rel && k > 0.15) { v.rel = true; const n = 6; for (let i = 0; i < n; i++) spawnPart(m.position.x + (Math.random() - 0.5) * 0.3, 2.75, (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.5, -0.9 - Math.random() * 0.5, (Math.random() - 0.5) * 0.3, synNT()); }
      if (k >= 1) { docked[v.slot] = false; v.slot = -1; v.st = 'recy'; v.t = 0; v.dur = 1.9; v.from = [m.position.x, m.position.y, m.position.z]; }
    }
    else if (v.st === 'recy') { const s = 0.9 - 0.65 * ease; m.scale.set(s, s, s); m.position.set(v.from[0] + (SX + SG[0] + 0.3 - v.from[0]) * ease, v.from[1] + (SG[1] - v.from[1]) * ease + Math.sin(ease * PI) * 0.5, 0); if (k >= 1) { v.st = 'bud'; v.t = 0; v.dur = 1.5; } }
  }
  function synTick(dt) {
    dt *= 0.55; synT += dt;
    scene.children.forEach(c => { if (c !== synG && c !== hemi && c !== sun && c.visible) { c.visible = false; if (synHid.indexOf(c) < 0) synHid.push(c); } });
    synVes.forEach(v => vesStep(v, dt));
    synParts.forEach(p => { if (p.life <= 0) return; p.life -= dt; const m = p.m; m.position.x += p.v[0] * dt; m.position.y += p.v[1] * dt; m.position.z += p.v[2] * dt; m.rotation.x += dt * 3; m.rotation.y += dt * 2;
      if (p.v[1] < 0 && m.position.y < 1.5) { p.v[1] = 0; p.v[0] *= 0.2; p.life = Math.min(p.life, 0.35); } if (p.v[1] > 0 && m.position.y > 2.65) p.life = Math.min(p.life, 0.3);
      const s = Math.min(1, p.life * 3); m.scale.set(s, s, s); if (p.life <= 0) m.visible = false; });
    if (synCat === 'cbd') { synRetro -= dt; if (synRetro <= 0) { synRetro = 2.4; for (let i = 0; i < 3; i++) spawnPart(SX + 1.9 + (Math.random() - 0.5) * 0.4, 1.4, (Math.random() - 0.5) * 0.5, -0.12 - Math.random() * 0.1, 0.8 + Math.random() * 0.3, 0, 0xE8F25A); } }
    Object.keys(synSite).forEach(id => synSite[id].groups.forEach(g => {
      const U = g.userData, vis = SSITES[id][1].indexOf(synCat) >= 0; if (g.visible !== vis) g.visible = vis; if (!vis) return;
      const fx = synDrug && synDrug.docked && synDrug.sites.indexOf(id) >= 0 ? ((synDrug.acts && synDrug.acts[id]) || synDrug.act) : null;
      if (U.fx !== fx) { U.fx = fx; U.e = -1; }
      if (U.ion) {
        const f = fx === 'inh' ? 0 : fx === 'act' ? 2.4 : 1; U.pp = (U.pp === undefined ? U.ph : U.pp) + dt * 0.55 * f;
        if (fx === 'inh') { U.ion.position.set(Math.sin(synT * 18) * 0.04, 0.62, 0); U.ion.visible = true; } else { const p = U.pp % 1; U.ion.position.set(0, 0.55 - p * 1.0, 0); U.ion.visible = p > 0.05 && p < 0.95; }
        if (U.ion2) { const on2 = fx === 'act'; U.ion2.visible = false; if (on2) { const p2 = (U.pp + 0.5) % 1; U.ion2.position.set(0, 0.55 - p2 * 1.0, 0); U.ion2.visible = p2 > 0.05 && p2 < 0.95; } }
        if (U.blk) { U.blk.visible = U.blk2.visible = fx === 'inh'; }
        // ions only appear once the site is selected (tapped, hovered, or revealed by the drug)
        if (!(fx || (synHLids && synHLids.indexOf(id) >= 0) || synHover === id)) { U.ion.visible = false; if (U.ion2) U.ion2.visible = false; }
      }
      if (fx) { const k = fx === 'inh' ? 0.35 + Math.sin(synT * 8) * 0.2 : 0.3 + Math.sin(synT * 7) * 0.2; g.traverse(o => { if (o.material && o.material.emissive && o !== U.blk && o !== U.blk2) o.material.emissive.setRGB(fx === 'inh' ? k : 0.05, fx === 'inh' ? 0.03 : k, 0.05); }); }
      if (U.flap) U.flap.rotation.z = fx === 'inh' ? 0 : Math.sin(synT * (fx === 'act' ? 4.5 : 2) + U.ph * 6) * 0.45;
      if (U.knob) { const s = fx === 'inh' ? 0.5 : 1 + Math.sin(synT * (fx === 'act' ? 9 : 4) + g.position.x) * (fx === 'act' ? 0.5 : 0.25); U.knob.scale.set(s, s, s); }
      if (U.bob !== undefined && fx !== 'inh' && id !== 'a2d') g.position.y += Math.sin(synT * 1.4 + U.bob) * dt * (fx === 'act' ? 0.2 : 0.08);
      const on = synHLids && synHLids.indexOf(id) >= 0, hov = synHover === id, e = on ? 0.45 + Math.sin(synT * 6) * 0.3 : hov ? 0.35 : 0, sc = on ? 1.12 + Math.sin(synT * 6) * 0.05 : hov ? 1.08 : 1;
      if (!fx && U.e !== e) { U.e = e; g.traverse(o => { if (o.material && o.material.emissive) { o.material.emissive.setRGB(e, e * 0.85, e * 0.2); } }); }
      const base = g.userData.s0 || (g.userData.s0 = g.scale.x); g.scale.set(base * sc, base * sc, base * sc);
    }));
    if (synDrug && synDrugM) {
      const D = synDrug, m = synDrugM; m.visible = true; D.t += dt;
      let tx, ty, tz = 0.5;
      if (!D.reveal) { tx = SX + Math.sin(D.t * 0.45) * 2.8; ty = 2.05 + Math.sin(D.t * 0.9) * 0.4; tz = 0.5 + Math.sin(D.t * 0.7) * 0.4; D.p = [tx, ty, tz]; }
      else {
        const g = synSite[D.sites[0]].groups[0], loc = SSITES[D.sites[0]][2], dy = (loc === 'pre' || loc === 'dome') ? -0.5 : 0.5; const goal = [g.position.x, g.position.y + dy, 0.45];
        D.k = Math.min(1, (D.k || 0) + dt / 1.6); const e = D.k * D.k * (3 - 2 * D.k); tx = D.p0[0] + (goal[0] - D.p0[0]) * e; ty = D.p0[1] + (goal[1] - D.p0[1]) * e; tz = D.p0[2] + (goal[2] - D.p0[2]) * e; if (D.k >= 1) D.docked = true;
      }
      m.position.set(tx, ty, tz); m.rotation.z += dt * 2.2; m.rotation.x = Math.sin(D.t * 2) * 0.4;
      if (!synDrugEl) { synDrugEl = document.createElement('span'); synDrugEl.className = 'syn3d drug'; synWrap0().appendChild(synDrugEl); }
      if (synDrugEl.textContent !== D.name) synDrugEl.textContent = D.name; synDrugEl.style.display = ''; synDrugPos = [tx, ty];
    } else { if (synDrugM) synDrugM.visible = false; if (synDrugEl) synDrugEl.style.display = 'none'; }
  }
  // labels are projected after the camera has moved this frame, so they stay locked to the models
  function synLabelPass() {
    if (synDrugEl && synDrugEl.style.display === '' && synDrugPos) place(synDrugEl, synDrugPos[0], synDrugPos[1] + 0.5, 0.9);
    synIonLabs.forEach(L => {
      const U = L.g.userData, ok = synLabelsOn && L.g.visible && U.ion && U.ion.visible && typeof U.ion.getWorldPosition === 'function';
      L.el.style.display = ok ? '' : 'none';
      if (ok) { tmpV = tmpV || new T.Vector3(); U.ion.getWorldPosition(tmpV); place(L.el, tmpV.x, tmpV.y + 0.22, 0.9); }
    });
    synLabs.forEach(L => {
      let show = synLabelsOn; if (!L.struct) show = show && L.cats.indexOf(synCat) >= 0; else show = true;
      if (L.struct && synCat !== 'cbd' && L.x === SX + 0.35 && false) show = true;
      const hl = L.id && synHLids && synHLids.indexOf(L.id) >= 0;
      const ex = !!(L.id && synInfo[L.id] && (hl || synHover === L.id));
      if (L.exp !== ex) { L.exp = ex; L.el.textContent = ''; if (ex) { const b = document.createElement('b'); b.textContent = synInfo[L.id].n; const p = document.createElement('span'); p.textContent = synInfo[L.id].i; L.el.appendChild(b); L.el.appendChild(p); } else L.el.textContent = L.short || ''; L.el.classList.toggle('exp', ex); }
      L.el.style.display = show || hl || ex ? '' : 'none'; L.el.classList.toggle('hl', !!hl);
      if (show || hl) { const q = L.struct ? { x: L.x, y: L.y, z: 0.8 } : L.g.position; place(L.el, q.x, q.y + L.dy, L.struct ? 0.8 : 0.9); }
    });
  }
  api.setSyn = function (on) {
    if (!api.ok || !scene) return false;
    on = !!on; if (on === synOn) return on;
    if (on) {
      if (!synG) buildSyn();
      synHid = []; scene.children.forEach(c => { if (c !== synG && c !== hemi && c !== sun && c.visible) { c.visible = false; synHid.push(c); } });
      synG.visible = true; synOn = true;
      synSaved = { TX, TY, TZ, gth, gph, grad }; TX = SX; TY = 2.5; TZ = 0; gth = 0; gph = 1.4; grad = baseRad * 0.56;
      document.body.classList.add('syn');
    } else {
      synOn = false; synHid.forEach(c => { c.visible = true; }); synHid = []; if (synG) synG.visible = false;
      if (synSaved) { TX = synSaved.TX; TY = synSaved.TY; TZ = synSaved.TZ; gth = synSaved.gth; gph = synSaved.gph; grad = synSaved.grad; synSaved = null; }
      if (synWrap) { synLabs.forEach(L => { L.el.style.display = 'none'; }); synIonLabs.forEach(L => { L.el.style.display = 'none'; }); if (synDrugEl) synDrugEl.style.display = 'none'; }
      document.body.classList.remove('syn');
    }
    applyTheme(); return on;
  };
  api.synOn = () => synOn;
  api.synCat = function (c) { synCat = c; synRetro = 0.3; synParts.forEach(p => { p.life = 0; p.m.visible = false; }); };
  api.synLabels = function (on) { synLabelsOn = !!on; };
  api.synDrug = function (d) {
    if (!d) { synDrug = null; return; }
    synDrug = { name: d.name, act: d.act, acts: d.acts, sites: d.sites.filter(s => synSite[s]), t: 0, reveal: false, docked: false, k: 0, p: [SX, 2.05, 0.5], p0: null };
  };
  api.synReveal = function () { if (synDrug && !synDrug.reveal && synDrug.sites.length) { synDrug.reveal = true; synDrug.p0 = synDrug.p.slice(); } };
  api.synInfo = function (m) { Object.keys(m || {}).forEach(k => { synInfo[k] = m[k]; }); };
  api.synHighlight = function (ids) { synHLids = ids && ids.length ? ids : null; };
  api.synHover = function (id) { synHover = id; };
  /* the floating brain next to the bookshelf opens the synapse lab */
  let brainG = null, brainTag = null;
  function buildBrain(g) {
    brainG = new T.Group(); brainG.position.set(-7.9, 4.6, -3.9); g.add(brainG);
    [-1, 1].forEach(sx => {
      const geo = new T.SphereGeometry(1, 56, 40), pa = geo.attributes.position;
      for (let k = 0; k < pa.count; k++) {
        let x = pa.getX(k), y = pa.getY(k), z = pa.getZ(k);
        const med = x * sx < 0;                       /* medial side faces the other hemisphere */
        const fold = Math.sin(9 * x + 2.2 * Math.sin(5 * z + 1.3 * y)) * Math.sin(8 * y + 2.4 * Math.sin(6 * x + 4 * z)) + 0.6 * Math.sin(13 * z + 3 * Math.sin(7 * y));
        const d = 1 + 0.075 * Math.max(-1.2, Math.min(1.2, fold)) * (med && Math.abs(x) > 0.5 ? 0.3 : 1);
        x *= d; y *= d; z *= d;
        if (med) x *= 0.3;                            /* flat inner wall */
        if (y < 0) y *= 0.62;                         /* flatter underside */
        if (y < -0.1 && z > 0.1) { y -= 0.06; }
        pa.setXYZ(k, x * 0.5, y * 0.5, z * 0.82);
      }
      geo.computeVertexNormals();
      add(brainG, geo, '#F29CB2', sx * 0.14, 0, 0, null, { flatShading: false });
    });
    const hit = new T.Mesh(new T.SphereGeometry(1.3, 6, 5), new T.MeshBasicMaterial({ visible: false })); brainG.add(hit);
    brainG.userData.brain = true;
    brainTag = document.createElement('button'); brainTag.type = 'button'; brainTag.className = 'brainTag'; brainTag.textContent = 'Synapse lab'; brainTag.addEventListener('click', e => { e.stopPropagation(); if (B.onBrain) B.onBrain(); }); if (tagsEl) tagsEl.appendChild(brainTag);
  }
  /* clickable event objects on the counter: restock box, prior-auth folder, mystery pill bottle */
  let evtG = null; const evtO = {};
  const EVT_DEF = { shelve: ['Restock', 4.1], prior: ['Prior auth', 5.3], bottle: ['Check bottle', 6.5] }, EVT_Y = 1.08, EVT_Z = -4.9;
  function buildEvt(g) {
    evtG = new T.Group(); g.add(evtG);
    // event table: tucked toward the back-right corner next to the robot
    bx(g, 3.9, 0.1, 1.4, '#F4F9F9', 5.3, 1.0, EVT_Z); bx(g, 3.9, 0.1, 0.1, '#F2A516', 5.3, 0.94, EVT_Z + 0.7);
    [[-1.75, -0.5], [1.75, -0.5], [-1.75, 0.5], [1.75, 0.5]].forEach(l => bx(g, 0.12, 0.95, 0.12, '#0A6F66', 5.3 + l[0], 0.47, EVT_Z + l[1]));
    bx(g, 3.7, 0.06, 1.2, '#0E9A8E', 5.3, 0.35, EVT_Z);
    Object.keys(EVT_DEF).forEach(k => {
      const o = new T.Group(); o.position.set(EVT_DEF[k][1], EVT_Y, EVT_Z); o.scale.set(1.25, 1.25, 1.25); o.visible = true; o.userData.evt = k; evtG.add(o);
      if (k === 'shelve') {
        bx(o, 0.8, 0.5, 0.6, '#C99A5B', 0, 0.25, 0); bx(o, 0.14, 0.02, 0.62, '#EAD9B0', 0, 0.51, 0); bx(o, 0.5, 0.32, 0.42, '#D8A968', -0.05, 0.66, 0.02).rotation.y = 0.35;
        bx(o, 0.3, 0.18, 0.02, '#FFFFFF', 0, 0.25, 0.31);
      } else if (k === 'prior') {
        bx(o, 0.8, 0.05, 1.0, '#F2A516', 0, 0.03, 0); bx(o, 0.34, 0.05, 0.12, '#F2A516', -0.2, 0.03, -0.55); bx(o, 0.68, 0.03, 0.88, '#FFFFFF', 0, 0.075, 0.02);
        for (let i = 0; i < 4; i++) bx(o, 0.5, 0.02, 0.05, '#7BA7B5', 0, 0.1, -0.28 + i * 0.18);
        cy(o, 0.09, 0.09, 0.05, 8, '#E04F3A', 0.22, 0.12, 0.3);
      } else {
        cy(o, 0.24, 0.24, 0.6, 10, '#F2A516', 0, 0.3, 0); cy(o, 0.245, 0.245, 0.3, 10, '#F4F9F9', 0, 0.3, 0); cy(o, 0.27, 0.27, 0.16, 10, '#FFFFFF', 0, 0.68, 0);
        bx(o, 0.18, 0.12, 0.02, '#2CCDBB', 0, 0.32, 0.245);
      }
      const hit = new T.Mesh(new T.SphereGeometry(0.95, 6, 5), new T.MeshBasicMaterial({ visible: false })); hit.position.y = 0.4; o.add(hit);
      const tag = document.createElement('button'); tag.type = 'button'; tag.className = 'evtTag'; tag.textContent = EVT_DEF[k][0]; tag.hidden = false;
      tag.addEventListener('click', e => { e.stopPropagation(); if (B.onEvt) B.onEvt(k); });
      if (tagsEl) tagsEl.appendChild(tag);
      evtO[k] = { g: o, tag: tag, on: false, t: Math.random() * 6, s: 0, d: 0 };
    });
  }
  function evtTick(dt) {
    Object.keys(evtO).forEach(k => {
      const e = evtO[k], show = !labOn && !synOn;
      e.t += dt; e.g.visible = show; e.tag.hidden = !show;
      if (!show) return;
      // due: bounce and wiggle so it is easy to spot; otherwise sit calmly on the table
      e.d += ((e.on ? 1 : 0) - e.d) * Math.min(1, dt * 6);
      const due = e.d > 0.5; if (e.tag.classList.contains('due') !== due) e.tag.classList.toggle('due', due);
      const bob = Math.abs(Math.sin(e.t * 4.2)) * 0.32 * e.d + Math.sin(e.t * 1.3) * 0.015 * (1 - e.d);
      e.g.position.y = EVT_Y + bob;
      e.g.rotation.y = Math.sin(e.t * 1.1) * 0.25 * (1 - e.d); e.g.rotation.z = Math.sin(e.t * 26) * 0.12 * e.d;
      const sc = 1.25 + 0.1 * e.d * Math.abs(Math.sin(e.t * 4.2)); e.g.scale.set(sc, sc, sc);
      place(e.tag, e.g.position.x, EVT_Y + 1.6, e.g.position.z);
    });
  }
  /* ---- seasonal events: Halloween (Oct 24-31) and Christmas (Dec 18-25) ---- */
  let hol = null, holN = 0, holG = null, holItems = [], holAnim = [], holFlakes = [];
  const HOLBG = { halloween: ['#F6A352', '#3A1D0A'], christmas: ['#DCEBFA', '#1B2A44'] };
  function holMk(fn) { const g = new T.Group(); holG.add(g); fn(g); return g; }
  function holBuild(kind) {
    if (holG) { scene.remove(holG); holG.traverse(n => { if (n.geometry && n.geometry.dispose) n.geometry.dispose(); }); }
    holG = null; holItems = []; holAnim = []; holFlakes = [];
    if (!kind) return;
    holG = new T.Group(); scene.add(holG);
    const bunt = (cols, y) => holMk(g => { for (let i = 0; i < 22; i++) { const x = -11 + i, sag = Math.sin((i / 21) * PI) * -0.7; const c = cone(g, 0.28, 0.55, 3, cols[i % cols.length], x, y + sag, -6.85); c.rotation.x = PI; c.rotation.y = 0.3; } });
    if (kind === 'halloween') {
      bunt(['#F28A1E', '#1F1B2E', '#7B3FA0'], 6.4);
      const orange = '#F28A1E', stem = '#3E8E41', glowM = { emissive: new T.Color('#FFD23F'), emissiveIntensity: 0.9 };
      const pumpkin = (g, x, y, z, s) => { const p = ico(g, 0.5 * s, orange, x, y + 0.42 * s, z); p.scale.set(1.15, 0.9, 1.15); cy(g, 0.07 * s, 0.1 * s, 0.22 * s, 5, stem, x, y + 0.9 * s, z); };
      holItems.push(holMk(g => { pumpkin(g, -9.0, 1.27, 0.5, 0.7); pumpkin(g, -8.4, 1.27, 0.7, 0.45); }));
      holItems.push(holMk(g => { pumpkin(g, -9.3, 0, 3.0, 1.35); bx(g, 0.14, 0.14, 0.05, '#FFE066', -9.55, 0.62, 3.9, null, glowM); bx(g, 0.14, 0.14, 0.05, '#FFE066', -9.05, 0.62, 3.9, null, glowM); bx(g, 0.34, 0.1, 0.05, '#FFE066', -9.3, 0.38, 3.92, null, glowM); }));
      const bub = [];
      holItems.push(holMk(g => { cy(g, 0.8, 0.6, 0.8, 9, '#1F1B2E', -7.3, 0.4, 6.0); cy(g, 0.84, 0.84, 0.08, 9, '#2B2438', -7.3, 0.82, 6.0); cy(g, 0.66, 0.66, 0.05, 9, '#6FD14C', -7.3, 0.8, 6.0, null, glowM); for (let i = 0; i < 4; i++) { const b = ico(g, 0.1, '#9BE86A', -7.3, 0.9, 6.0); bub.push({ m: b, t: i * 0.6 }); } [-1, 1].forEach(s => cy(g, 0.07, 0.07, 0.35, 5, '#1F1B2E', -7.3 + s * 0.5, 0.15, 6.4)); }));
      holAnim.push(dt => bub.forEach(b => { b.t += dt * 0.7; const k = b.t % 1; b.m.position.y = 0.85 + k * 0.7; b.m.position.x = -7.3 + Math.sin(b.t * 6) * 0.25; b.m.scale.setScalar ? b.m.scale.setScalar(1 - k * 0.7) : b.m.scale.set(1 - k * 0.7, 1 - k * 0.7, 1 - k * 0.7); }));
      const gh = holMk(g => { const body = ico(g, 0.5, '#F4F4FF', 0, 0, 0); body.scale.set(1, 1.3, 1); bx(g, 0.12, 0.18, 0.06, '#1b1b24', -0.16, 0.12, 0.45); bx(g, 0.12, 0.18, 0.06, '#1b1b24', 0.16, 0.12, 0.45); bx(g, 0.18, 0.12, 0.06, '#1b1b24', 0, -0.15, 0.46); [-0.3, 0, 0.3].forEach(x => cone(g, 0.15, 0.3, 4, '#F4F4FF', x, -0.72, 0).rotation.x = PI); }); holItems.push(gh);
      holAnim.push(dt => { gh.position.set(4.8 + Math.sin(time * 0.6) * 1.4, 3.3 + Math.sin(time * 1.7) * 0.3, 5.5); gh.rotation.y = Math.sin(time * 0.8) * 0.5; });
      const bats = []; holItems.push(holMk(g => { for (let i = 0; i < 5; i++) { const b = new T.Group(); bx(b, 0.22, 0.14, 0.18, '#1F1B2E', 0, 0, 0); const l = bx(b, 0.5, 0.04, 0.26, '#2B2438', -0.32, 0.02, 0), r = bx(b, 0.5, 0.04, 0.26, '#2B2438', 0.32, 0.02, 0); g.add(b); bats.push({ g: b, l, r, ph: i * 1.3 }); } }));
      holAnim.push(dt => bats.forEach(b => { const a = time * 0.5 + b.ph; b.g.position.set(Math.cos(a) * 7, 7 + Math.sin(a * 2.3) * 0.6, 2 + Math.sin(a) * 2.5); b.g.rotation.y = -a + PI; const f = Math.sin(time * 14 + b.ph) * 0.6; b.l.rotation.z = f; b.r.rotation.z = -f; }));
      const sp = []; holItems.push(holMk(g => { for (let i = 0; i < 6; i++) { const l = bx(g, 1.8, 0.03, 0.03, '#EEEEEE', 9, 6.2, -7.05); l.rotation.z = i * PI / 6; } [0.5, 0.9, 1.3].forEach(r => { const t = new T.Mesh(new T.TorusGeometry(r, 0.012, 3, 12), new T.MeshBasicMaterial({ color: 0xEEEEEE })); t.position.set(9, 6.2, -7.05); g.add(t); }); const s = new T.Group(); ico(s, 0.2, '#1b1b24', 0, 0, 0); [-1, 1].forEach(q => [0.15, 0.3].forEach(o => { const lg = bx(s, 0.3, 0.025, 0.025, '#1b1b24', q * 0.28, o - 0.2, 0); lg.rotation.z = q * 0.5; })); g.add(s); sp.push(s); bx(g, 0.02, 2.4, 0.02, '#EEEEEE', 8.4, 7.4, -6.9); }));
      holAnim.push(dt => sp.forEach(s => { s.position.set(8.4, 6.2 + Math.sin(time * 1.2) * 0.5, -6.85); }));
      holItems.push(holMk(g => { cone(g, 0.36, 0.8, 8, '#1F1B2E', -1.6, 1.27 + 0.42, 0.55).rotation.z = 0.08; cy(g, 0.58, 0.58, 0.05, 10, '#1F1B2E', -1.6, 1.3, 0.55); cy(g, 0.37, 0.4, 0.09, 8, '#7B3FA0', -1.6, 1.4, 0.55); }));
      holItems.push(holMk(g => { const b = new T.Mesh(new T.SphereGeometry(0.4, 8, 5, 0, PI * 2, PI / 2, PI / 2), new T.MeshStandardMaterial({ color: 0xF28A1E, flatShading: true, side: 2 })); b.position.set(2.9, 1.7, 0.55); g.add(b); ['#E04F3A', '#FFD23F', '#2CCDBB', '#8A63C9', '#FFFFFF', '#E04F3A'].forEach((c, i) => ico(g, 0.075, c, 2.9 + Math.cos(i * 1.05) * 0.2, 1.6 + (i % 2) * 0.05, 0.55 + Math.sin(i * 1.05) * 0.2)); }));
    } else {
      bunt(['#D8283A', '#2F8F4E', '#FFFFFF'], 6.4);
      const giftC = ['#D8283A', '#2F8F4E', '#3E7BD1', '#F2C94C', '#8A63C9', '#2CCDBB'];
      const gift = (g, x, y, z, s, ci, ry) => { const b = bx(g, 0.6 * s, 0.5 * s, 0.6 * s, giftC[ci % 6], x, y + 0.25 * s, z); b.rotation.y = ry || 0; const rb = '#FFFFFF'; const r1 = bx(g, 0.64 * s, 0.52 * s, 0.1 * s, rb, x, y + 0.25 * s, z); r1.rotation.y = ry || 0; const r2 = bx(g, 0.1 * s, 0.52 * s, 0.64 * s, rb, x, y + 0.25 * s, z); r2.rotation.y = ry || 0; ico(g, 0.1 * s, rb, x, y + 0.56 * s, z); };
      const tree = holMk(g => { const gx = -8.8, gz = 2.0; cy(g, 0.22, 0.28, 0.5, 6, '#6B4423', gx, 0.25, gz); [[1.15, 1.3, 0.5], [0.9, 1.15, 1.25], [0.62, 1.0, 2.0], [0.36, 0.8, 2.7]].forEach((t, i) => cone(g, t[0], t[1], 8, i % 2 ? '#2F8F4E' : '#237A3F', gx, t[2] + t[1] / 2, gz)); const star = ico(g, 0.25, '#FFD23F', gx, 3.62, gz, null); star.material = star.material.clone(); star.material.emissive = new T.Color('#FFD23F'); star.material.emissiveIntensity = 0.9; star.scale.set(1, 1, 0.5);
        const lights = []; ['#D8283A', '#F2C94C', '#3E7BD1', '#FFFFFF', '#2CCDBB', '#D8283A', '#F2C94C', '#3E7BD1'].forEach((c, i) => { const a = i * 2.4, h = 0.9 + i * 0.3, r = Math.max(0.2, 1.05 - h * 0.3); const l = ico(g, 0.08, c, gx + Math.cos(a) * r, h, gz + Math.sin(a) * r); l.material = l.material.clone(); l.material.emissive = new T.Color(c); l.material.emissiveIntensity = 0.8; lights.push(l); });
        holAnim.push(dt => lights.forEach((l, i) => { l.material.emissiveIntensity = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time * 3 + i * 1.3)); })); });
      holItems.push(tree);
      holItems.push(holMk(g => { gift(g, -8.0, 0, 3.4, 1, 0, 0.3); gift(g, -8.55, 0, 3.8, 0.7, 2, -0.2); }));
      holItems.push(holMk(g => { gift(g, -1.6, 1.27, 0.55, 0.7, 3, 0.2); }));
      holItems.push(holMk(g => { gift(g, -9.3, 0, 3.8, 0.9, 1, 0.1); gift(g, -9.3, 0.45, 3.8, 0.55, 4, 0.5); gift(g, -7.7, 0, 2.5, 0.65, 5, -0.4); }));
      holItems.push(holMk(g => { const wr = new T.Mesh(new T.TorusGeometry(0.7, 0.18, 6, 14), new T.MeshStandardMaterial({ color: 0x2F8F4E, flatShading: true })); wr.position.set(6.5, 4.4, -7.0); g.add(wr); cone(g, 0.18, 0.4, 3, '#D8283A', 6.3, 3.75, -6.85).rotation.z = 0.7; cone(g, 0.18, 0.4, 3, '#D8283A', 6.7, 3.75, -6.85).rotation.z = -0.7; ico(g, 0.1, '#D8283A', 6.5, 3.78, -6.8); }));
      holItems.push(holMk(g => { [0, 1, 2].forEach(i => { const x = 2.7 + i * 0.22; cy(g, 0.04, 0.04, 0.55, 5, i % 2 ? '#FFFFFF' : '#D8283A', x, 1.55, 0.6); cy(g, 0.04, 0.04, 0.18, 5, i % 2 ? '#FFFFFF' : '#D8283A', x - 0.07, 1.86, 0.6).rotation.z = 1.2; }); }));
      holItems.push(holMk(g => { const sx = 7.4, sz = 2.8; ico(g, 0.62, '#FFFFFF', sx, 0.55, sz); ico(g, 0.45, '#FFFFFF', sx, 1.3, sz); ico(g, 0.32, '#FFFFFF', sx, 1.8, sz); cone(g, 0.06, 0.3, 5, '#F28A1E', sx, 1.82, sz + 0.34).rotation.x = PI / 2; bx(g, 0.05, 0.05, 0.03, '#1b1b24', sx - 0.1, 1.9, sz + 0.3); bx(g, 0.05, 0.05, 0.03, '#1b1b24', sx + 0.1, 1.9, sz + 0.3); cy(g, 0.3, 0.3, 0.05, 8, '#1b1b24', sx, 2.1, sz); cy(g, 0.2, 0.2, 0.35, 8, '#1b1b24', sx, 2.3, sz); }));
      holItems.push(holMk(g => { gift(g, -7.4, 0, 4.2, 1.2, 3, 0.4); gift(g, -7.4, 0.6, 4.2, 0.7, 0, 0); gift(g, -6.7, 0, 3.6, 0.8, 2, -0.3); gift(g, -6.6, 0, 4.4, 0.6, 1, 0.7); }));
      for (let i = 0; i < 90; i++) { const f = new T.Mesh(new T.OctahedronGeometry(0.07, 0), new T.MeshBasicMaterial({ color: 0xFFFFFF })); f.position.set(-12 + Math.random() * 24, Math.random() * 11, -8 + Math.random() * 20); holG.add(f); holFlakes.push({ m: f, v: 0.6 + Math.random() * 1.1, s: Math.random() * 6 }); }
    }
    holShow();
  }
  function holShow() { holItems.forEach((g, i) => { g.visible = i < holN; }); }
  function holTick(dt) {
    if (!holG) return;
    holG.visible = !labOn && !synOn;
    holAnim.forEach(f => f(dt));
    holFlakes.forEach(f => { const p = f.m.position; p.y -= f.v * dt; p.x += Math.sin(time * 0.8 + f.s) * 0.4 * dt; if (p.y < 0) { p.y = 11; p.x = -12 + Math.random() * 24; } });
  }
  api.setHoliday = function (kind, n) {
    if (!api.ok || !scene) return false;
    kind = kind || null; const rebuild = kind !== hol || !holG; hol = kind; holN = Math.max(1, n || 1);
    if (rebuild) holBuild(kind); else holShow();
    applyTheme(); return true;
  };
  api.holiday = () => hol;
  api.evtShow = function (k, on) { if (evtO[k]) evtO[k].on = !!on; };
  api.evtOn = function (k) { return !!(evtO[k] && evtO[k].on); };
  function brainTick(dt) {
    if (!brainG) return;
    brainG.position.y = 3.5 + Math.sin(time * 1.4) * 0.18; brainG.rotation.y += dt * 0.6; brainG.rotation.z = Math.sin(time * 0.9) * 0.06;
    if (brainTag) place(brainTag, brainG.position.x, brainG.position.y + 1.1, brainG.position.z);
  }
  api.init = function (opts) {
    B = opts; host = opts.host;
    if (typeof THREE === 'undefined') return false;
    T = THREE;
    try {
      renderer = new T.WebGLRenderer({ antialias: true });
      if (!renderer.getContext()) return false;
    } catch (e) { return false; }
    try {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
      canvas = renderer.domElement; canvas.setAttribute('aria-label', '3D view of your pharmacy. Drag to look around, pinch to zoom, or use W A S D or the arrow keys. Tap glowing spots to upgrade.'); canvas.setAttribute('role', 'img');
      host.insertBefore(canvas, host.firstChild);
      tagsEl = host.querySelector('.tags'); bubEl = host.querySelector('.bub3d'); lineEl = host.querySelector('.line3d');
      scene = new T.Scene(); camera = new T.PerspectiveCamera(40, 2, 0.5, 120); raycaster = new T.Raycaster(); tmp = new T.Vector3();
      hemi = new T.HemisphereLight(0xffffff, 0x88aaaa, 0.85); scene.add(hemi);
      sun = new T.DirectionalLight(0xffffff, 0.8); sun.position.set(8, 16, 9); sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024); const sc = sun.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 14; sc.bottom = -14; sc.near = 1; sc.far = 50; scene.add(sun);
      buildStatic();
      CLICK.forEach(id => { const b = document.createElement('button'); b.type = 'button'; b.className = 'tag3d'; b.dataset.up = id; tagsEl.appendChild(b); tags[id] = b; });
      applyTheme(); bind();
      if (window.ResizeObserver) new ResizeObserver(resize).observe(host); else window.addEventListener('resize', resize);
      resize();
      const mq = window.matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', applyTheme);
      new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      if (window.IntersectionObserver) new IntersectionObserver(es => { const on = es[0].isIntersecting && !document.hidden; if (on && !running) { startLoop(); } else if (!on) running = false; }).observe(host);
      document.addEventListener('visibilitychange', () => { if (!document.hidden && !running) { startLoop(); } else if (document.hidden) running = false; });
      api.ok = true; startLoop();
      return true;
    } catch (e) { if (window.console) console.error(e); api.ok = false; return false; }
  };
  return api;
})();
