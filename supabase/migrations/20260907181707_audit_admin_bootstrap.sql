-- Trusted provisioning must be able to create the first administrator, while
-- ordinary users must never be able to promote themselves through REST.
create or replace function public.prevent_role_escalation()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if new.role is distinct from old.role and not public.is_admin()
    and current_user not in ('postgres','supabase_admin','service_role') then
    raise exception 'Seul un administrateur peut modifier un rôle.';
  end if;
  return new;
end $$;
