import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback Supabase Auth : échange le code (vérification e-mail, magic link,
 * réinitialisation de mot de passe) contre une session, puis redirige.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(
        `${origin}${next.startsWith("/") ? next : "/"}`
      );
    }
  }
  return NextResponse.redirect(`${origin}/connexion`);
}
