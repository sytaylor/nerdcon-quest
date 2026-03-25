-- Inc 5: Quest Engine Polish
-- Leaderboard category functions, RSVP table, quest completion persistence

-- Add completed_missions to profiles (JSONB array of mission IDs)
alter table profiles add column if not exists completed_missions jsonb not null default '[]';

-- RSVP table (unblocks Social Butterfly mission)
create table if not exists user_rsvps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, session_id)
);

alter table user_rsvps enable row level security;

create policy "Users can read own RSVPs"
  on user_rsvps for select using (user_id = auth.uid());

create policy "Users can manage own RSVPs"
  on user_rsvps for insert with check (user_id = auth.uid());

create policy "Users can remove own RSVPs"
  on user_rsvps for delete using (user_id = auth.uid());

-- Leaderboard: top users by connection count
create or replace function leaderboard_connections(lim int default 20)
returns table (
  id uuid,
  nerd_number int,
  display_name text,
  company text,
  role text,
  bio text,
  looking_for text,
  avatar_url text,
  quest_line text,
  xp int,
  level int,
  connection_count bigint
)
language sql
stable
security definer
as $$
  select
    p.id, p.nerd_number, p.display_name, p.company, p.role, p.bio,
    p.looking_for, p.avatar_url, p.quest_line, p.xp, p.level,
    count(c.id) as connection_count
  from profiles p
  left join connections c on (p.id = c.user_a or p.id = c.user_b)
  group by p.id
  having count(c.id) > 0
  order by connection_count desc, p.xp desc
  limit lim;
$$;

-- Leaderboard: top users by scheduled session count
create or replace function leaderboard_sessions(lim int default 20)
returns table (
  id uuid,
  nerd_number int,
  display_name text,
  company text,
  role text,
  bio text,
  looking_for text,
  avatar_url text,
  quest_line text,
  xp int,
  level int,
  session_count bigint
)
language sql
stable
security definer
as $$
  select
    p.id, p.nerd_number, p.display_name, p.company, p.role, p.bio,
    p.looking_for, p.avatar_url, p.quest_line, p.xp, p.level,
    count(us.id) as session_count
  from profiles p
  left join user_schedule us on p.id = us.user_id
  group by p.id
  having count(us.id) > 0
  order by session_count desc, p.xp desc
  limit lim;
$$;
