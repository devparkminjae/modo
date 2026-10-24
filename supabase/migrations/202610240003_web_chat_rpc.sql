-- Safe authenticated write paths for the web MVP.
create or replace function public.add_friend_by_lookup(lookup_value text, lookup_type text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare uid uuid:=auth.uid(); target uuid; result uuid; clean text:=btrim(lookup_value);
begin
 if uid is null then raise exception 'Authentication required'; end if;
 if lookup_type='id' then select p.id into target from public.profiles p where p.username=lower(clean);
 elsif lookup_type='phone' then
  if clean !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'Use international phone format'; end if;
  select p.id into target from public.profiles p join auth.users u on u.id=p.id where u.phone=clean and p.phone_search_enabled;
 else raise exception 'Unsupported lookup type'; end if;
 if target is null then raise exception 'No matching user found'; end if;
 if target=uid then raise exception 'Cannot add yourself'; end if;
 insert into public.friendships(requester_id,addressee_id,status) values(uid,target,'accepted')
 on conflict(pair_low,pair_high) do update set status='accepted',updated_at=now() returning id into result;
 return result;
end; $$;
revoke all on function public.add_friend_by_lookup(text,text) from public,anon;
grant execute on function public.add_friend_by_lookup(text,text) to authenticated;

create or replace function public.create_group_conversation(group_title text, member_ids uuid[])
returns uuid language plpgsql security definer set search_path = ''
as $$
declare uid uuid:=auth.uid(); cid uuid; target uuid;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 if char_length(btrim(group_title)) not between 1 and 60 then raise exception 'Group name must be 1 to 60 characters'; end if;
 insert into public.conversations(kind,title,created_by) values('group',btrim(group_title),uid) returning id into cid;
 insert into public.conversation_members(conversation_id,user_id) values(cid,uid);
 foreach target in array coalesce(member_ids,array[]::uuid[]) loop
   if target<>uid and exists(select 1 from public.profiles p where p.id=target)
     and public.are_friends(uid,target) then
     insert into public.conversation_members(conversation_id,user_id) values(cid,target) on conflict do nothing;
   else raise exception 'All invited members must be friends'; end if;
 end loop;
 return cid;
end; $$;
revoke all on function public.create_group_conversation(text,uuid[]) from public,anon;
grant execute on function public.create_group_conversation(text,uuid[]) to authenticated;

create policy "Members create group conversations" on public.conversations for insert to authenticated
 with check(kind='group' and created_by=(select auth.uid()));
create policy "Members send messages" on public.messages for insert to authenticated
 with check(sender_id=(select auth.uid()) and exists(select 1 from public.conversation_members cm where cm.conversation_id=messages.conversation_id and cm.user_id=(select auth.uid())));
grant insert on public.messages to authenticated;
grant insert on public.conversations, public.conversation_members to authenticated;
