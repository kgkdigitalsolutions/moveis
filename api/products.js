const { sb, readBody, isAdmin, send } = require('../lib/sb');
const COLS = 'id,slug,name,category,dims,colors,description,images,price,stock,featured,active';

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const qAll = req.query ? req.query.all : new URL(req.url, 'http://localhost').searchParams.get('all');
      const adm = qAll === '1' && isAdmin(req);
      const rows = await sb(`products?select=${COLS}${adm ? '' : '&active=eq.true'}&order=category,name&limit=2000`);
      if (adm) {
        res.setHeader('Cache-Control', 'no-store');
      } else {
        res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
      }
      return send(res, 200, rows);
    }
    if (req.method === 'PATCH') {
      if (!isAdmin(req)) return send(res, 401, { error: 'Não autorizado' });
      const { id, ...f } = await readBody(req);
      const ok = {};
      if ('price' in f) ok.price = f.price === '' || f.price === null ? null : Number(f.price);
      if ('stock' in f) ok.stock = f.stock === '' || f.stock === null ? null : parseInt(f.stock, 10);
      for (const k of ['name', 'description', 'dims']) if (k in f) ok[k] = String(f[k]).slice(0, 600);
      for (const k of ['featured', 'active']) if (k in f) ok[k] = !!f[k];
      if ('images' in f && Array.isArray(f.images)) ok.images = f.images.map(String).slice(0, 8);
      if (!id || !Object.keys(ok).length) return send(res, 400, { error: 'Dados inválidos' });
      if (('price' in ok && ok.price !== null && !(ok.price >= 0)) || ('stock' in ok && ok.stock !== null && !(ok.stock >= 0))) return send(res, 400, { error: 'Valor inválido' });
      const r = await sb(`products?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: ok });
      return send(res, 200, r[0] || {});
    }
    send(res, 405, { error: 'Método não permitido' });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    send(res, 500, { error: String(e.message || e) });
  }
};
