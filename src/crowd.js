/* ---------------- Crowd: walking, steering around people, collisions ---------------- */
const Crowd = (function () {
  const hyp = Math.hypot;
  let boxes = [];
  function setBoxes(b) { boxes = b; }
  function nearestOn(b, x, z) { return [Math.max(b.x0, Math.min(b.x1, x)), Math.max(b.z0, Math.min(b.z1, z))]; }
  // Keep people out of furniture (axis-aligned boxes in x/z).
  function pushOut(list, r0) {
    for (let i = 0; i < list.length; i++) {
      const p = list[i].g.position, r = list[i].r !== undefined ? list[i].r - 0.025 : r0;
      for (let k = 0; k < boxes.length; k++) {
        const b = boxes[k], q = nearestOn(b, p.x, p.z), dx = p.x - q[0], dz = p.z - q[1], d = hyp(dx, dz);
        if (d >= r) continue;
        if (d < 1e-4) {
          const m = Math.min(p.x - b.x0, b.x1 - p.x, p.z - b.z0, b.z1 - p.z);
          if (m === p.x - b.x0) p.x = b.x0 - r; else if (m === b.x1 - p.x) p.x = b.x1 + r; else if (m === p.z - b.z0) p.z = b.z0 - r; else p.z = b.z1 + r;
        } else { p.x = q[0] + dx / d * r; p.z = q[1] + dz / d * r; }
      }
    }
  }
  // Distance from a point to the nearest piece of furniture.
  function clearance(x, z) {
    let m = 99;
    for (let k = 0; k < boxes.length; k++) { const q = nearestOn(boxes[k], x, z); m = Math.min(m, hyp(x - q[0], z - q[1])); }
    return m;
  }
  function isMover(o) { return o.wp.length > 0 && !(o.stall > 0); }
  // Steer the unit heading (ux,uz) away from people ahead. Weak until the person has bumped into someone (o.dodge).
  function avoid(self, list, ux, uz, d) {
    if (d < 0.9) return [ux, uz];
    const p = self.g.position, dodging = self.dodge > 0, range = dodging ? 2.4 : 1.5, k = dodging ? 1.8 : 0.35;
    let sx = 0, sz = 0;
    for (let i = 0; i < list.length; i++) {
      const o = list[i]; if (o === self) continue;
      const q = o.g.position, rx = q.x - p.x, rz = q.z - p.z, dist = hyp(rx, rz);
      if (dist > range || dist < 1e-4) continue;
      if ((rx * ux + rz * uz) / dist < 0.2) continue;
      const w = (range - dist) / range, cross = ux * rz - uz * rx, side = Math.abs(cross) < 0.12 ? 1 : (cross > 0 ? -1 : 1);
      sx += -uz * side * w * k; sz += ux * side * w * k;
    }
    for (let k = 0; k < boxes.length; k++) {
      const q = nearestOn(boxes[k], p.x, p.z), rx = q[0] - p.x, rz = q[1] - p.z, dist = hyp(rx, rz);
      if (dist > 1.3 || dist < 1e-4) continue;
      if ((rx * ux + rz * uz) / dist < 0.2) continue;
      const w = (1.3 - dist) / 1.3, cross = ux * rz - uz * rx, side = Math.abs(cross) < 0.1 ? 1 : (cross > 0 ? -1 : 1);
      sx += -uz * side * w * 1.6; sz += ux * side * w * 1.6;
    }
    const nx = ux + sx, nz = uz + sz, n = hyp(nx, nz) || 1;
    return [nx / n, nz / n];
  }
  // Advance o toward its first waypoint. Sets o.heading (radians) while walking. Returns true if walking.
  function move(o, speed, dt, list) {
    if (o.dodge > 0) o.dodge -= dt;
    if (o.stall > 0) { o.stall -= dt; return false; }
    if (!o.wp.length) return false;
    const p = o.g.position, t = o.wp[0], dx = t.x - p.x, dz = t.z - p.z, d = hyp(dx, dz);
    if (d < 0.08) { p.x = t.x; p.z = t.z; o.wp.shift(); o.tryT = null; o.dirx = undefined; return false; }
    // Stuck protocol: an attempt that makes no progress for ~1.2 s counts as a failure; after 3 failures give up.
    if (o.tryT !== t) { o.tryT = t; o.bestD = d; o.stuckT = 0; o.fails = 0; }
    else if (d < o.bestD - 0.1) { o.bestD = d; o.stuckT = 0; }
    else if ((o.stuckT += dt) > 1.2) {
      o.stuckT = 0; o.bestD = d;
      if (++o.fails >= 3) { o.fails = 0; o.tryT = null; if (o.onStuck) o.onStuck(o); else o.wp.shift(); return false; }
      o.dodge = 1.5;
    }
    let ux = dx / d, uz = dz / d;
    if (list) { const v = avoid(o, list, ux, uz, d); ux = v[0]; uz = v[1]; }
    if (o.dirx !== undefined && d > 0.5) { const k = Math.min(1, dt * 6); ux = o.dirx + (ux - o.dirx) * k; uz = o.dirz + (uz - o.dirz) * k; const n = hyp(ux, uz) || 1; ux /= n; uz /= n; }
    o.dirx = ux; o.dirz = uz;
    const s = Math.min(d, speed * dt); p.x += ux * s; p.z += uz * s; o.heading = Math.atan2(ux, uz);
    return true;
  }
  // Push overlapping people apart. Walkers give way; people standing still hold their ground.
  function separate(list, min, onBump) {
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j], pa = a.g.position, pb = b.g.position;
      const need = a.r !== undefined && b.r !== undefined ? a.r + b.r : min;
      let dx = pb.x - pa.x, dz = pb.z - pa.z, dist = hyp(dx, dz);
      if (dist >= need) continue;
      if (dist < 1e-4) { dx = 1; dz = 0; dist = 1; }
      const ma = isMover(a), mb = isMover(b);
      let wa = ma && mb ? 0.5 : ma ? 1 : mb ? 0 : 0.5;
      if (a.pusher && !b.pusher) wa = 0.1; else if (b.pusher && !a.pusher) wa = 0.9;
      const wb = 1 - wa;
      const ov = need - (dist === 1 && dx === 1 ? 0 : dist), ux = dx / dist, uz = dz / dist;
      pa.x -= ux * ov * wa; pa.z -= uz * ov * wa; pb.x += ux * ov * wb; pb.z += uz * ov * wb;
      if (ov > 0.01 && (ma || mb) && onBump) onBump(a, b);
    }
  }
  return { avoid, move, separate, isMover, setBoxes, pushOut, clearance };
})();
if (typeof module !== 'undefined') module.exports = Crowd;
