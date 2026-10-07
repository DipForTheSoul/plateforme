// @vitest-environment node
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {beforeAll,afterAll,expect,it} from 'vitest';
let db:PGlite;
const sql=(name:string)=>readFileSync(new URL(`../supabase/migrations/${name}`,import.meta.url),'utf8');
beforeAll(async()=>{
  db=new PGlite();await db.exec("create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');");
  await db.exec(sql('0002_schema.sql').replace(/  location geography[\s\S]*?  \) stored,\n/, '').replace(/^create index venues_location_idx.*;$/m,'').replace(/^create index events_title_trgm_idx.*;$/m,''));
  const original=sql('0004_functions.sql');await db.exec(original.slice(0,original.indexOf('-- Recherche instantanée')));
  await db.exec(sql('20260907193754_audit_signup_profile.sql'));
  await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[
    '30000000-0000-4000-8000-000000000000',
    'oliver@example.test',
    JSON.stringify({role:'practitioner',name:'Oliver Rust',first_name:'Oliver',last_name:'Rust',bio:'Bio saisie avant la correction de la migration.',specialties:['Yoga'],website:'https://oliver.example.test',instagram:'https://instagram.com/oliver',preferred_lang:'fr'})
  ]);
  await db.exec(sql('20261007160000_signup_details_and_community_universe.sql'));
},30000);
afterAll(async()=>{await db?.close();});
it('crée le compte et une seule fiche en attente dans la même transaction',async()=>{
  const id='30000000-0000-4000-8000-000000000001';
  await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[id,'signup@example.test',JSON.stringify({role:'practitioner',name:'Marie QA',first_name:'Marie',last_name:'Dupont',bio:'Une présentation complète de la pratique.',specialties:['Méditation','Danse'],website:'https://example.test',instagram:'https://instagram.com/marie',preferred_lang:'de'})]);
  const result=await db.query('select name,bio,specialties,contact,links,status,credits from practitioners where user_id=$1',[id]);
  expect(result.rows).toEqual([{name:'Marie QA',bio:'Une présentation complète de la pratique.',specialties:['Méditation','Danse'],contact:{email:'signup@example.test',first_name:'Marie',last_name:'Dupont',website:'https://example.test'},links:{instagram:'https://instagram.com/marie'},status:'pending',credits:0}]);
});
it('ne crée pas de praticien ni d’administrateur depuis un rôle falsifié',async()=>{
  const id='30000000-0000-4000-8000-000000000002';
  await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[id,'visitor@example.test',JSON.stringify({role:'admin',preferred_lang:'xx'})]);
  expect((await db.query('select role,preferred_lang from profiles where id=$1',[id])).rows).toEqual([{role:'participant',preferred_lang:'fr'}]);
  expect((await db.query('select id from practitioners where user_id=$1',[id])).rows).toHaveLength(0);
});
it('restaure les détails encore présents dans les métadonnées des inscriptions existantes',async()=>{
  const result=await db.query('select bio,specialties,contact,links from practitioners where user_id=$1',['30000000-0000-4000-8000-000000000000']);
  expect(result.rows).toEqual([{bio:'Bio saisie avant la correction de la migration.',specialties:['Yoga'],contact:{email:'oliver@example.test',first_name:'Oliver',last_name:'Rust',website:'https://oliver.example.test'},links:{instagram:'https://instagram.com/oliver'}}]);
});
it('ajoute le nouvel univers demandé par Didier',async()=>{
  expect((await db.query("select name,position from categories where slug='cercles-rituels-communautes'")).rows).toEqual([{name:'Cercles, rituels, communautés',position:6}]);
});
