/* scratch glTF skinned-mesh reader for trying asset packs (three r128 core only, no GLTFLoader) */
window.loadGLB = async function (url) {
  const buf = await (await fetch(url)).arrayBuffer(), dv = new DataView(buf), jl = dv.getUint32(12, true);
  const J = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl))), bo = 20 + jl + 8, bl = dv.getUint32(20 + jl, true), bin = buf.slice(bo, bo + bl);
  const CT = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array }, NT = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  const cache = {};
  const acc = (i) => {
    if (cache[i]) return cache[i]; const a = J.accessors[i], bv = J.bufferViews[a.bufferView], n = NT[a.type], C = CT[a.componentType], es = C.BYTES_PER_ELEMENT * n, st = bv.byteStride || es, off = (bv.byteOffset || 0) + (a.byteOffset || 0);
    const out = new C(a.count * n), src = new Uint8Array(bin);
    for (let k = 0; k < a.count; k++) { const sl = src.slice(off + k * st, off + k * st + es); out.set(new C(sl.buffer, 0, n), k * n); }
    let r = out; if (a.normalized && C !== Float32Array) { r = new Float32Array(out.length); const m = C === Uint8Array ? 255 : C === Uint16Array ? 65535 : C === Int16Array ? 32767 : 127; for (let k = 0; k < out.length; k++) r[k] = Math.max(out[k] / m, -1); }
    return (cache[i] = { arr: r, n, count: a.count });
  };
  const img = J.images[0], ibv = J.bufferViews[img.bufferView], blob = new Blob([new Uint8Array(bin, ibv.byteOffset || 0, ibv.byteLength)], { type: img.mimeType });
  const im = new Image(); await new Promise((res, rej) => { im.onload = res; im.onerror = rej; im.src = URL.createObjectURL(blob); });
  const tex = new THREE.Texture(im); tex.flipY = false; tex.needsUpdate = true;
  const mats = J.materials.map(m => m.name === 'Glass' ? new THREE.MeshStandardMaterial({ color: 0xbfe3f0, transparent: true, opacity: 0.3, roughness: 0.1, skinning: true }) : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0, skinning: true }));
  const geos = J.meshes.map(m => m.primitives.map(p => { const g = new THREE.BufferGeometry(), A = p.attributes; const set = (nm, i, T) => { const a = acc(i); g.setAttribute(nm, new T(a.arr, a.n)); };
    set('position', A.POSITION, THREE.BufferAttribute); if (A.NORMAL !== undefined) set('normal', A.NORMAL, THREE.BufferAttribute); if (A.TEXCOORD_0 !== undefined) set('uv', A.TEXCOORD_0, THREE.BufferAttribute);
    if (A.JOINTS_0 !== undefined) { const a = acc(A.JOINTS_0); g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(Uint16Array.from(a.arr), 4)); } if (A.WEIGHTS_0 !== undefined) set('skinWeight', A.WEIGHTS_0, THREE.BufferAttribute);
    if (p.indices !== undefined) g.setIndex(new THREE.BufferAttribute(acc(p.indices).arr, 1)); return { g, mat: p.material }; }));
  const clips = (nodes) => J.animations.map(an => { const tr = []; an.channels.forEach(ch => { const s = an.samplers[ch.sampler], nd = nodes[ch.target.node], t = acc(s.input).arr, v = acc(s.output).arr, p = ch.target.path;
      if (p === 'rotation') tr.push(new THREE.QuaternionKeyframeTrack(nd.name + '.quaternion', t, v)); else tr.push(new THREE.VectorKeyframeTrack(nd.name + (p === 'translation' ? '.position' : '.scale'), t, v)); });
    return new THREE.AnimationClip(an.name, -1, tr); });
  return { json: J, build() {
    const nodes = J.nodes.map((n, i) => { const isBone = J.skins[0].joints.indexOf(i) >= 0, o = isBone ? new THREE.Bone() : new THREE.Object3D(); o.name = n.name || ('n' + i);
      if (n.translation) o.position.fromArray(n.translation); if (n.rotation) o.quaternion.fromArray(n.rotation); if (n.scale) o.scale.fromArray(n.scale); return o; });
    J.nodes.forEach((n, i) => (n.children || []).forEach(c => nodes[i].add(nodes[c])));
    const root = nodes[J.scenes[0].nodes[0]], skin = J.skins[0], bones = skin.joints.map(i => nodes[i]), ibm = acc(skin.inverseBindMatrices).arr, inv = bones.map((b, k) => new THREE.Matrix4().fromArray(ibm, k * 16)), skel = new THREE.Skeleton(bones, inv), parts = {};
    root.updateMatrixWorld(true);
    J.nodes.forEach((n, i) => { if (n.mesh === undefined) return; parts[n.name] = geos[n.mesh].map(gp => { const m = new THREE.SkinnedMesh(gp.g, mats[gp.mat || 0]); m.frustumCulled = false; nodes[i].add(m); m.updateMatrixWorld(true); m.bind(skel, m.matrixWorld); return m; }); });
    return { root, skel, parts, clips: clips(nodes), nodes };
  } };
};
