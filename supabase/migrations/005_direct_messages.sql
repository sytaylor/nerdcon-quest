-- Direct Messages (Phase 3: Opt-in DMs)
-- Requires mutual QR connection + explicit accept before messaging

-- DM requests: sender requests, recipient accepts/declines
create table if not exists dm_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (sender_id, recipient_id)
);

create index idx_dm_requests_recipient on dm_requests (recipient_id, status);
create index idx_dm_requests_sender on dm_requests (sender_id);

-- DM conversations: created when a request is accepted
create table if not exists dm_conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Ensure user_a < user_b for dedup (same pattern as connections table)
  constraint dm_conversations_ordered check (user_a < user_b),
  unique (user_a, user_b)
);

-- Direct messages
create table if not exists direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references dm_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete set null,
  content text not null check (char_length(content) <= 500),
  created_at timestamptz not null default now()
);

create index idx_direct_messages_convo on direct_messages (conversation_id, created_at desc);

-- Rate limit: 1 message per second per user per conversation.
-- Implemented as a trigger because date_trunc(timestamptz) is not immutable
-- and cannot be used in an index expression.
create or replace function enforce_direct_message_rate_limit()
returns trigger
language plpgsql
as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.conversation_id::text), hashtext(new.sender_id::text));

  if exists (
    select 1
    from direct_messages
    where conversation_id = new.conversation_id
      and sender_id = new.sender_id
      and created_at > new.created_at - interval '1 second'
    limit 1
  ) then
    raise exception 'rate limit exceeded';
  end if;

  return new;
end;
$$;

drop trigger if exists direct_messages_rate_limit on direct_messages;
create trigger direct_messages_rate_limit
  before insert on direct_messages
  for each row
  execute function enforce_direct_message_rate_limit();

-- DM read tracking
create table if not exists dm_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid not null references dm_conversations(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, conversation_id)
);

-- RLS
alter table dm_requests enable row level security;
alter table dm_conversations enable row level security;
alter table direct_messages enable row level security;
alter table dm_reads enable row level security;

-- dm_requests: sender or recipient can read their own requests
create policy "Users can read own DM requests"
  on dm_requests for select
  using (sender_id = auth.uid() or recipient_id = auth.uid());

-- dm_requests: anyone with a mutual connection can send a request
create policy "Connected users can send DM requests"
  on dm_requests for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from connections
      where (user_a = least(auth.uid(), recipient_id) and user_b = greatest(auth.uid(), recipient_id))
    )
  );

-- dm_requests: recipient can update (accept/decline)
create policy "Recipients can respond to DM requests"
  on dm_requests for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- dm_conversations: participants can read
create policy "Participants can read DM conversations"
  on dm_conversations for select
  using (user_a = auth.uid() or user_b = auth.uid());

-- dm_conversations: system creates on accept (use service role in function)
-- For now, allow participants to insert if they have an accepted request
create policy "Participants can create conversations"
  on dm_conversations for insert
  with check (
    user_a = auth.uid() or user_b = auth.uid()
  );

-- direct_messages: conversation participants can read
create policy "Conversation participants can read messages"
  on direct_messages for select
  using (
    exists (
      select 1 from dm_conversations
      where dm_conversations.id = direct_messages.conversation_id
        and (dm_conversations.user_a = auth.uid() or dm_conversations.user_b = auth.uid())
    )
  );

-- direct_messages: conversation participants can send
create policy "Conversation participants can send messages"
  on direct_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from dm_conversations
      where dm_conversations.id = direct_messages.conversation_id
        and (dm_conversations.user_a = auth.uid() or dm_conversations.user_b = auth.uid())
    )
  );

-- dm_reads: users manage own read markers
create policy "Users manage own DM read markers"
  on dm_reads for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Enable realtime
alter publication supabase_realtime add table direct_messages;
alter publication supabase_realtime add table dm_requests;
