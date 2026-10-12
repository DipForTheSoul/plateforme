-- Mise en avant payante self-service, activée uniquement par webhook Stripe signé.
insert into public.settings(key,value) values ('featured_price_chf','20') on conflict (key) do nothing;

create table if not exists public.featured_purchases (
  stripe_session_id text primary key,
  event_id uuid not null references public.events(id) on delete restrict,
  practitioner_id uuid not null references public.practitioners(id) on delete restrict,
  amount_chf numeric(10,2) not null check (amount_chf > 0),
  duration_days integer not null check (duration_days between 1 and 36500),
  created_at timestamptz not null default now()
);
alter table public.featured_purchases enable row level security;

create or replace function public.activate_featured_purchase(
  p_event_id uuid,p_practitioner_id uuid,p_stripe_session_id text,p_duration_days integer,p_amount_chf numeric
) returns boolean language plpgsql security definer set search_path=public as $$
declare inserted_session text;
begin
  if coalesce(current_setting('request.jwt.claim.role',true),'') <> 'service_role' then raise exception 'Service role required.'; end if;
  if p_duration_days not between 1 and 36500 or p_amount_chf <= 0 or length(p_stripe_session_id) < 8 then raise exception 'Invalid featured purchase.'; end if;
  perform 1 from public.events where id=p_event_id and practitioner_id=p_practitioner_id and status='approved' and parent_event_id is null for update;
  if not found then raise exception 'Eligible event not found.'; end if;
  insert into public.featured_purchases(stripe_session_id,event_id,practitioner_id,amount_chf,duration_days)
  values(p_stripe_session_id,p_event_id,p_practitioner_id,p_amount_chf,p_duration_days)
  on conflict(stripe_session_id) do nothing returning stripe_session_id into inserted_session;
  if inserted_session is null then return false; end if;
  update public.events set is_top=true,featured_until=greatest(coalesce(featured_until,now()),now())+make_interval(days=>p_duration_days) where id=p_event_id;
  return true;
end $$;
revoke all on function public.activate_featured_purchase(uuid,uuid,text,integer,numeric) from public,anon,authenticated;
grant execute on function public.activate_featured_purchase(uuid,uuid,text,integer,numeric) to service_role;
notify pgrst,'reload schema';
