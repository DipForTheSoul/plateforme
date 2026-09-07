-- Shared per-key limits. No raw addresses, passwords or visitor identifiers.
create table private.request_limits (
  key text primary key check (key ~ '^[a-f0-9]{64}$'),
  hits integer not null check(hits>=0),
  expires_at timestamptz not null
);
alter table private.request_limits enable row level security;
create index request_limits_expiry_idx on private.request_limits(expires_at);
revoke all on private.request_limits from public,anon,authenticated;
grant usage on schema private to service_role;
grant select,insert,update,delete on private.request_limits to service_role;

create or replace function public.take_request_slot(p_key text,p_limit integer,p_window_seconds integer)
returns boolean language plpgsql security invoker set search_path = public,private as $$
declare used integer; stamp timestamptz:=clock_timestamp();
begin
  if p_key !~ '^[a-f0-9]{64}$' or p_limit not between 1 and 1000 or p_window_seconds not between 1 and 86400 then
    raise exception 'Invalid rate limit parameters';
  end if;
  delete from private.request_limits where key in (
    select key from private.request_limits where expires_at<stamp-interval '1 day' order by expires_at limit 100
  );
  insert into private.request_limits(key,hits,expires_at)
    values(p_key,1,stamp+make_interval(secs=>p_window_seconds))
  on conflict(key) do update set
    hits=case when request_limits.expires_at<=stamp then 1 else least(request_limits.hits+1,p_limit+1) end,
    expires_at=case when request_limits.expires_at<=stamp then stamp+make_interval(secs=>p_window_seconds) else request_limits.expires_at end
  returning hits into used;
  return used<=p_limit;
end $$;
revoke all on function public.take_request_slot(text,integer,integer) from public,anon,authenticated;
grant execute on function public.take_request_slot(text,integer,integer) to service_role;

-- Public submissions now pass through validated, rate-limited server handlers.
-- Otherwise callers could bypass the form and its limits with the public API key.
revoke insert,update,delete on public.contacts,public.contact_messages,public.page_views from anon;
revoke insert on public.contacts,public.contact_messages,public.page_views from authenticated;
-- Favorites remain on the visitor's device. The unused historical mirror is retained read-only.
revoke insert,update,delete on public.favorites from anon,authenticated;
