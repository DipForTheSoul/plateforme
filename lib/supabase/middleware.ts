import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Routes réservées aux utilisateurs connectés (préfixe de locale retiré). */
const PROTECTED_PREFIXES = ["/espace-praticien", "/admin"];

function hasSupabaseSession(request: NextRequest) {
  return request.cookies.getAll().some(({ name }) =>
    name.startsWith("sb-") && name.includes("auth-token")
  );
}

/**
 * Rafraîchit la session Supabase à chaque requête et protège les espaces
 * praticien/admin (le contrôle de RÔLE fin est fait dans les layouts serveur —
 * le middleware ne vérifie que l'authentification).
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const bare = pathname.replace(/^\/(fr|de|en)(?=\/|$)/, "") || "/";
  const isProtected = PROTECTED_PREFIXES.some((p) => bare === p || bare.startsWith(p + "/"));

  // Un visiteur anonyme sur une page publique n'a aucune session à rafraîchir.
  // Évite un appel Auth Supabase à chaque hit de bot/crawler sans relâcher la
  // protection des zones privées.
  if (!isProtected && !hasSupabaseSession(request)) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // Keep next-intl's existing rewrite/locale headers while forwarding
          // the fresh cookie to Server Components in this same request.
          const forwarded = NextResponse.next({ request: { headers: request.headers } });
          response.headers.set('x-middleware-request-cookie', forwarded.headers.get('x-middleware-request-cookie') ?? '');
          const overrides = new Set((response.headers.get('x-middleware-override-headers') ?? '').split(',').map(s => s.trim()).filter(Boolean));
          overrides.add('cookie');
          response.headers.set('x-middleware-override-headers', [...overrides].join(','));
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

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    const locale = pathname.match(/^\/(de|en)(?=\/|$)/)?.[1];
    url.pathname = `${locale ? '/' + locale : ''}/connexion`;
    url.search = '';
    url.searchParams.set("next", pathname + request.nextUrl.search);
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach(cookie => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  return response;
}
