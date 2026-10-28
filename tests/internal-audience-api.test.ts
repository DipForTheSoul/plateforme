import {beforeEach,it,expect,vi} from 'vitest';
import {NextRequest} from 'next/server';
const s=vi.hoisted(()=>({rate:vi.fn(),record:vi.fn()}));
vi.mock('@/lib/rate-limit',()=>({isRateLimited:s.rate}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:()=>({rpc:(...args:unknown[])=>({abortSignal:()=>s.record(...args)})})}));
import {POST} from '@/app/api/views/route';
import {POST as preference} from '@/app/api/internal-audience-preference/route';
import {POST as google} from '@/app/api/analytics-consent/route';
const id='11111111-1111-4111-8111-111111111111';
function req(cookie='fts-internal-audience-v3=enabled',path='/lieux') {return new NextRequest('https://www.forthesoul.ch/api/views',{method:'POST',headers:{origin:'https://www.forthesoul.ch',cookie,'user-agent':'Mozilla/5.0 Chrome'},body:JSON.stringify({path,browserId:id})});}
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('VERCEL_ENV','production');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','local-only-test-secret');s.rate.mockResolvedValue(false);s.record.mockResolvedValue({error:null});});
it.each(['','accepted','refused'])('compte indépendamment du choix Google %s',async value=>{
 expect((await POST(req(`fts-internal-audience-v3=enabled; fts-audience-consent-v2=${value}`))).status).toBe(200);
 expect(s.record).toHaveBeenCalledTimes(1);
});
it.each(['accepted','refused'])('l’opposition interne prime avec Google %s',async google=>{
 expect((await POST(req(`fts-internal-audience-v3=disabled; fts-audience-consent-v2=${google}`))).status).toBe(204);
 expect(s.rate).not.toHaveBeenCalled();expect(s.record).not.toHaveBeenCalled();
});
it('isole les jetons des pages et ne transmet ni IP ni identifiant Google à la base',async()=>{
 await POST(req());const first=s.record.mock.calls[0][1];
 await POST(req(undefined,'/experiences'));const second=s.record.mock.calls[1][1];
 await POST(req());expect(s.record.mock.calls[2][1].p_page_token).toBe(first.p_page_token);
 expect(first.p_page_token).not.toBe(second.p_page_token);
 expect(Object.keys(first).sort()).toEqual(['p_browser_id','p_day','p_page_token','p_path']);
});
function choiceRequest(route:string,field:string,value:string,cookie=''){
 const body=new FormData();body.set(field,value);
 return new NextRequest(`https://www.forthesoul.ch/api/${route}`,{method:'POST',headers:{origin:'https://www.forthesoul.ch',referer:'https://www.forthesoul.ch/de/lieux',cookie},body});
}
it('le formulaire sans JS change uniquement le choix interne',async()=>{
 const out=await preference(choiceRequest('internal-audience-preference','choice','disabled','fts-audience-consent-v2=accepted'));
 expect(out.status).toBe(303);expect(out.cookies.get('fts-internal-audience-v3')?.value).toBe('disabled');
 expect(out.cookies.get('fts-audience-consent-v2')).toBeUndefined();expect(out.headers.get('location')).toBe('https://www.forthesoul.ch/de/lieux');
});
it('le refus Google sans JS laisse la mesure interne activée après information',async()=>{
 const out=await google(choiceRequest('analytics-consent','consent','refused','fts-internal-audience-v3=enabled'));
 expect(out.cookies.get('fts-audience-consent-v2')?.value).toBe('refused');expect(out.cookies.get('fts-internal-audience-v3')?.value).toBe('enabled');
});
it('la migration sans JS conserve un ancien refus interne malgré une nouvelle acceptation Google',async()=>{
 const out=await google(choiceRequest('analytics-consent','consent','accepted','fts-audience-consent-v2=refused'));
 expect(out.cookies.get('fts-internal-audience-v3')?.value).toBe('disabled');
});
it('refuse une mutation de préférence depuis un site tiers',async()=>{
 const request=choiceRequest('internal-audience-preference','choice','disabled');request.headers.set('origin','https://other.test');
 expect((await preference(request)).status).toBe(403);
});
