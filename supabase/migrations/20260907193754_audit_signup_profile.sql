-- Auth user + application profile + pending practitioner are one transaction.
-- This trigger is not an RPC: public users cannot call it or request admin privileges.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare requested_role text:=coalesce(new.raw_user_meta_data->>'role','participant');
  preferred text:=coalesce(new.raw_user_meta_data->>'preferred_lang','fr');
  display_name text; public_slug text;
begin
  if requested_role not in ('participant','practitioner') then requested_role:='participant'; end if;
  if preferred not in ('fr','de','en') then preferred:='fr'; end if;
  insert into public.profiles(id,email,role,preferred_lang)
    values(new.id,new.email,requested_role,preferred) on conflict(id) do nothing;
  if requested_role='practitioner' then
    display_name:=left(coalesce(nullif(btrim(new.raw_user_meta_data->>'name'),''),nullif(split_part(new.email,'@',1),''),'Praticien'),120);
    public_slug:=coalesce(nullif(trim(both '-' from regexp_replace(lower(display_name),'[^a-z0-9]+','-','g')),''),'praticien')||'-'||new.id::text;
    insert into public.practitioners(user_id,name,slug,status,contact,languages)
      values(new.id,display_name,public_slug,'pending',jsonb_build_object('email',new.email),array[preferred])
      on conflict(user_id) do nothing;
  end if;
  return new;
end $$;
revoke all on function public.handle_new_user() from public,anon,authenticated;
