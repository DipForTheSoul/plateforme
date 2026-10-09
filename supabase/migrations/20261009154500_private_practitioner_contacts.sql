-- Les coordonnées privées ne doivent jamais être exposées avec la fiche
-- publique du praticien. La fiche ne conserve que le site web public.
create table if not exists public.practitioner_private_contacts (
  practitioner_id uuid primary key references public.practitioners(id) on delete cascade,
  contact jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.practitioner_private_contacts enable row level security;
revoke all on public.practitioner_private_contacts from anon;
grant select, insert, update on public.practitioner_private_contacts to authenticated;

create policy "private practitioner contact: owner or admin read"
  on public.practitioner_private_contacts for select to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.practitioners p
      where p.id = practitioner_id and p.user_id = auth.uid()
    )
  );

create policy "private practitioner contact: owner or admin insert"
  on public.practitioner_private_contacts for insert to authenticated
  with check (
    public.is_admin() or exists (
      select 1 from public.practitioners p
      where p.id = practitioner_id and p.user_id = auth.uid()
    )
  );

create policy "private practitioner contact: owner or admin update"
  on public.practitioner_private_contacts for update to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.practitioners p
      where p.id = practitioner_id and p.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.practitioners p
      where p.id = practitioner_id and p.user_id = auth.uid()
    )
  );

-- Copie des coordonnées existantes avant leur retrait de la table publique.
insert into public.practitioner_private_contacts(practitioner_id, contact)
select id, jsonb_strip_nulls(jsonb_build_object(
  'email', contact->>'email',
  'phone', contact->>'phone',
  'first_name', contact->>'first_name',
  'last_name', contact->>'last_name'
))
from public.practitioners
on conflict (practitioner_id) do update
set contact = excluded.contact, updated_at = now();

update public.practitioners
set contact = contact - array['email', 'phone', 'first_name', 'last_name'];

-- Compatibilité avec les formulaires existants : toute écriture de `contact`
-- est séparée automatiquement, puis les clés privées sont retirées de la ligne
-- publique dans la même transaction.
create or replace function public.separate_practitioner_private_contact()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() > 1 then
    return null;
  end if;

  insert into public.practitioner_private_contacts(practitioner_id, contact, updated_at)
  values (
    new.id,
    jsonb_strip_nulls(jsonb_build_object(
      'email', new.contact->>'email',
      'phone', new.contact->>'phone',
      'first_name', new.contact->>'first_name',
      'last_name', new.contact->>'last_name'
    )),
    now()
  )
  on conflict (practitioner_id) do update
  set contact = excluded.contact, updated_at = now();

  update public.practitioners
  set contact = new.contact - array['email', 'phone', 'first_name', 'last_name']
  where id = new.id;
  return null;
end;
$$;

drop trigger if exists practitioners_private_contact_split on public.practitioners;
create trigger practitioners_private_contact_split
after insert or update of contact on public.practitioners
for each row execute function public.separate_practitioner_private_contact();

