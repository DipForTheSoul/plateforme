import {beforeEach, expect, it, vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {AdminExperienceViews} from '@/app/[locale]/admin/ExperienceViews';

const state = vi.hoisted(() => ({failure: '', rows: [{id:'1', title:'Offre sans vue', slug:'offre-zero', view_count:0}], calls: [] as unknown[][]}));
vi.mock('next-intl/server', () => ({getLocale:async ()=>'fr', getTranslations:async ()=>(key:string)=>key}));
vi.mock('@/i18n/navigation', () => ({Link:({href,children}:{href:string;children:React.ReactNode})=><a href={href}>{children}</a>}));
vi.mock('@/lib/supabase/server', () => ({createClient:async () => ({from:(table:string) => {
  state.calls.push(['from',table]);
  const q = {
    select:(value:string)=>{state.calls.push(['select',value]);return q;},
    eq:(key:string,value:string)=>{state.calls.push(['eq',key,value]);return q;},
    order:()=>q,
    limit:(value:number)=>{state.calls.push(['limit',value]);return q;},
    abortSignal:(signal:AbortSignal)=>{state.calls.push(['signal',signal]);return q;},
    then:(resolve:(v:unknown)=>unknown,reject:(v:unknown)=>unknown)=>state.failure==='throw'?reject(new Error('timeout')):resolve({data:state.rows,error:state.failure?{}:null}),
  }; return q;
}})}));
beforeEach(()=>{state.failure='';state.rows=[{id:'1',title:'Offre sans vue',slug:'offre-zero',view_count:0}];state.calls=[];});
it('affiche aussi une expérience à zéro avec son lien et une lecture bornée',async()=>{
  const html=renderToStaticMarkup(await AdminExperienceViews());
  expect(html).toContain('Offre sans vue');expect(html).toContain('/experiences/offre-zero');expect(html).toContain('>0</span>');
  expect(state.calls).toContainEqual(['from','events']);expect(state.calls).toContainEqual(['limit',8]);expect(state.calls).toContainEqual(['eq','status','approved']);
  expect(state.calls.some(c=>c[0]==='signal'&&c[1] instanceof AbortSignal)).toBe(true);
  expect(state.calls.some(c=>c.includes('page_views'))).toBe(false);
});
it.each(['error','throw'])('isole une panne %s sans afficher un faux zéro',async(failure)=>{
  state.failure=failure;const html=renderToStaticMarkup(await AdminExperienceViews());
  expect(html).toContain('dashboard.unavailable');expect(html).not.toContain('Offre sans vue');expect(html).not.toContain('>0</span>');
});
it('garde le bloc visible si aucune offre publiée existe',async()=>{
  state.rows=[];const html=renderToStaticMarkup(await AdminExperienceViews());expect(html).toContain('dashboard.topExperiences');expect(html).toContain('dashboard.noData');
});
