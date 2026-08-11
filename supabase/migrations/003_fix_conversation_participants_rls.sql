-- Avoid recursive RLS checks on conversation_participants.
-- SECURITY DEFINER lets policies check membership without re-entering the table policy.
create or replace function public.is_conversation_participant(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants
    where conversation_id = target_conversation_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_conversation_participant(uuid) from public;
grant execute on function public.is_conversation_participant(uuid) to authenticated;

drop policy if exists "Users can view own conversations" on public.conversations;
create policy "Users can view own conversations"
  on public.conversations for select
  to authenticated
  using (public.is_conversation_participant(id));

drop policy if exists "Users can view conversation participants" on public.conversation_participants;
create policy "Users can view conversation participants"
  on public.conversation_participants for select
  to authenticated
  using (public.is_conversation_participant(conversation_id));

drop policy if exists "Users can view own messages" on public.messages;
create policy "Users can view own messages"
  on public.messages for select
  to authenticated
  using (public.is_conversation_participant(conversation_id));

drop policy if exists "Users can send messages" on public.messages;
create policy "Users can send messages"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.is_conversation_participant(conversation_id)
  );

-- Create the conversation and both memberships atomically, before RLS tries to
-- return the new conversation to the caller.
create or replace function public.start_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_conversation_id uuid;
  new_conversation_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;
  if other_user_id is null or other_user_id = current_user_id then
    raise exception 'Invalid conversation participant';
  end if;

  select mine.conversation_id
    into existing_conversation_id
  from public.conversation_participants mine
  join public.conversation_participants other
    on other.conversation_id = mine.conversation_id
  where mine.user_id = current_user_id
    and other.user_id = other_user_id
  limit 1;

  if existing_conversation_id is not null then
    return existing_conversation_id;
  end if;

  insert into public.conversations default values
  returning id into new_conversation_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values
    (new_conversation_id, current_user_id),
    (new_conversation_id, other_user_id);

  return new_conversation_id;
end;
$$;

revoke all on function public.start_conversation(uuid) from public;
grant execute on function public.start_conversation(uuid) to authenticated;
