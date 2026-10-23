// @vitest-environment node
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {afterAll,beforeAll,expect,it} from 'vitest';
let db:PGlite;
const sql=(name:string)=>readFileSync(new URL(`../supabase/migrations/${name}`,import.meta.url),'utf8');
const repair=()=>db.exec(sql('20261023143000_preserve_signup_biography.sql'));
const signup=(suffix:string,bio:string)=>db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[
  `30000000-0000-4000-8000-${suffix.padStart(12,'0')}`,`signup-${suffix}@example.test`,JSON.stringify({role:'practitioner',name:'Test inscription',bio}),
]);
beforeAll(async()=>{
  db=new PGlite();
  await db.exec("create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');");
  await db.exec(sql('0002_schema.sql').replace(/  location geography[\s\S]*?  \) stored,\n/,'').replace(/^create index venues_location_idx.*;$/m,'').replace(/^create index events_title_trgm_idx.*;$/m,''));
  const original=sql('0004_functions.sql');await db.exec(original.slice(0,original.indexOf('-- Recherche instantanée')));
  await db.exec(sql('20260907193754_audit_signup_profile.sql'));
  await signup('1','Présentation conservée dans les métadonnées.');
  expect((await db.query('select bio from practitioners')).rows).toEqual([{bio:null}]);
  await repair();
},30000);
afterAll(async()=>{await db?.close();});
it('récupère une biographie absente depuis les métadonnées',async()=>{
  expect((await db.query('select bio from practitioners')).rows).toEqual([{bio:'Présentation conservée dans les métadonnées.'}]);
});
it('conserve la biographie à la création puis à la validation avec le trigger historique',async()=>{
  await signup('2','Une présentation avec accents.\nDeuxième paragraphe.');
  await db.exec("update practitioners set status='approved' where user_id='30000000-0000-4000-8000-000000000002'");
  expect((await db.query("select bio,status from practitioners where user_id='30000000-0000-4000-8000-000000000002'")).rows).toEqual([{bio:'Une présentation avec accents.\nDeuxième paragraphe.',status:'approved'}]);
});
it('préserve exactement les textes enrichis lors de la réparation répétée',async()=>{
  await db.exec("update practitioners set bio='Texte enrichi après inscription.' where user_id='30000000-0000-4000-8000-000000000001'");
  await repair();
  expect((await db.query("select bio from practitioners where user_id='30000000-0000-4000-8000-000000000001'")).rows).toEqual([{bio:'Texte enrichi après inscription.'}]);
});
it('respecte les biographies fournies par le trigger récent',async()=>{
  await db.exec(sql('20261007160000_signup_details_fix.sql'));
  await signup('3','Texte avec le parcours récent.');
  expect((await db.query("select bio from practitioners where user_id='30000000-0000-4000-8000-000000000003'")).rows).toEqual([{bio:'Texte avec le parcours récent.'}]);
});
