-- Inc 7: Security hardening
-- Fixes privacy boundaries, invite-code leakage, DM consent, and client-owned XP.

-- ============================================================================
-- Profiles: discoverability is a real data boundary, not just a UI filter.
-- ============================================================================

drop policy if exists "Profiles are viewable by everyone" on public.profiles;

create policy "Profiles visible by discovery or relationship"
  on public.profiles for select
  using (
    discoverable = true
    or id = auth.uid()
    or exists (
      select 1 from public.connections c
      where (c.user_a = auth.uid() and c.user_b = profiles.id)
         or (c.user_b = auth.uid() and c.user_a = profiles.id)
    )
    or exists (
      select 1
      from public.party_members mine
      join public.party_members theirs on theirs.party_id = mine.party_id
      where mine.user_id = auth.uid()
        and theirs.user_id = profiles.id
    )
    or exists (
      select 1 from public.dm_conversations dc
      where (dc.user_a = auth.uid() and dc.user_b = profiles.id)
         or (dc.user_b = auth.uid() and dc.user_a = profiles.id)
    )
  );

-- ============================================================================
-- Parties: invite codes are capabilities, not public metadata.
-- ============================================================================

drop policy if exists "Authenticated users can read all parties" on public.parties;

create policy "Users can read own and open parties"
  on public.parties for select
  to authenticated
  using (
    is_organic = true
    or created_by = auth.uid()
    or exists (
      select 1 from public.party_members pm
      where pm.party_id = parties.id
        and pm.user_id = auth.uid()
    )
  );

create or replace function public.join_party_by_invite(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_party public.parties%rowtype;
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'not signed in';
  end if;

  select *
  into v_party
  from public.parties
  where invite_code = upper(trim(p_invite_code))
  limit 1;

  if v_party.id is null then
    raise exception 'party not found';
  end if;

  if exists (
    select 1 from public.party_members
    where party_id = v_party.id and user_id = v_user_id
  ) then
    return v_party.id;
  end if;

  select count(*)::integer
  into v_count
  from public.party_members
  where party_id = v_party.id;

  if v_count >= v_party.max_members then
    raise exception 'party full';
  end if;

  insert into public.party_members (party_id, user_id)
  values (v_party.id, v_user_id);

  return v_party.id;
end;
$$;

grant execute on function public.join_party_by_invite(text) to authenticated;

-- ============================================================================
-- DMs: accepted request is the trust boundary for conversation creation.
-- ============================================================================

drop policy if exists "Participants can create conversations" on public.dm_conversations;

create policy "Clients cannot directly create DM conversations"
  on public.dm_conversations for insert
  to authenticated
  with check (false);

create or replace function public.accept_dm_request(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.dm_requests%rowtype;
  v_user_a uuid;
  v_user_b uuid;
  v_conversation_id uuid;
begin
  if v_user_id is null then
    raise exception 'not signed in';
  end if;

  select *
  into v_request
  from public.dm_requests
  where id = p_request_id
    and recipient_id = v_user_id
    and status = 'pending'
  for update;

  if v_request.id is null then
    raise exception 'request not found';
  end if;

  v_user_a := least(v_request.sender_id, v_request.recipient_id);
  v_user_b := greatest(v_request.sender_id, v_request.recipient_id);

  update public.dm_requests
  set status = 'accepted',
      responded_at = now()
  where id = p_request_id;

  insert into public.dm_conversations (user_a, user_b)
  values (v_user_a, v_user_b)
  on conflict (user_a, user_b) do nothing
  returning id into v_conversation_id;

  if v_conversation_id is null then
    select id
    into v_conversation_id
    from public.dm_conversations
    where user_a = v_user_a and user_b = v_user_b;
  end if;

  return v_conversation_id;
end;
$$;

grant execute on function public.accept_dm_request(uuid) to authenticated;

-- ============================================================================
-- XP: game fields are server-owned.
-- ============================================================================

create or replace function public.protect_profile_game_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() = new.id
    and coalesce(current_setting('app.allow_game_profile_update', true), '') <> 'on'
    and (
      new.xp is distinct from old.xp
      or new.level is distinct from old.level
      or new.completed_missions is distinct from old.completed_missions
    )
  then
    raise exception 'game fields are server-owned';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_game_fields on public.profiles;
create trigger profiles_protect_game_fields
  before update on public.profiles
  for each row
  execute function public.protect_profile_game_fields();

create or replace function public.sync_profile_missions()
returns table (
  total_xp integer,
  profile_level integer,
  completed_missions jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_schedule_count integer := 0;
  v_connection_count integer := 0;
  v_rsvp_count integer := 0;
  v_message_count integer := 0;
  v_sponsor_visit_count integer := 0;
  v_completed text[] := array[]::text[];
  v_xp integer := 0;
  v_level integer := 1;
begin
  if v_user_id is null then
    raise exception 'not signed in';
  end if;

  select count(*)::integer into v_schedule_count
  from public.user_schedule
  where user_id = v_user_id;

  select count(*)::integer into v_connection_count
  from public.connections
  where user_a = v_user_id or user_b = v_user_id;

  select count(*)::integer into v_rsvp_count
  from public.user_rsvps
  where user_id = v_user_id;

  select count(*)::integer into v_message_count
  from public.party_messages
  where sender_id = v_user_id and message_type = 'text';

  select count(*)::integer into v_sponsor_visit_count
  from public.sponsor_visits
  where user_id = v_user_id;

  if v_schedule_count >= 3 then
    v_completed := array_append(v_completed, 'plan-ahead');
    v_xp := v_xp + 50;
  end if;
  if v_connection_count >= 1 then
    v_completed := array_append(v_completed, 'first-blood');
    v_xp := v_xp + 50;
  end if;
  if v_connection_count >= 3 then
    v_completed := array_append(v_completed, 'party-up');
    v_xp := v_xp + 75;
  end if;
  if v_rsvp_count >= 2 then
    v_completed := array_append(v_completed, 'social-butterfly');
    v_xp := v_xp + 75;
  end if;
  if v_connection_count >= 10 then
    v_completed := array_append(v_completed, 'guild-master');
    v_xp := v_xp + 200;
  end if;
  if v_message_count >= 10 then
    v_completed := array_append(v_completed, 'party-chatter');
    v_xp := v_xp + 50;
  end if;
  if v_sponsor_visit_count >= 5 then
    v_completed := array_append(v_completed, 'booth-crawler');
    v_xp := v_xp + 100;
  end if;
  if v_sponsor_visit_count >= 12 then
    v_completed := array_append(v_completed, 'sponsor-champion');
    v_xp := v_xp + 300;
  end if;

  v_level := case
    when v_xp >= 1500 then 5
    when v_xp >= 1000 then 4
    when v_xp >= 500 then 3
    when v_xp >= 200 then 2
    else 1
  end;

  perform set_config('app.allow_game_profile_update', 'on', true);

  update public.profiles
  set xp = v_xp,
      level = v_level,
      completed_missions = to_jsonb(v_completed),
      updated_at = now()
  where id = v_user_id;

  total_xp := v_xp;
  profile_level := v_level;
  completed_missions := to_jsonb(v_completed);
  return next;
end;
$$;

grant execute on function public.sync_profile_missions() to authenticated;
