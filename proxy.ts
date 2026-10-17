import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { shouldStopCatalogueCrawl } from "./lib/traffic-policy";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export default async function proxy(request: NextRequest) {
  if ((request.method === "GET" || request.method === "HEAD") &&
      shouldStopCatalogueCrawl(request.nextUrl, request.headers.get("user-agent"))) {
    // Do not cache a bot response across user agents, or touch Auth/DB/rendering.
    return new NextResponse(null, { status: 403, headers: {
      "Cache-Control": "private, no-store", "Vary": "User-Agent",
      "X-Robots-Tag": "noindex, nofollow",
    } });
  }
  // 1. next-intl : détection de langue navigateur + réécriture de locale.
  const response = intlMiddleware(request);
  // 2. Supabase : rafraîchissement de session + protection des espaces privés.
  return updateSession(request, response);
}

export const config = {
  // Tout sauf les API, les assets Next et les fichiers statiques.
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
