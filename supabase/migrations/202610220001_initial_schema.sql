create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username = lower(username) and username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  status_message text not null default '' check (char_length(status_message) <= 80),
  avatar_path text,
  phone_search_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  pair_low uuid generated always as (least(requester_id, addressee_id)) stored,
  pair_high uuid generated always as (greatest(requester_id, addressee_id)) stored,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (pair_low, pair_high)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('direct', 'group')),
  participant_a uuid references public.profiles (id) on delete cascade,
  participant_b uuid references public.profiles (id) on delete cascade,
  title text check (title is null or char_length(btrim(title)) between 1 and 60),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (kind = 'direct' and participant_a is not null and participant_b is not null
      and participant_a < participant_b and title is null)
    or (kind = 'group' and participant_a is null and participant_b is null)
  )
);

create unique index conversations_unique_direct_pair
  on public.conversations (participant_a, participant_b) where kind = 'direct';

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index friendships_addressee_status_idx on public.friendships (addressee_id, status);
create index conversation_members_user_idx on public.conversation_members (user_id, conversation_id);
create index messages_conversation_created_idx on public.messages (conversation_id, created_at desc, id desc);

create function public.are_friends(left_user uuid, right_user uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and (left_user = auth.uid() or right_user = auth.uid())
      and ((f.requester_id = left_user and f.addressee_id = right_user)
        or (f.requester_id = right_user and f.addressee_id = left_user))
  );
$$;

create function public.enforce_friendship_transition()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if old.requester_id <> new.requester_id or old.addressee_id <> new.addressee_id then
    raise exception 'Friendship participants cannot be changed';
  end if;
  if old.status = new.status then return new; end if;
  if old.status = 'pending' and new.status = 'accepted' and auth.uid() = old.addressee_id then
    return new;
  end if;
  if old.status in ('pending', 'accepted') and new.status in ('declined', 'blocked')
    and auth.uid() in (old.requester_id, old.addressee_id) then return new;
  end if;
  raise exception 'Invalid friendship status transition';
end;
$$;

create trigger friendships_validate_update before update on public.friendships
for each row execute function public.enforce_friendship_transition();

create function public.start_direct_conversation(target_user_id uuid, first_message text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  canonical_a uuid;
  canonical_b uuid;
  new_conversation_id uuid;
  clean_body text := btrim(first_message);
  phone_confirmed timestamptz;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if target_user_id = current_user_id then raise exception 'Cannot message yourself'; end if;
  if clean_body is null or char_length(clean_body) not between 1 and 4000 then
    raise exception 'Message must contain 1 to 4000 characters';
  end if;
  select u.phone_confirmed_at into phone_confirmed from auth.users u where u.id = current_user_id;
  if phone_confirmed is null then raise exception 'Phone verification is required'; end if;
  if not exists (select 1 from public.profiles p where p.id = current_user_id) then
    raise exception 'Complete your profile before messaging';
  end if;
  if not exists (select 1 from public.profiles p where p.id = target_user_id) then
    raise exception 'Friend not found';
  end if;
  if not public.are_friends(current_user_id, target_user_id) then
    raise exception 'You can only message an accepted friend';
  end if;
  if exists (
    select 1 from public.friendships f
    where f.status = 'blocked'
      and f.pair_low = least(current_user_id, target_user_id)
      and f.pair_high = greatest(current_user_id, target_user_id)
  ) then raise exception 'This friend relationship is blocked'; end if;

  canonical_a := least(current_user_id, target_user_id);
  canonical_b := greatest(current_user_id, target_user_id);
  insert into public.conversations (kind, participant_a, participant_b, created_by)
  values ('direct', canonical_a, canonical_b, current_user_id)
  on conflict (participant_a, participant_b) where kind = 'direct' do nothing;
  select c.id into new_conversation_id from public.conversations c
    where c.kind = 'direct' and c.participant_a = canonical_a and c.participant_b = canonical_b;
  insert into public.conversation_members (conversation_id, user_id)
    values (new_conversation_id, canonical_a), (new_conversation_id, canonical_b)
    on conflict do nothing;
  insert into public.messages (conversation_id, sender_id, body)
    values (new_conversation_id, current_user_id, clean_body);
  update public.conversations set updated_at = now() where id = new_conversation_id;
  return new_conversation_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create policy "Users read own and friends profiles" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.are_friends((select auth.uid()), id));
create policy "Users create own profile" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "Users update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Users read friendships they belong to" on public.friendships
  for select to authenticated using ((select auth.uid()) in (requester_id, addressee_id));
create policy "Users send friend requests" on public.friendships
  for insert to authenticated
  with check (requester_id = (select auth.uid()) and status = 'pending');
create policy "Participants update friendship status" on public.friendships
  for update to authenticated using ((select auth.uid()) in (requester_id, addressee_id))
  with check ((select auth.uid()) in (requester_id, addressee_id));
create policy "Requesters cancel pending requests" on public.friendships
  for delete to authenticated using (requester_id = (select auth.uid()) and status = 'pending');

create policy "Members read conversations" on public.conversations
  for select to authenticated using (exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = id and cm.user_id = (select auth.uid())
  ));
create policy "Users read own memberships" on public.conversation_members
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users update own read position" on public.conversation_members
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Members read messages" on public.messages for select to authenticated
  using (exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = public.messages.conversation_id and cm.user_id = (select auth.uid())
  ));

revoke all on public.profiles, public.friendships, public.conversations,
  public.conversation_members, public.messages from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.friendships to authenticated;
grant select on public.conversations, public.conversation_members, public.messages to authenticated;
grant update (last_read_at) on public.conversation_members to authenticated;
revoke all on function public.are_friends(uuid, uuid) from public, anon;
grant execute on function public.are_friends(uuid, uuid) to authenticated;
revoke all on function public.start_direct_conversation(uuid, text) from public, anon;
grant execute on function public.start_direct_conversation(uuid, text) to authenticated;
