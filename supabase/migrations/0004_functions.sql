-- ForTheSoul — Fonctions métier (recherche, rayon, crédits, profils)

-- ---------------------------------------------------------------------------
-- Création automatique du profil à l'inscription (Supabase Auth).
-- Le rôle demandé est lu depuis les métadonnées d'inscription, restreint à
-- participant/practitioner (jamais admin — promotion manuelle uniquement).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data ->> 'role', 'participant');
begin
  if requested_role not in ('participant', 'practitioner') then
    requested_role := 'participant';
  end if;
  insert into public.profiles (id, email, role, preferred_lang)
  values (
    new.id,
    new.email,
    requested_role,
    coalesce(new.raw_user_meta_data ->> 'preferred_lang', 'fr')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Recherche instantanée plein texte (français, sans accents), classée par
-- pertinence puis par date. Ne renvoie QUE les événements validés à venir.
-- ---------------------------------------------------------------------------
create or replace function public.search_events(q text)
returns setof public.events
language sql stable security definer set search_path = public as $$
  select e.*
  from events e
  where e.status = 'approved'
    and e.start_date >= now() - interval '1 day'
    and (
      to_tsvector('french', unaccent(coalesce(e.title, '') || ' ' || coalesce(e.description, '')))
        @@ plainto_tsquery('french', unaccent(q))
      or e.title ilike '%' || q || '%'
    )
  order by
    ts_rank(
      to_tsvector('french', unaccent(coalesce(e.title, '') || ' ' || coalesce(e.description, ''))),
      plainto_tsquery('french', unaccent(q))
    ) desc,
    e.start_date asc
  limit 50;
$$;

-- ---------------------------------------------------------------------------
-- Recherche par rayon (PostGIS ST_DWithin) : renvoie les ids des lieux dans
-- un rayon de `radius_km` autour d'un point. Règle d'or n°3 : les lieux sont
-- géocodés à la création, donc `location` est toujours renseignée.
-- ---------------------------------------------------------------------------
create or replace function public.venues_within_radius(
  center_lat double precision,
  center_lng double precision,
  radius_km double precision
)
returns table (venue_id uuid, distance_km double precision)
language sql stable security definer set search_path = public as $$
  select
    v.id,
    round((st_distance(
      v.location,
      st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography
    ) / 1000.0)::numeric, 1)::double precision
  from venues v
  where v.location is not null
    and st_dwithin(
      v.location,
      st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography,
      radius_km * 1000.0
    )
  order by 2 asc;
$$;

-- ---------------------------------------------------------------------------
-- Crédits — ajout idempotent (webhook Stripe). Règle d'or n°2 :
--   · appelée par le service role uniquement (contourne la RLS) ;
--   · l'unicité de stripe_session_id garantit qu'une session Checkout déjà
--     traitée n'est JAMAIS comptée deux fois (on conflict do nothing).
-- Renvoie true si les crédits ont été ajoutés, false si déjà traités.
-- ---------------------------------------------------------------------------
create or replace function public.add_credits(
  p_practitioner_id uuid,
  p_amount integer,
  p_stripe_session_id text
)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  inserted_id uuid;
begin
  if p_amount <= 0 then
    raise exception 'Le montant de crédits doit être positif.';
  end if;

  insert into credit_transactions (practitioner_id, amount, type, stripe_session_id)
  values (p_practitioner_id, p_amount, 'purchase', p_stripe_session_id)
  on conflict (stripe_session_id) do nothing
  returning id into inserted_id;

  if inserted_id is null then
    return false;  -- session déjà traitée : idempotence
  end if;

  update practitioners set credits = credits + p_amount where id = p_practitioner_id;
  return true;
end $$;
-- Seul le service role doit pouvoir l'appeler :
revoke execute on function public.add_credits(uuid, integer, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Crédits — attribution manuelle par l'admin (paiement statique QR/IBAN).
-- ---------------------------------------------------------------------------
create or replace function public.grant_credits(
  p_practitioner_id uuid,
  p_amount integer,
  p_note text default null
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Réservé à l''administrateur.';
  end if;
  if p_amount <= 0 then
    raise exception 'Le montant de crédits doit être positif.';
  end if;
  insert into credit_transactions (practitioner_id, amount, type, note)
  values (p_practitioner_id, p_amount, 'manual', p_note);
  update practitioners set credits = credits + p_amount where id = p_practitioner_id;
end $$;

-- ---------------------------------------------------------------------------
-- Crédits — consommation atomique lors du dépôt d'un événement.
-- Vérifie que l'appelant possède bien la fiche praticien et qu'il reste
-- au moins 1 crédit (blocage à 0 : règle du tableau de bord praticien).
-- ---------------------------------------------------------------------------
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

  update practitioners set credits = credits - 1 where id = pid;
  insert into credit_transactions (practitioner_id, amount, type, note)
  values (pid, -1, 'consumption', coalesce(p_note, 'Dépôt d''événement'));
end $$;

-- ---------------------------------------------------------------------------
-- Analytics — incrément du compteur de vues d'un événement (sans cookies).
-- ---------------------------------------------------------------------------
create or replace function public.increment_event_view(p_event_id uuid)
returns void
language sql security definer set search_path = public as $$
  update events set view_count = view_count + 1 where id = p_event_id and status = 'approved';
$$;
