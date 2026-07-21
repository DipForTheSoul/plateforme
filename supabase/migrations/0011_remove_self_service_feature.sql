-- 0011 — Retrait de la mise en avant self-service (hors périmètre du cahier des
-- charges Premium : les top listings sont une prérogative manuelle de l'admin,
-- §6.5). On restaure le garde-fou d'origine et on supprime colonnes + fonctions.
-- Les champs « included » / « to_bring » (0009) sont CONSERVÉS.

-- 1. Restaurer le garde-fou anti-escalade dans sa version d'origine (0003) :
--    ne protège plus que status + is_top (les colonnes top_* disparaissent).
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
  end if;
  return new;
end $$;

-- 2. Supprimer les fonctions de demande / résolution de mise en avant.
drop function if exists public.request_feature(uuid);
drop function if exists public.resolve_feature(uuid, boolean);

-- 3. Supprimer les colonnes dédiées.
alter table public.events
  drop column if exists top_until,
  drop column if exists top_requested_at;

notify pgrst, 'reload schema';
