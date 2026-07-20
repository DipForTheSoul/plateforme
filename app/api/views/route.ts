import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Ping analytics sans cookies — insert best-effort dans page_views. */
export async function POST(request: NextRequest) {
  try {
    const { path, locale } = (await request.json()) as {
      path?: string;
      locale?: string;
    };
    if (!path || typeof path !== "string" || path.length > 200) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const supabase = await createClient();
    await supabase.from("page_views").insert({ path, locale: locale ?? null });
  } catch {
    // Supabase non configurée : le ping est simplement ignoré.
  }
  return NextResponse.json({ ok: true });
}
