-- 0010 — Correctif : request_feature / resolve_feature doivent poser le drapeau
-- de confiance app.credit_op avant de toucher aux crédits (comme consume_credit,
-- cf. 0006), sinon le garde-fou guard_practitioner_sensitive_fields les bloque.

create or replace function public.request_feature(p_event_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  pid uuid;
  remaining integer;
  ev record;
begin
  select id, credits into pid, remaining
  from practitioners where user_id = auth.uid()
  for update;
  if pid is null then
    raise exception 'Aucune fiche praticien pour cet utilisateur.';
  end if;

  select id, status, top_until, top_requested_at, practitioner_id
  into ev from events where id = p_event_id;
  if ev.id is null or ev.practitioner_id <> pid then
    raise exception 'Expérience introuvable.';
  end if;
  if ev.status <> 'approved' then
    raise exception 'Seule une expérience publiée peut être mise en avant.';
  end if;
  if ev.top_requested_at is not null then
    raise exception 'Une demande de mise en avant est déjà en attente.';
  end if;
  if ev.top_until is not null and ev.top_until > now() then
    raise exception 'Cette expérience est déjà mise en avant.';
  end if;
  if remaining < 1 then
    raise exception 'Solde de publications épuisé. Rachetez un pack pour la mise en avant.';
  end if;

  perform set_config('app.credit_op', '1', true);  -- drapeau de confiance (crédits)
  update practitioners set credits = credits - 1 where id = pid;
  insert into credit_transactions (practitioner_id, amount, type, note)
  values (pid, -1, 'consumption', 'Demande de mise en avant');

  perform set_config('app.feature_flow', 'on', true);  -- drapeau de confiance (top_requested_at)
  update events set top_requested_at = now() where id = p_event_id;
end $$;

create or replace function public.resolve_feature(p_event_id uuid, p_approve boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
  ev record;
begin
  if not public.is_admin() then
    raise exception 'Réservé à l''administrateur.';
  end if;
  select id, practitioner_id, top_requested_at into ev
  from events where id = p_event_id;
  if ev.id is null or ev.top_requested_at is null then
    raise exception 'Aucune demande de mise en avant en attente.';
  end if;

  if p_approve then
    update events
      set top_until = now() + interval '7 days',
          top_requested_at = null
      where id = p_event_id;
  else
    -- Refus : remboursement du crédit + annulation de la demande.
    perform set_config('app.credit_op', '1', true);  -- drapeau de confiance (crédits)
    update practitioners set credits = credits + 1 where id = ev.practitioner_id;
    insert into credit_transactions (practitioner_id, amount, type, note)
    values (ev.practitioner_id, 1, 'manual', 'Remboursement — mise en avant refusée');
    update events set top_requested_at = null where id = p_event_id;
  end if;
end $$;

notify pgrst, 'reload schema';
