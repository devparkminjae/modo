-- Modo v0.0.1 uses immediate friend addition, matching the requested product flow.
create or replace function public.add_friend_by_username(target_username text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_user_id uuid;
  result_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  select p.id into target_user_id from public.profiles p where p.username = lower(btrim(target_username));
  if target_user_id is null then raise exception 'User not found'; end if;
  if target_user_id = current_user_id then raise exception 'Cannot add yourself'; end if;
  insert into public.friendships(requester_id, addressee_id, status)
  values (current_user_id, target_user_id, 'accepted')
  on conflict (pair_low, pair_high) do update set status = 'accepted', updated_at = now()
  returning id into result_id;
  return result_id;
end;
$$;
revoke all on function public.add_friend_by_username(text) from public, anon;
grant execute on function public.add_friend_by_username(text) to authenticated;
