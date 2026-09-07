import {beforeEach,expect,it,vi} from 'vitest';
import {getCurrentProfile} from '@/lib/auth';
const state=vi.hoisted(()=>({user:{id:'qa'} as {id:string}|null,authError:null as {status:number}|null,dbError:false}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:state.user},error:state.authError})},from:()=>{
  const q={select:()=>q,eq:()=>q,single:async()=>({data:state.dbError?null:{id:'qa',role:'practitioner'},error:state.dbError?{message:'outage'}:null})};return q;
}})}));
beforeEach(()=>{state.user={id:'qa'};state.authError=null;state.dbError=false;});
it('ne fait pas passer une panne du profil pour une déconnexion',async()=>{state.dbError=true;await expect(getCurrentProfile()).rejects.toThrow();});
it('ne fait pas passer une panne Auth pour une déconnexion',async()=>{state.user=null;state.authError={status:503};await expect(getCurrentProfile()).rejects.toThrow();});
it('reconnaît un visiteur vraiment déconnecté',async()=>{state.user=null;expect(await getCurrentProfile()).toBeNull();});
