-- Requires server-only recordEventView caller (9ffd007) deployed first.
-- Preserves the function body and every existing counter.
BEGIN;
DO $guard$
BEGIN
  IF md5(pg_get_functiondef('public.increment_event_view(uuid)'::regprocedure)) <> '17a3dcf0bdd4f284cacba13ae6be04eb'
     OR (SELECT pg_get_userbyid(proowner) FROM pg_proc WHERE oid='public.increment_event_view(uuid)'::regprocedure) <> 'postgres'
     OR NOT has_function_privilege('service_role', 'public.increment_event_view(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Unexpected counter definition, owner or server permissions';
  END IF;
END $guard$;
REVOKE EXECUTE ON FUNCTION public.increment_event_view(uuid) FROM PUBLIC, anon, authenticated;
COMMIT;
