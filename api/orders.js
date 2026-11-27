const { sb, isAdmin, send } = require('../lib/sb');
const STATUS = ['novo', 'confirmado', 'em_separacao', 'entregue', 'cancelado'];
module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const b = req.body || {};
      const name = String(b.name || '').trim(), phone = String(b.phone || '').replace(/\D/g, '');
      if (name.length < 2 || phone.length < 10) return send(res, 400, { error: 'Informe nome e telefone com DDD' });
      if (!Array.isArray(b.items) || !b.items.length || b.items.length > 50) return send(res, 400, { error: 'Carrinho vazio' });
      const ids = [...new Set(b.items.map((i) => String(i.id)))];
      if (ids.some((i) => !/^[0-9a-f-]{36}$/i.test(i))) return send(res, 400, { error: 'Item inválido' });
      const prods = await sb(`products?select=id,name,price&active=eq.true&id=in.(${ids.join(',')})`);
      const map = Object.fromEntries(prods.map((p) => [p.id, p]));
      const items = [];
      let total = 0;
      for (const i of b.items) {
        const p = map[i.id], qty = Math.min(99, Math.max(1, parseInt(i.qty, 10) || 1));
        if (!p) return send(res, 400, { error: 'Produto indisponível no carrinho' });
        items.push({ id: p.id, name: p.name, color: String(i.color || '').slice(0, 80), qty, price: p.price });
        if (p.price != null) total += Number(p.price) * qty;
      }
      const [o] = await sb('orders', { method: 'POST', body: {
        customer_name: name.slice(0, 120), phone, address: String(b.address || '').slice(0, 300),
        notes: String(b.notes || '').slice(0, 500), items, total } });
      return send(res, 201, { id: o.id, number: o.number, total });
    }
    if (!isAdmin(req)) return send(res, 401, { error: 'Não autorizado' });
    if (req.method === 'GET') return send(res, 200, await sb('orders?select=*&order=created_at.desc&limit=200'));
    if (req.method === 'PATCH') {
      const { id, status } = req.body || {};
      if (!id || !STATUS.includes(status)) return send(res, 400, { error: 'Dados inválidos' });
      const r = await sb(`orders?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: { status } });
      return send(res, 200, r[0] || {});
    }
    send(res, 405, { error: 'Método não permitido' });
  } catch (e) { send(res, 500, { error: String(e.message || e) }); }
};
