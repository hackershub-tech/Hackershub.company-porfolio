-- Run this once in Supabase SQL Editor.
create table if not exists public.project_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  project_type text not null,
  message text not null,
  source text default 'website',
  created_at timestamptz not null default now()
);

alter table public.project_leads enable row level security;

drop policy if exists "Anyone can submit project leads" on public.project_leads;
create policy "Anyone can submit project leads"
  on public.project_leads
  for insert
  to anon, authenticated
  with check (
    length(trim(name)) between 2 and 120
    and length(trim(email)) between 5 and 254
    and length(trim(message)) between 10 and 5000
  );
