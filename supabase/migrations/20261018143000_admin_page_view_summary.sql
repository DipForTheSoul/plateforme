-- Read only: no historical rows or event counters are modified.
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
    select split_part(split_part(v.path, '?', 1), '#', 1) as path, count(*) as views
    from public.page_views v
    where v.created_at >= now() - interval '30 days'
      and split_part(split_part(v.path, '?', 1), '#', 1) !~ '^/(fr/|de/|en/)?(admin|espace-praticien)(/|$)'
    group by 1
  ), top_pages as (
    select c.path, c.views from counts c order by c.views desc, c.path limit 8
  )
  select coalesce((select sum(c.views) from counts c),0)::bigint,
    coalesce((select jsonb_agg(jsonb_build_object('path',p.path,'views',p.views) order by p.views desc,p.path) from top_pages p),'[]'::jsonb);
end;
$$;
revoke all on function public.get_admin_page_view_summary() from public, anon;
grant execute on function public.get_admin_page_view_summary() to authenticated;
