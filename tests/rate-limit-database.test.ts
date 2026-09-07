// @vitest-environment node
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {beforeAll,afterAll,expect,it} from 'vitest';
let db:PGlite;
const key='a'.repeat(64);
beforeAll(async()=>{
  db=new PGlite();await db.exec('create role anon;create role authenticated;create role service_role bypassrls;create schema private;create table contacts(id int);create table contact_messages(id int);create table page_views(id int);create table favorites(id int);');
  await db.exec(readFileSync(new URL('../supabase/migrations/20260907193051_audit_shared_limits.sql',import.meta.url),'utf8'));
},30000);
afterAll(async()=>{await db?.close();});
it('limite les appels et rouvre après expiration sans remettre à zéro chaque connexion',async()=>{
  await db.exec('set role service_role');
  const results=[];for(let i=0;i<7;i++)results.push((await db.query<{ok:boolean}>('select take_request_slot($1,5,60) as ok',[key])).rows[0].ok);
  expect(results).toEqual([true,true,true,true,true,false,false]);
  await db.query("update private.request_limits set expires_at=now()-interval '1 second' where key=$1",[key]);
  expect((await db.query<{ok:boolean}>('select take_request_slot($1,5,60) as ok',[key])).rows[0].ok).toBe(true);
  await db.exec('reset role');
});
it('bloque les RPC publiques et les insertions directes contournant les formulaires',async()=>{
  for(const role of ['anon','authenticated']){
    await db.exec(`set role ${role}`);
    await expect(db.query('select take_request_slot($1,5,60)',[key])).rejects.toThrow(/permission denied/);
    for(const table of ['contacts','contact_messages','page_views','favorites'])await expect(db.exec(`insert into ${table}(id) values(1)`)).rejects.toThrow(/permission denied/);
    await db.exec('reset role');
  }
});
it('refuse des paramètres hors limite',async()=>{
  await expect(db.query('select take_request_slot($1,0,60)',[key])).rejects.toThrow('Invalid rate limit');
  await expect(db.query('select take_request_slot($1,5,60)',['raw-ip'])).rejects.toThrow('Invalid rate limit');
});
