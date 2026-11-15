/* Online bits (question flags and the leaderboard) without any login.
   Backend: a Supabase project, reached through its REST API with plain fetch. No library, no accounts.
   Fill RX_NET with the project URL and the anon public key (Supabase: Project Settings > API). Both are meant to be
   public; the SQL in net/supabase.sql sets the row rules. Empty values keep everything offline and the game hides the online bits.
   For local testing a JSON object in localStorage.rxNet ({"url":..., "key":...}) overrides this block. */
const RX_NET = { url: 'https://crzgekhluqnyzeuhffib.supabase.co', key: 'sb_publishable_n7RddvbU4qGIZc3oGyHMcQ_FEMkQNqi' };

const Net = (function () {
  const cfg = () => { try { const o = JSON.parse(localStorage.getItem('rxNet') || 'null'); if (o && o.off) return { url: '', key: '' }; if (o && o.url && o.key) return o; } catch (e) { /* ignore */ } return RX_NET; };
  const on = () => { const c = cfg(); return !!(c.url && c.key); };
  /* newer sb_publishable_ keys are not JWTs: send them as apikey only. Older anon keys (eyJ...) also go in Authorization. */
  const headers = (extra) => { const c = cfg(), h = { apikey: c.key, 'Content-Type': 'application/json' }; if (/^eyJ/.test(c.key)) h.Authorization = 'Bearer ' + c.key; return Object.assign(h, extra || {}); };
  async function req(path, opts) {
    const c = cfg(); if (!c.url) throw new Error('offline');
    const r = await fetch(c.url.replace(/\/(rest\/v1\/?)?$/, '') + '/rest/v1/' + path, Object.assign({ headers: headers(opts && opts.headers) }, opts || {}, { headers: headers(opts && opts.headers) }));
    if (!r.ok) { let t = ''; try { t = await r.text(); } catch (e) { /* ignore */ } throw new Error('HTTP ' + r.status + ' ' + t.slice(0, 200)); }
    const txt = await r.text(); return txt ? JSON.parse(txt) : null;
  }
  const insert = (table, row) => req(table, { method: 'POST', body: JSON.stringify(row), headers: { Prefer: 'return=minimal' } });
  const upsert = (table, row, conflict) => req(table + '?on_conflict=' + encodeURIComponent(conflict), { method: 'POST', body: JSON.stringify(row), headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } });
  const select = (table, query) => req(table + '?' + query, { method: 'GET' });
  const rpc = (fn, args) => req('rpc/' + fn, { method: 'POST', body: JSON.stringify(args || {}) });
  /* a random id per browser, so a player can update their own leaderboard row without an account */
  const uuid = () => { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); let s = ''; for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16); return s; };
  const weekKey = (d) => { d = d || new Date(); const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  return { on, req, insert, upsert, select, rpc, uuid, weekKey, cfg };
})();
