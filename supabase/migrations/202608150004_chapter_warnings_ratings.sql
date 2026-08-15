alter table public.chapter_messages
  add column if not exists trigger_warning boolean not null default false,
  add column if not exists chapter_rating smallint;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chapter_messages_chapter_rating_check'
      and conrelid = 'public.chapter_messages'::regclass
  ) then
    alter table public.chapter_messages
      add constraint chapter_messages_chapter_rating_check
      check (chapter_rating is null or chapter_rating between 1 and 5);
  end if;
end
$$;

create index if not exists chapter_messages_trigger_warning_idx
  on public.chapter_messages (chapter_id)
  where trigger_warning;

comment on column public.chapter_messages.trigger_warning is
  'Member-supplied content warning for the chapter conversation.';

comment on column public.chapter_messages.chapter_rating is
  'Optional one-to-five heart rating supplied with a chapter message.';
