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
  join public.conversation_participants other_member
    on other_member.conversation_id = mine.conversation_id
  where mine.user_id = current_user_id
    and other_member.user_id = other_user_id
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

notify pgrst, 'reload schema';
