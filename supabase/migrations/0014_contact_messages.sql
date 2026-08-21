-- Messages du formulaire de contact public (arbitrage Victor : formulaire plutôt
-- qu'e-mail exposé, anti-spam). Reçus dans le back-office admin ; une notification
-- e-mail pourra être ajoutée ensuite (décision e-mail vs back-office à confirmer).

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  locale text,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Le formulaire public peut insérer (honeypot + rate-limit gérés côté application).
drop policy if exists "contact_messages_insert_public" on public.contact_messages;
create policy "contact_messages_insert_public"
  on public.contact_messages for insert
  with check (true);

-- Seul l'admin lit et met à jour (marquer comme traité).
drop policy if exists "contact_messages_admin_read" on public.contact_messages;
create policy "contact_messages_admin_read"
  on public.contact_messages for select
  using (public.is_admin());

drop policy if exists "contact_messages_admin_update" on public.contact_messages;
create policy "contact_messages_admin_update"
  on public.contact_messages for update
  using (public.is_admin())
  with check (public.is_admin());

notify pgrst, 'reload schema';
