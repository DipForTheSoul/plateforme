-- Additive only. Historical page_views and event counters are not changed.
create table public.audience_visitors (
  browser_id uuid not null,
  day date not null default (now() at time zone 'Europe/Zurich')::date,
  primary key(day, browser_id)
);
alter table public.audience_visitors enable row level security;
revoke all on public.audience_visitors from anon, authenticated;
grant select on public.audience_visitors to authenticated;
grant select, insert on public.audience_visitors to service_role;
create policy audience_admin_read on public.audience_visitors for select to authenticated using (public.is_admin());
create table public.audience_measurement (
  singleton boolean primary key default true check(singleton),
  started_at timestamptz not null default now()
);
insert into public.audience_measurement(singleton) values(true);
alter table public.audience_measurement enable row level security;
revoke all on public.audience_measurement from anon, authenticated;
grant select on public.audience_measurement to authenticated;
create policy audience_measurement_admin on public.audience_measurement for select to authenticated using(public.is_admin());
create function public.get_admin_visitors()
returns table(visitors bigint, started_at timestamptz)
language plpgsql stable security invoker
set search_path = public
set statement_timeout = '3s'
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  return query select count(distinct v.browser_id), m.started_at
    from public.audience_measurement m
    left join public.audience_visitors v on v.day >= (now() at time zone 'Europe/Zurich')::date - 29
    group by m.started_at;
end;
$$;
revoke all on function public.get_admin_visitors() from public, anon;
grant execute on function public.get_admin_visitors() to authenticated;
