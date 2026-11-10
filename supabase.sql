-- Apply once in Supabase SQL Editor. Service-role writes happen in server-side API only.
create table if not exists public.early_access_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role text not null,
  interest text,
  created_at timestamptz not null default now()
);

alter table public.early_access_leads enable row level security;
-- No client-side policies: inserts only through server-side endpoint with service role.
