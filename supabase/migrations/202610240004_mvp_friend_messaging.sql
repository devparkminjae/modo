-- Complete web MVP write paths. RPCs run as the authenticated caller and validate membership.
drop policy if exists "Users read own and friends profiles" on public.profiles;
create policy "Users read own, friends, and blocked profiles" on public.profiles
  for select to authenticated using (
    id = (select auth.uid())
    or public.are_friends((select auth.uid()), id)
    or exists (
      select 1 from public.friendships f
      where f.status = 'blocked'
        and f.pair_low = least((select auth.uid()), id)
        and f.pair_high = greatest((select auth.uid()), id)
    )
  );

create or replace function public.enforce_friendship_transition()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if old.requester_id <> new.requester_id or old.addressee_id <> new.addressee_id then
    raise exception 'Friendship participants cannot be changed';
  end if;
  if old.status = new.status then return new; end if;
  if current_setting('modo.friend_rpc', true) = 'true'
    and auth.uid() in (old.requester_id, old.addressee_id)
    and new.status in ('accepted','blocked') then return new; end if;
  if old.status = 'pending' and old.requester_id <> auth.uid() and new.status in ('accepted','declined') then return new; end if;
  if old.status in ('pending','accepted') and new.status in ('declined','blocked')
    and auth.uid() in (old.requester_id,old.addressee_id) then return new; end if;
  raise exception 'Invalid friendship status transition';
end; $$;

create or replace function public.add_friend_by_lookup(lookup_value text, lookup_type text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare uid uuid:=auth.uid(); target uuid; result uuid; clean text:=btrim(lookup_value);
begin
 if uid is null then raise exception 'Authentication required'; end if;
 if lookup_type='id' then select p.id into target from public.profiles p where p.username=lower(clean);
 elsif lookup_type='phone' then
   if clean !~ '^\+[1-9][0-9]{7,14}$' then raise exception '전화번호는 국제 형식으로 입력해 주세요. 예: +821012345678'; end if;
   select p.id into target from public.profiles p join auth.users u on u.id=p.id where u.phone=clean and p.phone_search_enabled;
 else raise exception '지원하지 않는 검색 방법입니다.'; end if;
 if target is null then raise exception '검색된 사용자가 없습니다.'; end if;
 if target=uid then raise exception '자기 자신은 추가할 수 없습니다.'; end if;
 perform set_config('modo.friend_rpc','true',true);
 insert into public.friendships(requester_id,addressee_id,status) values(uid,target,'accepted')
 on conflict(pair_low,pair_high) do update set status='accepted',updated_at=now() returning id into result;
 return result;
end; $$;
revoke all on function public.add_friend_by_lookup(text,text) from public,anon;
grant execute on function public.add_friend_by_lookup(text,text) to authenticated;

create or replace function public.remove_friend(target_user_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if target_user_id=auth.uid() then raise exception 'Invalid friend'; end if;
 delete from public.friendships f where f.pair_low=least(auth.uid(),target_user_id) and f.pair_high=greatest(auth.uid(),target_user_id);
end; $$;
revoke all on function public.remove_friend(uuid) from public,anon;
grant execute on function public.remove_friend(uuid) to authenticated;

create or replace function public.set_friend_block(target_user_id uuid, should_block boolean)
returns void language plpgsql security definer set search_path = ''
as $$
declare uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Authentication required'; end if;
 if target_user_id=uid then raise exception 'Invalid friend'; end if;
 if should_block then
   perform set_config('modo.friend_rpc','true',true);
   insert into public.friendships(requester_id,addressee_id,status) values(uid,target_user_id,'blocked')
   on conflict(pair_low,pair_high) do update set status='blocked',updated_at=now();
 else
   delete from public.friendships f where f.status='blocked' and f.pair_low=least(uid,target_user_id) and f.pair_high=greatest(uid,target_user_id);
 end if;
end; $$;
revoke all on function public.set_friend_block(uuid,boolean) from public,anon;
grant execute on function public.set_friend_block(uuid,boolean) to authenticated;

create or replace function public.start_direct_conversation(target_user_id uuid, first_message text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare uid uuid:=auth.uid(); a uuid; b uuid; cid uuid; body text:=btrim(first_message); phone_confirmed timestamptz; alpha_skip boolean;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 if target_user_id=uid then raise exception 'Cannot message yourself'; end if;
 if body is null or char_length(body) not between 1 and 4000 then raise exception '메시지는 1~4000자여야 합니다.'; end if;
 select u.phone_confirmed_at, coalesce(u.raw_user_meta_data->>'modo_alpha_phone_skip'='true',false) into phone_confirmed,alpha_skip from auth.users u where u.id=uid;
 if phone_confirmed is null and not alpha_skip then raise exception 'Phone verification is required'; end if;
 if not exists(select 1 from public.profiles p where p.id=uid) then raise exception '프로필을 먼저 설정해 주세요.'; end if;
 if not public.are_friends(uid,target_user_id) then raise exception '먼저 친구로 추가해 주세요.'; end if;
 if exists(select 1 from public.friendships f where f.status='blocked' and f.pair_low=least(uid,target_user_id) and f.pair_high=greatest(uid,target_user_id)) then raise exception '차단된 친구와 대화할 수 없습니다.'; end if;
 a:=least(uid,target_user_id); b:=greatest(uid,target_user_id);
 insert into public.conversations(kind,participant_a,participant_b,created_by) values('direct',a,b,uid) on conflict(participant_a,participant_b) where kind='direct' do nothing;
 select c.id into cid from public.conversations c where c.kind='direct' and c.participant_a=a and c.participant_b=b;
 insert into public.conversation_members(conversation_id,user_id) values(cid,a),(cid,b) on conflict do nothing;
 insert into public.messages(conversation_id,sender_id,body) values(cid,uid,body);
 update public.conversations set updated_at=now() where id=cid;
 return cid;
end; $$;
revoke all on function public.start_direct_conversation(uuid,text) from public,anon;
grant execute on function public.start_direct_conversation(uuid,text) to authenticated;

create or replace function public.create_group_conversation(group_title text, member_ids uuid[])
returns uuid language plpgsql security definer set search_path = ''
as $$
declare uid uuid:=auth.uid(); cid uuid; target uuid;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 if char_length(btrim(group_title)) not between 1 and 60 then raise exception '그룹 이름은 1~60자여야 합니다.'; end if;
 if coalesce(array_length(member_ids,1),0)<1 then raise exception '친구를 한 명 이상 선택해 주세요.'; end if;
 insert into public.conversations(kind,title,created_by) values('group',btrim(group_title),uid) returning id into cid;
 insert into public.conversation_members(conversation_id,user_id) values(cid,uid);
 foreach target in array member_ids loop
   if target<>uid and public.are_friends(uid,target) then insert into public.conversation_members(conversation_id,user_id) values(cid,target) on conflict do nothing;
   else raise exception '초대한 사람은 모두 친구여야 합니다.'; end if;
 end loop;
 return cid;
end; $$;
revoke all on function public.create_group_conversation(text,uuid[]) from public,anon;
grant execute on function public.create_group_conversation(text,uuid[]) to authenticated;

drop policy if exists "Members create group conversations" on public.conversations;
create policy "Members create group conversations" on public.conversations for insert to authenticated with check(kind='group' and created_by=(select auth.uid()));
drop policy if exists "Members send messages" on public.messages;
create policy "Members send messages" on public.messages for insert to authenticated with check(sender_id=(select auth.uid()) and exists(select 1 from public.conversation_members cm where cm.conversation_id=messages.conversation_id and cm.user_id=(select auth.uid())));
grant insert on public.messages,public.conversations,public.conversation_members to authenticated;
