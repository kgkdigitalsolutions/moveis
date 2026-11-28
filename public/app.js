const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
let P = [], cat = 'Lançamentos', term = '', cfg = { store: 'Móveis', whatsapp: '' };
let cart = []; try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); } catch (e) { cart = []; }
const save = () => { try { localStorage.setItem('cart', JSON.stringify(cart)); } catch (e) {} $('#cc').textContent = cart.reduce((a, i) => a + i.qty, 0); };
const img = (p) => (p.images && p.images[0]) || '';
const priceHtml = (p) => p.price != null ? `<div class="price">${money(p.price)}</div>` : `<div class="price q">Sob consulta</div>`;

function rail() {
  const cats = ['Lançamentos', 'Todos', ...[...new Set(P.map((p) => p.category))]];
  $('#rail').innerHTML = cats.map((c, i) => `<button class="${c === cat ? 'on' : ''}" data-c="${esc(c)}"><b>${String(i).padStart(2, '0')}</b><span>${esc(c)}</span></button>`).join('');
}
function list() {
  const t = term.toLowerCase();
  let L = P.filter((p) => cat === 'Todos' || (cat === 'Lançamentos' ? p.featured : p.category === cat));
  if (t) L = P.filter((p) => (p.name + ' ' + p.category + ' ' + (p.colors || []).join(' ') + ' ' + (p.dims || '')).toLowerCase().includes(t));
  $('#grid').innerHTML = L.length ? L.map((p) => `<button class="card" data-id="${p.id}"><div class="ph">${p.featured ? '<span class="tag">Lançamento</span>' : ''}${img(p) ? `<img loading="lazy" src="${esc(img(p))}" alt="${esc(p.name)}">` : ''}</div><span class="mono">${esc(p.category)}</span><h3 class="serif">${esc(p.name)}</h3>${priceHtml(p)}</button>`).join('') : '<div class="empty serif">Nenhum móvel encontrado.</div>';
}
function open(id) {
  const p = P.find((x) => x.id === id); if (!p) return;
  let color = (p.colors || [])[0] || '', qty = 1;
  const d = $('#pd');
  const draw = () => {
    d.innerHTML = `<button class="x" id="cl">×</button><div class="pd"><div class="gal"><img id="big" src="${esc(img(p))}" alt="">${(p.images || []).length > 1 ? `<div class="th">${p.images.map((s) => `<img src="${esc(s)}" data-s="${esc(s)}" alt="">`).join('')}</div>` : ''}</div>
    <div class="info"><span class="mono">${esc(p.category)}</span><h2>${esc(p.name)}</h2>${priceHtml(p)}
    ${p.dims ? `<div><span class="mono">Medidas</span><div>${esc(p.dims)}</div></div>` : ''}
    ${(p.colors || []).length ? `<div><span class="mono">Cor / acabamento</span><div class="chips">${p.colors.map((c) => `<button class="${c === color ? 'on' : ''}" data-col="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>` : ''}
    ${p.description ? `<p style="color:var(--mute);margin:0">${esc(p.description)}</p>` : ''}
    ${p.stock === 0 ? '<b>Indisponível no momento</b>' : `<div style="display:flex;gap:12px;align-items:center;margin-top:auto"><div class="qty"><button data-q="-1">−</button><span>${qty}</span><button data-q="1">+</button></div><button class="btn" id="add" style="flex:1">Adicionar ao pedido</button></div>`}</div></div>`;
  };
  draw(); d.showModal();
  d.onclick = (e) => {
    const t = e.target;
    if (t.id === 'cl' || t === d) return d.close();
    if (t.dataset.s) $('#big').src = t.dataset.s;
    if (t.dataset.col) { color = t.dataset.col; draw(); }
    if (t.dataset.q) { qty = Math.min(99, Math.max(1, qty + Number(t.dataset.q))); draw(); }
    if (t.id === 'add') {
      const k = cart.find((i) => i.id === p.id && i.color === color);
      k ? (k.qty += qty) : cart.push({ id: p.id, color, qty }); save(); d.close(); showCart();
    }
  };
}
function showCart(done) {
  const d = $('#cart'); let tot = 0, some = false;
  const rows = cart.map((it, n) => { const p = P.find((x) => x.id === it.id); if (!p) return ''; if (p.price != null) tot += p.price * it.qty; else some = true;
    return `<div class="row"><img src="${esc(img(p))}" alt=""><div><b>${esc(p.name)}</b><div class="mono">${esc(it.color)}</div><div class="qty" style="margin-top:4px"><button data-n="${n}" data-d="-1">−</button><span>${it.qty}</span><button data-n="${n}" data-d="1">+</button></div></div><button class="x" style="position:static" data-r="${n}">×</button></div>`; }).join('');
  d.innerHTML = `<div class="in"><div style="display:flex;justify-content:space-between"><h2 class="serif" style="margin:0">Seu pedido</h2><button class="x" style="position:static" id="cc2">×</button></div>
  ${done ? `<p class="serif" style="font-size:22px">Pedido nº ${esc(done.number)} registrado.</p><p>Envie agora pelo WhatsApp para agilizar o atendimento.</p>${cfg.whatsapp ? `<a class="btn" style="text-align:center;text-decoration:none" href="${esc(done.wa)}" target="_blank" rel="noopener">Enviar pelo WhatsApp</a>` : ''}` :
  !cart.length ? '<p class="empty">Seu pedido está vazio.</p>' : `${rows}<div style="display:flex;justify-content:space-between"><span>Total dos itens com preço</span><b>${money(tot)}</b></div>${some ? '<div class="mono">Itens “sob consulta” serão orçados pela loja.</div>' : ''}
  <div><label>Nome</label><input id="fn"></div><div><label>Telefone / WhatsApp (com DDD)</label><input id="fp" inputmode="tel"></div><div><label>Endereço de entrega</label><input id="fa"></div><div><label>Observações</label><textarea id="fo" rows="2"></textarea></div>
  <div id="err" style="color:var(--acc)"></div><button class="btn" id="send">Finalizar pedido</button>`}</div>`;
  if (!d.open) d.showModal();
  d.onclick = async (e) => {
    const t = e.target;
    if (t === d || t.id === 'cc2') return d.close();
    if (t.dataset.r) { cart.splice(+t.dataset.r, 1); save(); showCart(); }
    if (t.dataset.d) { const i = cart[+t.dataset.n]; i.qty = Math.min(99, Math.max(1, i.qty + +t.dataset.d)); save(); showCart(); }
    if (t.id === 'send') {
      t.disabled = true;
      try {
        const body = { name: $('#fn').value, phone: $('#fp').value, address: $('#fa').value, notes: $('#fo').value, items: cart };
        const r = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Erro ao enviar');
        const lines = cart.map((i) => { const p = P.find((x) => x.id === i.id); return `• ${i.qty}x ${p ? p.name : ''}${i.color ? ' (' + i.color + ')' : ''}`; });
        const msg = `Olá! Pedido nº ${j.number} - ${body.name}\n${lines.join('\n')}${j.total ? '\nTotal: ' + money(j.total) : ''}`;
        cart = []; save(); showCart({ number: j.number, wa: `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(msg)}` });
      } catch (er) { $('#err').textContent = er.message; t.disabled = false; }
    }
  };
}
document.addEventListener('click', (e) => {
  const c = e.target.closest('[data-c]'); if (c) { cat = c.dataset.c; term = ''; $('#q').value = ''; rail(); list(); }
  const k = e.target.closest('.card'); if (k) open(k.dataset.id);
});
$('#q').addEventListener('input', (e) => { term = e.target.value; list(); });
$('#cartBtn').onclick = () => showCart();
async function loadCatalog() {
  $('#grid').innerHTML = '<div class="empty serif">Carregando catálogo…</div>';
  try {
    const r = await fetch('/api/products');
    const txt = await r.text();
    let data = null;
    try { data = JSON.parse(txt); } catch (_) {}
    if (!r.ok || !Array.isArray(data)) {
      throw new Error((data && (data.error || data.message)) || `Erro HTTP ${r.status}`);
    }
    P = data;
  } catch (e) {
    $('#grid').innerHTML = `<div class="empty"><div class="serif">Não foi possível carregar o catálogo.</div><div class="mono" style="margin-top:8px">${esc(e.message || 'Erro de conexão')}</div><button class="btn ghost" id="retryCat" style="margin-top:14px">Tentar novamente</button></div>`;
    const btn = $('#retryCat'); if (btn) btn.onclick = loadCatalog;
    return;
  }
  if (!P.some((p) => p.featured)) cat = 'Todos';
  rail(); list();
}
(async () => {
  save();
  try { cfg = await (await fetch('/api/config')).json(); document.title = cfg.store; $('#brand').textContent = cfg.store; $('#fs').textContent = '© ' + new Date().getFullYear() + ' ' + cfg.store; } catch (e) {}
  await loadCatalog();
})();
