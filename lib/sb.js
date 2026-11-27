const crypto = require('crypto');
async function sb(path, { method = 'GET', body } = {}) {
  const U = process.env.SUPABASE_URL, K = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!U || !K) throw new Error('Variáveis SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes');
  const r = await fetch(`${U}/rest/v1/${path}`, {
    method,
    headers: { apikey: K, Authorization: `Bearer ${K}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(t || r.statusText);
  return t ? JSON.parse(t) : null;
}
const sign = (v) => crypto.createHmac('sha256', process.env.SESSION_SECRET || 'dev').update(v).digest('hex');
function makeToken() { const exp = String(Date.now() + 12 * 3600e3); return `${exp}.${sign(exp)}`; }
function isAdmin(req) {
  const m = /(?:^|;\s*)adm=([^;]+)/.exec(req.headers.cookie || '');
  if (!m) return false;
  const [exp, sig] = m[1].split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const a = Buffer.from(sig), b = Buffer.from(sign(exp));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const send = (res, code, data) => { res.status(code).setHeader('Content-Type', 'application/json'); res.send(JSON.stringify(data)); };
module.exports = { sb, makeToken, isAdmin, send };
