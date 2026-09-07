begin;
create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
alter table public.credit_packs add column if not exists accounting_active boolean not null default true;
alter table public.credit_transactions drop constraint if exists credit_transactions_type_check;
alter table public.credit_transactions add constraint credit_transactions_type_check check(type in ('purchase','manual','consumption','expiration'));

-- Historical pack rows were not decremented. Preserve them for audit, but do not
-- infer debts/expiry from them. Grandfather the actual pre-cutover balance.
lock table public.practitioners,public.credit_packs in share row exclusive mode;
update public.credit_packs set accounting_active=false;
insert into public.credit_packs(practitioner_id,credits_total,credits_remaining,expires_at,source)
select id,credits,credits,null,'manual' from public.practitioners where credits>0;
create unique index credit_packs_payment_unique on public.credit_packs(stripe_session_id)
  where stripe_session_id is not null and accounting_active;

create or replace function private.sync_credit_balance(pid uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare expired integer; balance integer;
begin
  perform 1 from public.practitioners where id=pid for update;
  if not found then raise exception 'Praticien introuvable.'; end if;
  select coalesce(sum(credits_remaining),0) into expired from public.credit_packs
    where practitioner_id=pid and accounting_active and credits_remaining>0 and expires_at<=now();
  if expired>0 then
    update public.credit_packs set credits_remaining=0 where practitioner_id=pid and accounting_active and expires_at<=now() and credits_remaining>0;
    insert into public.credit_transactions(practitioner_id,amount,type,note) values(pid,-expired,'expiration','Expiration de crédits non utilisés');
  end if;
  select coalesce(sum(credits_remaining),0) into balance from public.credit_packs where practitioner_id=pid and accounting_active;
  perform set_config('app.credit_op','1',true);
  update public.practitioners set credits=balance where id=pid;
  return balance;
end $$;
revoke all on function private.sync_credit_balance(uuid) from public,anon,authenticated;

create or replace function public.get_credit_balance(p_practitioner_id uuid)
returns integer language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or not(public.is_admin() or p_practitioner_id=public.current_practitioner_id()) then raise exception 'Non autorisé.'; end if;
  return private.sync_credit_balance(p_practitioner_id);
end $$;
revoke all on function public.get_credit_balance(uuid) from public,anon;
grant execute on function public.get_credit_balance(uuid) to authenticated;

create or replace function private.take_pack_credits(pid uuid,amount integer)
returns void language plpgsql security definer set search_path='' as $$
declare pack record; needed integer:=amount; used integer;
begin
  if amount<1 or private.sync_credit_balance(pid)<amount then raise exception 'Solde insuffisant.'; end if;
  for pack in select id,credits_remaining from public.credit_packs where practitioner_id=pid and accounting_active and credits_remaining>0
    order by expires_at nulls last,created_at,id for update loop
    used:=least(needed,pack.credits_remaining);
    update public.credit_packs set credits_remaining=credits_remaining-used where id=pack.id;
    needed:=needed-used;
    exit when needed=0;
  end loop;
  if needed<>0 then raise exception 'Solde incohérent.'; end if;
  perform private.sync_credit_balance(pid);
end $$;
revoke all on function private.take_pack_credits(uuid,integer) from public,anon,authenticated;

create or replace function public.consume_credit(p_note text default null)
returns void language plpgsql security definer set search_path='' as $$
declare pid uuid:=public.current_practitioner_id();
begin
  if auth.uid() is null or pid is null then raise exception 'Connexion praticien requise.'; end if;
  if private.sync_credit_balance(pid)<1 then raise exception 'Solde de publications épuisé. Rachetez un pack pour publier.'; end if;
  perform private.take_pack_credits(pid,1);
  insert into public.credit_transactions(practitioner_id,amount,type,note) values(pid,-1,'consumption',coalesce(p_note,'Dépôt d''événement'));
end $$;
-- Only the checked atomic deposit calls this internal debit. Old two-step
-- clients fail BEFORE debit, instead of losing a credit on their INSERT.
revoke all on function public.consume_credit(text) from public,anon,authenticated;

create or replace function private.new_credit_pack(pid uuid,amount integer,source_name text,session_id text default null)
returns void language plpgsql security definer set search_path='' as $$
declare validity integer;
begin
  select case when value~'^[0-9]{1,5}$' then greatest(1,least(value::integer,36500)) else 365 end
    into validity from public.settings where key='pack_default_valid_days';
  insert into public.credit_packs(practitioner_id,credits_total,credits_remaining,expires_at,source,stripe_session_id)
    values(pid,amount,amount,now()+make_interval(days=>coalesce(validity,365)),source_name,session_id);
  perform private.sync_credit_balance(pid);
end $$;
revoke all on function private.new_credit_pack(uuid,integer,text,text) from public,anon,authenticated;

create or replace function public.adjust_credits_transaction(p_practitioner_id uuid,p_delta integer,p_request_id uuid,p_note text default null)
returns integer language plpgsql security definer set search_path='' as $$
declare previous public.credit_transactions%rowtype; balance integer;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Réservé à l''administrateur.'; end if;
  if p_delta is null or p_delta=0 or abs(p_delta::bigint)>10000 or p_request_id is null then raise exception 'Montant ou identifiant invalide.'; end if;
  balance:=private.sync_credit_balance(p_practitioner_id);
  select * into previous from public.credit_transactions where request_id=p_request_id;
  if found then
    if previous.practitioner_id<>p_practitioner_id or previous.amount<>p_delta then raise exception 'Identifiant déjà utilisé.'; end if;
    return balance;
  end if;
  if p_delta<0 then perform private.take_pack_credits(p_practitioner_id,-p_delta);
  else perform private.new_credit_pack(p_practitioner_id,p_delta,'manual'); end if;
  insert into public.credit_transactions(practitioner_id,amount,type,note,request_id)
    values(p_practitioner_id,p_delta,'manual',left(p_note,1000),p_request_id);
  return private.sync_credit_balance(p_practitioner_id);
end $$;
revoke all on function public.adjust_credits_transaction(uuid,integer,uuid,text) from public,anon;
grant execute on function public.adjust_credits_transaction(uuid,integer,uuid,text) to authenticated;

create or replace function public.add_credits(p_practitioner_id uuid,p_amount integer,p_stripe_session_id text)
returns boolean language plpgsql security definer set search_path='' as $$
declare inserted_id uuid;
begin
  if p_amount is null or p_amount<1 or p_amount>10000 or nullif(trim(p_stripe_session_id),'') is null then raise exception 'Paiement invalide.'; end if;
  perform private.sync_credit_balance(p_practitioner_id);
  insert into public.credit_transactions(practitioner_id,amount,type,stripe_session_id) values(p_practitioner_id,p_amount,'purchase',p_stripe_session_id)
    on conflict(stripe_session_id) do nothing returning id into inserted_id;
  if inserted_id is null then return false; end if;
  perform private.new_credit_pack(p_practitioner_id,p_amount,'purchase',p_stripe_session_id);
  return true;
end $$;
revoke all on function public.add_credits(uuid,integer,text) from public,anon,authenticated;
grant execute on function public.add_credits(uuid,integer,text) to service_role;

create or replace function public.grant_credits(p_practitioner_id uuid,p_amount integer,p_note text default null)
returns void language plpgsql security definer set search_path='' as $$
begin
  if p_amount is null or p_amount<1 then raise exception 'Montant invalide.'; end if;
  perform public.adjust_credits_transaction(p_practitioner_id,p_amount,gen_random_uuid(),p_note);
end $$;
revoke all on function public.grant_credits(uuid,integer,text) from public,anon;
grant execute on function public.grant_credits(uuid,integer,text) to authenticated;
notify pgrst,'reload schema';
commit;
