-- App Store readiness: user blocking, content reporting, and server-side
-- filtering for the user-generated text that is visible to other readers.

-- Keep books contributed to a shared club if the contributor later deletes
-- their account; the deletion function clears this attribution.
alter table public.club_books alter column added_by drop not null;

create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_not_self check (blocker_id <> blocked_id)
);

alter table public.user_blocks enable row level security;

drop policy if exists "Readers manage their own blocks" on public.user_blocks;
create policy "Readers manage their own blocks"
on public.user_blocks
for all
to authenticated
using (blocker_id = auth.uid())
with check (blocker_id = auth.uid());

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  reported_user_id uuid references auth.users(id) on delete set null,
  message_id uuid references public.chapter_messages(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  reason text not null check (reason in ('harassment','hate','sexual','violence','spam','other')),
  details text check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists content_reports_status_created_at_idx
  on public.content_reports(status, created_at);

alter table public.content_reports enable row level security;

drop policy if exists "Readers submit reports" on public.content_reports;
create policy "Readers submit reports"
on public.content_reports
for insert
to authenticated
with check (reporter_id = auth.uid());

drop policy if exists "Readers view their own reports" on public.content_reports;
create policy "Readers view their own reports"
on public.content_reports
for select
to authenticated
using (reporter_id = auth.uid());

create or replace function public.community_text_is_allowed(value text)
returns boolean
language sql
immutable
as $$
  select coalesce(value, '') !~* '\m(kill[[:space:]]+yourself|n[i1]gg(er|a)s?|f[a@]gg?ots?|cunts?)\M';
$$;

create or replace function public.enforce_community_text()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  combined_text text;
begin
  -- A trigger RECORD only exposes columns from the table that fired it.
  -- Separate branches prevent PostgreSQL from resolving another table's
  -- fields (for example `new.name` while inserting a profile).
  if tg_table_name = 'profiles' then
    combined_text := coalesce(new.display_name, '');
  elsif tg_table_name = 'clubs' then
    combined_text := concat_ws(' ', new.name, new.description);
  elsif tg_table_name = 'chapter_messages' then
    combined_text := coalesce(new.body, '');
  else
    combined_text := '';
  end if;

  if not public.community_text_is_allowed(combined_text) then
    raise exception 'This text does not follow the Community Standards.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_community_text_trigger on public.profiles;
create trigger profiles_community_text_trigger
before insert or update of display_name on public.profiles
for each row execute function public.enforce_community_text();

drop trigger if exists clubs_community_text_trigger on public.clubs;
create trigger clubs_community_text_trigger
before insert or update of name, description on public.clubs
for each row execute function public.enforce_community_text();

drop trigger if exists chapter_messages_community_text_trigger on public.chapter_messages;
create trigger chapter_messages_community_text_trigger
before insert or update of body on public.chapter_messages
for each row execute function public.enforce_community_text();
