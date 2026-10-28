import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/rate-limit";
import { isAutomatedAgent } from "@/lib/traffic-policy";
import { AUDIENCE_CONSENT, isPublicAudiencePath } from '@/lib/audience';
import { INTERNAL_AUDIENCE } from '@/lib/audience';
import { createHmac } from 'node:crypto';
import {classifyAcquisition,audienceDevice,type AcquisitionInput} from '@/lib/audience-acquisition';

/** Statistical browser count. Legacy tables and Google choices stay untouched. */
export async function POST(request: NextRequest) {
  // Before the distributed limiter: rejected analytics must cost zero DB calls.
  if (isAutomatedAgent(request.headers.get("user-agent")) ||
      request.headers.get("purpose") === "prefetch" ||
      request.headers.get("sec-purpose")?.includes("prefetch")) {
    return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  }
  // Explicit internal opposition overrides any Google setting. Old clients keep
  // their consent-only behaviour throughout the rolling deployment.
  const preference = request.cookies.get(INTERNAL_AUDIENCE)?.value;
  const allowed = preference === 'enabled' || (!preference && request.cookies.get(AUDIENCE_CONSENT)?.value === 'accepted');
  if ((process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') ||
      !allowed ||
      request.cookies.getAll().some(({name})=>name.startsWith('sb-')&&name.includes('auth-token'))) {
    return new NextResponse(null,{status:204});
  }
  if(request.headers.get('origin')!==request.nextUrl.origin)return new NextResponse(null,{status:403});
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    // Every page display is now counted: allow normal browsing while bounding abuse.
    if (await isRateLimited(`views:${ip}`,60,60)) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const { path, browserId,eventId,acquisition } = (await request.json()) as {
      path?: string;
      browserId?: string;
      eventId?:string;
      acquisition?:AcquisitionInput;
    };
    if (!path || typeof path !== "string" || path.length > 200 || typeof browserId!=='string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(browserId)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    if(eventId!==undefined&&!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId))return NextResponse.json({ok:false},{status:400});
    if(acquisition!==undefined&&(!acquisition||typeof acquisition!=='object'||Array.isArray(acquisition)||Object.entries(acquisition).some(([key,value])=>!['source','medium','referrerHost','searchAd','socialClick'].includes(key)||(['searchAd','socialClick'].includes(key)?typeof value!=='boolean':typeof value!=='string'||value.length>253))))return NextResponse.json({ok:false},{status:400});
    // Do not count private back-office activity or arbitrary query strings.
    const cleanPath=path.split(/[?#]/,1)[0];
    if(!isPublicAudiencePath(cleanPath))return new NextResponse(null,{status:204});
    const supabase = createAdminClient();
    const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!secret)return NextResponse.json({ok:false},{status:503});
    const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    // Page tokens cannot be joined with the visitor ID or across pages/days.
    // The secret remains exclusively on the application server.
    const pageToken=createHmac('sha256',secret).update(JSON.stringify(['audience-page-v3',day,cleanPath,browserId])).digest('hex');
    const payload={p_browser_id:browserId,p_path:cleanPath,p_page_token:pageToken,p_day:day};
    const country=request.headers.get('x-vercel-ip-country')??'ZZ';
    const {error}=eventId?await supabase.rpc('record_audience_visit',{
      ...payload,p_event_id:eventId,p_channel:classifyAcquisition(acquisition??{},request.nextUrl.hostname),
      p_country:/^[A-Z]{2}$/.test(country)?country:'ZZ',p_device:audienceDevice(request.headers.get('user-agent')),
    }).abortSignal(AbortSignal.timeout(3500)):await supabase.rpc('record_internal_audience',payload).abortSignal(AbortSignal.timeout(3500));
    if(error)return NextResponse.json({ok:false},{status:503});
  } catch {
    return NextResponse.json({ok:false},{status:503});
  }
  return NextResponse.json({ ok: true });
}
