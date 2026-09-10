-- Directory publication is an explicit admin decision, separate from validating
-- the location of an event. Preserve all existing directory entries and data.
alter table public.venues add column is_public boolean not null default false;
update public.venues set is_public = true where review_status = 'approved';

create or replace function public.guard_venue_review() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.review_status := 'pending';
    new.is_public := false;
  end if;
  return new;
end;
$$;
-- event_venue_review still validates the address for the public event, but never
-- changes is_public. Pending directory entries therefore retain event maps.
revoke all on function public.guard_venue_review() from public, anon, authenticated;
