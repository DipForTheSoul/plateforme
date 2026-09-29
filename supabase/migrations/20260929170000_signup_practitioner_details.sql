-- New practitioner applications arrive complete enough for moderation.
-- Existing practitioners and data are untouched; this only affects future sign-ups.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data->>'role', 'participant');
  preferred text := coalesce(new.raw_user_meta_data->>'preferred_lang', 'fr');
  display_name text;
  public_slug text;
  signup_contact jsonb;
  signup_links jsonb;
  signup_specialties text[];
begin
  if requested_role not in ('participant', 'practitioner') then requested_role := 'participant'; end if;
  if preferred not in ('fr', 'de', 'en') then preferred := 'fr'; end if;

  insert into public.profiles(id, email, role, preferred_lang)
    values(new.id, new.email, requested_role, preferred)
    on conflict(id) do nothing;

  if requested_role = 'practitioner' then
    display_name := left(coalesce(nullif(btrim(new.raw_user_meta_data->>'name'), ''), nullif(split_part(new.email, '@', 1), ''), 'Praticien'), 120);
    public_slug := coalesce(nullif(trim(both '-' from regexp_replace(lower(display_name), '[^a-z0-9]+', '-', 'g')), ''), 'praticien') || '-' || new.id::text;
    signup_contact := jsonb_strip_nulls(jsonb_build_object(
      'email', new.email,
      'first_name', nullif(btrim(new.raw_user_meta_data->>'first_name'), ''),
      'last_name', nullif(btrim(new.raw_user_meta_data->>'last_name'), ''),
      'website', nullif(btrim(new.raw_user_meta_data->>'website'), '')
    ));
    signup_links := jsonb_strip_nulls(jsonb_build_object(
      'instagram', nullif(btrim(new.raw_user_meta_data->>'instagram'), '')
    ));
    select coalesce(array_agg(value), '{}'::text[]) into signup_specialties
      from jsonb_array_elements_text(coalesce(new.raw_user_meta_data->'specialties', '[]'::jsonb));

    insert into public.practitioners(user_id, name, slug, bio, status, contact, links, specialties, languages)
      values(
        new.id,
        display_name,
        public_slug,
        nullif(btrim(new.raw_user_meta_data->>'bio'), ''),
        'pending',
        signup_contact,
        signup_links,
        signup_specialties,
        array[preferred]
      )
      on conflict(user_id) do nothing;
  end if;
  return new;
end $$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
