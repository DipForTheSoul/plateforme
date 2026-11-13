-- Preserve every legacy slug; public_slug is the stable address used by the UI.
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS public_slug text;
ALTER TABLE public.practitioners ADD COLUMN IF NOT EXISTS public_slug text;
CREATE UNIQUE INDEX IF NOT EXISTS events_public_slug_unique ON public.events(public_slug);
CREATE UNIQUE INDEX IF NOT EXISTS practitioners_public_slug_unique ON public.practitioners(public_slug);

-- Prefer the explicitly recorded first/last name; do not infer a surname.
CREATE OR REPLACE FUNCTION private.practitioner_link_label(p public.practitioners)
RETURNS text LANGUAGE plpgsql STABLE SET search_path = '' AS $label$
DECLARE first_name text; last_name text; metadata jsonb; display text;
BEGIN
 SELECT u.raw_user_meta_data INTO metadata FROM auth.users u WHERE u.id=p.user_id;
 first_name:=coalesce(nullif(pg_catalog.btrim(p.contact->>'first_name'),''),nullif(pg_catalog.btrim(metadata->>'first_name'),''));
 last_name:=coalesce(nullif(pg_catalog.btrim(p.contact->>'last_name'),''),nullif(pg_catalog.btrim(metadata->>'last_name'),''));
 IF first_name IS NOT NULL AND last_name IS NOT NULL THEN RETURN first_name||' '||last_name; END IF;
 display:=pg_catalog.btrim((pg_catalog.regexp_split_to_array(p.name, E'\\s+[-/·]\\s+'))[1]);
 RETURN coalesce(nullif(display,''),p.name);
END $label$;
REVOKE ALL ON FUNCTION private.practitioner_link_label(public.practitioners) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION private.assign_short_public_slug()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE label text; base text; candidate text; suffix integer := 1; taken boolean;
BEGIN
  IF TG_TABLE_SCHEMA <> 'public' OR TG_TABLE_NAME NOT IN ('events','practitioners') THEN
    RAISE EXCEPTION 'Unsupported public address target';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    -- Renames, moderation and counters never alter a shared public address.
    NEW.public_slug := OLD.public_slug;
    RETURN NEW;
  END IF;
  IF TG_TABLE_NAME='events' THEN
    label := pg_catalog.to_jsonb(NEW)->>'title';
  ELSE
    label := private.practitioner_link_label(NEW);
  END IF;
  base := pg_catalog.regexp_replace(pg_catalog.lower(normalize(label,NFD)), U&'[\0300-\036f]', '', 'g');
  base := pg_catalog.regexp_replace(base,'[^a-z0-9]+','-','g');
  base := pg_catalog.rtrim(pg_catalog.left(pg_catalog.btrim(base,'-'),60),'-');
  IF base = '' OR base IS NULL THEN base := CASE WHEN TG_TABLE_NAME='events' THEN 'experience' ELSE 'praticien' END; END IF;
  -- Serialize identical names, including simultaneous signup/series inserts.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(TG_TABLE_NAME || ':' || base,0));
  candidate := base;
  LOOP
    EXECUTE pg_catalog.format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE public_slug=$1 OR slug=$1)',TG_TABLE_NAME) INTO taken USING candidate;
    EXIT WHEN NOT taken;
    suffix := suffix + 1; candidate := base || '-' || suffix;
  END LOOP;
  NEW.public_slug := candidate;
  RETURN NEW;
END $function$;
REVOKE ALL ON FUNCTION private.assign_short_public_slug() FROM PUBLIC, anon, authenticated;

-- Backfill with the same allocator before installing the immutable-update guard.
-- Preserve updated_at: this is an address migration, not a content edit.
DO $backfill$
DECLARE target text; row record; base text; candidate text; suffix integer; taken boolean; stamp_trigger text;
BEGIN
 FOREACH target IN ARRAY ARRAY['events','practitioners'] LOOP
  stamp_trigger := target || '_updated_at';
  EXECUTE pg_catalog.format('ALTER TABLE public.%I DISABLE TRIGGER %I',target,stamp_trigger);
  FOR row IN EXECUTE pg_catalog.format('SELECT id, %s AS label FROM public.%I p WHERE public_slug IS NULL ORDER BY created_at,id',CASE WHEN target='events' THEN 'title' ELSE 'private.practitioner_link_label(p)' END,target) LOOP
   base := pg_catalog.regexp_replace(pg_catalog.lower(normalize(row.label,NFD)), U&'[\0300-\036f]', '', 'g');
   base := pg_catalog.rtrim(pg_catalog.left(pg_catalog.btrim(pg_catalog.regexp_replace(base,'[^a-z0-9]+','-','g'),'-'),60),'-');
   IF base='' OR base IS NULL THEN base:=CASE WHEN target='events' THEN 'experience' ELSE 'praticien' END; END IF;
   candidate:=base; suffix:=1;
   LOOP
    EXECUTE pg_catalog.format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE public_slug=$1 OR (slug=$1 AND id<>$2))',target) INTO taken USING candidate,row.id;
    EXIT WHEN NOT taken;
    suffix:=suffix+1; candidate:=base||'-'||suffix;
   END LOOP;
   EXECUTE pg_catalog.format('UPDATE public.%I SET public_slug=$1 WHERE id=$2',target) USING candidate,row.id;
  END LOOP;
  EXECUTE pg_catalog.format('ALTER TABLE public.%I ENABLE TRIGGER %I',target,stamp_trigger);
 END LOOP;
END $backfill$;
CREATE TRIGGER events_short_public_slug BEFORE INSERT OR UPDATE OF public_slug ON public.events FOR EACH ROW EXECUTE FUNCTION private.assign_short_public_slug();
CREATE TRIGGER practitioners_short_public_slug BEFORE INSERT OR UPDATE OF public_slug ON public.practitioners FOR EACH ROW EXECUTE FUNCTION private.assign_short_public_slug();
