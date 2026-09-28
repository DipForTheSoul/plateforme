-- Demandes envoyées depuis une fiche praticien. L'insertion passe uniquement
-- par le serveur applicatif (service role) : aucune écriture/lecture publique.
create table if not exists public.practitioner_contact_requests (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete restrict,
  visitor_name text not null check (length(visitor_name) between 2 and 120),
  visitor_email text not null check (length(visitor_email) between 5 and 320),
  visitor_phone text check (visitor_phone is null or length(visitor_phone) <= 40),
  message text not null check (length(message) between 10 and 3000),
  contact_consent boolean not null check (contact_consent = true),
  newsletter_consent boolean not null default false,
  locale text not null check (locale in ('fr', 'de', 'en')),
  send_status text not null default 'pending' check (send_status in ('pending', 'sent', 'failed')),
  send_error text,
  ip_hash text not null check (length(ip_hash) = 64),
  created_at timestamptz not null default now()
);

create index if not exists practitioner_contact_requests_created_idx
  on public.practitioner_contact_requests(created_at desc);
create index if not exists practitioner_contact_requests_practitioner_idx
  on public.practitioner_contact_requests(practitioner_id, created_at desc);

alter table public.practitioner_contact_requests enable row level security;
revoke all on public.practitioner_contact_requests from anon, authenticated;
grant select on public.practitioner_contact_requests to authenticated;

drop policy if exists "practitioner_contact_requests_admin_read" on public.practitioner_contact_requests;
create policy "practitioner_contact_requests_admin_read"
  on public.practitioner_contact_requests for select to authenticated
  using (public.is_admin());

notify pgrst, 'reload schema';
