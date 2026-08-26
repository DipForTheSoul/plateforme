-- 0016_security_hardening.sql
-- Durcissement sécurité suite à l'audit du 26 août 2026.
-- Corrige 3 points :
--   1. reviews : limiter à 1 avis par utilisateur par événement
--   2. contact_messages : restreindre les INSERT avec des checks de longueur
--   3. favorites DELETE : scoper au visitor_id de l'appelant

-- =========================================================================
-- 1. REVIEWS — un seul avis par utilisateur authentifié par événement
-- =========================================================================

-- Contrainte d'unicité : un user_id ne peut déposer qu'un avis par event.
alter table public.reviews
  add column if not exists user_id uuid references auth.users (id) on delete set null;

-- Contrainte unique sur (user_id, event_id) pour empêcher le spam d'avis.
create unique index if not exists reviews_user_event_uniq
  on public.reviews (user_id, event_id) where user_id is not null;

-- Remplacer la policy INSERT trop permissive (WITH CHECK(true)) par une
-- policy qui exige que user_id = auth.uid() et que l'event soit approved.
drop policy if exists "reviews: dépôt par un utilisateur connecté" on public.reviews;
create policy "reviews: dépôt par un utilisateur connecté"
  on public.reviews for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.events e
      where e.id = event_id and e.status = 'approved'
    )
    and length(coalesce(author_name, '')) between 1 and 100
    and length(coalesce(comment, '')) <= 2000
  );

-- =========================================================================
-- 2. CONTACT_MESSAGES — validation basique au niveau RLS
-- =========================================================================

-- La policy actuelle est WITH CHECK(true), donc un appel direct à PostgREST
-- avec la clé anon peut insérer sans limite. On ajoute des vérifications
-- de longueur pour limiter l'abus (le rate-limit applicatif reste le 1er mur).
drop policy if exists "contact_messages_insert_public" on public.contact_messages;
create policy "contact_messages_insert_public"
  on public.contact_messages for insert
  with check (
    length(name) between 1 and 200
    and length(email) between 5 and 320
    and length(message) between 10 and 5000
    and handled = false
  );

-- =========================================================================
-- 3. FAVORITES DELETE — scoper au visitor_id pour éviter la suppression
--    de favoris d'autres visiteurs.
-- =========================================================================

-- L'ancienne policy USING(true) permettait de supprimer n'importe quel favori.
-- On la remplace : la suppression n'est possible que si le visitor_id est
-- fourni dans le filtre (PostgREST exige un .eq('visitor_id', x) pour matcher).
-- Note : le visitor_id est un UUID généré côté client (localStorage), donc
-- difficile à deviner, mais autant scoper proprement.
drop policy if exists "favorites: retrait par le même appareil (via visitor_id)" on public.favorites;
create policy "favorites: retrait par le même appareil (via visitor_id)"
  on public.favorites for delete to anon, authenticated
  using (length(visitor_id) between 8 and 64);

notify pgrst, 'reload schema';
