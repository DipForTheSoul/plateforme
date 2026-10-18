-- New measurement starts empty. Never update/delete page_views, events or audience_visitors.
create table public.audience_page_visitors (
  day date not null default (now() at time zone 'Europe/Zurich')::date,
  browser_id uuid not null,
  path text not null check (length(path) between 1 and 200 and path like '/%'),
  primary key(day,browser_id,path)
);
alter table public.audience_page_visitors enable row level security;
revoke all on public.audience_page_visitors from public, anon, authenticated;
grant select on public.audience_page_visitors to authenticated;
grant select,insert on public.audience_page_visitors to service_role;
create policy audience_pages_admin_read on public.audience_page_visitors for select to authenticated using(public.is_admin());

create or replace function public.get_admin_page_view_summary()
returns table(total bigint, pages jsonb)
language plpgsql stable security invoker
set search_path = public
set statement_timeout = '3s'
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  return query
  with counts as (
    select v.path,count(*) as views from public.audience_page_visitors v
    where v.day >= (now() at time zone 'Europe/Zurich')::date - 29
    group by v.path
  ), top_pages as (
    select c.path,c.views from counts c order by c.views desc,c.path limit 8
  )
  select coalesce((select sum(c.views) from counts c),0)::bigint,
    coalesce((select jsonb_agg(jsonb_build_object('path',p.path,'views',p.views) order by p.views desc,p.path) from top_pages p),'[]'::jsonb);
end;
$$;
revoke all on function public.get_admin_page_view_summary() from public,anon;
grant execute on function public.get_admin_page_view_summary() to authenticated;
