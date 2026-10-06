-- Revised three-plan catalog, account-wide limits, reader-owned message deletion,
-- and Story Spinner member polls.

create or replace function public.subscription_club_limit(tier text)
returns integer language sql immutable as $$
  select case tier
    when 'story_spinner' then 2
    when 'shelf_enchanter' then 2147483647
    when 'library_legend' then 2147483647
    else 2
  end;
$$;

create or replace function public.subscription_book_limit(tier text)
returns integer language sql immutable as $$
  select case tier
    when 'story_spinner' then 100
    when 'shelf_enchanter' then 2147483647
    when 'library_legend' then 2147483647
    else 50
  end;
$$;

create or replace function public.subscription_member_limit(tier text)
returns integer language sql immutable as $$
  select case tier
    when 'story_spinner' then 20
    when 'shelf_enchanter' then 2147483647
    when 'library_legend' then 2147483647
    else 10
  end;
$$;

-- Books are counted across every club owned by the subscriber, matching the
-- plan language shown in the app.
create or replace function public.enforce_club_book_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  owner_tier text;
  book_count integer;
  allowed_count integer;
begin
  select c.created_by, coalesce(p.subscription_tier, 'first_chapter')
    into owner_id, owner_tier
  from public.clubs c
  left join public.profiles p on p.id = c.created_by
  where c.id = new.club_id;

  if owner_id is null then raise exception 'Club not found.'; end if;
  perform pg_advisory_xact_lock(hashtext(owner_id::text));
  allowed_count := public.subscription_book_limit(owner_tier);

  select count(*) into book_count
  from public.club_books b
  join public.clubs c on c.id = b.club_id
  where c.created_by = owner_id;

  if book_count >= allowed_count then
    raise exception 'SUBSCRIPTION_BOOK_LIMIT: % allows % total books across owned clubs.', owner_tier, allowed_count;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_club_book_limit_trigger on public.club_books;
create trigger enforce_club_book_limit_trigger
before insert on public.club_books
for each row execute function public.enforce_club_book_limit();

-- A reader who belongs to more than one club owned by the same subscriber is
-- counted once. The owner is also one of the total members.
create or replace function public.enforce_owner_member_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  owner_tier text;
  member_count integer;
  allowed_count integer;
  already_counted boolean;
begin
  select c.created_by, coalesce(p.subscription_tier, 'first_chapter')
    into owner_id, owner_tier
  from public.clubs c
  left join public.profiles p on p.id = c.created_by
  where c.id = new.club_id;

  if owner_id is null then raise exception 'Club not found.'; end if;
  perform pg_advisory_xact_lock(hashtext(owner_id::text));

  select exists (
    select 1
    from public.club_members m
    join public.clubs c on c.id = m.club_id
    where c.created_by = owner_id and m.user_id = new.user_id
  ) into already_counted;

  if already_counted then return new; end if;

  allowed_count := public.subscription_member_limit(owner_tier);
  select count(distinct m.user_id) into member_count
  from public.club_members m
  join public.clubs c on c.id = m.club_id
  where c.created_by = owner_id;

  if member_count >= allowed_count then
    raise exception 'SUBSCRIPTION_MEMBER_LIMIT: % allows % total members across owned clubs.', owner_tier, allowed_count;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_owner_member_limit_trigger on public.club_members;
create trigger enforce_owner_member_limit_trigger
before insert on public.club_members
for each row execute function public.enforce_owner_member_limit();

create or replace function public.get_club_plan_usage(target_club_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  owner_tier text;
  book_count integer;
  member_count integer;
begin
  if not exists (
    select 1 from public.club_members
    where club_id = target_club_id and user_id = auth.uid()
  ) then
    return null;
  end if;

  select c.created_by, coalesce(p.subscription_tier, 'first_chapter')
    into owner_id, owner_tier
  from public.clubs c
  left join public.profiles p on p.id = c.created_by
  where c.id = target_club_id;

  select count(*) into book_count
  from public.club_books b
  join public.clubs c on c.id = b.club_id
  where c.created_by = owner_id;

  select count(distinct m.user_id) into member_count
  from public.club_members m
  join public.clubs c on c.id = m.club_id
  where c.created_by = owner_id;

  return jsonb_build_object(
    'tier', owner_tier,
    'book_count', book_count,
    'book_limit', public.subscription_book_limit(owner_tier),
    'member_count', member_count,
    'member_limit', public.subscription_member_limit(owner_tier)
  );
end;
$$;

grant execute on function public.get_club_plan_usage(uuid) to authenticated;

drop policy if exists "Readers delete their own chapter messages" on public.chapter_messages;
create policy "Readers delete their own chapter messages"
on public.chapter_messages
for delete
to authenticated
using (author_id = auth.uid());

drop policy if exists "Readers delete their own chapter audio" on storage.objects;
create policy "Readers delete their own chapter audio"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'chapter-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.user_is_club_member(target_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.club_members
    where club_id = target_club_id and user_id = auth.uid()
  );
$$;

create or replace function public.user_manages_club(target_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.club_members
    where club_id = target_club_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

grant execute on function public.user_is_club_member(uuid) to authenticated;
grant execute on function public.user_manages_club(uuid) to authenticated;

create table if not exists public.club_polls (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  question text not null check (char_length(question) between 3 and 180),
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists club_polls_one_open_per_club_idx
  on public.club_polls(club_id) where is_open;

create table if not exists public.club_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.club_polls(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 100),
  position smallint not null check (position between 1 and 6),
  unique (poll_id, position)
);

create table if not exists public.club_poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.club_polls(id) on delete cascade,
  option_id uuid not null references public.club_poll_options(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

create index if not exists club_poll_options_poll_idx on public.club_poll_options(poll_id, position);
create index if not exists club_poll_votes_poll_idx on public.club_poll_votes(poll_id, option_id);

create or replace function public.enforce_poll_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_tier text;
begin
  select coalesce(p.subscription_tier, 'first_chapter') into owner_tier
  from public.clubs c
  left join public.profiles p on p.id = c.created_by
  where c.id = new.club_id;

  if owner_tier not in ('story_spinner', 'shelf_enchanter', 'library_legend') then
    raise exception 'SUBSCRIPTION_LIMIT: Member polls begin with Story Spinner.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_poll_entitlement_trigger on public.club_polls;
create trigger enforce_poll_entitlement_trigger
before insert or update of club_id on public.club_polls
for each row execute function public.enforce_poll_entitlement();

create or replace function public.validate_poll_vote()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.club_poll_options
    where id = new.option_id and poll_id = new.poll_id
  ) then
    raise exception 'That choice does not belong to this poll.';
  end if;
  if not exists (select 1 from public.club_polls where id = new.poll_id and is_open) then
    raise exception 'This poll is closed.';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_poll_vote_trigger on public.club_poll_votes;
create trigger validate_poll_vote_trigger
before insert or update on public.club_poll_votes
for each row execute function public.validate_poll_vote();

alter table public.club_polls enable row level security;
alter table public.club_poll_options enable row level security;
alter table public.club_poll_votes enable row level security;

drop policy if exists "Club members view polls" on public.club_polls;
create policy "Club members view polls" on public.club_polls
for select to authenticated
using (public.user_is_club_member(club_id));

drop policy if exists "Club managers create polls" on public.club_polls;
create policy "Club managers create polls" on public.club_polls
for insert to authenticated
with check (created_by = auth.uid() and public.user_manages_club(club_id));

drop policy if exists "Club managers update polls" on public.club_polls;
create policy "Club managers update polls" on public.club_polls
for update to authenticated
using (public.user_manages_club(club_id))
with check (public.user_manages_club(club_id));

drop policy if exists "Club managers delete polls" on public.club_polls;
create policy "Club managers delete polls" on public.club_polls
for delete to authenticated
using (public.user_manages_club(club_id));

drop policy if exists "Club members view poll options" on public.club_poll_options;
create policy "Club members view poll options" on public.club_poll_options
for select to authenticated
using (exists (
  select 1 from public.club_polls p
  where p.id = poll_id and public.user_is_club_member(p.club_id)
));

drop policy if exists "Club managers create poll options" on public.club_poll_options;
create policy "Club managers create poll options" on public.club_poll_options
for insert to authenticated
with check (exists (
  select 1 from public.club_polls p
  where p.id = poll_id and public.user_manages_club(p.club_id)
));

drop policy if exists "Club managers delete poll options" on public.club_poll_options;
create policy "Club managers delete poll options" on public.club_poll_options
for delete to authenticated
using (exists (
  select 1 from public.club_polls p
  where p.id = poll_id and public.user_manages_club(p.club_id)
));

drop policy if exists "Club members view poll votes" on public.club_poll_votes;
create policy "Club members view poll votes" on public.club_poll_votes
for select to authenticated
using (exists (
  select 1 from public.club_polls p
  where p.id = poll_id and public.user_is_club_member(p.club_id)
));

drop policy if exists "Club members cast poll votes" on public.club_poll_votes;
create policy "Club members cast poll votes" on public.club_poll_votes
for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.club_polls p
    where p.id = poll_id and p.is_open and public.user_is_club_member(p.club_id)
  )
);

drop policy if exists "Club members change poll votes" on public.club_poll_votes;
create policy "Club members change poll votes" on public.club_poll_votes
for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.club_polls p
    where p.id = poll_id and p.is_open and public.user_is_club_member(p.club_id)
  )
);

drop policy if exists "Club members remove poll votes" on public.club_poll_votes;
create policy "Club members remove poll votes" on public.club_poll_votes
for delete to authenticated
using (user_id = auth.uid());
