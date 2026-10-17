import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/rate-limit";
import { isAutomatedAgent } from "@/lib/traffic-policy";
import { AUDIENCE_CONSENT, isPublicAudiencePath } from '@/lib/audience';

/** Consented pseudonymous browser count. Historical page_views stay untouched. */
export async function POST(request: NextRequest) {
  // Before the distributed limiter: rejected analytics must cost zero DB calls.
  if (isAutomatedAgent(request.headers.get("user-agent")) ||
      request.headers.get("purpose") === "prefetch" ||
      request.headers.get("sec-purpose")?.includes("prefetch")) {
    return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  }
  // No tracking in previews, signed-in sessions or without explicit consent.
  if ((process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') ||
      request.cookies.get(AUDIENCE_CONSENT)?.value !== 'accepted' ||
      request.cookies.getAll().some(({name})=>name.startsWith('sb-')&&name.includes('auth-token'))) {
    return new NextResponse(null,{status:204});
  }
  if(request.headers.get('origin')!==request.nextUrl.origin)return new NextResponse(null,{status:403});
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (await isRateLimited(`views:${ip}`)) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const { path, browserId } = (await request.json()) as {
      path?: string;
      browserId?: string;
    };
    if (!path || typeof path !== "string" || path.length > 200 || typeof browserId!=='string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(browserId)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    // Do not count private back-office activity or arbitrary query strings.
    const cleanPath=path.split(/[?#]/,1)[0];
    if(!isPublicAudiencePath(cleanPath))return new NextResponse(null,{status:204});
    const supabase = createAdminClient();
    const {error}=await supabase.from('audience_visitors').upsert({browser_id:browserId},{onConflict:'day,browser_id',ignoreDuplicates:true});
    if(error)return NextResponse.json({ok:false},{status:503});
  } catch {
    return NextResponse.json({ok:false},{status:503});
  }
  return NextResponse.json({ ok: true });
}
