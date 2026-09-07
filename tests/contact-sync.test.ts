import {beforeEach,it,expect,vi} from 'vitest';
import {syncContactsToMailerLite} from '@/app/actions/contacts';
const state=vi.hoisted(()=>({failed:false,sent:0,cursors:[] as string[]}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('@/lib/auth',()=>({getCurrentProfile:async()=>({role:'admin'})}));
vi.mock('@/lib/mailerlite',()=>({mailerliteEnabled:()=>true,upsertSubscriber:async()=>{state.sent++;return !state.failed;}}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:()=>{
  let after='';const q={select:()=>q,eq:()=>q,order:()=>q,limit:()=>q,gt:(_:string,value:string)=>{after=value;state.cursors.push(value);return q;},then:(resolve:(value:unknown)=>unknown)=>resolve({error:null,data:after?[]:Array.from({length:6},(_,i)=>({id:`10000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,email:`qa${i}@example.test`,interests:[]}))})};return q;
}})}));
beforeEach(()=>{state.failed=false;state.sent=0;state.cursors=[];});
it('synchronise un petit lot puis fournit le curseur suivant sans plafond global',async()=>{
  const first=await syncContactsToMailerLite();expect(first.processed).toBe(5);expect(first.nextCursor).toBeTruthy();
  const last=await syncContactsToMailerLite(first.nextCursor);expect(last.nextCursor).toBeUndefined();expect(state.cursors).toEqual([first.nextCursor]);expect(state.sent).toBe(5);
});
it('arrête explicitement la synchronisation sur refus du prestataire',async()=>{
  state.failed=true;const result=await syncContactsToMailerLite();expect(result.error).toContain('interrompue');expect(result.nextCursor).toBeUndefined();
});
it('rejette un curseur arbitraire avant la lecture',async()=>{expect((await syncContactsToMailerLite('invalid')).error).toBeTruthy();expect(state.sent).toBe(0);});
