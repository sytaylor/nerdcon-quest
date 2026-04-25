-- Party Messages (Phase 1: Party Chat)
-- Enables real-time chat within party groups (max 6 people)

create table if not exists party_messages (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references parties(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  content text not null check (char_length(content) <= 500),
  message_type text not null default 'text' check (message_type in ('text', 'system')),
  created_at timestamptz not null default now()
);

-- Indexes for fast retrieval
create index idx_party_messages_party_created on party_messages (party_id, created_at desc);
create index idx_party_messages_sender on party_messages (sender_id);

-- Rate limiting: prevent more than 1 message per second per user per party.
-- This cannot be a date_trunc expression index because date_trunc(timestamptz)
-- is not immutable. Use a trigger with a transaction-scoped advisory lock so
-- concurrent inserts for the same party/sender are checked serially.
create or replace function enforce_party_message_rate_limit()
returns trigger
language plpgsql
as $$
begin
  if new.message_type <> 'text' or new.sender_id is null then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext(new.party_id::text), hashtext(new.sender_id::text));

  if exists (
    select 1
    from party_messages
    where party_id = new.party_id
      and sender_id = new.sender_id
      and message_type = 'text'
      and created_at > new.created_at - interval '1 second'
    limit 1
  ) then
    raise exception 'rate limit exceeded';
  end if;

  return new;
end;
$$;

drop trigger if exists party_messages_rate_limit on party_messages;
create trigger party_messages_rate_limit
  before insert on party_messages
  for each row
  execute function enforce_party_message_rate_limit();

-- Track last read position for unread counts
create table if not exists party_chat_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  party_id uuid not null references parties(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, party_id)
);

-- RLS Policies
alter table party_messages enable row level security;
alter table party_chat_reads enable row level security;

-- party_messages: members can read messages from their party
create policy "Party members can read messages"
  on party_messages for select
  using (
    exists (
      select 1 from party_members
      where party_members.party_id = party_messages.party_id
        and party_members.user_id = auth.uid()
    )
  );

-- party_messages: members can insert messages to their party
create policy "Party members can send messages"
  on party_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from party_members
      where party_members.party_id = party_messages.party_id
        and party_members.user_id = auth.uid()
    )
  );

-- party_chat_reads: users can read/write their own read markers
create policy "Users manage own read markers"
  on party_chat_reads for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Enable realtime for party_messages
alter publication supabase_realtime add table party_messages;
