-- Preserve signup biographies even when the installed auth trigger predates
-- the detailed signup form. Do not replace contact handling or edited bios.
create or replace function public.preserve_signup_biography()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if nullif(btrim(new.bio), '') is null then
    select nullif(btrim(u.raw_user_meta_data->>'bio'), '') into new.bio
    from auth.users u where u.id = new.user_id;
  end if;
  return new;
end;
$$;

revoke all on function public.preserve_signup_biography() from public, anon, authenticated;

drop trigger if exists practitioners_preserve_signup_biography on public.practitioners;
create trigger practitioners_preserve_signup_biography
before insert on public.practitioners
for each row execute function public.preserve_signup_biography();

-- Recover only missing texts; never overwrite a biography edited afterwards.
update public.practitioners p
set bio = nullif(btrim(u.raw_user_meta_data->>'bio'), '')
from auth.users u
where p.user_id = u.id
  and nullif(btrim(p.bio), '') is null
  and nullif(btrim(u.raw_user_meta_data->>'bio'), '') is not null;
