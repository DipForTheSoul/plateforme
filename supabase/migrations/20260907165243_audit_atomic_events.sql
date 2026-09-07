-- Audit parcours : crédit + expérience + univers + répétitions dans une transaction.
-- SECURITY DEFINER needed to enforce debit while blocking direct credit-free INSERTs.
-- Every entry point verifies auth.uid(), role and ownership; fixed search_path.
begin;

alter table public.events add column if not exists submission_id uuid unique;
alter table public.events drop constraint if exists events_recurrence_check;
alter table public.events add constraint events_recurrence_check
  check (recurrence in ('weekly', 'biweekly', 'monthly', 'custom'));

create or replace function public.guard_event_sensitive_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() and auth.uid() is not null then
    if new.status is distinct from old.status and new.status <> 'pending' then
      raise exception 'Validation réservée à l''administrateur.';
    end if;
    if new.is_top is distinct from old.is_top or new.featured_until is distinct from old.featured_until then
      raise exception 'Mise en avant réservée à l''administrateur.';
    end if;
    if new.practitioner_id is distinct from old.practitioner_id or new.parent_event_id is distinct from old.parent_event_id then
      raise exception 'Propriétaire et série non modifiables.';
    end if;
    -- Content edits require review, not the public analytics view counter.
    if (new.title,new.description,new.category_id,new.venue_id,new.start_date,new.end_date,
        new.duration_minutes,new.price,new.languages,new.included,new.to_bring,new.video_url,new.images,new.recurrence,new.recurrence_count)
      is distinct from (old.title,old.description,old.category_id,old.venue_id,old.start_date,old.end_date,
        old.duration_minutes,old.price,old.languages,old.included,old.to_bring,old.video_url,old.images,old.recurrence,old.recurrence_count) then
      new.status := 'pending';
      new.admin_message := null;
    end if;
  end if;
  return new;
end $$;

-- Deposit must go through the atomic function (otherwise REST could skip the debit).
drop policy if exists "events: dépôt par le praticien propriétaire (statut pending)" on public.events;
create policy "events: création directe admin uniquement" on public.events for insert to authenticated
  with check (public.is_admin());

create or replace function public.save_event_atomic(
  p_input jsonb, p_event_id uuid default null, p_practitioner_id uuid default null,
  p_submission_id uuid default null, p_expected_updated_at timestamptz default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  admin boolean := public.is_admin();
  owner_id uuid;
  old_event public.events%rowtype;
  saved public.events%rowtype;
  child public.events%rowtype;
  item jsonb;
  cats uuid[];
  langs text[];
  photos text[];
  starts timestamptz := (p_input->>'start_date')::timestamptz;
  ends timestamptz := (p_input->>'end_date')::timestamptz;
  frequency text := p_input->>'recurrence';
  planned jsonb := coalesce(p_input->'occurrences', '[]'::jsonb);
  schedule_changed boolean;
  child_ids uuid[];
  retained uuid[] := '{}';
  child_id uuid;
  i integer := 0;
  state text;
begin
  if actor is null then raise exception 'Connexion requise.'; end if;
  if p_event_id is not null then
    select * into old_event from public.events where id = p_event_id for update;
    if not found then raise exception 'Expérience introuvable.'; end if;
    owner_id := old_event.practitioner_id;
    if p_expected_updated_at is not null and old_event.updated_at is distinct from p_expected_updated_at then
      raise exception 'Expérience modifiée entre-temps.';
    end if;
  else
    owner_id := case when admin then p_practitioner_id else public.current_practitioner_id() end;
  end if;
  perform 1 from public.practitioners where id = owner_id and (admin or (user_id = actor and status = 'approved')) for update;
  if not found then raise exception 'Fiche praticien non autorisée.'; end if;
  if p_event_id is null and p_submission_id is not null then
    select * into saved from public.events where submission_id = p_submission_id;
    if found then
      if saved.practitioner_id <> owner_id then raise exception 'Dépôt non autorisé.'; end if;
      return jsonb_build_object('id', saved.id, 'updated_at', saved.updated_at, 'replayed', true);
    end if;
  end if;
  cats := array(select value::uuid from jsonb_array_elements_text(p_input->'category_ids') with ordinality group by value order by min(ordinality));
  langs := array(select value from jsonb_array_elements_text(p_input->'languages'));
  photos := array(select value from jsonb_array_elements_text(p_input->'images'));
  if coalesce(length(btrim(p_input->>'title')),0) not between 3 and 140
    or coalesce(length(btrim(p_input->>'description')),0) not between 20 and 8000
    or cardinality(cats) not between 1 and 6 or cardinality(langs) not between 1 and 5
    or cardinality(photos) > 6 or starts is null or (ends is not null and ends <= starts)
    or jsonb_array_length(planned) > 25
    or (p_input->>'price')::numeric < 0 or (p_input->>'duration_minutes')::integer <= 0 then
    raise exception 'Formulaire invalide.';
  end if;
  if old_event.parent_event_id is not null and (frequency is not null or jsonb_array_length(planned) > 0) then
    raise exception 'Modifiez la série depuis sa première date.';
  end if;
  if (frequency is null and jsonb_array_length(planned) <> 0)
    or (frequency is not null and jsonb_array_length(planned) < 1) then raise exception 'Répétition invalide.'; end if;
  for item in select value from jsonb_array_elements(planned) loop
    if (item->>'start_date')::timestamptz <= starts or item->>'start_date' is null
      or ((item->>'end_date') is not null and (item->>'end_date')::timestamptz <= (item->>'start_date')::timestamptz) then
      raise exception 'Date de répétition invalide.';
    end if;
  end loop;
  if (select count(distinct (value->>'start_date')::timestamptz) from jsonb_array_elements(planned)) <> jsonb_array_length(planned) then
    raise exception 'Dates de répétition en double.';
  end if;
  schedule_changed := p_event_id is null or starts is distinct from old_event.start_date or ends is distinct from old_event.end_date
    or frequency is distinct from old_event.recurrence
    or (frequency is not null and coalesce((p_input->>'recurrence_count')::int, jsonb_array_length(planned)+1) is distinct from old_event.recurrence_count);
  if frequency = 'custom' then
    schedule_changed := schedule_changed or (select coalesce(jsonb_agg(to_char(start_date at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') order by start_date), '[]') from public.events where parent_event_id = p_event_id)
      is distinct from (select coalesce(jsonb_agg(value->>'start_date' order by value->>'start_date'), '[]') from jsonb_array_elements(planned));
  end if;
  state := case when admin then coalesce(old_event.status, 'approved') else 'pending' end;
  if p_event_id is null then
    if not admin then perform public.consume_credit('Dépôt : ' || (p_input->>'title')); end if;
    insert into public.events(title, slug, description, practitioner_id, category_id, venue_id, start_date, end_date,
      recurrence, recurrence_count, duration_minutes, price, languages, included, to_bring, video_url, images, status, submission_id)
    values (p_input->>'title', 'experience-' || gen_random_uuid()::text, p_input->>'description', owner_id, cats[1], (p_input->>'venue_id')::uuid,
      starts, ends, frequency, case when frequency is not null then jsonb_array_length(planned)+1 end,
      (p_input->>'duration_minutes')::integer, (p_input->>'price')::numeric, langs, p_input->>'included', p_input->>'to_bring', p_input->>'video_url', photos, state, p_submission_id)
    returning * into saved;
  else
    update public.events set title=p_input->>'title', description=p_input->>'description', category_id=cats[1], venue_id=(p_input->>'venue_id')::uuid,
      start_date=starts, end_date=ends, recurrence=frequency, recurrence_count=case when frequency is not null then coalesce((p_input->>'recurrence_count')::int, jsonb_array_length(planned)+1) end,
      duration_minutes=(p_input->>'duration_minutes')::integer, price=(p_input->>'price')::numeric, languages=langs,
      included=p_input->>'included', to_bring=p_input->>'to_bring', video_url=p_input->>'video_url', images=photos, status=state
    where id=p_event_id returning * into saved;
  end if;
  delete from public.event_categories where event_id=saved.id;
  insert into public.event_categories(event_id, category_id) select saved.id, unnest(cats);
  if old_event.parent_event_id is null then
    child_ids := array(select id from public.events where parent_event_id=saved.id order by start_date, id);
    if schedule_changed then
      for item in select value from jsonb_array_elements(planned) loop
        i := i+1;
        child_id := child_ids[i];
        if child_id is null then
          insert into public.events(title,slug,description,practitioner_id,category_id,venue_id,start_date,end_date,parent_event_id,duration_minutes,price,languages,included,to_bring,video_url,images,status)
          values(saved.title,'experience-' || gen_random_uuid()::text,saved.description,owner_id,cats[1],saved.venue_id,(item->>'start_date')::timestamptz,(item->>'end_date')::timestamptz,saved.id,saved.duration_minutes,saved.price,langs,saved.included,saved.to_bring,saved.video_url,photos,state)
          returning id into child_id;
        else
          update public.events set start_date=(item->>'start_date')::timestamptz, end_date=(item->>'end_date')::timestamptz where id=child_id;
        end if;
        retained := array_append(retained, child_id);
      end loop;
      delete from public.events where parent_event_id=saved.id and not(id=any(retained));
    end if;
    for child in select * from public.events where parent_event_id=saved.id loop
      update public.events set title=saved.title,description=saved.description,category_id=cats[1],venue_id=saved.venue_id,
        duration_minutes=saved.duration_minutes,price=saved.price,languages=langs,included=saved.included,to_bring=saved.to_bring,video_url=saved.video_url,images=photos,status=state
        where id=child.id;
      delete from public.event_categories where event_id=child.id;
      insert into public.event_categories(event_id,category_id) select child.id,unnest(cats);
    end loop;
  end if;
  return jsonb_build_object('id',saved.id,'updated_at',saved.updated_at,'replayed',false,
    'occurrences',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'start_date',start_date) order by start_date),'[]') from public.events where parent_event_id=saved.id));
end $$;
revoke all on function public.save_event_atomic(jsonb,uuid,uuid,uuid,timestamptz) from public, anon;
grant execute on function public.save_event_atomic(jsonb,uuid,uuid,uuid,timestamptz) to authenticated;

create or replace function public.remove_event_occurrence(p_occurrence_id uuid,p_parent_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare parent public.events%rowtype;
begin
  if auth.uid() is null then raise exception 'Connexion requise.'; end if;
  select * into parent from public.events where id=p_parent_id for update;
  if not found or not(public.is_admin() or parent.practitioner_id=public.current_practitioner_id()) then raise exception 'Non autorisé.'; end if;
  delete from public.events where id=p_occurrence_id and parent_event_id=p_parent_id;
  if not found then raise exception 'Occurrence introuvable.'; end if;
  -- Switch to explicit dates so saving the series never resurrects a deleted date.
  update public.events set recurrence=case when exists(select 1 from public.events where parent_event_id=p_parent_id) then 'custom' end,
    recurrence_count=case when exists(select 1 from public.events where parent_event_id=p_parent_id) then 1+(select count(*) from public.events where parent_event_id=p_parent_id) end
    where id=p_parent_id returning * into parent;
  return jsonb_build_object('updated_at', parent.updated_at);
end $$;
revoke all on function public.remove_event_occurrence(uuid,uuid) from public,anon;
grant execute on function public.remove_event_occurrence(uuid,uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
