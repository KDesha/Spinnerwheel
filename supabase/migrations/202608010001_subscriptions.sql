-- Spines & Spins subscription entitlements and server-enforced limits.
-- RevenueCat uses the Supabase auth UUID as its App User ID.

alter table public.profiles
  add column if not exists subscription_tier text not null default 'first_chapter',
  add column if not exists subscription_expires_at timestamptz,
  add column if not exists revenuecat_product_id text,
  add column if not exists subscription_store text,
  add column if not exists subscription_updated_at timestamptz not null default now();

do $$ begin
  alter table public.profiles add constraint profiles_subscription_tier_check
    check (subscription_tier in ('first_chapter','story_spinner','shelf_enchanter','library_legend'));
exception when duplicate_object then null;
end $$;

create table if not exists public.revenuecat_webhook_events (
  event_id text primary key,
  event_type text not null,
  app_user_id text,
  received_at timestamptz not null default now()
);

alter table public.revenuecat_webhook_events enable row level security;

create or replace function public.subscription_club_limit(tier text)
returns integer language sql immutable as $$
  select case tier
    when 'story_spinner' then 2
    when 'shelf_enchanter' then 8
    when 'library_legend' then 2147483647
    else 1
  end;
$$;

create or replace function public.subscription_book_limit(tier text)
returns integer language sql immutable as $$
  select case tier
    when 'story_spinner' then 100
    when 'shelf_enchanter' then 500
    when 'library_legend' then 2147483647
    else 25
  end;
$$;

create or replace function public.get_club_plan(target_club_id uuid)
returns text
language sql
security definer
set search_path = public
as $$
  select coalesce(p.subscription_tier, 'first_chapter')
  from public.clubs c
  left join public.profiles p on p.id = c.created_by
  where c.id = target_club_id
    and exists (
      select 1 from public.club_members m
      where m.club_id = c.id and m.user_id = auth.uid()
    );
$$;

grant execute on function public.get_club_plan(uuid) to authenticated;

create or replace function public.enforce_owned_club_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_tier text;
  owned_count integer;
  allowed_count integer;
begin
  if new.created_by is distinct from auth.uid() then
    raise exception 'Only the signed-in owner can create this club.';
  end if;

  perform pg_advisory_xact_lock(hashtext(new.created_by::text));
  select coalesce(subscription_tier, 'first_chapter') into owner_tier
  from public.profiles where id = new.created_by;
  allowed_count := public.subscription_club_limit(owner_tier);
  select count(*) into owned_count from public.clubs where created_by = new.created_by;

  if owned_count >= allowed_count then
    raise exception 'SUBSCRIPTION_LIMIT: % allows % owned club(s).', owner_tier, allowed_count;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_owned_club_limit_trigger on public.clubs;
create trigger enforce_owned_club_limit_trigger
before insert on public.clubs
for each row execute function public.enforce_owned_club_limit();

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
  perform pg_advisory_xact_lock(hashtext(new.club_id::text));
  allowed_count := public.subscription_book_limit(owner_tier);
  select count(*) into book_count from public.club_books where club_id = new.club_id;

  if book_count >= allowed_count then
    raise exception 'SUBSCRIPTION_LIMIT: % allows % books in this club.', owner_tier, allowed_count;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_club_book_limit_trigger on public.club_books;
create trigger enforce_club_book_limit_trigger
before insert on public.club_books
for each row execute function public.enforce_club_book_limit();

create or replace function public.protect_subscription_fields()
returns trigger language plpgsql as $$
begin
  if current_user not in ('postgres', 'service_role') and coalesce(auth.role(), '') <> 'service_role'
    and (new.subscription_tier, new.subscription_expires_at, new.revenuecat_product_id, new.subscription_store)
      is distinct from
        (old.subscription_tier, old.subscription_expires_at, old.revenuecat_product_id, old.subscription_store)
  then
    raise exception 'Subscription fields can only be changed by the verified billing service.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_subscription_fields_trigger on public.profiles;
create trigger protect_subscription_fields_trigger
before update on public.profiles
for each row execute function public.protect_subscription_fields();

