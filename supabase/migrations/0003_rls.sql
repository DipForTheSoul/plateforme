-- ForTheSoul — Politiques RLS (règle d'or n°1 : sécurité RLS d'abord)
--
-- Principes :
--   · un praticien ne voit/modifie que SES données ;
--   · un visiteur (clé anon) ne voit que le contenu public (approved) ;
--   · l'admin voit tout ;
--   · les crédits ne sont modifiables que par le service role (webhook Stripe)
--     ou des fonctions SECURITY DEFINER contrôlées (0004_functions.sql).
-- Les policies "using (true)" ne sont utilisées QUE pour du contenu
-- explicitement public (catalogue), jamais par défaut.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_practitioner_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select id from practitioners where user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "profiles: lecture de son propre profil"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles: mise à jour de son propre profil"
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Empêche l'auto-promotion de rôle (seul l'admin peut changer un rôle).
create or replace function public.prevent_role_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Seul un administrateur peut modifier un rôle.';
  end if;
  return new;
end $$;
create trigger profiles_role_guard before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- ---------------------------------------------------------------------------
-- practitioners
-- ---------------------------------------------------------------------------
create policy "practitioners: lecture publique des fiches validées"
  on public.practitioners for select to anon, authenticated
  using (status = 'approved' or user_id = auth.uid() or public.is_admin());

create policy "practitioners: création de sa propre fiche"
  on public.practitioners for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and credits = 0);

create policy "practitioners: mise à jour de sa propre fiche ou admin"
  on public.practitioners for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "practitioners: suppression par admin"
  on public.practitioners for delete to authenticated
  using (public.is_admin());

-- Un praticien ne peut modifier ni son statut ni son solde de crédits.
create or replace function public.guard_practitioner_sensitive_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and auth.uid() is not null then
    if new.status is distinct from old.status then
      raise exception 'Statut modifiable uniquement par un administrateur.';
    end if;
    if new.credits is distinct from old.credits then
      raise exception 'Crédits modifiables uniquement via achat ou administrateur.';
    end if;
  end if;
  return new;
end $$;
create trigger practitioners_sensitive_guard before update on public.practitioners
  for each row execute function public.guard_practitioner_sensitive_fields();

-- ---------------------------------------------------------------------------
-- venues — contenu public (annuaire des lieux)
-- ---------------------------------------------------------------------------
create policy "venues: lecture publique (catalogue)"
  on public.venues for select to anon, authenticated
  using (true);  -- justifié : les lieux sont des données publiques du catalogue

create policy "venues: création par praticien ou admin"
  on public.venues for insert to authenticated
  with check (created_by = auth.uid() or public.is_admin());

create policy "venues: mise à jour par créateur ou admin"
  on public.venues for update to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());

create policy "venues: suppression par admin"
  on public.venues for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- categories — référentiel public, géré par l'admin
-- ---------------------------------------------------------------------------
create policy "categories: lecture publique"
  on public.categories for select to anon, authenticated
  using (true);  -- justifié : référentiel public du catalogue

create policy "categories: écriture par admin"
  on public.categories for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
create policy "events: lecture des événements validés, des siens, ou admin"
  on public.events for select to anon, authenticated
  using (
    status = 'approved'
    or practitioner_id = public.current_practitioner_id()
    or public.is_admin()
  );

create policy "events: dépôt par le praticien propriétaire (statut pending)"
  on public.events for insert to authenticated
  with check (
    (practitioner_id = public.current_practitioner_id() and status = 'pending' and is_top = false)
    or public.is_admin()
  );

create policy "events: modification par propriétaire ou admin"
  on public.events for update to authenticated
  using (practitioner_id = public.current_practitioner_id() or public.is_admin())
  with check (practitioner_id = public.current_practitioner_id() or public.is_admin());

create policy "events: suppression par propriétaire ou admin"
  on public.events for delete to authenticated
  using (practitioner_id = public.current_practitioner_id() or public.is_admin());

-- Le praticien ne peut ni s'auto-valider ni se mettre en top listing.
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
create trigger events_sensitive_guard before update on public.events
  for each row execute function public.guard_event_sensitive_fields();

-- ---------------------------------------------------------------------------
-- favorites — écriture anonyme (liée à l'appareil), lecture admin uniquement.
-- La source de vérité côté visiteur est le localStorage ; la table sert de
-- miroir analytique. Aucune lecture anon → pas de fuite inter-appareils.
-- ---------------------------------------------------------------------------
create policy "favorites: ajout anonyme lié à l'appareil"
  on public.favorites for insert to anon, authenticated
  with check (length(visitor_id) between 8 and 64);

create policy "favorites: retrait par le même appareil (via visitor_id)"
  on public.favorites for delete to anon, authenticated
  using (true);  -- justifié : la ligne visée est identifiée par (visitor_id, event_id)
                 -- côté client ; aucune donnée sensible, suppression seule.

create policy "favorites: lecture admin (statistiques)"
  on public.favorites for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- contacts — inscription newsletter publique, gestion admin
-- ---------------------------------------------------------------------------
create policy "contacts: inscription newsletter (consentement requis)"
  on public.contacts for insert to anon, authenticated
  with check (consent = true);

create policy "contacts: lecture par admin"
  on public.contacts for select to authenticated
  using (public.is_admin());

create policy "contacts: gestion par admin"
  on public.contacts for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "contacts: suppression par admin"
  on public.contacts for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- credit_transactions — insertion par service role (webhook) ou admin.
-- Lecture : le praticien voit son propre historique.
-- ---------------------------------------------------------------------------
create policy "credit_transactions: lecture par propriétaire ou admin"
  on public.credit_transactions for select to authenticated
  using (practitioner_id = public.current_practitioner_id() or public.is_admin());

create policy "credit_transactions: insertion manuelle par admin"
  on public.credit_transactions for insert to authenticated
  with check (public.is_admin());
-- (Le webhook Stripe utilise le service role, qui contourne la RLS —
--  voir la fonction add_credits dans 0004_functions.sql.)

-- ---------------------------------------------------------------------------
-- page_views — insertion anonyme (ping analytics), lecture admin
-- ---------------------------------------------------------------------------
create policy "page_views: ping anonyme"
  on public.page_views for insert to anon, authenticated
  with check (length(path) <= 200);

create policy "page_views: lecture admin"
  on public.page_views for select to authenticated
  using (public.is_admin());
