// @vitest-environment node
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {beforeAll,afterAll,it,expect} from 'vitest';
let db:PGlite;
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create function public.is_admin() returns boolean language sql stable as $$ select current_setting('test.admin',true)='yes' $$;
 create table public.page_views(id bigint); insert into page_views select generate_series(1,40027);`);
 await db.exec(readFileSync(new URL('../supabase/migrations/20261017190000_audience_v2.sql',import.meta.url),'utf8'));
 await db.exec(readFileSync(new URL('../supabase/migrations/20261018155000_clean_page_audience.sql',import.meta.url),'utf8'));
});
afterAll(async()=>db.close());
it('démarre le classement à zéro sans reprendre les 40027 anciennes lignes',async()=>{
 await db.exec("set role authenticated; set test.admin='yes'");
 const result=await db.query<{total:number;pages:unknown[]}>('select * from get_admin_page_view_summary()');
 expect(Number(result.rows[0].total)).toBe(0);expect(result.rows[0].pages).toEqual([]);
 await db.exec('reset role');expect((await db.query('select count(*)::int as n from page_views')).rows).toEqual([{n:40027}]);
});
it('compte chaque navigateur/page/jour une fois et refuse les écritures non autorisées',async()=>{
 await db.exec(`set role service_role;
 insert into audience_page_visitors(browser_id,path) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','/experiences') on conflict do nothing;
 insert into audience_page_visitors(browser_id,path) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','/experiences') on conflict do nothing;
 insert into audience_page_visitors(browser_id,path) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','/lieux');
 reset role; set role authenticated; set test.admin='yes';`);
 const result=await db.query<{total:number;pages:{path:string;views:number}[]}>('select * from get_admin_page_view_summary()');
 expect(Number(result.rows[0].total)).toBe(2);expect(result.rows[0].pages).toHaveLength(2);
 await expect(db.query("insert into audience_page_visitors(browser_id,path) values(gen_random_uuid(),'/')")).rejects.toThrow('permission denied');
 await db.exec("set test.admin='no'");expect((await db.query('select * from audience_page_visitors')).rows).toHaveLength(0);
 await expect(db.query('select * from get_admin_page_view_summary()')).rejects.toThrow('Administrator access required');await db.exec('reset role');
});
it('conserve l’historique et ne le compte pas comme des visiteurs',async()=>{
 expect((await db.query('select count(*)::int as n from page_views')).rows).toEqual([{n:40027}]);
 await db.exec("set role authenticated; set test.admin='yes'");
 expect((await db.query<{visitors:number}>('select * from get_admin_visitors()')).rows[0].visitors).toBe(0);
 await db.exec('reset role');
});
it('déduplique par navigateur, même sur plusieurs jours et avec répétition',async()=>{
 await db.exec(`set role service_role;
 insert into audience_visitors(browser_id) values('11111111-1111-4111-8111-111111111111') on conflict(day,browser_id) do nothing;
 insert into audience_visitors(browser_id) values('11111111-1111-4111-8111-111111111111') on conflict(day,browser_id) do nothing;
 insert into audience_visitors(browser_id,day) values('11111111-1111-4111-8111-111111111111',current_date-1),('22222222-2222-4222-8222-222222222222',current_date-31);
 reset role; set role authenticated; set test.admin='yes';`);
 expect((await db.query<{visitors:number}>('select * from get_admin_visitors()')).rows[0].visitors).toBe(1);
 await db.exec('reset role');
});
it('refuse lecture et écriture aux visiteurs et praticiens',async()=>{
 await db.exec("set role authenticated; set test.admin='no'");
 expect((await db.query('select * from audience_visitors')).rows).toHaveLength(0);
 await expect(db.query('select * from get_admin_visitors()')).rejects.toThrow('Administrator access required');
 await expect(db.query("insert into audience_visitors(browser_id) values(gen_random_uuid())")).rejects.toThrow('permission denied');
 await db.exec('reset role; set role anon');
 await expect(db.query('select * from get_admin_visitors()')).rejects.toThrow('permission denied');
 await db.exec('reset role');
});
it('agrège 100000 relevés synthétiques sans les transférer au serveur web',async()=>{
 await db.exec("insert into audience_visitors(browser_id) select gen_random_uuid() from generate_series(1,100000); set role authenticated; set test.admin='yes'");
 const start=performance.now();const result=await db.query<{visitors:number}>('select * from get_admin_visitors()');
 console.info('Audience 100000 rows (ms):',Math.round(performance.now()-start));
 expect(result.rows).toHaveLength(1);expect(result.rows[0].visitors).toBe(100001);
 await db.exec('reset role');
});
