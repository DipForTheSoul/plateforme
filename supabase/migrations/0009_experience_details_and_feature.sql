-- 0009 — Détails d'expérience (« à apporter » / « inclus ») + mise en avant
-- self-service par le praticien (1 crédit, 7 jours, validée par Didier).

-- ---------------------------------------------------------------------------
-- 1. Champs descriptifs supplémentaires sur les expériences.
-- ---------------------------------------------------------------------------
alter table public.events
  add column if not exists included text,   -- ce qui est inclus (prix, matériel, repas…)
  add column if not exists to_bring text;   -- ce que le/la participant·e doit apporter

-- ---------------------------------------------------------------------------
-- 2. Mise en avant temporaire : fenêtre d'affichage + demande en attente.
--    top_until      : fin de la mise en avant payée (null = aucune en cours).
--    top_requested_at : demande du praticien en attente de validation admin.
--    (is_top reste le « top listing » manuel et permanent posé par l'admin.)
-- ---------------------------------------------------------------------------
alter table public.events
  add column if not exists top_until timestamptz,
  add column if not exists top_requested_at timestamptz;

-- ---------------------------------------------------------------------------
-- 3. Garde-fou anti-escalade : protège aussi top_until / top_requested_at.
--    top_requested_at ne peut être posé que via request_feature (drapeau GUC).
-- ---------------------------------------------------------------------------
create or replace function public.guard_event_sensitive_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and auth.uid() is not null then
    if new.status is distinct from old.status then
      raise exception 'Validation réservée à l''administrateur.';
    end if;
    if new.is_top is distinct from old.is_top then
      raise exception 'Top listing réservé à l''administrateur.';
    end if;
    if new.top_until is distinct from old.top_until then
      raise exception 'Mise en avant réservée à l''administrateur.';
    end if;
    if new.top_requested_at is distinct from old.top_requested_at
       and coalesce(current_setting('app.feature_flow', true), '') <> 'on' then
      raise exception 'Demande de mise en avant : passez par le parcours dédié.';
    end if;
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Demande de mise en avant par le praticien — consomme 1 crédit (atomique).
--    Ne pose que top_requested_at ; l'admin décide ensuite (resolve_feature).
-- ---------------------------------------------------------------------------
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

  update practitioners set credits = credits - 1 where id = pid;
  insert into credit_transactions (practitioner_id, amount, type, note)
  values (pid, -1, 'consumption', 'Demande de mise en avant');

  perform set_config('app.feature_flow', 'on', true);
  update events set top_requested_at = now() where id = p_event_id;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Résolution par l'admin (Didier) : valider (7 jours) ou refuser (rembourse).
-- ---------------------------------------------------------------------------
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
    update practitioners set credits = credits + 1 where id = ev.practitioner_id;
    insert into credit_transactions (practitioner_id, amount, type, note)
    values (ev.practitioner_id, 1, 'manual', 'Remboursement — mise en avant refusée');
    update events set top_requested_at = null where id = p_event_id;
  end if;
end $$;

revoke execute on function public.resolve_feature(uuid, boolean) from public, anon;
grant execute on function public.request_feature(uuid) to authenticated;
grant execute on function public.resolve_feature(uuid, boolean) to authenticated;

notify pgrst, 'reload schema';
