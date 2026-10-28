// @vitest-environment node
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {beforeAll,afterAll,it,expect} from 'vitest';
let db:PGlite;
const oldId='11111111-1111-4111-8111-111111111111';
const newId='22222222-2222-4222-8222-222222222222';
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create function public.is_admin() returns boolean language sql stable as $$select current_setting('test.admin',true)='yes'$$;
 create table page_views(id int);insert into page_views values(123);
 create table events(id int,view_count int);insert into events values(1,654);`);
 for(const file of ['20261017190000_audience_v2.sql','20261018155000_clean_page_audience.sql'])await db.exec(readFileSync(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
 await db.exec(`insert into audience_visitors(browser_id) values('${oldId}');insert into audience_page_visitors(browser_id,path) values('${oldId}','/lieux');`);
 await db.exec(readFileSync(new URL('../supabase/migrations/20261028091124_separate_internal_audience.sql',import.meta.url),'utf8'));
});
afterAll(async()=>db.close());
it('la migration conserve les totaux, la date et toutes les anciennes lignes',async()=>{
 await db.exec("set role authenticated;set test.admin='yes'");
 expect(Number((await db.query<{visitors:number}>('select * from get_admin_visitors()')).rows[0].visitors)).toBe(1);
 expect(Number((await db.query<{total:number}>('select * from get_admin_page_view_summary()')).rows[0].total)).toBe(1);
 await db.exec('reset role');expect((await db.query('select view_count from events')).rows).toEqual([{view_count:654}]);
 expect((await db.query('select * from page_views')).rows).toEqual([{id:123}]);
});
it('déduplique anciens et nouveaux relevés, les pages et les appels concurrents',async()=>{
 await db.exec('set role service_role');
 for(const id of [oldId,newId,newId])await db.query(`select record_internal_audience($1,'/lieux',$2,(now() at time zone 'Europe/Zurich')::date)`,[id,id===oldId?'a'.repeat(64):'b'.repeat(64)]);
 await db.exec("reset role;set role authenticated;set test.admin='yes'");
 expect(Number((await db.query<{visitors:number}>('select * from get_admin_visitors()')).rows[0].visitors)).toBe(2);
 expect(Number((await db.query<{total:number}>('select * from get_admin_page_view_summary()')).rows[0].total)).toBe(2);
 await db.exec('reset role');
});
it.each(['anon','authenticated'])('interdit les écritures directes et les fonctions service au rôle %s',async role=>{
 await db.exec(`set role ${role}`);
 await expect(db.query(`select record_internal_audience($1,'/lieux',$2,current_date)`,[newId,'c'.repeat(64)])).rejects.toThrow('permission denied');
 await expect(db.query('select archive_internal_audience()')).rejects.toThrow('permission denied');
 await db.exec('reset role');
});
it('refuse les statistiques aux non-admins, y compris un résultat NULL',async()=>{
 await db.exec("set role authenticated;set test.admin='no'");
 expect((await db.query('select * from internal_audience_visitors')).rows).toHaveLength(0);
 await expect(db.query('select * from get_admin_visitors()')).rejects.toThrow('Administrator access required');
 await db.exec("reset role;create or replace function public.is_admin() returns boolean language sql stable as $$select null::boolean$$;set role authenticated;");
 await expect(db.query('select * from get_admin_visitors()')).rejects.toThrow('Administrator access required');
 await db.exec("reset role;create or replace function public.is_admin() returns boolean language sql stable as $$select current_setting('test.admin',true)='yes'$$;");
});
it('archive les chiffres expirés sans identifiants et préserve le compteur courant et l’ancien historique',async()=>{
 await db.exec(`insert into internal_audience_visitors(day,browser_id) values(current_date-40,'${newId}');
 insert into internal_audience_pages(day,path,page_token) values(current_date-40,'/lieux','${'c'.repeat(64)}');
 set role service_role;select archive_internal_audience();select archive_internal_audience();reset role;`);
 expect((await db.query('select kind,observations::int from internal_audience_archive order by kind')).rows).toEqual([{kind:'pages',observations:1},{kind:'visitors',observations:1}]);
 expect((await db.query('select count(*)::int as n from audience_visitors')).rows).toEqual([{n:1}]);
 expect((await db.query('select count(*)::int as n from audience_page_visitors')).rows).toEqual([{n:1}]);
 await db.exec("set role authenticated;set test.admin='yes'");
 expect(Number((await db.query<{visitors:number}>('select * from get_admin_visitors()')).rows[0].visitors)).toBe(2);
 await db.exec('reset role');
});
