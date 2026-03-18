-- 003_parties.sql
-- Party system support for NerdCon Quest

-- Function to generate a random 6-char uppercase alphanumeric invite code
create or replace function generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code text := '';
  i integer;
begin
  for i in 1..6 loop
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;
  return code;
end;
$$;

-- Parties table
create table parties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references profiles(id) on delete cascade,
  invite_code text unique not null default generate_invite_code(),
  max_members integer default 6,
  created_at timestamptz default now()
);

-- Party members table
create table party_members (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references parties(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  unique (party_id, user_id)
);

-- Indexes
create index idx_parties_invite_code on parties(invite_code);
create index idx_parties_created_by on parties(created_by);
create index idx_party_members_party_id on party_members(party_id);
create index idx_party_members_user_id on party_members(user_id);

-- RLS: parties
alter table parties enable row level security;

create policy "Authenticated users can read all parties"
  on parties for select
  to authenticated
  using (true);

create policy "Authenticated users can create parties"
  on parties for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Creator can update own party"
  on parties for update
  to authenticated
  using (auth.uid() = created_by);

create policy "Creator can delete own party"
  on parties for delete
  to authenticated
  using (auth.uid() = created_by);

-- RLS: party_members
alter table party_members enable row level security;

create policy "Members can read their party members"
  on party_members for select
  to authenticated
  using (
    party_id in (
      select pm.party_id
      from party_members pm
      where pm.user_id = auth.uid()
    )
  );

create policy "Authenticated users can join parties"
  on party_members for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Members can leave parties"
  on party_members for delete
  to authenticated
  using (auth.uid() = user_id);
