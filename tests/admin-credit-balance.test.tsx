import {expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import AdminCreditsPage from '@/app/[locale]/admin/credits/page';
vi.mock('next-intl/server',()=>({getTranslations:async()=>((key:string)=>key)}));
vi.mock('@/components/admin/SettingNumberForm',()=>({SettingNumberForm:()=>null}));
vi.mock('@/components/admin/AdjustCreditsForm',()=>({AdjustCreditsForm:()=>null}));
vi.mock('@/components/admin/GrantCreditsForm',()=>({GrantCreditsForm:({practitioners}:{practitioners:Array<{credits:number}>})=><output>{practitioners[0].credits}</output>}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:(table:string)=>{
  let start=0,end=999;
  let rows:Array<Record<string,unknown>>=table==='practitioners'?[{id:'p',name:'QA',credits:19}]:table==='credit_packs'?[
    {practitioner_id:'p',credits_remaining:15,accounting_active:true,expires_at:'2000-01-01'},
    {practitioner_id:'p',credits_remaining:4,accounting_active:true,expires_at:null},
    {practitioner_id:'p',credits_remaining:80,accounting_active:false,expires_at:null},
  ]:table==='credit_transactions'?[{id:'tx',type:'expiration',amount:-15,created_at:'2026-09-07T10:00:00Z',practitioner:{name:'QA'}}]:[];
  const q={select:()=>q,order:()=>q,limit:()=>q,range:(a:number,b:number)=>{start=a;end=b;return q;},
    eq:(key:string,value:unknown)=>{rows=rows.filter(r=>r[key as keyof typeof r]===value);return q;},
    gt:()=>q,or:()=>{rows=rows.filter(r=>!('expires_at'in r)||r.expires_at===null||String(r.expires_at)>new Date().toISOString());return q;},
    maybeSingle:async()=>({data:{value:'365'},error:null}),then:(resolve:(v:unknown)=>unknown)=>resolve({data:rows.slice(start,end+1),error:null})};return q;
}})}));
it('affiche quatre crédits utilisables et non les dix-neuf du cache après expiration',async()=>{
  expect(renderToStaticMarkup(await AdminCreditsPage()).includes('<output>4</output>')).toBe(true);
});
it('ne présente pas les crédits expirés comme une consommation',async()=>{
  const html=renderToStaticMarkup(await AdminCreditsPage());expect(html).toContain('txExpiration');expect(html).not.toContain('txConsumption');
});
