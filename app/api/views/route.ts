import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/rate-limit";

/** Ping analytics sans cookies — insert best-effort dans page_views. */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (await isRateLimited(`views:${ip}`)) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const { path, locale } = (await request.json()) as {
      path?: string;
      locale?: string;
    };
    if (!path || typeof path !== "string" || path.length > 200) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    // Do not count private back-office activity or arbitrary query strings.
    const cleanPath=path.split(/[?#]/,1)[0];
    if(!cleanPath.startsWith('/')||/^\/(?:fr\/|de\/|en\/)?(?:admin|espace-praticien)(?:\/|$)/.test(cleanPath))return NextResponse.json({ok:true});
    const supabase = createAdminClient();
    const {error}=await supabase.from("page_views").insert({ path:cleanPath, locale: ['fr','de','en'].includes(String(locale)) ? locale : null });
    if(error)return NextResponse.json({ok:false},{status:503});
  } catch {
    // Supabase non configurée : le ping est simplement ignoré.
  }
  return NextResponse.json({ ok: true });
}
