begin;

alter table public.credit_transactions add column if not exists request_id uuid unique;

-- One locked balance, one ledger entry and (for an addition) one pack in the
-- same transaction. Retries of an uncertain network response are idempotent.
create or replace function public.adjust_credits_atomic(
  p_practitioner_id uuid, p_delta integer, p_request_id uuid, p_note text default null
) returns integer language plpgsql security definer set search_path = '' as $$
declare
  balance integer;
  previous public.credit_transactions%rowtype;
  validity integer := 365;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Réservé à l''administrateur.'; end if;
  if p_delta is null or p_delta = 0 or abs(p_delta::bigint) > 10000 or p_request_id is null then raise exception 'Montant ou identifiant invalide.'; end if;
  select credits into balance from public.practitioners where id=p_practitioner_id for update;
  if not found then raise exception 'Praticien introuvable.'; end if;
  select * into previous from public.credit_transactions where request_id=p_request_id;
  if found then
    if previous.practitioner_id <> p_practitioner_id or previous.amount <> p_delta then raise exception 'Identifiant déjà utilisé.'; end if;
    return balance;
  end if;
  if balance + p_delta < 0 then raise exception 'Solde insuffisant : aucune modification effectuée.'; end if;
  insert into public.credit_transactions(practitioner_id,amount,type,note,request_id)
    values(p_practitioner_id,p_delta,'manual',left(p_note,1000),p_request_id);
  update public.practitioners set credits=credits+p_delta where id=p_practitioner_id;
  if p_delta > 0 then
    select case when value ~ '^[0-9]{1,5}$' then greatest(1,least(value::integer,36500)) else 365 end
      into validity from public.settings where key='pack_default_valid_days';
    insert into public.credit_packs(practitioner_id,credits_total,credits_remaining,expires_at,source)
      values(p_practitioner_id,p_delta,p_delta,now()+make_interval(days=>coalesce(validity,365)),'manual');
  end if;
  return balance+p_delta;
end $$;
revoke all on function public.adjust_credits_atomic(uuid,integer,uuid,text) from public,anon;
grant execute on function public.adjust_credits_atomic(uuid,integer,uuid,text) to authenticated;

-- Explicit service-role grant: public/anon/authenticated must never credit an
-- arbitrary account via a forged Stripe session identifier.
grant execute on function public.add_credits(uuid,integer,text) to service_role;

notify pgrst, 'reload schema';
commit;
