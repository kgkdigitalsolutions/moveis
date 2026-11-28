const crypto = require('crypto');

const cleanEnv = (v) => String(v || '').trim().replace(/^["']|["']$/g, '');

async function sb(path, { method = 'GET', body } = {}) {
  const rawUrl = cleanEnv(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, '');
  const U = rawUrl && !/^https?:\/\//i.test(rawUrl) ? `https://${rawUrl}` : rawUrl;
  const K = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY);
  if (!U || !K) throw new Error('Variáveis SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes');

  const headers = {
    apikey: K,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
  // Legacy JWT keys (service_role / anon) use Bearer; new sb_secret_ / sb_publishable_ keys fail with Bearer.
  if (K.split('.').length === 3) {
    headers.Authorization = `Bearer ${K}`;
  }

  const r = await fetch(`${U}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) {
    let msg = t || r.statusText;
    try {
      const j = JSON.parse(t);
      msg = j.message || j.error_description || j.error || msg;
    } catch (_) {}
    throw new Error(`Supabase (${r.status}): ${msg}`);
  }
  return t ? JSON.parse(t) : null;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }
  if (Buffer.isBuffer(req.body)) {
    try { return JSON.parse(req.body.toString('utf8')); } catch (_) { return {}; }
  }
  if (!req.readable) return {};
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try { return JSON.parse(raw); } catch (_) { return {}; }
}

const sign = (v) => crypto.createHmac('sha256', cleanEnv(process.env.SESSION_SECRET) || 'dev').update(v).digest('hex');

function makeToken() {
  const exp = String(Date.now() + 12 * 3600e3);
  return `${exp}.${sign(exp)}`;
}

function isAdmin(req) {
  const m = /(?:^|;\s*)adm=([^;]+)/.exec(req.headers.cookie || '');
  if (!m) return false;
  const [exp, sig] = m[1].split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const a = Buffer.from(sig), b = Buffer.from(sign(exp));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const isHttps = (req) =>
  req.headers['x-forwarded-proto'] === 'https' || Boolean(req.socket && req.socket.encrypted);

const send = (res, code, data) => {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
};

module.exports = { sb, readBody, makeToken, isAdmin, isHttps, send };
