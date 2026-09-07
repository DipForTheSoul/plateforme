import {beforeEach,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({role:'practitioner',profileError:false,resetError:null as {status:number}|null,redirectTo:'',limited:false}));
vi.mock('next/headers',()=>({headers:async()=>new Headers()}));
vi.mock('next/navigation',()=>({redirect:(path:string)=>{throw new Error(`redirect:${path}`);}}));
vi.mock('@/lib/rate-limit',()=>({isRateLimited:async()=>state.limited}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{
  signInWithPassword:async()=>({error:null}),getUser:async()=>({data:{user:{id:'qa'}},error:null}),
  resetPasswordForEmail:async(_email:string,options:{redirectTo:string})=>{state.redirectTo=options.redirectTo;return {error:state.resetError};},
  updateUser:async()=>({error:null}),
},from:()=>{const q={select:()=>q,eq:()=>q,single:async()=>({data:state.profileError?null:{role:state.role},error:state.profileError?{}:null})};return q;}})}));
import {requestPasswordReset,signIn,updatePassword} from '@/app/actions/auth';
const form=(values:Record<string,string>)=>{const f=new FormData();Object.entries(values).forEach(([k,v])=>f.set(k,v));return f;};
beforeEach(()=>{state.role='practitioner';state.profileError=false;state.resetError=null;state.redirectTo='';state.limited=false;});
it('conserve l’allemand à la connexion praticien',async()=>{
  await expect(signIn({},form({email:'qa@example.test',password:'password',locale:'de'}))).rejects.toThrow('redirect:/de/espace-praticien');
});
it('signale une panne de lecture du rôle sans rediriger à tort',async()=>{
  state.profileError=true;expect(await signIn({},form({email:'qa@example.test',password:'password'}))).toEqual({error:'generic'});
});
it('conserve la langue dans le lien de récupération',async()=>{
  expect(await requestPasswordReset({},form({email:'qa@example.test',locale:'de'}))).toEqual({success:'resetSent'});
  expect(new URL(state.redirectTo).searchParams.get('next')).toBe('/de/reinitialiser-mot-de-passe');
});
it('ne confirme pas un envoi lorsque le service e-mail est en panne',async()=>{
  state.resetError={status:503};expect(await requestPasswordReset({},form({email:'qa@example.test'}))).toEqual({error:'generic'});
});
it('ne révèle pas l’existence du compte lorsque le fournisseur refuse une adresse',async()=>{
  state.resetError={status:400};expect(await requestPasswordReset({},form({email:'qa@example.test'}))).toEqual({success:'resetSent'});
});
it('refuse une adresse mal formée avant appel au fournisseur',async()=>{
  expect(await requestPasswordReset({},form({email:'invalid'}))).toEqual({error:'generic'});expect(state.redirectTo).toBe('');
});
it('conserve la langue après remplacement du mot de passe',async()=>{
  await expect(updatePassword({},form({password:'password',passwordConfirm:'password',locale:'en'}))).rejects.toThrow('redirect:/en/connexion');
});
