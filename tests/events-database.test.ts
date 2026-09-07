// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { parseEventForm, occurrenceSchedule } from '@/lib/event-input';

let db: PGlite;
const user = '10000000-0000-4000-8000-000000000001';
const other = '10000000-0000-4000-8000-000000000002';
const admin = '10000000-0000-4000-8000-000000000003';
const practitioner = '20000000-0000-4000-8000-000000000001';
const category = '30000000-0000-4000-8000-000000000001';
const sql = (name: string) => readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8');
const actor = (id: string) => db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
function input(changes: Record<string,string> = {}) {
  const fd = new FormData();
  Object.entries({title:'Love Lounge',description:'Une description suffisamment longue pour cette expérience.',category_ids:category,start_date:'2026-10-09T11:00',languages:'fr',recurrence:'weekly',recurrence_count:'4', ...changes}).forEach(([k,v])=>fd.set(k,v));
  const parsed = parseEventForm(fd);
  if (!parsed.success) throw parsed.error;
  return {...parsed.data, occurrences:occurrenceSchedule(parsed.data)};
}
async function save(data = input(), id: string | null = null, submission: string | null = null, version: string | null = null) {
  const result = await db.query<{value:{id:string;replayed:boolean;updated_at:string}}>('select public.save_event_atomic($1::jsonb,$2::uuid,$3::uuid,$4::uuid,$5::timestamptz) as value', [JSON.stringify(data),id,practitioner,submission,version]);
  return result.rows[0].value;
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
  // PGlite is PostgreSQL; only the PostGIS column/index and trigram index are omitted.
  // No geospatial behavior is claimed by these transaction/authorization tests.
  await db.exec(sql('0002_schema.sql').replace(/  location geography[\s\S]*?  \) stored,\n/, '').replace(/^create index venues_location_idx.*;$/m,'').replace(/^create index events_title_trgm_idx.*;$/m,''));
  await db.exec(sql('0003_rls.sql'));
  const creditFunctions = sql('0004_functions.sql');
  await db.exec(creditFunctions.slice(creditFunctions.indexOf('create or replace function public.add_credits')));
  for (const name of ['0006_fix_credit_consumption.sql','0007_admin_refinements.sql','0008_reviews.sql','0009_experience_details_and_feature.sql','0010_fix_feature_credit_flag.sql','0011_remove_self_service_feature.sql','0012_multi_universe.sql','0013_v2_fields.sql','0014_contact_messages.sql','0015_enforce_rls_all_tables.sql','0016_security_hardening.sql','20260907165243_audit_atomic_events.sql']) await db.exec(sql(name));
  await db.query('insert into auth.users(id,email) values ($1,\'one@example.test\'),($2,\'two@example.test\'),($3,\'admin@example.test\')',[user,other,admin]);
  await db.query("insert into public.profiles(id,email,role) values ($1,'one@example.test','practitioner'),($2,'two@example.test','participant'),($3,'admin@example.test','admin')",[user,other,admin]);
  await db.query("insert into public.practitioners(id,user_id,name,slug,credits,status) values($1,$2,'Test','test',20,'approved')",[practitioner,user]);
  await db.query("insert into public.categories(id,name,slug) values($1,'Yoga','yoga')",[category]);
  await actor(user);
  await db.exec(sql('20260907172118_audit_manual_credits.sql'));
  // Supabase grants API roles table access, then RLS restricts individual rows.
  await db.exec('grant usage on schema public,auth to anon,authenticated; grant all on all tables in schema public to anon,authenticated;');
}, 30000);
afterAll(async()=>{ await db?.close(); });

describe('Transactions réelles PostgreSQL — publication et crédits', () => {
  it('crée quatre dates avec un seul crédit, tous les univers, et la même heure suisse après changement d’heure', async()=>{
    const saved = await save();
    const rows = await db.query<{time:string}>("select to_char(start_date at time zone 'Europe/Zurich','HH24:MI') as time from events where id=$1 or parent_event_id=$1",[saved.id]);
    expect(rows.rows).toHaveLength(4);
    expect(rows.rows.every(r=>r.time==='11:00')).toBe(true);
    expect((await db.query('select credits from practitioners where id=$1',[practitioner])).rows[0]).toEqual({credits:19});
    expect((await db.query('select * from event_categories')).rows).toHaveLength(4);
  });
  it('annule le débit et toutes les lignes si la création échoue', async()=>{
    const before=(await db.query('select credits from practitioners where id=$1',[practitioner])).rows[0];
    const data=input(); data.category_ids=['90000000-0000-4000-8000-000000000001'];
    await expect(save(data)).rejects.toThrow();
    expect((await db.query('select credits from practitioners where id=$1',[practitioner])).rows[0]).toEqual(before);
  });
  it('ne débite pas deux fois après nouvelle tentative du même dépôt',async()=>{
    const request='40000000-0000-4000-8000-000000000001';
    const first=await save(input(),null,request);
    const second=await save(input(),null,request);
    expect(second.id).toBe(first.id); expect(second.replayed).toBe(true);
  });
  it('permet de changer la répétition après publication et conserve les URL des dates existantes',async()=>{
    await actor(admin);
    const first=await save(input());
    const children=await db.query<{id:string}>('select id from events where parent_event_id=$1 order by start_date',[first.id]);
    await save(input({recurrence:'biweekly',recurrence_count:'5'}),first.id);
    const edited=await db.query<{id:string}>('select id from events where parent_event_id=$1 order by start_date',[first.id]);
    expect(edited.rows).toHaveLength(4); expect(edited.rows.slice(0,3)).toEqual(children.rows);
    await actor(user);
  });
  it('conserve les dates libres et ne ressuscite pas une date supprimée',async()=>{
    await actor(admin);
    const first=await save(input());
    const children=await db.query<{id:string}>('select id from events where parent_event_id=$1 order by start_date',[first.id]);
    await db.query('select public.remove_event_occurrence($1,$2)',[children.rows[0].id,first.id]);
    expect((await db.query('select recurrence from events where id=$1',[first.id])).rows[0]).toEqual({recurrence:'custom'});
    const data=input(); data.recurrence='custom'; data.recurrence_count=null;
    data.occurrences=data.occurrences.slice(1);
    await save(data,first.id);
    expect((await db.query('select id from events where id=$1',[children.rows[0].id])).rows).toHaveLength(0);
    await actor(user);
  });
  it('renvoie en validation une expérience publiée modifiée par le praticien',async()=>{
    await actor(admin); const first=await save(input()); await actor(user);
    await save(input({title:'Titre modifié'}),first.id);
    expect((await db.query('select distinct status from events where id=$1 or parent_event_id=$1',[first.id])).rows).toEqual([{status:'pending'}]);
  });
  it('ne dépublie pas une expérience lorsque seul le compteur de vues change',async()=>{
    await actor(admin); const first=await save(input()); await actor(user);
    await db.query('update events set view_count=view_count+1 where id=$1',[first.id]);
    expect((await db.query('select status from events where id=$1',[first.id])).rows[0]).toEqual({status:'approved'});
  });
  it('refuse l’écriture d’un autre utilisateur et l’accès anonyme',async()=>{
    const first=await save();
    await actor(other); await expect(save(input(),first.id)).rejects.toThrow('autorisée');
    await actor(''); await expect(save()).rejects.toThrow('Connexion'); await actor(user);
  });
  it('détecte une édition concurrente',async()=>{
    const first=await save();
    await expect(save(input(),first.id,null,'2000-01-01T00:00:00Z')).rejects.toThrow('modifiée');
  });
  it('bloque un dépôt à zéro crédit sans ligne partielle',async()=>{
    await actor(admin); await db.query('update practitioners set credits=0 where id=$1',[practitioner]); await actor(user);
    await expect(save()).rejects.toThrow('épuisé');
  });
  it('retire du solde réel sans le recalculer depuis un historique incomplet',async()=>{
    await actor(admin); await db.query('update practitioners set credits=20 where id=$1',[practitioner]);
    const request='60000000-0000-4000-8000-000000000001';
    await db.query('select public.adjust_credits_atomic($1,-3,$2)',[practitioner,request]);
    await db.query('select public.adjust_credits_atomic($1,-3,$2)',[practitioner,request]);
    expect((await db.query('select credits from practitioners where id=$1',[practitioner])).rows[0]).toEqual({credits:17});
  });
  it('ajoute un pack et un crédit comptable ensemble, sans doublon après relance',async()=>{
    await actor(admin); const request='60000000-0000-4000-8000-000000000002';
    await db.query('select public.adjust_credits_atomic($1,5,$2)',[practitioner,request]);
    await db.query('select public.adjust_credits_atomic($1,5,$2)',[practitioner,request]);
    expect((await db.query('select credits from practitioners where id=$1',[practitioner])).rows[0]).toEqual({credits:22});
    expect((await db.query('select credits_total from credit_packs where practitioner_id=$1',[practitioner])).rows).toEqual([{credits_total:5}]);
  });
  it('refuse un retrait supérieur au solde et une attribution par le praticien',async()=>{
    const request='60000000-0000-4000-8000-000000000003';
    await expect(db.query('select public.adjust_credits_atomic($1,-999,$2)',[practitioner,request])).rejects.toThrow('Solde insuffisant');
    await actor(user);await expect(db.query('select public.adjust_credits_atomic($1,999,$2)',[practitioner,request])).rejects.toThrow('administrateur');
  });
  it('RLS : un praticien peut déposer via la fonction, pas insérer gratuitement via REST',async()=>{
    await actor(user);await db.exec('set role authenticated');
    try{
      await expect(db.query("insert into events(title,slug,practitioner_id,category_id,start_date,status) values('Direct','direct',$1,$2,now(),'pending')",[practitioner,category])).rejects.toThrow('row-level security');
      expect((await save()).id).toBeTruthy();
    }finally{await db.exec('reset role');}
  });
  it('RLS : ni auto-promotion administrateur ni crédit arbitraire',async()=>{
    await actor(user);await db.exec('set role authenticated');
    try{
      await expect(db.query("update profiles set role='admin' where id=$1",[user])).rejects.toThrow('administrateur');
      await expect(db.query('update practitioners set credits=999 where id=$1',[practitioner])).rejects.toThrow('Crédits');
      await expect(db.query("select add_credits($1,999,'forged')",[practitioner])).rejects.toThrow('permission denied');
    }finally{await db.exec('reset role');}
  });
  it('RLS : un autre compte ne lit pas une soumission en attente',async()=>{
    await actor(user);const draft=await save();await actor(other);await db.exec('set role authenticated');
    try{expect((await db.query('select id from events where id=$1',[draft.id])).rows).toEqual([]);}
    finally{await db.exec('reset role');await actor(user);}
  });
});
