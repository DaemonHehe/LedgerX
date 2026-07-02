create extension if not exists pgcrypto;

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text,
  customer_address text,
  date text,
  total_quantity numeric default 0,
  grand_total numeric default 0,
  items jsonb not null default '[]'::jsonb,
  user_id uuid references auth.users (id) on delete set null
);

create index if not exists receipts_user_id_idx on public.receipts (user_id);
