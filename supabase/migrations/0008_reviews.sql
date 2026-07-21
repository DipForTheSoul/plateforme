-- ForTheSoul — Avis sur les expériences (note + commentaire).
-- La moyenne et le nombre d'avis sont dénormalisés sur events (rating_avg /
-- rating_count) via trigger, pour un affichage rapide sur les cartes.

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  author_name text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
create index if not exists reviews_event_idx on public.reviews (event_id);

alter table public.events add column if not exists rating_avg numeric(3, 2) not null default 0;
alter table public.events add column if not exists rating_count integer not null default 0;

-- Recalcule la note moyenne + le nombre d'avis d'un événement.
create or replace function public.recalc_event_rating(p_event uuid)
returns void language sql security definer set search_path = public as $$
  update public.events e set
    rating_count = (select count(*) from public.reviews r where r.event_id = p_event),
    rating_avg = coalesce(
      (select round(avg(r.rating)::numeric, 2) from public.reviews r where r.event_id = p_event),
      0
    )
  where e.id = p_event;
$$;

create or replace function public.reviews_after_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.recalc_event_rating(coalesce(new.event_id, old.event_id));
  return null;
end $$;

drop trigger if exists reviews_recalc on public.reviews;
create trigger reviews_recalc
  after insert or update or delete on public.reviews
  for each row execute function public.reviews_after_change();

-- RLS : lecture publique, dépôt par un utilisateur connecté.
alter table public.reviews enable row level security;

drop policy if exists "reviews: lecture publique" on public.reviews;
create policy "reviews: lecture publique"
  on public.reviews for select to anon, authenticated using (true);

drop policy if exists "reviews: dépôt par un utilisateur connecté" on public.reviews;
create policy "reviews: dépôt par un utilisateur connecté"
  on public.reviews for insert to authenticated with check (true);
