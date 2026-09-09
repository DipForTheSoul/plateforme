-- Existing public venues stay public. New practitioner venues are reviewed
-- alongside their event, not through a second practitioner workflow.
alter table public.venues add column review_status text not null default 'approved'
  check (review_status in ('pending', 'approved'));
alter table public.venues alter column review_status set default 'pending';

drop policy "venues: lecture publique (catalogue)" on public.venues;
create policy "venues: lecture publique (catalogue)"
  on public.venues for select to anon, authenticated
  using (review_status = 'approved' or created_by = auth.uid() or public.is_admin());

create or replace function public.guard_venue_review() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.review_status := 'pending';
  end if;
  return new;
end;
$$;
create trigger venue_review_guard before insert or update on public.venues
  for each row execute function public.guard_venue_review();

create or replace function public.approve_event_venue() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status = 'approved' and new.venue_id is not null and public.is_admin() then
    update public.venues set review_status = 'approved'
      where id = new.venue_id and review_status = 'pending';
  end if;
  return new;
end;
$$;
-- Runs in the same transaction as the admin's event approval.
create trigger event_venue_review after insert or update of status, venue_id on public.events
  for each row execute function public.approve_event_venue();
revoke all on function public.guard_venue_review() from public, anon, authenticated;
revoke all on function public.approve_event_venue() from public, anon, authenticated;
