-- ForTheSoul — Schéma de données
-- Voir BUILD-BRIEF.md §4. Chaque table a la RLS activée (policies dans 0003_rls.sql).

-- ---------------------------------------------------------------------------
-- profiles — miroir applicatif de auth.users (rôle + langue préférée)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'participant' check (role in ('participant', 'practitioner', 'admin')),
  preferred_lang text not null default 'fr' check (preferred_lang in ('fr', 'de', 'en')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------------
-- practitioners — fiches praticiens (validées par l'admin avant publication)
-- ---------------------------------------------------------------------------
create table public.practitioners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  name text not null,
  slug text not null unique,
  bio text,
  photos text[] not null default '{}',
  contact jsonb not null default '{}'::jsonb,     -- { email, phone, website }
  specialties text[] not null default '{}',
  languages text[] not null default '{}',          -- codes: fr, de, en, es…
  links jsonb not null default '{}'::jsonb,        -- { instagram, facebook, youtube… }
  credits integer not null default 0 check (credits >= 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.practitioners enable row level security;

-- ---------------------------------------------------------------------------
-- venues — lieux (géocodés à la création : lat/lng obligatoires côté app)
-- ---------------------------------------------------------------------------
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  lat double precision,
  lng double precision,
  -- Colonne générée pour PostGIS : permet ST_DWithin sans recalcul.
  location geography(point, 4326) generated always as (
    case when lat is not null and lng is not null
      then st_setsrid(st_makepoint(lng, lat), 4326)::geography
      else null end
  ) stored,
  canton text,
  country text not null default 'CH',
  description text,
  capacity integer,
  rooms integer,
  contact jsonb not null default '{}'::jsonb,
  photos text[] not null default '{}',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.venues enable row level security;
create index venues_location_idx on public.venues using gist (location);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  position integer not null default 0
);
alter table public.categories enable row level security;

-- ---------------------------------------------------------------------------
-- events — expériences. Récurrence : les occurrences sont générées à la
-- création comme lignes filles (parent_event_id) → le calendrier et la
-- recherche restent triviaux.
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  category_id uuid references public.categories (id) on delete set null,
  practitioner_id uuid not null references public.practitioners (id) on delete cascade,
  venue_id uuid references public.venues (id) on delete set null,
  start_date timestamptz not null,
  end_date timestamptz,
  recurrence text check (recurrence in ('weekly', 'biweekly', 'monthly')),
  recurrence_count integer,                        -- nb total d'occurrences générées
  parent_event_id uuid references public.events (id) on delete cascade,
  duration_minutes integer,
  price numeric(10, 2),
  currency text not null default 'CHF',
  languages text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_message text,                              -- message joint au refus / à la validation
  is_top boolean not null default false,           -- top listing (mis en avant)
  images text[] not null default '{}',
  view_count integer not null default 0,           -- analytics sans cookies
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.events enable row level security;
create index events_status_start_idx on public.events (status, start_date);
create index events_practitioner_idx on public.events (practitioner_id);
create index events_category_idx on public.events (category_id);
-- Recherche plein texte français, insensible aux accents (voir 0004_functions.sql).
create index events_search_idx on public.events using gin (
  to_tsvector('french', coalesce(title, '') || ' ' || coalesce(description, ''))
);
create index events_title_trgm_idx on public.events using gin (title gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- favorites — favoris liés à l'appareil (visitor_id = UUID localStorage).
-- Source de vérité côté client ; cette table sert de miroir analytique et
-- prépare la migration vers des comptes participants.
-- ---------------------------------------------------------------------------
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  event_id uuid references public.events (id) on delete cascade,
  practitioner_id uuid references public.practitioners (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (event_id is not null or practitioner_id is not null),
  unique (visitor_id, event_id),
  unique (visitor_id, practitioner_id)
);
alter table public.favorites enable row level security;

-- ---------------------------------------------------------------------------
-- contacts — base newsletter (import Wix, export CSV segmenté MailerLite)
-- ---------------------------------------------------------------------------
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text,
  last_name text,
  interests text[] not null default '{}',          -- tags par intérêt / événement
  consent boolean not null default false,
  opt_in_at timestamptz,
  source text,                                     -- 'site', 'import-wix', 'event:<slug>'…
  created_at timestamptz not null default now()
);
alter table public.contacts enable row level security;

-- ---------------------------------------------------------------------------
-- credit_transactions — traçabilité des crédits (achat Stripe, manuel, conso).
-- stripe_session_id UNIQUE = idempotence du webhook (règle d'or n°2).
-- ---------------------------------------------------------------------------
create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners (id) on delete cascade,
  amount integer not null,                         -- positif = crédit, négatif = consommation
  type text not null default 'purchase' check (type in ('purchase', 'manual', 'consumption')),
  stripe_session_id text unique,
  note text,
  created_at timestamptz not null default now()
);
alter table public.credit_transactions enable row level security;

-- ---------------------------------------------------------------------------
-- page_views — analytics interne sans cookies (pas de bannière nécessaire)
-- ---------------------------------------------------------------------------
create table public.page_views (
  id bigint generated always as identity primary key,
  path text not null,
  locale text,
  created_at timestamptz not null default now()
);
alter table public.page_views enable row level security;
create index page_views_created_idx on public.page_views (created_at);

-- ---------------------------------------------------------------------------
-- Tables FUTURES (hors périmètre — voir BUILD-BRIEF.md §8) : reviews, blog_posts,
-- bookings. Non créées volontairement ; structure anticipée dans
-- docs/FUTUR-schema.sql pour pouvoir les ajouter sans refonte.
-- ---------------------------------------------------------------------------

-- updated_at automatique
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger practitioners_updated_at before update on public.practitioners
  for each row execute function public.set_updated_at();
create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();
