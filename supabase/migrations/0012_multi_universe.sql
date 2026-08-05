-- 0012_multi_universe.sql
-- Multi-univers (§2.1) : une expérience peut être rattachée à PLUSIEURS catégories.
-- Passage d'une relation 1-N (events.category_id) à une relation N-N via une
-- table de liaison. `events.category_id` est CONSERVÉE et sert désormais de
-- « catégorie principale » (dégradé/visuel, 1er badge) ; la table de liaison
-- est la source de vérité pour les filtres et la liste complète des badges.

create table if not exists public.event_categories (
  event_id    uuid not null references public.events (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (event_id, category_id)
);

create index if not exists event_categories_category_idx
  on public.event_categories (category_id);

-- Reprise sans perte des rattachements existants (events.category_id).
insert into public.event_categories (event_id, category_id)
select id, category_id
from public.events
where category_id is not null
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- RLS : lecture alignée sur la visibilité de l'événement (pas de USING(true)) ;
-- écriture réservée au praticien propriétaire de l'événement ou à l'admin.
-- ---------------------------------------------------------------------------
alter table public.event_categories enable row level security;

create policy "event_categories: lecture alignée sur l'événement"
  on public.event_categories for select to anon, authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and (
          e.status = 'approved'
          or e.practitioner_id = public.current_practitioner_id()
          or public.is_admin()
        )
    )
  );

create policy "event_categories: écriture par propriétaire de l'événement ou admin"
  on public.event_categories for all to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.events e
      where e.id = event_id
        and e.practitioner_id = public.current_practitioner_id()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.events e
      where e.id = event_id
        and e.practitioner_id = public.current_practitioner_id()
    )
  );

notify pgrst, 'reload schema';
