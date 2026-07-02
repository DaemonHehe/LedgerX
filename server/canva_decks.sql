create extension if not exists pgcrypto;

create table if not exists public.canva_decks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text,
  background text default '#ffffff',
  elements jsonb not null default '[]'::jsonb,
  -- Owner of the deck (Supabase auth user). Nullable for back-compat with
  -- pre-existing rows; scoped in code by the Express requireAuth middleware.
  user_id uuid references auth.users (id) on delete set null
);

create index if not exists canva_decks_user_id_idx on public.canva_decks (user_id);
