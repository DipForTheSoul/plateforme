import {expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import ContactPage from '@/app/[locale]/admin/contact/page';
import SubmissionsPage from '@/app/[locale]/admin/soumissions/page';
import PractitionerPage from '@/app/[locale]/admin/praticiens/page';
import NewsletterPage from '@/app/[locale]/admin/newsletter/page';
import FeaturedPage from '@/app/[locale]/admin/mises-en-avant/page';
vi.mock('@/components/admin/SettingNumberForm',()=>({SettingNumberForm:()=>null}));
vi.mock('@/app/[locale]/admin/newsletter/ImportForm',()=>({ImportForm:()=>null}));
vi.mock('@/app/[locale]/admin/newsletter/MailerLiteSync',()=>({MailerLiteSync:()=>null}));
vi.mock('@/lib/queries',()=>({getCategories:async()=>[]}));
vi.mock('@/app/actions/contacts',()=>({deleteContact:()=>{},updateContactInterests:()=>{}}));
vi.mock('@/lib/auth',()=>({requireRole:async()=>({role:'admin'})}));
vi.mock('@/lib/live-credits',()=>({withLiveCredits:async(_:unknown,rows:unknown[])=>rows}));
vi.mock('next-intl/server',()=>({getLocale:async()=> 'fr',setRequestLocale:()=>{},getTranslations:async()=>Object.assign((key:string)=>key,{raw:(key:string)=>key})}));
vi.mock('next-intl',()=>({useTranslations:()=>((key:string)=>key)}));
vi.mock('@/i18n/navigation',()=>({Link:({href,children}:{href:string,children:React.ReactNode})=><a href={href}>{children}</a>}));
vi.mock('@/app/actions/admin',()=>({moderateEvent:()=>{},moderatePractitioner:()=>{},toggleTopListing:()=>{},extendFeatured:()=>{}}));
vi.mock('@/app/actions/contact',()=>({toggleContactHandled:()=>{}}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:()=>{
  let start=0,end=999;
  const q={select:()=>q,is:()=>q,eq:()=>q,order:()=>q,limit:(n:number)=>{end=n-1;return q;},range:(a:number,b:number)=>{start=a;end=b;return q;},maybeSingle:async()=>({data:{value:'30'},error:null}),
    then:(resolve:(v:unknown)=>unknown)=>resolve({error:null,count:1105,data:Array.from({length:1105},(_,i)=>({id:String(i),name:`QA-${i}`,title:`QA-${i}`,email:'qa@example.test',message:`Message-${i}`,status:'pending',start_date:'2026-10-30T10:00:00Z',created_at:'2026-09-01T10:00:00Z',specialties:[],interests:[],contact:{},credits:0})).slice(start,end+1)})};return q;
}})}));
it('un ancien message reste consultable au-delà de la limite de 200',async()=>{
  expect(renderToStaticMarkup(await ContactPage({params:Promise.resolve({locale:'fr'})})).includes('Message-1104')).toBe(true);
});
it('une soumission ne disparaît pas après les 100 premières',async()=>{
  expect(renderToStaticMarkup(await SubmissionsPage()).includes('QA-1104')).toBe(true);
});
it('un praticien reste accessible au-delà de mille fiches',async()=>{
  expect(renderToStaticMarkup(await PractitionerPage()).includes('QA-1104')).toBe(true);
});
it('les contacts restent modifiables après les cinq cents premiers',async()=>{
  expect(renderToStaticMarkup(await NewsletterPage()).includes('value="1104"')).toBe(true);
});
it('les anciennes expériences restent sélectionnables pour une mise en avant',async()=>{
  expect(renderToStaticMarkup(await FeaturedPage()).includes('QA-1104')).toBe(true);
});
