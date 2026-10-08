import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from '@/lib/safe-redirect';

/**
 * Callback Supabase Auth : échange le code (vérification e-mail, magic link,
 * réinitialisation de mot de passe) contre une session, puis redirige.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeRedirectPath(searchParams.get("next"));

  // Le token_hash est autonome : contrairement au code PKCE, il fonctionne
  // aussi lorsque l'e-mail est ouvert dans un autre navigateur ou appareil.
  if (tokenHash && type === "recovery") {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(
        `${origin}${next}`
      );
    }
  }
  return NextResponse.redirect(`${origin}/connexion`);
}
