-- STrack database schema. Run this once in the Supabase SQL editor.
-- Every table is owned per user (user_id defaults to the logged in user) and
-- protected by Row Level Security so people can only touch their own rows.
--
-- Note on shape: sessions store their items and method label denormalized
-- (subject name + sector id kept on the row) so old history never breaks when a
-- subject or method is later renamed or removed. The sectors, subjects, and
-- methods tables still drive the pickers and full CRUD.

create table if not exists public.sectors (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  color text not null default '#5C7FB0',
  goal_hours numeric not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  sector_id text not null references public.sectors (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.methods (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date timestamptz not null,
  total_min int not null default 0,
  method text default '',
  notes text default '',
  items jsonb not null default '[]'::jsonb, -- [{ subject, catId, minutes }]
  created_at timestamptz not null default now()
);

create table if not exists public.custom_plans (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  sector_id text,
  title text not null,
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.trash (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  payload jsonb not null, -- the full deleted session
  deleted_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.sectors enable row level security;
alter table public.subjects enable row level security;
alter table public.methods enable row level security;
alter table public.sessions enable row level security;
alter table public.custom_plans enable row level security;
alter table public.trash enable row level security;
alter table public.app_settings enable row level security;

-- Owner-only access (select, insert, update, delete) for each table.
create policy "own rows" on public.sectors
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.subjects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.methods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.custom_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.trash
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.app_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists sectors_user_idx on public.sectors (user_id);
create index if not exists subjects_user_idx on public.subjects (user_id);
create index if not exists subjects_sector_idx on public.subjects (sector_id);
create index if not exists methods_user_idx on public.methods (user_id);
create index if not exists sessions_user_idx on public.sessions (user_id);
create index if not exists custom_plans_user_idx on public.custom_plans (user_id);
create index if not exists trash_user_idx on public.trash (user_id);
