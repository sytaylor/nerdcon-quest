-- NerdCon Quest: Initial Schema
-- Gamified conference app with quests, connections, and nerd numbers

-- ============================================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nerd_number integer unique not null,
  display_name text,
  company text,
  role text,
  bio text,
  looking_for text,
  avatar_url text,
  quest_line text check (quest_line in ('builder', 'operator', 'explorer')),
  xp integer not null default 0,
  level integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 2. NERD NUMBER COUNTER (single-row atomic counter)
-- ============================================================================

create table public.nerd_number_counter (
  id integer primary key default 1 check (id = 1),
  next_number integer not null default 1
);

-- Seed the counter
insert into public.nerd_number_counter (id, next_number) values (1, 1);

-- ============================================================================
-- 3. CONNECTIONS (mutual QR scan connections)
-- ============================================================================

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint connections_ordered check (user_a < user_b),
  constraint connections_unique unique (user_a, user_b)
);

-- ============================================================================
-- 4. QUESTS (quest definitions)
-- ============================================================================

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  xp_reward integer not null default 0,
  quest_type text not null check (quest_type in ('social', 'content', 'explore', 'side')),
  quest_line text check (quest_line in ('builder', 'operator', 'explorer')),
  conditions jsonb not null default '{}',
  sort_order integer not null default 0
);

-- ============================================================================
-- 5. USER QUESTS (quest progress per user)
-- ============================================================================

create table public.user_quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on delete cascade,
  status text not null default 'available' check (status in ('available', 'in_progress', 'completed')),
  progress jsonb not null default '{}',
  completed_at timestamptz,
  unique (user_id, quest_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

create index idx_profiles_nerd_number on public.profiles(nerd_number);
create index idx_profiles_quest_line on public.profiles(quest_line);
create index idx_profiles_xp on public.profiles(xp desc);
create index idx_connections_user_a on public.connections(user_a);
create index idx_connections_user_b on public.connections(user_b);
create index idx_user_quests_user_id on public.user_quests(user_id);
create index idx_user_quests_quest_id on public.user_quests(quest_id);
create index idx_user_quests_status on public.user_quests(user_id, status);

-- ============================================================================
-- FUNCTION: assign_nerd_number()
-- Atomically increments counter and returns the assigned number
-- ============================================================================

create or replace function public.assign_nerd_number()
returns integer
language plpgsql
security definer
as $$
declare
  assigned_number integer;
begin
  update public.nerd_number_counter
  set next_number = next_number + 1
  where id = 1
  returning next_number - 1 into assigned_number;

  return assigned_number;
end;
$$;

-- ============================================================================
-- FUNCTION + TRIGGER: auto-create profile on auth.users insert
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_nerd_number integer;
begin
  new_nerd_number := public.assign_nerd_number();

  insert into public.profiles (id, nerd_number, display_name, avatar_url)
  values (
    new.id,
    new_nerd_number,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================================
-- FUNCTION: auto-update updated_at on profiles
-- ============================================================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Profiles: anyone can read, only owner can update
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Connections: authenticated can read, authenticated can insert
alter table public.connections enable row level security;

create policy "Connections are viewable by authenticated users"
  on public.connections for select
  to authenticated
  using (true);

create policy "Authenticated users can create connections"
  on public.connections for insert
  to authenticated
  with check (auth.uid() = user_a or auth.uid() = user_b);

-- User Quests: owner can read/update, service role can insert
alter table public.user_quests enable row level security;

create policy "Users can view own quests"
  on public.user_quests for select
  using (auth.uid() = user_id);

create policy "Users can update own quests"
  on public.user_quests for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Service role can insert quests"
  on public.user_quests for insert
  to service_role
  with check (true);

create policy "Users can insert own quests"
  on public.user_quests for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Quests: anyone can read definitions
alter table public.quests enable row level security;

create policy "Quests are viewable by everyone"
  on public.quests for select
  using (true);

-- Nerd number counter: no public access (only used by security definer functions)
alter table public.nerd_number_counter enable row level security;

-- ============================================================================
-- SEED: Quest definitions
-- ============================================================================

insert into public.quests (name, description, xp_reward, quest_type, quest_line, conditions, sort_order) values
  (
    'First Blood',
    'Make your first connection by scanning another attendee''s QR code.',
    50, 'social', null,
    '{"type": "connections", "count": 1}',
    1
  ),
  (
    'Deep Dive',
    'Attend a breakout session and leave a takeaway note.',
    100, 'content', null,
    '{"type": "session_note", "count": 1}',
    2
  ),
  (
    'Party Up',
    'Form a group of 3+ by connecting with at least 3 people.',
    75, 'social', null,
    '{"type": "connections", "count": 3}',
    3
  ),
  (
    'Cartographer',
    'Visit all venue zones and check in at each one.',
    50, 'explore', null,
    '{"type": "zone_checkin", "zones": ["main_hall", "expo", "lounge", "workshop"]}',
    4
  ),
  (
    'Boss Fight: Keynote',
    'Attend the keynote and answer the challenge question.',
    150, 'content', null,
    '{"type": "keynote_challenge", "answered": true}',
    5
  ),
  (
    'Sunset Social',
    'Check in at the evening networking event.',
    75, 'side', null,
    '{"type": "event_checkin", "event": "sunset_social"}',
    6
  ),
  (
    'Loot Drop',
    'Find and scan a hidden QR code at the venue.',
    100, 'explore', null,
    '{"type": "hidden_qr", "count": 1}',
    7
  ),
  (
    'Guild Master',
    'Connect with 10 or more attendees.',
    200, 'social', null,
    '{"type": "connections", "count": 10}',
    8
  ),
  (
    'Speed Run',
    'Complete 5 quests within a single day.',
    300, 'content', null,
    '{"type": "quests_completed_in_day", "count": 5}',
    9
  );
