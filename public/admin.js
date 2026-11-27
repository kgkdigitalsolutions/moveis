const $ = (s) => document.querySelector(s), A = $('#app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const api = async (u, o = {}) => { const r = await fetch(u, { ...o, headers: { 'Content-Type': 'application/json' }, body: o.body ? JSON.stringify(o.body) : undefined }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Erro'); return j; };
let tab = 'p', prods = [], orders = [], f = '';
const ST = { novo: 'Novo', confirmado: 'Confirmado', em_separacao: 'Em separação', entregue: 'Entregue', cancelado: 'Cancelado' };

function login(msg) {
  $('#out').hidden = true;
  A.innerHTML = `<div style="max-width:340px;margin:80px auto"><h2 class="serif" style="font-size:34px">Acesso restrito</h2><label>Senha</label><input id="pw" type="password"><div style="color:var(--acc);margin:8px 0">${esc(msg || '')}</div><button class="btn" id="go">Entrar</button></div>`;
  const go = async () => { try { await api('/api/login', { method: 'POST', body: { password: $('#pw').value } }); start(); } catch (e) { login(e.message); } };
  $('#go').onclick = go; $('#pw').onkeydown = (e) => e.key === 'Enter' && go();
}
async function start() {
  try { if (!(await api('/api/login')).admin) return login(); } catch (e) { return login(); }
  $('#out').hidden = false;
  try { [prods, orders] = await Promise.all([api('/api/products?all=1'), api('/api/orders')]); } catch (e) { A.innerHTML = `<p style="color:var(--acc)">${esc(e.message)}</p>`; return; }
  draw();
}
function draw() {
  const t = f.toLowerCase();
  const L = prods.filter((p) => !t || (p.name + p.category).toLowerCase().includes(t)).slice(0, 80);
  A.innerHTML = `<div class="tabs"><button class="btn ghost ${tab === 'p' ? 'on' : ''}" data-t="p">Produtos (${prods.length})</button><button class="btn ghost ${tab === 'o' ? 'on' : ''}" data-t="o">Pedidos (${orders.length})</button></div>` +
  (tab === 'p' ? `<input id="f" placeholder="Filtrar produtos…" value="${esc(f)}" style="max-width:320px;margin-bottom:12px"><p class="mono">Mostrando até 80 resultados. Preço vazio = “sob consulta”. Estoque vazio = sem controle.</p>
  <table><tr><th>Produto</th><th>Preço (R$)</th><th>Estoque</th><th>Destaque</th><th>Ativo</th><th></th></tr>${L.map((p) => `<tr data-id="${p.id}"><td><b>${esc(p.name)}</b><div class="mono">${esc(p.category)}</div></td><td><input type="number" step="0.01" min="0" data-k="price" value="${p.price ?? ''}"></td><td><input type="number" min="0" data-k="stock" value="${p.stock ?? ''}"></td><td><input type="checkbox" data-k="featured" ${p.featured ? 'checked' : ''} style="width:auto"></td><td><input type="checkbox" data-k="active" ${p.active ? 'checked' : ''} style="width:auto"></td><td><button class="btn" data-save>Salvar</button> <span class="ok"></span></td></tr>`).join('')}</table>` :
  `<table><tr><th>Nº</th><th>Data</th><th>Cliente</th><th>Itens</th><th>Total</th><th>Status</th></tr>${orders.map((o) => `<tr><td>${o.number}</td><td>${new Date(o.created_at).toLocaleString('pt-BR')}</td><td><b>${esc(o.customer_name)}</b><div class="mono">${esc(o.phone)}</div><div>${esc(o.address)}</div>${o.notes ? `<div class="mono">${esc(o.notes)}</div>` : ''}</td><td>${o.items.map((i) => `${i.qty}x ${esc(i.name)}${i.color ? ' <span class="mono">' + esc(i.color) + '</span>' : ''}`).join('<br>')}</td><td>${money(o.total)}</td><td><select data-o="${o.id}">${Object.entries(ST).map(([k, v]) => `<option value="${k}" ${k === o.status ? 'selected' : ''}>${v}</option>`).join('')}</select></td></tr>`).join('') || '<tr><td colspan="6">Nenhum pedido ainda.</td></tr>'}</table>`);
}
A.addEventListener('click', async (e) => {
  const t = e.target;
  if (t.dataset.t) { tab = t.dataset.t; draw(); }
  if (t.dataset.save !== undefined) {
    const tr = t.closest('tr'), id = tr.dataset.id, g = (k) => tr.querySelector(`[data-k=${k}]`);
    const body = { id, price: g('price').value, stock: g('stock').value, featured: g('featured').checked, active: g('active').checked };
    try { const r = await api('/api/products', { method: 'PATCH', body }); Object.assign(prods.find((p) => p.id === id), r); tr.querySelector('.ok').textContent = 'Salvo ✓'; } catch (er) { tr.querySelector('.ok').textContent = er.message; }
  }
});
A.addEventListener('change', async (e) => {
  const o = e.target.dataset.o; if (!o) return;
  try { await api('/api/orders', { method: 'PATCH', body: { id: o, status: e.target.value } }); } catch (er) { alert(er.message); }
});
A.addEventListener('input', (e) => { if (e.target.id === 'f') { f = e.target.value; const p = e.target.selectionStart; draw(); const i = $('#f'); i.focus(); i.setSelectionRange(p, p); } });
$('#out').onclick = async () => { await api('/api/login', { method: 'DELETE' }); login(); };
start();
