import {beforeEach,expect,it,vi} from 'vitest';
import {sendContactMessage} from '@/app/actions/contact';
const state=vi.hoisted(()=>({contactError:null as null|{code:string},synced:0,inserted:0}));
vi.mock('next/headers',()=>({headers:async()=>new Headers()}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('@/lib/auth',()=>({getCurrentProfile:async()=>null}));
vi.mock('@/lib/rate-limit',()=>({isRateLimited:()=>false}));
vi.mock('@/lib/email',()=>({sendEmail:async()=>true}));
vi.mock('@/lib/mailerlite',()=>({upsertSubscriber:async()=>{state.synced++;return true;}}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:()=>({from:(table:string)=>({
  insert:async()=>{if(table==='contacts')state.inserted++;return {error:table==='contacts'?state.contactError:null};},
  upsert:async()=>({error:{code:'42501'}}), // ON CONFLICT requires SELECT under the actual RLS.
})})}));
function form(){const f=new FormData();for(const [k,v] of Object.entries({name:'Visiteur QA',email:'qa@example.test',message:'Un message de test local.',newsletter_consent:'on'}))f.set(k,v);return f;}
beforeEach(()=>{state.contactError=null;state.synced=0;state.inserted=0;});
it('enregistre le consentement sans utiliser un upsert interdit par les RLS publiques',async()=>{
  expect((await sendContactMessage({status:'idle'},form())).status).toBe('success');expect(state.synced).toBe(1);expect(state.inserted).toBe(1);
});
it('signale une inscription indisponible sans demander de renvoyer un message déjà reçu',async()=>{
  state.contactError={code:'42501'};expect((await sendContactMessage({status:'idle'},form())).status).toBe('partial');expect(state.synced).toBe(0);
});
it('tolère uniquement un vrai doublon SQL',async()=>{
  state.contactError={code:'23505'};expect((await sendContactMessage({status:'idle'},form())).status).toBe('success');
});
