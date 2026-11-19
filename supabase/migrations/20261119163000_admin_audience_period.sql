-- Read-only aggregation over the existing history. No counter or row is reset.
create function public.get_admin_audience_period(p_month text default null)
returns table(visitors bigint, started_at timestamptz, period_start date, period_end date)
language plpgsql stable security invoker
set search_path = ''
set statement_timeout = '3s'
as $$
declare
  today date := (now() at time zone 'Europe/Zurich')::date;
  first_day date;
  last_day date;
begin
  if public.is_admin() is not true then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if p_month is null then
    first_day := today - 29;
    last_day := today;
  else
    if p_month !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then
      raise exception 'Invalid month' using errcode = '22023';
    end if;
    first_day := (p_month || '-01')::date;
    if first_day > today or first_day < date '2000-01-01' then
      raise exception 'Invalid month' using errcode = '22023';
    end if;
    last_day := least((first_day + interval '1 month' - interval '1 day')::date, today);
  end if;
  return query
    select count(distinct v.browser_id), m.started_at, first_day, last_day
    from public.audience_measurement m
    left join public.audience_visitors v on v.day between first_day and last_day
    group by m.started_at;
end;
$$;
revoke all on function public.get_admin_audience_period(text) from public, anon;
grant execute on function public.get_admin_audience_period(text) to authenticated;
