-- Run this in Supabase SQL Editor

create table if not exists public.tenders (
  id uuid primary key default gen_random_uuid(),
  prozorro_id text,
  title text not null,
  customer text not null default '—',
  budget numeric,
  currency text not null default 'UAH',
  deadline timestamptz,
  status text check (status in ('interesting', 'preparing', 'submitted', 'won', 'lost', 'archive')),
  items jsonb not null default '[]'::jsonb,
  notes text not null default '',
  prozorro_url text,
  starred boolean not null default false,
  source text not null default 'manual' check (source in ('prozorro', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for common queries
create index if not exists tenders_status_idx on public.tenders (status);
create index if not exists tenders_created_at_idx on public.tenders (created_at desc);
create index if not exists tenders_prozorro_id_idx on public.tenders (prozorro_id);

-- Enable RLS (Row Level Security)
alter table public.tenders enable row level security;

-- For personal use we allow all operations with the anon key.
-- Later you can add auth and restrict by user_id.
create policy "Allow all for anon" on public.tenders
  for all
  using (true)
  with check (true);
