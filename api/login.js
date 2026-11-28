const { readBody, makeToken, isAdmin, isHttps, send } = require('../lib/sb');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const sec = isHttps(req) ? '; Secure' : '';

  if (req.method === 'GET') return send(res, 200, { admin: isAdmin(req) });
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', `adm=; Path=/; Max-Age=0; HttpOnly${sec}; SameSite=Lax`);
    return send(res, 200, { ok: true });
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido' });

  const pw = (process.env.ADMIN_PASSWORD || '').replace(/[\r\n]+$/, '');
  if (!pw) return send(res, 500, { error: 'Variável ADMIN_PASSWORD não configurada no servidor' });

  const body = await readBody(req);
  if (!body || typeof body.password !== 'string' || body.password !== pw) {
    return send(res, 401, { error: 'Senha incorreta' });
  }

  res.setHeader('Set-Cookie', `adm=${makeToken()}; Path=/; Max-Age=43200; HttpOnly${sec}; SameSite=Lax`);
  send(res, 200, { ok: true });
};
