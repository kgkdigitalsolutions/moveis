const { makeToken, isAdmin, send } = require('../lib/sb');
module.exports = (req, res) => {
  if (req.method === 'GET') return send(res, 200, { admin: isAdmin(req) });
  if (req.method === 'DELETE') { res.setHeader('Set-Cookie', 'adm=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict'); return send(res, 200, { ok: true }); }
  const pw = process.env.ADMIN_PASSWORD;
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido' });
  if (!pw || !req.body || req.body.password !== pw) return send(res, 401, { error: 'Senha incorreta' });
  res.setHeader('Set-Cookie', `adm=${makeToken()}; Path=/; Max-Age=43200; HttpOnly; Secure; SameSite=Strict`);
  send(res, 200, { ok: true });
};
