-- Store alpha phone numbers separately from public profile rows.
create table if not exists public.profile_phone_lookup (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  phone_e164 text not null unique check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  updated_at timestamptz not null default now()
);

alter table public.profile_phone_lookup enable row level security;
revoke all on public.profile_phone_lookup from anon, authenticated;
grant select, insert, update, delete on public.profile_phone_lookup to authenticated;
drop policy if exists "Users manage their own phone lookup" on public.profile_phone_lookup;
create policy "Users manage their own phone lookup" on public.profile_phone_lookup
  for all to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create or replace function public.add_friend_by_lookup(lookup_value text, lookup_type text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare uid uuid := auth.uid(); target uuid; result uuid; clean text := btrim(lookup_value);
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if lookup_type = 'id' then
    select p.id into target from public.profiles p where p.username = lower(clean);
  elsif lookup_type = 'phone' then
    if clean !~ '^\+[1-9][0-9]{7,14}$' then
      raise exception '전화번호는 국제 형식으로 입력해 주세요. 예: +821012345678';
    end if;
    select p.user_id into target
      from public.profile_phone_lookup p
      join public.profiles profile on profile.id = p.user_id
      where p.phone_e164 = clean and profile.phone_search_enabled;
  else
    raise exception '지원하지 않는 검색 방법입니다.';
  end if;
  if target is null then raise exception '검색된 사용자가 없습니다.'; end if;
  if target = uid then raise exception '자기 자신은 추가할 수 없습니다.'; end if;
  if exists (
    select 1 from public.friendships f
    where f.status = 'blocked' and f.pair_low = least(uid,target) and f.pair_high = greatest(uid,target)
  ) then raise exception '차단 해제 후 친구로 추가해 주세요.'; end if;
  perform set_config('modo.friend_rpc','true',true);
  insert into public.friendships(requester_id,addressee_id,status)
    values(uid,target,'accepted')
    on conflict(pair_low,pair_high) do update set status='accepted',updated_at=now()
    returning id into result;
  return result;
end;
$$;
revoke all on function public.add_friend_by_lookup(text,text) from public,anon;
grant execute on function public.add_friend_by_lookup(text,text) to authenticated;
