-- A club insert returns the newly created row before the membership helper is
-- reliably visible to the SELECT policy. Owners must be able to read their own
-- row directly so `.insert(...).select()` succeeds atomically.
drop policy if exists "v2 select" on public.clubs;

create policy "v2 select"
on public.clubs
for select
to authenticated
using (
  is_public
  or created_by = auth.uid()
  or public.is_club_member(id)
);
