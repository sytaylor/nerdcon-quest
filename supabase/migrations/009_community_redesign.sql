-- Community Tab Redesign
-- People directory, connection requests, organic squads, meet-at pins

-- Discoverable toggle on profiles
alter table profiles add column if not exists discoverable boolean not null default true;
-- Role tag for organic group matching (founder, speaker, investor, operator, builder, etc.)
alter table profiles add column if not exists role_tags text[] not null default '{}';

-- Connection requests (in-app discovery flow)
create table if not exists connection_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  message text check (char_length(message) <= 140),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (sender_id, recipient_id)
);

create index idx_connection_requests_recipient on connection_requests (recipient_id, status);
create index idx_connection_requests_sender on connection_requests (sender_id, status);

alter table connection_requests enable row level security;

create policy "Users can see own requests"
  on connection_requests for select
  using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy "Authenticated users can send requests"
  on connection_requests for insert
  with check (sender_id = auth.uid());

create policy "Recipients can respond"
  on connection_requests for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- Enable realtime for connection requests
alter publication supabase_realtime add table connection_requests;

-- Add is_organic flag + tags to parties (now "squads")
alter table parties add column if not exists is_organic boolean not null default false;
alter table parties add column if not exists description text;
alter table parties add column if not exists emoji text not null default '🎮';
alter table parties add column if not exists tags text[] not null default '{}';
-- Organic squads don't have max_members limit enforced the same way
-- (they use a higher cap)
alter table parties alter column max_members set default 6;

-- Seed organic squads (admin-managed, members join/leave freely).
-- Organic squads are system-owned, so they intentionally have no profile owner.
alter table parties alter column created_by drop not null;

insert into parties (name, created_by, invite_code, max_members, is_organic, description, emoji, tags) values
  ('Founders Circle', null, 'FOUND1', 500, true, 'For founders building the future of fintech. Share war stories, find co-founders, and compare notes.', '🚀', array['founder', 'ceo', 'co-founder']),
  ('Speakers Lounge', null, 'SPEAK1', 500, true, 'Green room for NerdCon speakers. Prep talks, share slides, coordinate.', '🎤', array['speaker']),
  ('Builder''s Guild', null, 'BUILD1', 500, true, 'Engineers, architects, and code nerds. Talk APIs, infra, and shipping.', '⚡', array['builder', 'engineer', 'developer', 'cto']),
  ('Operator''s Den', null, 'OPER01', 500, true, 'Product, growth, and ops leaders. Strategy, metrics, and scaling.', '📊', array['operator', 'product', 'growth']),
  ('Investor Circle', null, 'INVEST', 500, true, 'VCs, angels, and allocators. Deal flow, thesis, and portfolio.', '💰', array['investor', 'vc', 'angel']),
  ('First-Timers', null, 'FIRST1', 500, true, 'Your first NerdCon? Welcome! Find your people and get the lay of the land.', '👋', array['first-timer'])
on conflict do nothing;

-- Meet-at location pins in messages
-- Add location_pin column to party_messages and direct_messages
alter table party_messages add column if not exists location_pin text check (
  location_pin is null or location_pin in (
    'Main Stage', 'Workshop A', 'Workshop B', 'Networking Hub',
    'Sponsor Hall', 'VIP Lounge', 'Registration', 'Food Court'
  )
);
alter table direct_messages add column if not exists location_pin text check (
  location_pin is null or location_pin in (
    'Main Stage', 'Workshop A', 'Workshop B', 'Networking Hub',
    'Sponsor Hall', 'VIP Lounge', 'Registration', 'Food Court'
  )
);

-- Index for people directory (discoverable users, ordered by signup)
create index if not exists idx_profiles_discoverable on profiles (discoverable, nerd_number);
