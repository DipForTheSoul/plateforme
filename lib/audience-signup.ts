import 'server-only';
import {cookies,headers} from 'next/headers';
import {INTERNAL_AUDIENCE,AUDIENCE_CONSENT} from '@/lib/audience';
import {createAdminClient} from '@/lib/supabase/admin';
import {isAutomatedAgent} from '@/lib/traffic-policy';

/** Called by successful signup only; never store the account-to-browser link. */
export async function recordAudienceSignup(browserId:unknown) {
  if(typeof browserId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(browserId))return;
  if(process.env.VERCEL_ENV&&process.env.VERCEL_ENV!=='production')return;
  try{
    const [jar,h]=await Promise.all([cookies(),headers()]);
    const choice=jar.get(INTERNAL_AUDIENCE)?.value;
    if(choice!=='enabled'&&(choice||jar.get(AUDIENCE_CONSENT)?.value!=='accepted'))return;
    if(isAutomatedAgent(h.get('user-agent')))return;
    await createAdminClient().rpc('record_audience_signup',{p_browser_id:browserId}).abortSignal(AbortSignal.timeout(1500));
  }catch{/* Signup must succeed even if its optional measurement is unavailable. */}
}
