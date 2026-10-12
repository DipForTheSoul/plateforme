import {beforeEach,it,expect,vi} from 'vitest';
import {getApprovedEvents,getApprovedPractitioners,getVenues} from '@/lib/queries';
const state=vi.hoisted(()=>({failed:false,ranges:[] as number[],practitionerName:'QA'}));
vi.mock('@/lib/supabase/public',()=>({createPublicClient:()=>({from:(table:string)=>{
  let offset=0,end=999;
  const query={select:()=>query,eq:()=>query,order:()=>query,range:(from:number,to:number)=>{offset=from;end=to;state.ranges.push(from);return query;},then:(resolve:(v:unknown)=>unknown)=>resolve({error:state.failed?{message:'unavailable'}:null,data:table==='settings'?[{key:'event_delist_days',value:'15'}]:Array.from({length:1105},(_,i)=>({id:String(i),name:'QA',title:i===4?'Méditation':'Atelier',slug:`event-${i}`,status:'approved',start_date:'2026-10-20T12:00:00Z',end_date:null,languages:['fr'],price:10,duration_minutes:60,practitioner:{id:'p',name:state.practitionerName,slug:'didier'},category:{id:'c',slug:i===1104?'rare':'common'},event_categories:[]})).slice(offset,end+1)})};
  return query;
}})}));
beforeEach(()=>{state.failed=false;state.ranges=[];state.practitionerName='QA';});
it('décompte le délai depuis la fin du séjour et conserve le filtre de début choisi',async()=>{
  vi.spyOn(Date,'now').mockReturnValue(Date.parse('2026-09-30T12:00:00Z'));
  try {
    await getApprovedEvents();
    expect(await getApprovedEvents({dateFrom:'2026-10-21T00:00:00Z'})).toHaveLength(0);
    expect(await getApprovedEvents({dateFrom:'2026-09-20T00:00:00Z'})).toHaveLength(1105);
  } finally {vi.restoreAllMocks();}
});
it('retrouve une catégorie au-delà des 100 et des 1000 premières expériences',async()=>{
  const events=await getApprovedEvents({category:'rare'});expect(events.map(e=>e.id)).toEqual(['1104']);expect(state.ranges.length).toBeGreaterThan(1);
});
it('retrouve les expériences par leur titre ou par le nom du praticien',async()=>{
  expect((await getApprovedEvents({q:'Méditation'})).map(event=>event.id)).toEqual(['4']);
  state.practitionerName='Didier Picamoles';
  expect(await getApprovedEvents({q:'didier'})).toHaveLength(1105);
});
it('ne présente pas une panne de catalogue comme une absence de résultats',async()=>{
  state.failed=true;await expect(getApprovedEvents()).rejects.toThrow();
});
it('ne tronque pas les annuaires de praticiens et de lieux à mille entrées',async()=>{
  expect(await getApprovedPractitioners()).toHaveLength(1105);expect(await getVenues()).toHaveLength(1105);
});
