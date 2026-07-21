-- ForTheSoul — Correctif : consommation de crédit bloquée par le garde-fou.
--
-- Problème : `guard_practitioner_sensitive_fields` interdit toute modification
-- de `credits` à un non-admin dont `auth.uid()` est non nul. Or `consume_credit`
-- (SECURITY DEFINER) est appelée PAR le praticien lui-même : `auth.uid()` reste
-- renseigné, donc le trigger bloquait la consommation → un praticien ne pouvait
-- jamais publier ("Impossible de consommer un crédit").
--
-- Solution : les fonctions de crédit de confiance posent un drapeau de session
-- transactionnel `app.credit_op = '1'` que le garde-fou reconnaît pour laisser
-- passer la variation de crédits. Le drapeau ne peut PAS être posé via l'API
-- REST (PostgREST), donc un praticien ne peut toujours pas trafiquer son solde.

-- 1) Garde-fou : autoriser la variation de crédits quand le drapeau est posé.
create or replace function public.guard_practitioner_sensitive_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and auth.uid() is not null then
    if new.status is distinct from old.status then
      raise exception 'Statut modifiable uniquement par un administrateur.';
    end if;
    if new.credits is distinct from old.credits
       and coalesce(current_setting('app.credit_op', true), '') <> '1' then
      raise exception 'Crédits modifiables uniquement via achat ou administrateur.';
    end if;
  end if;
  return new;
end $$;

-- 2) consume_credit : pose le drapeau de confiance avant de décrémenter.
create or replace function public.consume_credit(p_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  pid uuid;
  remaining integer;
begin
  select id, credits into pid, remaining
  from practitioners where user_id = auth.uid()
  for update;

  if pid is null then
    raise exception 'Aucune fiche praticien pour cet utilisateur.';
  end if;
  if remaining < 1 then
    raise exception 'Solde de publications épuisé. Rachetez un pack pour publier.';
  end if;

  perform set_config('app.credit_op', '1', true);  -- drapeau transactionnel de confiance
  update practitioners set credits = credits - 1 where id = pid;
  insert into credit_transactions (practitioner_id, amount, type, note)
  values (pid, -1, 'consumption', coalesce(p_note, 'Dépôt d''événement'));
end $$;
