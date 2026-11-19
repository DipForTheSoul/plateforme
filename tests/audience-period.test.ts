// @vitest-environment node
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {beforeAll, afterAll, expect, it} from 'vitest';
import {audienceMonth, audienceMonths} from '@/lib/audience-period';

let db: PGlite;
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create function public.is_admin() returns boolean language sql stable as $$ select current_setting('test.admin',true)='yes' $$;`);
 await db.exec(readFileSync('supabase/migrations/20261017190000_audience_v2.sql','utf8'));
 await db.exec(`update audience_measurement set started_at='2020-01-15T12:00:00Z';
 insert into audience_visitors(browser_id,day) values
 ('11111111-1111-4111-8111-111111111111','2020-01-20'),
 ('11111111-1111-4111-8111-111111111111','2020-01-31'),
 ('22222222-2222-4222-8222-222222222222','2020-01-31'),
 ('33333333-3333-4333-8333-333333333333','2020-02-01'),
 ('44444444-4444-4444-8444-444444444444',(now() at time zone 'Europe/Zurich')::date-29),
 ('55555555-5555-4555-8555-555555555555',(now() at time zone 'Europe/Zurich')::date-30),
 ('44444444-4444-4444-8444-444444444444',(now() at time zone 'Europe/Zurich')::date);`);
 await db.exec(readFileSync('supabase/migrations/20261119163000_admin_audience_period.sql','utf8'));
 await db.exec("set role authenticated; set test.admin='yes'");
});
afterAll(async()=>db.close());
it('compte un navigateur une seule fois et exclut les jours du mois voisin',async()=>{
 const r=await db.query<{visitors:number;period_start:string;period_end:string}>("select visitors::int,period_start::text,period_end::text from get_admin_audience_period('2020-01')");
 expect(r.rows).toEqual([{visitors:2,period_start:'2020-01-01',period_end:'2020-01-31'}]);
 const feb=await db.query<{visitors:number}>("select visitors::int from get_admin_audience_period('2020-02')");
 expect(feb.rows[0].visitors).toBe(1);
});
it('garde le calcul glissant existant et les relevés antérieurs',async()=>{
 const r=await db.query<{same:boolean}>(`select a.visitors=b.visitors as same from get_admin_visitors() a cross join get_admin_audience_period() b`);
 expect(r.rows[0].same).toBe(true);
 const n=await db.query<{n:number}>('select count(*)::int n from audience_visitors');expect(n.rows[0].n).toBe(7);
});
it('arrête le mois en cours à la date du jour et rejette les périodes invalides',async()=>{
 const r=await db.query<{same:boolean}>(`select period_end=(now() at time zone 'Europe/Zurich')::date as same from get_admin_audience_period(to_char(now() at time zone 'Europe/Zurich','YYYY-MM'))`);
 expect(r.rows[0].same).toBe(true);
 for(const month of ['2026-13','abc','2099-01','1999-01']) await expect(db.query('select * from get_admin_audience_period($1)',[month])).rejects.toThrow('Invalid month');
});
it('refuse les appels non admin, y compris identité non établie, et anonymes',async()=>{
 await db.exec("set test.admin='no'");await expect(db.query("select * from get_admin_audience_period('2020-01')")).rejects.toThrow('Administrator access required');
 await db.exec(`reset role; create or replace function public.is_admin() returns boolean language sql stable as $$ select null::boolean $$; set role authenticated;`);
 await expect(db.query("select * from get_admin_audience_period('2020-01')")).rejects.toThrow('Administrator access required');
 await db.exec('reset role; set role anon');await expect(db.query('select * from get_admin_audience_period()')).rejects.toThrow('permission denied');
});
it('valide les mois URL et énumère les données disponibles avec le fuseau suisse',()=>{
 const today=new Date('2026-11-19T12:00:00Z');
 expect(audienceMonth('2026-10',today)).toBe('2026-10');expect(audienceMonth('2026-13',today)).toBe('2026-11');expect(audienceMonth(['2026-10'],today)).toBe('2026-11');
 expect(audienceMonth(undefined,today)).toBe('2026-11');expect(audienceMonth('',today)).toBeUndefined();expect(audienceMonth('rolling',today)).toBeUndefined();expect(audienceMonth('2099-01',today)).toBe('2026-11');
 expect(audienceMonth(undefined,new Date('2026-11-30T23:30:00Z'))).toBe('2026-12');
 expect(audienceMonth(undefined,new Date('2026-12-31T23:30:00Z'))).toBe('2027-01');
 expect(audienceMonths('2025-12-31T23:30:00Z','2026-03-19')).toEqual(['2026-03','2026-02','2026-01']);
});
