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

-- Rate limiting: prevent more than 1 message per second per user per party
-- (enforced via a unique partial index on truncated timestamp)
create unique index idx_party_messages_rate_limit
  on party_messages (party_id, sender_id, (date_trunc('second', created_at)))
  where message_type = 'text';

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
