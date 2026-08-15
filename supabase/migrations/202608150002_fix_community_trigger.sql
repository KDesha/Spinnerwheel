-- Correct the shared moderation trigger so each invocation only references
-- columns that exist on the table that fired it.
create or replace function public.enforce_community_text()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  combined_text text;
begin
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
