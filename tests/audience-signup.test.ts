import {beforeEach,expect,it,vi} from 'vitest';
const s=vi.hoisted(()=>({signup:vi.fn(),record:vi.fn(),choice:'enabled'}));
vi.mock('server-only',()=>({}));
vi.mock('next/headers',()=>({headers:async()=>new Headers({'user-agent':'Mozilla/5.0 Chrome'}),cookies:async()=>({get:(key:string)=>({value:key==='fts-internal-audience-v3'?s.choice:'refused'})})}));
vi.mock('@/lib/rate-limit',()=>({isRateLimited:async()=>false}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{signUp:s.signup}})}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:()=>({rpc:(...args:unknown[])=>({abortSignal:()=>s.record(...args)})})}));
import {signUp} from '@/app/actions/auth';
const id='11111111-1111-4111-8111-111111111111';
function form(){const f=new FormData();Object.entries({email:'local@example.test',password:'Local-fixture-password',passwordConfirm:'Local-fixture-password',firstName:'Local',lastName:'Fixture',artistName:'Profil de test',bio:'Biographie fictive suffisamment longue pour vérifier la création du compte.',specialties:'Yoga',audienceBrowserId:id}).forEach(([k,v])=>f.set(k,v));return f;}
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('VERCEL_ENV','production');s.choice='enabled';s.signup.mockResolvedValue({data:{user:{identities:[{id:'local'}]}},error:null});s.record.mockResolvedValue({error:null});});
it('relève uniquement une création réussie, sans transmettre le profil à la mesure',async()=>{
 expect(await signUp({},form())).toEqual({success:'checkEmail'});
 expect(s.record).toHaveBeenCalledExactlyOnceWith('record_audience_signup',{p_browser_id:id});
});
it('ne confond pas une adresse existante masquée avec une inscription',async()=>{
 s.signup.mockResolvedValue({data:{user:{identities:[]}},error:null});
 await signUp({},form());expect(s.record).not.toHaveBeenCalled();
});
it('respecte l’opposition interne même lors de la création du compte',async()=>{
 s.choice='disabled';await signUp({},form());expect(s.record).not.toHaveBeenCalled();
});
it('une panne du suivi ne fait pas échouer l’inscription',async()=>{
 s.record.mockRejectedValue(new Error('measurement unavailable'));
 expect(await signUp({},form())).toEqual({success:'checkEmail'});
});
it('ne relève ni un formulaire invalide ni les prévisualisations',async()=>{
 expect(await signUp({},new FormData())).toHaveProperty('error');expect(s.record).not.toHaveBeenCalled();
 vi.stubEnv('VERCEL_ENV','preview');await signUp({},form());expect(s.record).not.toHaveBeenCalled();
});
