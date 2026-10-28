// @vitest-environment node
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {beforeAll,afterAll,it,expect} from 'vitest';
let db:PGlite;
const old='11111111-1111-4111-8111-111111111111';
const fresh='22222222-2222-4222-8222-222222222222';
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create function public.is_admin() returns boolean language sql stable as $$select current_setting('test.admin',true)='yes'$$;`);
 for(const file of ['20261017190000_audience_v2.sql','20261018155000_clean_page_audience.sql','20261028091124_separate_internal_audience.sql'])await db.exec(readFileSync(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
 await db.exec(`insert into audience_visitors(browser_id) values('${old}');insert into audience_page_visitors(browser_id,path) values('${old}','/lieux');`);
 await db.exec(readFileSync(new URL('../supabase/migrations/20261028093827_audience_acquisition_followup.sql',import.meta.url),'utf8'));
});
afterAll(async()=>db.close());
async function summary(days=30){
 await db.exec("set role authenticated;set test.admin='yes'");
 const r=await db.query<{data:{visitors:number;page_views:number;signups:number;paid:number;google:number;conversion_rate:number;daily:unknown[]}}>('select get_admin_audience_followup($1) data',[days]);
 await db.exec('reset role');return r.rows[0].data;
}
it('préserve le visiteur historique au démarrage du nouveau suivi',async()=>{
 expect((await summary()).visitors).toBe(1);
 expect((await db.query<{n:number}>('select count(*)::int n from audience_page_visitors')).rows[0].n).toBe(1);
});
it('ajoute de vraies consultations sans doubler le navigateur historique ni les retries',async()=>{
 await db.exec('set role service_role');
 for(const [id,event,channel] of [[old,old,'google'],[old,old,'google'],[old,fresh,'google'],[fresh,'33333333-3333-4333-8333-333333333333','paid_social']]){
 await db.query("select record_audience_visit($1,'/lieux',$2,(now() at time zone 'Europe/Zurich')::date,$3,$4,'CH','mobile')",[id,'a'.repeat(64),event,channel]);
 }
 await db.query('select record_audience_signup($1)',[fresh]);
 await db.query('select record_audience_signup($1)',[fresh]);
 await db.exec('reset role');
 expect(await summary()).toMatchObject({visitors:2,page_views:3,signups:1,paid:1,google:1,conversion_rate:50});
});
it.each([7,30,90])('couvre %i jours sans additionner plusieurs fois le même navigateur',async days=>{
 const data=await summary(days);expect(data.visitors).toBe(2);expect(data.daily).toHaveLength(days);
});
it('refuse un rôle non administrateur et les écritures publiques',async()=>{
 await db.exec("set role authenticated;set test.admin='no'");
 await expect(db.query('select get_admin_audience_followup(30)')).rejects.toThrow('Administrator access required');
 await expect(db.query('select record_audience_signup($1)',[fresh])).rejects.toThrow('permission denied');
 await db.exec('reset role');
});
it('archive les totaux expirés sans toucher à l’historique ni aux chiffres courants',async()=>{
 await db.exec(`insert into internal_audience_signups values(current_date-100,'${fresh}');
 insert into internal_audience_visitors(day,browser_id) values(current_date-100,'${fresh}');
 select archive_internal_audience();select archive_internal_audience();`);
 expect((await db.query("select observations::int n from internal_audience_archive where kind='signups'")).rows).toEqual([{n:1}]);
 expect((await summary()).visitors).toBe(2);
 expect((await db.query<{n:number}>('select count(*)::int n from audience_visitors')).rows[0].n).toBe(1);
});
