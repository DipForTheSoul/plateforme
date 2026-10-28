begin;
-- New statistical storage only. Never change/delete the legacy audience,
-- page_views, events or audience_measurement history.
create table public.internal_audience_visitors (
  day date not null,
  browser_id uuid not null,
  primary key(day,browser_id)
);
create table public.internal_audience_pages (
  day date not null,
  path text not null check(length(path) between 1 and 200 and path like '/%'),
  page_token text not null check(page_token ~ '^[0-9a-f]{64}$'),
  primary key(day,path,page_token)
);
-- Long-term totals have no browser identifiers and no link between pages.
create table public.internal_audience_archive (
  day date not null,
  kind text not null check(kind in ('visitors','pages')),
  path text not null default '',
  observations bigint not null check(observations>=0),
  primary key(day,kind,path)
);
alter table public.internal_audience_visitors enable row level security;
alter table public.internal_audience_pages enable row level security;
alter table public.internal_audience_archive enable row level security;
revoke all on public.internal_audience_visitors,public.internal_audience_pages,public.internal_audience_archive from public,anon,authenticated;
grant select on public.internal_audience_visitors,public.internal_audience_pages,public.internal_audience_archive to authenticated;
grant select,insert,update,delete on public.internal_audience_visitors,public.internal_audience_pages,public.internal_audience_archive to service_role;
create policy internal_visitors_admin on public.internal_audience_visitors for select to authenticated using(public.is_admin());
create policy internal_pages_admin on public.internal_audience_pages for select to authenticated using(public.is_admin());
create policy internal_archive_admin on public.internal_audience_archive for select to authenticated using(public.is_admin());

create function public.record_internal_audience(p_browser_id uuid,p_path text,p_page_token text,p_day date)
returns void language plpgsql security invoker set search_path=public,pg_temp set statement_timeout='3s' as $$
begin
  if p_browser_id is null or p_path is null or p_page_token is null or p_day is null
     or abs(p_day-(now() at time zone 'Europe/Zurich')::date)>1
     or p_page_token !~ '^[0-9a-f]{64}$' or length(p_path) not between 1 and 200
     or p_path !~ '^/[^/]' and p_path<>'/' then
    raise exception 'Invalid statistical record' using errcode='22023';
  end if;
  insert into public.internal_audience_visitors(day,browser_id) values(p_day,p_browser_id) on conflict do nothing;
  -- Preserve the cutover day's per-page count for already measured browsers.
  if not exists(select 1 from public.audience_page_visitors where day=p_day and browser_id=p_browser_id and path=p_path) then
    insert into public.internal_audience_pages(day,path,page_token) values(p_day,p_path,p_page_token) on conflict do nothing;
  end if;
end; $$;
revoke all on function public.record_internal_audience(uuid,text,text,date) from public,anon,authenticated;
grant execute on function public.record_internal_audience(uuid,text,text,date) to service_role;

create or replace function public.get_admin_visitors()
returns table(visitors bigint,started_at timestamptz) language plpgsql stable security invoker
set search_path=public,pg_temp set statement_timeout='3s' as $$
begin
  if public.is_admin() is not true then raise exception 'Administrator access required' using errcode='42501'; end if;
  return query with measured as (
    select browser_id from public.audience_visitors where day >= (now() at time zone 'Europe/Zurich')::date-29
    union
    select browser_id from public.internal_audience_visitors where day >= (now() at time zone 'Europe/Zurich')::date-29
  ) select (select count(*) from measured),m.started_at from public.audience_measurement m;
end; $$;
revoke all on function public.get_admin_visitors() from public,anon;
grant execute on function public.get_admin_visitors() to authenticated;

create or replace function public.get_admin_page_view_summary()
returns table(total bigint,pages jsonb) language plpgsql stable security invoker
set search_path=public,pg_temp set statement_timeout='3s' as $$
begin
  if public.is_admin() is not true then raise exception 'Administrator access required' using errcode='42501'; end if;
  return query with records as (
    select path from public.audience_page_visitors where day >= (now() at time zone 'Europe/Zurich')::date-29
    union all select path from public.internal_audience_pages where day >= (now() at time zone 'Europe/Zurich')::date-29
  ), counts as (select path,count(*) as views from records group by path),
  top_pages as (select * from counts order by views desc,path limit 8)
  select (select count(*) from records),coalesce((select jsonb_agg(jsonb_build_object('path',t.path,'views',t.views) order by t.views desc,t.path) from top_pages t),'[]'::jsonb);
end; $$;
revoke all on function public.get_admin_page_view_summary() from public,anon;
grant execute on function public.get_admin_page_view_summary() to authenticated;

create function public.archive_internal_audience()
returns void language plpgsql security invoker set search_path=public,pg_temp set statement_timeout='15s' as $$
begin
  -- Transactional archival: keep the numbers, discard only expired new tokens.
  -- Legacy consented history is never affected.
  if not pg_try_advisory_xact_lock(28092026,3) then return; end if;
  with expired as (
    delete from public.internal_audience_visitors where day < (now() at time zone 'Europe/Zurich')::date-30 returning day
  ) insert into public.internal_audience_archive(day,kind,path,observations)
    select day,'visitors','',count(*) from expired group by day
    on conflict(day,kind,path) do update set observations=internal_audience_archive.observations+excluded.observations;
  with expired as (
    delete from public.internal_audience_pages where day < (now() at time zone 'Europe/Zurich')::date-30 returning day,path
  ) insert into public.internal_audience_archive(day,kind,path,observations)
    select day,'pages',path,count(*) from expired group by day,path
    on conflict(day,kind,path) do update set observations=internal_audience_archive.observations+excluded.observations;
end; $$;
revoke all on function public.archive_internal_audience() from public,anon,authenticated;
grant execute on function public.archive_internal_audience() to service_role;

-- Schedule only where supported (the PGlite SQL test engine has no extensions).
-- Real local/production PostgreSQL must verify this job exists and is active.
do $$ begin
  if exists(select 1 from pg_available_extensions where name='pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('fts-internal-audience-retention','15 * * * *','select public.archive_internal_audience();');
  end if;
end $$;
commit;
