import {beforeEach,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import Dashboard from '@/app/[locale]/admin/page';
const state=vi.hoisted(()=>({fail:false}));
vi.mock('next-intl/server',()=>({getTranslations:async()=>Object.assign((key:string,args?:{count:number})=>args?`${key}:${args.count}`:key,{raw:()=>''})}));
vi.mock('@/i18n/navigation',()=>({Link:({href,children}:{href:string,children:React.ReactNode})=><a href={href}>{children}</a>}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:(table:string)=>{
  let start=0,end=999;
  const q={select:()=>q,eq:()=>q,is:()=>q,gte:()=>q,order:()=>q,limit:(n:number)=>{end=n-1;return q;},range:(a:number,b:number)=>{start=a;end=b;return q;},
    then:(resolve:(v:unknown)=>unknown)=>resolve({error:state.fail?{}:null,count:1105,data:table==='page_views'?Array.from({length:1105},(_,i)=>({id:i,path:i===1104?'/unique-page':'/experiences'})).slice(start,end+1):[]})};return q;
}})}));
beforeEach(()=>{state.fail=false;});
it('compte toutes les vues même après mille lignes',async()=>{
  const html=renderToStaticMarkup(await Dashboard());expect(html).toContain('/unique-page');expect(html).toContain('>1104<');
});
it('ne présente pas de statistiques artificiellement vides si la base échoue',async()=>{
  state.fail=true;await expect(Dashboard()).rejects.toThrow();
});
