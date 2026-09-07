import "server-only";
import {createHmac} from 'node:crypto';
import {createAdminClient} from '@/lib/supabase/admin';

/** Shared across instances; fail closed. Only HMAC keys are stored, never raw IPs. */
export async function isRateLimited(key:string,limit=5,windowSeconds=60):Promise<boolean> {
  try {
    const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!secret)return true;
    const digest=createHmac('sha256',secret).update(`${key}:${limit}:${windowSeconds}`).digest('hex');
    const {data,error}=await createAdminClient().rpc('take_request_slot',{
      p_key:digest,p_limit:limit,p_window_seconds:windowSeconds
    });
    return Boolean(error)||data!==true;
  } catch {return true;}
}
