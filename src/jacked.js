/* Builds the Part Maker "jACKED" body (jackeddata.js) as flat low-poly geometry. world.js person() calls JK.parts().
   Sizes are full extents, rotations are degrees, a vertex nudge is in units of the shape size (world delta = nudge * size). */
const JK = (() => {
  const T = THREE, cache = {};
  const PIV = { Torso: [0, 1.12, 0], Arm_L: [0.46, 1.5, 0], Leg_L: [0.15, 0.68, 0], Shin_L: [0.15, 0.34, 0] };
  // flat triangle list (array of [x,y,z] x3) for one shape in its local space, before rotation
  function localTris(s) {
    const [sx, sy, sz] = s.z, n = s.n || null, sd = Math.max(5, s.sd || 8), tris = [];
    const nd = (i) => { if (!n || !n[i]) return [0, 0, 0]; const v = n[i]; return [(s.f ? -v[0] : v[0]) * sx, v[1] * sy, v[2] * sz]; };
    if (s.t === 'box') {
      const g = new T.BoxGeometry(sx, sy, sz).toNonIndexed(), a = g.attributes.position.array;
      for (let i = 0; i < a.length; i += 9) tris.push([[a[i], a[i + 1], a[i + 2]], [a[i + 3], a[i + 4], a[i + 5]], [a[i + 6], a[i + 7], a[i + 8]]]);
    } else if (s.t === 'cylinder') {
      const g = new T.CylinderGeometry(0.5, 0.5, 1, sd).toNonIndexed(), a = g.attributes.position.array;
      for (let i = 0; i < a.length; i += 9) tris.push([0, 3, 6].map(k => [a[i + k] * sx, a[i + k + 1] * sy, a[i + k + 2] * sz]));
    } else if (s.t === 'sphere') {
      // unique vertices in first-appearance order, the same numbering the Part Maker uses for nudges
      const g = new T.IcosahedronGeometry(0.5, Math.max(0, (s.dt || 1))).toNonIndexed(), a = g.attributes.position.array, key = new Map(), U = [], idx = [];
      for (let i = 0; i < a.length; i += 3) { const k = a[i].toFixed(4) + ',' + a[i + 1].toFixed(4) + ',' + a[i + 2].toFixed(4); if (!key.has(k)) { key.set(k, U.length); U.push([a[i] * sx, a[i + 1] * sy, a[i + 2] * sz]); } idx.push(key.get(k)); }
      U.forEach((v, i) => { const d = nd(i); v[0] += d[0]; v[1] += d[1]; v[2] += d[2]; });
      for (let i = 0; i < idx.length; i += 3) tris.push([U[idx[i]], U[idx[i + 1]], U[idx[i + 2]]]);
    } else if (s.t === 'capsule') {
      // vertex 0 is the bottom pole, then rings of `sd` going up; flat caps of radius min(x,z)/2
      const cs = (s.dt || 2) + 1, cap = Math.min(sy / 2, Math.min(sx, sz) / 2), cyl = Math.max(0, sy - 2 * cap), R = [];
      for (let k = 1; k <= cs; k++) { const ph = (k / cs) * Math.PI / 2; R.push({ y: -cyl / 2 - cap * Math.cos(ph), r: Math.sin(ph) }); }
      for (let k = cs; k >= 1; k--) { const ph = (k / cs) * Math.PI / 2; R.push({ y: cyl / 2 + cap * Math.cos(ph), r: Math.sin(ph) }); }
      const V = [[0, -sy / 2, 0]]; R.forEach(q => { for (let j = 0; j < sd; j++) { const th = j / sd * Math.PI * 2; V.push([Math.sin(th) * q.r * sx / 2, q.y, Math.cos(th) * q.r * sz / 2]); } }); V.push([0, sy / 2, 0]);
      V.forEach((v, i) => { const d = nd(i); v[0] += d[0]; v[1] += d[1]; v[2] += d[2]; });
      const ring = (r, j) => 1 + r * sd + (j % sd);
      for (let j = 0; j < sd; j++) tris.push([V[0], V[ring(0, j + 1)], V[ring(0, j)]]);
      for (let r = 0; r < R.length - 1; r++) for (let j = 0; j < sd; j++) { const a0 = ring(r, j), a1 = ring(r, j + 1), b0 = ring(r + 1, j), b1 = ring(r + 1, j + 1); tris.push([V[a0], V[a1], V[b1]], [V[a0], V[b1], V[b0]]); }
      const top = V.length - 1; for (let j = 0; j < sd; j++) tris.push([V[top], V[ring(R.length - 1, j)], V[ring(R.length - 1, j + 1)]]);
    } else if (s.t === 'cone') {
      // the lower torso flare: base ring widened and the tip stretched down (the sculpted nudges, approximated)
      const g = new T.ConeGeometry(0.5, 1, sd).toNonIndexed(), a = g.attributes.position.array;
      const f = (x, y, z) => y < 0 ? [x * sx * 3.4, y * sy - 0.12, z * sz * 1.3] : [x * sx, y * sy + 0.14, z * sz];
      for (let i = 0; i < a.length; i += 9) tris.push([0, 3, 6].map(k => f(a[i + k], a[i + k + 1], a[i + k + 2])));
    } else if (s.t === 'wedge') {
      const h = [[-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0, 0.5, -0.5], [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0, 0.5, 0.5]].map(v => [v[0] * sx, v[1] * sy, v[2] * sz]);
      [[0, 1, 2], [3, 5, 4], [0, 3, 4], [0, 4, 1], [1, 4, 5], [1, 5, 2], [2, 5, 3], [2, 3, 0]].forEach(q => tris.push([h[q[0]], h[q[1]], h[q[2]]]));
    }
    return tris;
  }
  function rotate(v, rx, ry, rz) { // three's default XYZ Euler
    const e = new T.Euler(rx, ry, rz, 'XYZ'), m = new T.Matrix4().makeRotationFromEuler(e), p = new T.Vector3(v[0], v[1], v[2]).applyMatrix4(m); return [p.x, p.y, p.z];
  }
  // slot -> Float32Array of flat triangles, relative to the part's pivot. mirror makes the R side.
  function bake(part, mirror) {
    const key = part + (mirror ? 'R' : 'L'), c = cache[key]; if (c) return c;
    const out = {}, pv = PIV[part], piv = mirror ? [-pv[0], pv[1], pv[2]] : pv; // the pivot of the R twin
    const list = JACKED_DATA[part] || [];
    list.forEach(s => {
      const rd = Math.PI / 180, tr = localTris(s), buf = out[s.s] = out[s.s] || [];
      tr.forEach(t => {
        const w = t.map(v => { const r = rotate(v, s.r[0] * rd, s.r[1] * rd, s.r[2] * rd); return [r[0] + s.p[0], r[1] + s.p[1], r[2] + s.p[2]]; });
        let tri = w; if (mirror) tri = [w[0], w[2], w[1]].map(v => [-v[0], v[1], v[2]]);
        tri.forEach(v => buf.push(v[0] - piv[0], v[1] - piv[1], v[2] - piv[2]));
      });
    });
    Object.keys(out).forEach(k => { out[k] = new Float32Array(out[k]); });
    return (cache[key] = out);
  }
  const geoCache = {};
  function geo(part, mirror, slot) {
    const k = part + (mirror ? 'R' : 'L') + slot; if (geoCache[k]) return geoCache[k];
    const arr = bake(part, mirror)[slot]; if (!arr) return null;
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(arr, 3)); g.computeVertexNormals(); return (geoCache[k] = g);
  }
  // adds the meshes of one part to `parent` (positioned at the part pivot by the caller); mats: {Shirt, Pants, Skin, Hair, Shoes, White}
  function parts(part, mirror, parent, mats, tag) {
    const made = [];
    ['Shirt', 'Pants', 'Skin', 'Hair', 'Shoes', 'White'].forEach(slot => {
      const g = geo(part, mirror, slot); if (!g || !mats[slot]) return;
      const m = new T.Mesh(g, mats[slot]); m.castShadow = true; Object.assign(m.userData, tag || {}); parent.add(m); made.push(m);
    });
    return made;
  }
  return { parts, PIV };
})();
