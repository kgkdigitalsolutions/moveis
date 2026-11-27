-- Execute no SQL Editor do Supabase (1º schema.sql, 2º seed.sql)
create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  dims text default '',
  colors text[] default '{}',
  description text default '',
  images text[] default '{}',
  price numeric(12,2),            -- null = "sob consulta"
  stock integer,                  -- null = sem controle
  featured boolean default false,
  active boolean default true,
  catalog_page integer,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity,
  created_at timestamptz default now(),
  customer_name text not null,
  phone text not null,
  address text default '',
  notes text default '',
  items jsonb not null,
  total numeric(12,2) default 0,
  status text not null default 'novo'
    check (status in ('novo','confirmado','em_separacao','entregue','cancelado'))
);

alter table public.products enable row level security;
alter table public.orders enable row level security;

-- Leitura pública apenas de produtos ativos. Pedidos: somente via API (service role).
drop policy if exists "produtos_publicos" on public.products;
create policy "produtos_publicos" on public.products for select using (active = true);
