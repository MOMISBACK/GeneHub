-- GeneHub Bacteria (MVP) schema
-- Apply in Supabase SQL editor.

-- Enable required extensions
create extension if not exists "pgcrypto";

-- Cache table (optional for the client, useful for future)
create table if not exists public.genes (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  organism text not null,
  summary text,
  source text,
  updated_at timestamptz not null default now(),
  unique(symbol, organism)
);

-- Private notes per user per gene
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  organism text not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, symbol, organism)
);

-- Simple "view history" per user (one entry per gene, updated on revisit)
create table if not exists public.gene_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  organism text not null,
  summary text,
  accessed_at timestamptz not null default now(),
  unique(user_id, symbol, organism)
);

-- Keep updated_at current
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_notes_updated_at on public.notes;
create trigger trg_notes_updated_at
before update on public.notes
for each row execute function public.set_updated_at();

-- RLS
alter table public.genes enable row level security;
alter table public.notes enable row level security;
alter table public.gene_views enable row level security;

-- genes: readable by anyone logged-in; writable only by service role (no policy needed for inserts)
-- Minimal: allow select to authenticated users.
drop policy if exists "genes_select_authenticated" on public.genes;
create policy "genes_select_authenticated"
on public.genes
for select
to authenticated
using (true);

-- notes: only owner
drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own"
on public.notes
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own"
on public.notes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own"
on public.notes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- gene_views: only owner
drop policy if exists "gene_views_select_own" on public.gene_views;
create policy "gene_views_select_own"
on public.gene_views
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "gene_views_insert_own" on public.gene_views;
create policy "gene_views_insert_own"
on public.gene_views
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "gene_views_update_own" on public.gene_views;
create policy "gene_views_update_own"
on public.gene_views
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "gene_views_delete_own" on public.gene_views;
create policy "gene_views_delete_own"
on public.gene_views
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own"
on public.notes
for delete
to authenticated
using (auth.uid() = user_id);
