import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Routes réservées aux utilisateurs connectés (préfixe de locale retiré). */
const PROTECTED_PREFIXES = ["/espace-praticien", "/admin"];

/**
 * Rafraîchit la session Supabase à chaque requête et protège les espaces
 * praticien/admin (le contrôle de RÔLE fin est fait dans les layouts serveur —
 * le middleware ne vérifie que l'authentification).
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Important : getUser() (et non getSession()) pour revalider le JWT.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  // Retire un éventuel préfixe de locale (/de, /en) pour tester la route.
  const bare = pathname.replace(/^\/(de|en)(?=\/|$)/, "") || "/";
  const isProtected = PROTECTED_PREFIXES.some((p) => bare.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
