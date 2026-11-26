-- Esquema Mini-CRM Operativo (Totalum Flow) para Supabase Postgres
-- Ejecutar una vez en Supabase > SQL Editor

create extension if not exists "pgcrypto";

create table if not exists public.crm_clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  company text not null default '',
  email text not null default '',
  phone text not null default '',
  segment text not null default 'pyme' check (segment in ('enterprise', 'pyme', 'startup')),
  created_at timestamptz not null default now()
);

create table if not exists public.crm_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid references public.crm_clients(id) on delete set null,
  title text not null check (char_length(trim(title)) > 0),
  description text not null default '',
  status text not null default 'pendiente' check (status in ('pendiente', 'en_progreso', 'completado')),
  priority text not null default 'media' check (priority in ('baja', 'media', 'alta')),
  amount_eur numeric(12,2) not null default 0 check (amount_eur >= 0),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_clients_user on public.crm_clients(user_id, created_at desc);
create index if not exists idx_crm_tasks_user on public.crm_tasks(user_id, status, created_at desc);

alter table public.crm_clients enable row level security;
alter table public.crm_tasks enable row level security;

drop policy if exists "crm_clients_owner_all" on public.crm_clients;
create policy "crm_clients_owner_all"
  on public.crm_clients
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "crm_tasks_owner_all" on public.crm_tasks;
create policy "crm_tasks_owner_all"
  on public.crm_tasks
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
