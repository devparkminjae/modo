create or replace function public.add_friend_by_lookup(lookup_value text, lookup_type text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_user_id uuid;
  clean_value text := btrim(lookup_value);
  result_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if lookup_type = 'id' then
    select p.id into target_user_id from public.profiles p where p.username = lower(clean_value);
  elsif lookup_type = 'phone' then
    if clean_value !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'Enter phone number in international format, such as +821012345678'; end if;
    select p.id into target_user_id from public.profiles p join auth.users u on u.id = p.id
      where u.phone = clean_value and p.phone_search_enabled = true;
  else raise exception 'Unsupported lookup type'; end if;
  if target_user_id is null then raise exception 'No matching user found'; end if;
  if target_user_id = current_user_id then raise exception 'Cannot add yourself'; end if;
  insert into public.friendships(requester_id, addressee_id, status)
  values(current_user_id, target_user_id, 'accepted')
  on conflict(pair_low,pair_high) do update set status='accepted', updated_at=now()
  returning id into result_id;
  return result_id;
end; $$;
revoke all on function public.add_friend_by_lookup(text,text) from public, anon;
grant execute on function public.add_friend_by_lookup(text,text) to authenticated;
