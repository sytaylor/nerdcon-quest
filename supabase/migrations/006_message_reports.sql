-- Message Reports (Phase 4: Moderation)
-- Users can report inappropriate messages

create table if not exists message_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  message_id uuid not null,
  message_table text not null check (message_table in ('party_messages', 'direct_messages')),
  reason text not null default 'inappropriate' check (char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  -- Prevent duplicate reports
  unique (reporter_id, message_id, message_table)
);

create index idx_message_reports_message on message_reports (message_id, message_table);

-- RLS
alter table message_reports enable row level security;

-- Users can create reports
create policy "Users can report messages"
  on message_reports for insert
  with check (reporter_id = auth.uid());

-- Users can see their own reports
create policy "Users can see own reports"
  on message_reports for select
  using (reporter_id = auth.uid());
