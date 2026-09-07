import {beforeEach,afterEach,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({hits:0,failed:false,keys:[] as string[]}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:()=>({rpc:async(_:string,args:{p_key:string,p_limit:number})=>{
  state.keys.push(args.p_key);return {data:++state.hits<=args.p_limit,error:state.failed?{message:'outage'}:null};
}})}));
beforeEach(()=>{vi.resetModules();state.hits=0;state.failed=false;state.keys=[];vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','qa-only-secret');});
afterEach(()=>vi.unstubAllEnvs());
it('conserve le plafond même après remplacement du processus serveur',async()=>{
  let limiter=await import('@/lib/rate-limit');
  for(let i=0;i<5;i++)expect(await limiter.isRateLimited('contact:192.0.2.1')).toBe(false);
  vi.resetModules();limiter=await import('@/lib/rate-limit');expect(await limiter.isRateLimited('contact:192.0.2.1')).toBe(true);
});
it('ne stocke ni adresse IP brute ni secret dans la clé de compteur',async()=>{
  const {isRateLimited}=await import('@/lib/rate-limit');await isRateLimited('contact:192.0.2.1');
  expect(state.keys[0]).toMatch(/^[a-f0-9]{64}$/);expect(state.keys[0]).not.toContain('192.0.2.1');
});
it('refuse la requête si le contrôle partagé est indisponible',async()=>{
  state.failed=true;const {isRateLimited}=await import('@/lib/rate-limit');expect(await isRateLimited('contact:192.0.2.1')).toBe(true);
});
