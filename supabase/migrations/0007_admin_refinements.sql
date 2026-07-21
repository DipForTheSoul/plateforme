-- ForTheSoul — Améliorations admin :
--   · motif de refus stocké aussi pour les fiches praticien (parité avec events) ;
--   · suivi des exports newsletter pour n'exporter que les nouveaux contacts.

alter table public.practitioners
  add column if not exists admin_message text;

alter table public.contacts
  add column if not exists exported_at timestamptz;

-- Requête fréquente : « contacts jamais exportés ».
create index if not exists contacts_exported_at_idx
  on public.contacts (exported_at);
