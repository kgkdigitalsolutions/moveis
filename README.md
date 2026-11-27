# Loja de Móveis — Vercel + Supabase

Vitrine, carrinho, pedidos (com envio por WhatsApp) e painel administrativo. Sem build e sem dependências npm.
421 produtos do catálogo de maio/2026 já estão no `supabase/seed.sql`, com fotos em `public/img`.

## 1. Supabase
1. Crie um projeto em supabase.com.
2. No **SQL Editor**, execute `supabase/schema.sql` e depois `supabase/seed.sql`.
3. Em **Project Settings → API**, copie a *Project URL* e a chave **service_role**.

## 2. Vercel
1. Suba esta pasta para um repositório GitHub (ou use `vercel` na pasta) e importe o projeto. *Framework Preset: Other*.
2. Em **Settings → Environment Variables**, cadastre (veja `.env.example`):
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `STORE_NAME`, `WHATSAPP_NUMBER` (só dígitos, com 55 + DDD).
3. Faça o deploy.

## 3. Uso
- Loja: `/` · Painel: `/admin` (senha = `ADMIN_PASSWORD`).
- O catálogo não tinha preços: todos os itens aparecem como **Sob consulta**. Defina preço, estoque, destaque e ativo no painel.
- Os pedidos ficam na tabela `orders`; o total é recalculado no servidor com os preços do banco.
- A chave `service_role` só é usada nas funções em `/api` (nunca vai ao navegador).
