-- Additive: previous app versions ignore slug and keep their UUID routes.
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS slug text;
DO $migration$
DECLARE venue record; base text; candidate text; suffix integer;
BEGIN
  FOR venue IN SELECT id, name FROM public.venues WHERE slug IS NULL ORDER BY created_at, id LOOP
    base := trim(both '-' from left(regexp_replace(regexp_replace(lower(normalize(venue.name, NFD)), U&'[\0300-\036f]', '', 'g'), '[^a-z0-9]+', '-', 'g'), 60));
    IF base = '' THEN base := 'lieu'; END IF;
    candidate := base; suffix := 1;
    WHILE EXISTS (SELECT 1 FROM public.venues WHERE slug = candidate) LOOP
      suffix := suffix + 1; candidate := base || '-' || suffix;
    END LOOP;
    UPDATE public.venues SET slug = candidate WHERE id = venue.id AND slug IS NULL;
  END LOOP;
END $migration$;
CREATE UNIQUE INDEX IF NOT EXISTS venues_public_slug_unique ON public.venues (slug);
-- No policy, privilege, row deletion or counter is changed.
