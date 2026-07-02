-- 001_user_scoping.sql
-- Scope receipts + canva decks to the authenticated owner.
-- Run once in the Supabase SQL editor (or psql) after enabling Email auth.
--
-- Notes:
--   • user_id is nullable so pre-existing rows survive; they simply become
--     ownerless and invisible once every query filters by user_id.
--   • No RLS: the Express server uses the service-role key (which bypasses RLS)
--     and enforces per-user scoping in code. Add RLS later as defense-in-depth.
--   • auth.users is the Supabase managed users table; referencing it gives us
--     referential integrity (no orphan owners).

-- Ensure the pgcrypto extension is available (gen_random_uuid in fresh schemas).
create extension if not exists pgcrypto;

alter table public.receipts
  add column if not exists user_id uuid references auth.users (id) on delete set null;

alter table public.canva_decks
  add column if not exists user_id uuid references auth.users (id) on delete set null;

-- Speed up per-user list queries (every dashboard/deck-list call filters by owner).
create index if not exists receipts_user_id_idx on public.receipts (user_id);
create index if not exists canva_decks_user_id_idx on public.canva_decks (user_id);
