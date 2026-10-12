import {beforeEach,expect,it,vi} from 'vitest';
import {getAdjacentEvents} from '@/lib/queries';
const state=vi.hoisted(()=>({failed:false}));
const date='2026-10-30T10:00:00.000Z';
const ids=['10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003'];
vi.mock('@/lib/supabase/public',()=>({createPublicClient:()=>({from:()=>{
  const rows=ids.map((id,i)=>({id,start_date:date,slug:`event-${i}`,title:`Event ${i}`,status:'approved',category:null,event_categories:[]}));
  const q={select:()=>q,eq:()=>q,order:()=>q,range:()=>q,
    then:(resolve:(value:unknown)=>unknown)=>resolve({error:state.failed?{message:'outage'}:null,data:rows})};return q;
}})}));
beforeEach(()=>{state.failed=false;});
it('permet de parcourir trois expériences à la même heure sans en sauter',async()=>{
  const middle=await getAdjacentEvents(date,ids[1]);expect(middle.prev?.slug).toBe('event-0');expect(middle.next?.slug).toBe('event-2');
  expect((await getAdjacentEvents(date,ids[0])).prev).toBeNull();expect((await getAdjacentEvents(date,ids[2])).next).toBeNull();
});
it('ne transforme pas une panne de navigation en absence de voisins',async()=>{state.failed=true;await expect(getAdjacentEvents(date,ids[1])).rejects.toThrow();});
