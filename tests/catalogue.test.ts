import {beforeEach,it,expect,vi} from 'vitest';
import {getApprovedEvents,getApprovedPractitioners,getVenues} from '@/lib/queries';
const state=vi.hoisted(()=>({failed:false,ranges:[] as number[],or:vi.fn(),gte:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:(table:string)=>{
  let offset=0,end=999;
  const query={select:()=>query,eq:()=>query,or:(filter:string)=>{state.or(filter);return query;},gte:(...args:unknown[])=>{state.gte(...args);return query;},order:()=>query,limit:(n:number)=>{end=n-1;return query;},range:(from:number,to:number)=>{offset=from;end=to;state.ranges.push(from);return query;},maybeSingle:async()=>({data:{value:'15'},error:null}),then:(resolve:(v:unknown)=>unknown)=>resolve({error:state.failed?{message:'unavailable'}:null,data:table!=='settings'?Array.from({length:1105},(_,i)=>({id:String(i),name:'QA',title:'Atelier',category:{id:'c',slug:i===1104?'rare':'common'},event_categories:[]})).slice(offset,end+1):[]})};
  return query;
}})}));
beforeEach(()=>{state.failed=false;state.ranges=[];state.or.mockClear();state.gte.mockClear();});
it('décompte le délai depuis la fin du séjour et conserve le filtre de début choisi',async()=>{
  vi.spyOn(Date,'now').mockReturnValue(Date.parse('2026-09-30T12:00:00Z'));
  try {
    await getApprovedEvents();
    expect(state.or).toHaveBeenCalledWith('end_date.gte.2026-09-15T12:00:00.000Z,start_date.gte.2026-09-15T12:00:00.000Z');
    expect(state.gte).not.toHaveBeenCalled();
    await getApprovedEvents({dateFrom:'2026-09-20T00:00:00Z'});
    expect(state.gte).toHaveBeenCalledWith('start_date','2026-09-20T00:00:00Z');
  } finally {vi.restoreAllMocks();}
});
it('retrouve une catégorie au-delà des 100 et des 1000 premières expériences',async()=>{
  const events=await getApprovedEvents({category:'rare'});expect(events.map(e=>e.id)).toEqual(['1104']);expect(state.ranges.length).toBeGreaterThan(1);
});
it('ne présente pas une panne de catalogue comme une absence de résultats',async()=>{
  state.failed=true;await expect(getApprovedEvents()).rejects.toThrow();
});
it('ne tronque pas les annuaires de praticiens et de lieux à mille entrées',async()=>{
  expect(await getApprovedPractitioners()).toHaveLength(1105);expect(await getVenues()).toHaveLength(1105);
});
