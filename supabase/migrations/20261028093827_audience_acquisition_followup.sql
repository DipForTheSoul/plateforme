begin;
alter table public.internal_audience_visitors
  add column channel text not null default 'unknown' check(channel in ('paid_search','paid_social','paid_other','google','search_other','social','email','referral','direct','unknown')),
  add column country text not null default 'ZZ' check(country ~ '^[A-Z]{2}$'),
  add column device text not null default 'unknown' check(device in ('mobile','tablet','desktop','unknown'));
create table public.internal_audience_pageviews (
  day date not null, path text not null check(length(path) between 1 and 200),
  views bigint not null default 0 check(views>=0), primary key(day,path)
);
-- Request tokens have no browser ID, path or identity attached.
create table public.internal_audience_requests(day date not null,event_id uuid not null,primary key(day,event_id));
create table public.internal_audience_signups(day date not null,browser_id uuid not null,primary key(day,browser_id));
create table public.internal_audience_settings(singleton boolean primary key default true check(singleton),started_at timestamptz not null default now());
insert into public.internal_audience_settings(singleton) values(true);
alter table public.internal_audience_pageviews enable row level security;
alter table public.internal_audience_requests enable row level security;
alter table public.internal_audience_signups enable row level security;
alter table public.internal_audience_settings enable row level security;
revoke all on public.internal_audience_pageviews,public.internal_audience_requests,public.internal_audience_signups,public.internal_audience_settings from public,anon,authenticated;
grant select on public.internal_audience_pageviews,public.internal_audience_signups,public.internal_audience_settings to authenticated;
grant select,insert,update,delete on public.internal_audience_pageviews,public.internal_audience_requests,public.internal_audience_signups,public.internal_audience_settings to service_role;
create policy audience_views_admin on public.internal_audience_pageviews for select to authenticated using(public.is_admin());
create policy audience_signups_admin on public.internal_audience_signups for select to authenticated using(public.is_admin());
create policy audience_settings_admin on public.internal_audience_settings for select to authenticated using(public.is_admin());

create function public.record_audience_visit(p_browser_id uuid,p_path text,p_page_token text,p_day date,p_event_id uuid,p_channel text,p_country text,p_device text)
returns void language plpgsql security invoker set search_path=public,pg_temp set statement_timeout='3s' as $$
begin
  if p_event_id is null then raise exception 'Missing visit token' using errcode='22023'; end if;
  insert into public.internal_audience_requests(day,event_id) values(p_day,p_event_id) on conflict do nothing;
  if not found then return; end if;
  insert into public.internal_audience_visitors(day,browser_id,channel,country,device)
    values(p_day,p_browser_id,p_channel,p_country,p_device) on conflict do nothing;
  perform public.record_internal_audience(p_browser_id,p_path,p_page_token,p_day);
  insert into public.internal_audience_pageviews(day,path,views) values(p_day,p_path,1)
    on conflict(day,path) do update set views=internal_audience_pageviews.views+1;
end; $$;
revoke all on function public.record_audience_visit(uuid,text,text,date,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.record_audience_visit(uuid,text,text,date,uuid,text,text,text) to service_role;

create function public.record_audience_signup(p_browser_id uuid)
returns void language plpgsql security invoker set search_path=public,pg_temp set statement_timeout='3s' as $$
begin
  -- Called only after a real new account is created. No account ID is retained.
  if exists(select 1 from public.internal_audience_visitors where browser_id=p_browser_id and day >= (now() at time zone 'Europe/Zurich')::date-89) then
    insert into public.internal_audience_signups(day,browser_id) values((now() at time zone 'Europe/Zurich')::date,p_browser_id) on conflict do nothing;
  end if;
end; $$;
revoke all on function public.record_audience_signup(uuid) from public,anon,authenticated;
grant execute on function public.record_audience_signup(uuid) to service_role;

create function public.get_admin_audience_followup(p_days integer default 30)
returns jsonb language plpgsql stable security invoker set search_path=public,pg_temp set statement_timeout='4s' as $$
declare result jsonb; first_day date; last_day date;
begin
  if public.is_admin() is not true then raise exception 'Administrator access required' using errcode='42501'; end if;
  if p_days not in (7,30,90) or p_days is null then raise exception 'Invalid audience period' using errcode='22023'; end if;
  last_day:=(now() at time zone 'Europe/Zurich')::date;first_day:=last_day-p_days+1;
  with legacy as (select day,browser_id from public.audience_visitors where day between first_day and last_day),
  current_records as (select * from public.internal_audience_visitors where day between first_day and last_day),
  all_visitors as (select browser_id from legacy union select browser_id from current_records),
  first_known as (select distinct on(browser_id) browser_id,channel,country,device from current_records order by browser_id,day),
  acquisition as (select v.browser_id,coalesce(k.channel,'unknown') channel,coalesce(k.country,'ZZ') country,coalesce(k.device,'unknown') device from all_visitors v left join first_known k using(browser_id)),
  sources as (select channel,count(*) n from acquisition group by channel),
  countries as (select country,count(*) n from acquisition group by country order by n desc,country limit 10),
  devices as (select device,count(*) n from acquisition group by device),
  daily_visitors as (select day,count(distinct browser_id) n from (select day,browser_id from legacy union select day,browser_id from current_records) d group by day),
  calendar as (select g::date as day from generate_series(first_day::timestamp,last_day::timestamp,interval '1 day') g),
  page_counts as (select path,sum(views) n from public.internal_audience_pageviews where day between first_day and last_day group by path order by n desc,path limit 10),
  conversions as (select distinct s.browser_id from public.internal_audience_signups s join first_known k using(browser_id) where s.day between first_day and last_day)
  select jsonb_build_object(
    'days',p_days,'from',first_day,'to',last_day,'started_at',(select started_at from public.internal_audience_settings),
    'visitors',(select count(*) from all_visitors),'measured_visitors',(select count(*) from first_known),
    'page_views',(select coalesce(sum(views),0) from public.internal_audience_pageviews where day between first_day and last_day),
    'signups',(select count(*) from conversions),
    'conversion_rate',case when (select count(*) from first_known)>0 then round(100.0*(select count(*) from conversions)/(select count(*) from first_known),1) else null end,
    'paid',(select coalesce(sum(n),0) from sources where channel in ('paid_search','paid_social','paid_other')),
    'google',(select coalesce(sum(n),0) from sources where channel='google'),
    'sources',coalesce((select jsonb_agg(jsonb_build_object('name',channel,'count',n) order by n desc,channel) from sources),'[]'::jsonb),
    'countries',coalesce((select jsonb_agg(jsonb_build_object('name',country,'count',n) order by n desc,country) from countries),'[]'::jsonb),
    'devices',coalesce((select jsonb_agg(jsonb_build_object('name',device,'count',n) order by n desc,device) from devices),'[]'::jsonb),
    'pages',coalesce((select jsonb_agg(jsonb_build_object('name',path,'count',n) order by n desc,path) from page_counts),'[]'::jsonb),
    'daily',(select jsonb_agg(jsonb_build_object('day',c.day,'visitors',coalesce(v.n,0),'views',coalesce((select sum(p.views) from public.internal_audience_pageviews p where p.day=c.day),0)) order by c.day) from calendar c left join daily_visitors v on v.day=c.day)
  ) into result;
  return result;
end; $$;
revoke all on function public.get_admin_audience_followup(integer) from public,anon;
grant execute on function public.get_admin_audience_followup(integer) to authenticated;

alter table public.internal_audience_archive drop constraint internal_audience_archive_kind_check;
alter table public.internal_audience_archive add constraint internal_audience_archive_kind_check check(kind in ('visitors','pages','signups'));

create or replace function public.archive_internal_audience()
returns void language plpgsql security invoker set search_path=public,pg_temp set statement_timeout='15s' as $$
begin
  if not pg_try_advisory_xact_lock(28092026,3) then return; end if;
  with expired as (delete from public.internal_audience_visitors where day < (now() at time zone 'Europe/Zurich')::date-90 returning day)
  insert into public.internal_audience_archive(day,kind,path,observations) select day,'visitors','',count(*) from expired group by day
    on conflict(day,kind,path) do update set observations=internal_audience_archive.observations+excluded.observations;
  with expired as (delete from public.internal_audience_pages where day < (now() at time zone 'Europe/Zurich')::date-90 returning day,path)
  insert into public.internal_audience_archive(day,kind,path,observations) select day,'pages',path,count(*) from expired group by day,path
    on conflict(day,kind,path) do update set observations=internal_audience_archive.observations+excluded.observations;
  -- Totals of true page views are anonymous aggregates and remain intact.
  delete from public.internal_audience_requests where day < (now() at time zone 'Europe/Zurich')::date-90;
  with expired as (delete from public.internal_audience_signups where day < (now() at time zone 'Europe/Zurich')::date-90 returning day)
  insert into public.internal_audience_archive(day,kind,path,observations) select day,'signups','',count(*) from expired group by day
    on conflict(day,kind,path) do update set observations=internal_audience_archive.observations+excluded.observations;
end; $$;
commit;
