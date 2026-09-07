import {beforeEach,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import Dashboard from '@/app/[locale]/espace-praticien/page';
import MyEvents from '@/app/[locale]/espace-praticien/evenements/page';
const state=vi.hoisted(()=>({fail:false}));
vi.mock('next-intl/server',()=>({getLocale:async()=> 'de',getTranslations:async()=>((key:string)=>key)}));
vi.mock('next-intl',()=>({useTranslations:()=>((key:string)=>key)}));
vi.mock('@/i18n/navigation',()=>({Link:({href,children}:{href:string,children:React.ReactNode})=><a href={href}>{children}</a>}));
vi.mock('@/lib/auth',()=>({getCurrentPractitioner:async()=>({id:'p',status:'approved',credits:10})}));
vi.mock('@/app/actions/auth',()=>({createMissingPractitioner:()=>{}}));
vi.mock('@/app/actions/events',()=>({deleteEvent:()=>{}}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:()=>{
  let start=0,end=999,rootsOnly=false;
  const rows=Array.from({length:1106},(_,i)=>({id:String(i),title:`Event-${i}`,status:'approved',start_date:'2026-10-30T10:00:00Z',view_count:2,parent_event_id:i===1105?'0':null}));
  const q={select:()=>q,eq:()=>q,is:()=>{rootsOnly=true;return q;},order:()=>q,limit:(n:number)=>{end=Math.min(n-1,999);return q;},range:(a:number,b:number)=>{start=a;end=b;return q;},
    then:(resolve:(v:unknown)=>unknown)=>resolve({error:state.fail?{}:null,data:(rootsOnly?rows.filter(r=>!r.parent_event_id):rows).slice(start,end+1)})};return q;
}})}));
beforeEach(()=>{state.fail=false;});
it('compte toutes les séries déposées et les vues de leurs occurrences',async()=>{
  const html=renderToStaticMarkup(await Dashboard());expect(html).toContain('>1105<');expect(html).toContain('>2212<');expect(html).not.toContain('Event-5');
});
it('présente les dates en allemand dans le tableau de bord',async()=>{
  const html=renderToStaticMarkup(await Dashboard());expect(html).toContain('Freitag 30.10.2026');expect(html).not.toContain('Vendredi');
});
it('ne cache pas les expériences au-delà de mille séries',async()=>{
  const html=renderToStaticMarkup(await MyEvents({searchParams:Promise.resolve({})}));expect(html).toContain('Event-1104');expect(html).toContain('Freitag');
});
it('ne fait pas passer une panne pour une liste vide',async()=>{
  state.fail=true;await expect(Dashboard()).rejects.toThrow();await expect(MyEvents({searchParams:Promise.resolve({})})).rejects.toThrow();
});
