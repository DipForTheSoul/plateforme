-- 0013_v2_fields.sql
-- Nouveaux champs & tables du lot V2 (TASKS §2.2). DDL uniquement — le câblage
-- fonctionnel (affichage, logique d'expiration) suit dans les lots dédiés.

-- --- Expériences -----------------------------------------------------------
-- §4.1 lien vidéo (YouTube/Vimeo) ; §6.1 mise en avant à durée limitée.
alter table public.events
  add column if not exists video_url      text,
  add column if not exists featured_until timestamptz;

-- --- Praticiens ------------------------------------------------------------
-- §4.2 lien d'avis externe ; §4.3 logo.
alter table public.practitioners
  add column if not exists review_url text,
  add column if not exists logo_url   text;

-- --- Lieux -----------------------------------------------------------------
-- §5.1 ville (optionnelle ; `country` existe déjà, obligatoire par défaut 'CH').
alter table public.venues
  add column if not exists city text;

-- --- Paramètres éditables en admin (clé/valeur) ---------------------------
-- §4.4 taux de change, durées par défaut des mises en avant / packs, etc.
create table if not exists public.settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value) values
  ('exchange_rate_eur', '1.05'),   -- 1 CHF = X EUR (indicatif, saisi par l'admin)
  ('currency_default',  'CHF'),
  ('featured_default_days', '30'), -- durée par défaut d'une mise en avant (§6.1)
  ('pack_default_valid_days', '365') -- durée de validité par défaut d'un pack (§6.2)
on conflict (key) do nothing;

alter table public.settings enable row level security;

-- Lecture publique restreinte aux clés d'affichage visiteur (pas de USING(true)).
create policy "settings: lecture publique des clés d'affichage"
  on public.settings for select to anon, authenticated
  using (key in ('exchange_rate_eur', 'currency_default') or public.is_admin());

create policy "settings: écriture par admin"
  on public.settings for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- Packs de publications avec échéance (§6.2) ----------------------------
-- Chaque pack acheté porte une date de validité ; le statut « expiré » est
-- calculé à la lecture (expires_at < now()). Le câblage conso/achat suit.
create table if not exists public.credit_packs (
  id               uuid primary key default gen_random_uuid(),
  practitioner_id  uuid not null references public.practitioners (id) on delete cascade,
  credits_total    integer not null check (credits_total > 0),
  credits_remaining integer not null check (credits_remaining >= 0),
  expires_at       timestamptz,
  source           text not null default 'purchase' check (source in ('purchase', 'manual')),
  stripe_session_id text,
  created_at       timestamptz not null default now()
);

create index if not exists credit_packs_practitioner_idx
  on public.credit_packs (practitioner_id);

alter table public.credit_packs enable row level security;

create policy "credit_packs: lecture par propriétaire ou admin"
  on public.credit_packs for select to authenticated
  using (practitioner_id = public.current_practitioner_id() or public.is_admin());

-- Écriture réservée à l'admin (l'attribution passe par une fonction dédiée /
-- le webhook Stripe, comme credit_transactions).
create policy "credit_packs: écriture par admin"
  on public.credit_packs for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

notify pgrst, 'reload schema';
