-- ForTheSoul — Extensions PostgreSQL requises
-- À appliquer en premier (Supabase : SQL Editor ou `supabase db push`).

create extension if not exists postgis;      -- géolocalisation (recherche par rayon, ST_DWithin)
create extension if not exists unaccent;     -- recherche insensible aux accents (français)
create extension if not exists pg_trgm;      -- recherche floue / instantanée (trigrammes)
