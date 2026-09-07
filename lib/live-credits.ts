import type {createClient} from '@/lib/supabase/server';
import {readPages} from '@/lib/read-pages';

/** Read-only balance projection. Expiration is booked by the next transactional operation. */
export async function withLiveCredits<T extends {id:string;credits:number}>(
  client:Awaited<ReturnType<typeof createClient>>, practitioners:T[]
):Promise<T[]> {
  if(!practitioners.length)return practitioners;
  const query=client.from('credit_packs').select('id,practitioner_id,credits_remaining')
    .eq('accounting_active',true).gt('credits_remaining',0)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`).order('id');
  const packs=await readPages((from,to)=>query.range(from,to));
  const balances=new Map<string,number>();
  for(const pack of packs)balances.set(pack.practitioner_id,(balances.get(pack.practitioner_id)??0)+pack.credits_remaining);
  return practitioners.map(p=>({...p,credits:balances.get(p.id)??0}));
}
