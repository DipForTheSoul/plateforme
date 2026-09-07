import {beforeEach,it,expect,vi} from 'vitest';
import {getApprovedEvents,getApprovedPractitioners,getVenues} from '@/lib/queries';
const state=vi.hoisted(()=>({failed:false,ranges:[] as number[]}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:(table:string)=>{
  let offset=0,end=999;
  const query={select:()=>query,eq:()=>query,gte:()=>query,order:()=>query,limit:(n:number)=>{end=n-1;return query;},range:(from:number,to:number)=>{offset=from;end=to;state.ranges.push(from);return query;},maybeSingle:async()=>({data:{value:'15'},error:null}),then:(resolve:(v:unknown)=>unknown)=>resolve({error:state.failed?{message:'unavailable'}:null,data:table!=='settings'?Array.from({length:1105},(_,i)=>({id:String(i),name:'QA',title:'Atelier',category:{id:'c',slug:i===1104?'rare':'common'},event_categories:[]})).slice(offset,end+1):[]})};
  return query;
}})}));
beforeEach(()=>{state.failed=false;state.ranges=[];});
it('retrouve une catégorie au-delà des 100 et des 1000 premières expériences',async()=>{
  const events=await getApprovedEvents({category:'rare'});expect(events.map(e=>e.id)).toEqual(['1104']);expect(state.ranges.length).toBeGreaterThan(1);
});
it('ne présente pas une panne de catalogue comme une absence de résultats',async()=>{
  state.failed=true;await expect(getApprovedEvents()).rejects.toThrow();
});
it('ne tronque pas les annuaires de praticiens et de lieux à mille entrées',async()=>{
  expect(await getApprovedPractitioners()).toHaveLength(1105);expect(await getVenues()).toHaveLength(1105);
});
