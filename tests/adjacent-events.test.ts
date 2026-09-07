import {beforeEach,expect,it,vi} from 'vitest';
import {getAdjacentEvents} from '@/lib/queries';
const state=vi.hoisted(()=>({failed:false}));
const date='2026-10-30T10:00:00.000Z';
const ids=['10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003'];
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:()=>{
  let rows=ids.map((id,i)=>({id,start_date:date,slug:`event-${i}`,title:`Event ${i}`,status:'approved'}));
  const orders:Array<{key:string,ascending:boolean}>=[];
  const q={select:()=>q,eq:(key:string,v:string)=>{rows=rows.filter(r=>r[key as keyof typeof r]===v);return q;},
    neq:(key:string,v:string)=>{rows=rows.filter(r=>r[key as keyof typeof r]!==v);return q;},
    lt:(key:string,v:string)=>{rows=rows.filter(r=>r[key as keyof typeof r]<v);return q;},
    gt:(key:string,v:string)=>{rows=rows.filter(r=>r[key as keyof typeof r]>v);return q;},
    or:(filter:string)=>{const match=filter.match(/^start_date\.(lt|gt)\.([^,]+),and\(start_date\.eq\.([^,]+),id\.(lt|gt)\.([^,)]+)\)$/);if(!match)throw new Error('Unexpected filter');const [,op,d,,idOp,id]=match;rows=rows.filter(r=>(op==='lt'?r.start_date<d:r.start_date>d)||(r.start_date===d&&(idOp==='lt'?r.id<id:r.id>id)));return q;},
    order:(key:string,options?:{ascending:boolean})=>{orders.push({key,ascending:options?.ascending??true});return q;},limit:()=>q,
    maybeSingle:async()=>({error:state.failed?{message:'outage'}:null,data:rows.sort((a,b)=>{for(const {key,ascending} of orders){const result=a[key as keyof typeof a].localeCompare(b[key as keyof typeof b]);if(result)return ascending?result:-result;}return 0;})[0]??null})};return q;
}})}));
beforeEach(()=>{state.failed=false;});
it('permet de parcourir trois expériences à la même heure sans en sauter',async()=>{
  const middle=await getAdjacentEvents(date,ids[1]);expect(middle.prev?.slug).toBe('event-0');expect(middle.next?.slug).toBe('event-2');
  expect((await getAdjacentEvents(date,ids[0])).prev).toBeNull();expect((await getAdjacentEvents(date,ids[2])).next).toBeNull();
});
it('ne transforme pas une panne de navigation en absence de voisins',async()=>{state.failed=true;await expect(getAdjacentEvents(date,ids[1])).rejects.toThrow();});
