begin;

-- Invoker context distinguishes a direct authenticated UPDATE from a checked
-- SECURITY DEFINER workflow. Only trusted database roles may restructure a series.
create or replace function public.guard_event_sensitive_fields()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if current_user in ('postgres','supabase_admin') then return new; end if;
  if not public.is_admin() and auth.uid() is not null then
    if new.status is distinct from old.status and new.status <> 'pending' then
      raise exception 'Validation réservée à l''administrateur.';
    end if;
    if new.is_top is distinct from old.is_top or new.featured_until is distinct from old.featured_until then
      raise exception 'Mise en avant réservée à l''administrateur.';
    end if;
    if new.practitioner_id is distinct from old.practitioner_id or new.parent_event_id is distinct from old.parent_event_id
       or new.submission_id is distinct from old.submission_id then
      raise exception 'Propriétaire et série non modifiables.';
    end if;
    if (new.title,new.description,new.category_id,new.venue_id,new.start_date,new.end_date,
        new.duration_minutes,new.price,new.languages,new.included,new.to_bring,new.video_url,new.images,new.recurrence,new.recurrence_count)
      is distinct from (old.title,old.description,old.category_id,old.venue_id,old.start_date,old.end_date,
        old.duration_minutes,old.price,old.languages,old.included,old.to_bring,old.video_url,old.images,old.recurrence,old.recurrence_count) then
      new.status := 'pending'; new.admin_message := null;
    end if;
  end if;
  return new;
end $$;

create or replace function public.remove_event_occurrence(p_occurrence_id uuid,p_parent_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  parent public.events%rowtype;
  successor public.events%rowtype;
  remaining integer;
begin
  if auth.uid() is null then raise exception 'Connexion requise.'; end if;
  select * into parent from public.events where id=p_parent_id and parent_event_id is null for update;
  if not found or not(public.is_admin() or parent.practitioner_id=public.current_practitioner_id()) then raise exception 'Non autorisé.'; end if;
  if p_occurrence_id = p_parent_id then
    select * into successor from public.events where parent_event_id=p_parent_id order by start_date,id limit 1 for update;
    if not found then
      delete from public.events where id=p_parent_id;
      return jsonb_build_object('deleted',true,'parent_id',null);
    end if;
    -- Detach and reparent BEFORE deleting the old root (ON DELETE CASCADE).
    update public.events set parent_event_id=null where id=successor.id;
    update public.events set parent_event_id=successor.id where parent_event_id=p_parent_id;
    delete from public.events where id=p_parent_id;
    update public.events set submission_id=parent.submission_id where id=successor.id;
    p_parent_id := successor.id;
  else
    delete from public.events where id=p_occurrence_id and parent_event_id=p_parent_id;
    if not found then raise exception 'Occurrence introuvable.'; end if;
  end if;
  select count(*) into remaining from public.events where parent_event_id=p_parent_id;
  -- Deleting dates is not a content edit and must not silently unpublish others.
  update public.events set recurrence=case when remaining>0 then 'custom' end,
    recurrence_count=case when remaining>0 then remaining+1 end
    where id=p_parent_id returning * into parent;
  return jsonb_build_object('parent_id',parent.id,'updated_at',parent.updated_at);
end $$;
revoke all on function public.remove_event_occurrence(uuid,uuid) from public,anon;
grant execute on function public.remove_event_occurrence(uuid,uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
