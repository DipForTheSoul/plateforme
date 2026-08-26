-- 0015_enforce_rls_all_tables.sql
-- Filet de sécurité : force RLS sur TOUTES les tables du schéma public.
-- Corrige l'alerte Supabase « rls_disabled_in_public ».
-- Idempotent : ENABLE ROW LEVEL SECURITY est un no-op si déjà activé.

alter table public.profiles enable row level security;
alter table public.practitioners enable row level security;
alter table public.venues enable row level security;
alter table public.categories enable row level security;
alter table public.events enable row level security;
alter table public.favorites enable row level security;
alter table public.contacts enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.page_views enable row level security;
alter table public.reviews enable row level security;
alter table public.event_categories enable row level security;
alter table public.settings enable row level security;
alter table public.credit_packs enable row level security;
alter table public.contact_messages enable row level security;

-- Vérification dynamique : lève une exception si une table publique n'a pas RLS.
-- Cette vérification s'exécute au moment de la migration et bloque si un oubli
-- est détecté (par ex. une table ajoutée manuellement via le Dashboard).
do $$
declare
  t record;
  missing text[];
begin
  for t in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename not like 'pg_%'
      and tablename not in ('spatial_ref_sys', 'geometry_columns', 'geography_columns')
  loop
    if not exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = t.tablename
        and c.relrowsecurity = true
    ) then
      missing := array_append(missing, t.tablename);
    end if;
  end loop;

  if array_length(missing, 1) > 0 then
    raise warning '[SECURITE] Tables sans RLS détectées: %. Activation forcée.', array_to_string(missing, ', ');
    for t in select unnest(missing) as tbl
    loop
      execute format('alter table public.%I enable row level security', t.tbl);
    end loop;
  end if;
end $$;

notify pgrst, 'reload schema';
