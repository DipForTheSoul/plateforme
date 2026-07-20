import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // 1. next-intl : détection de langue navigateur + réécriture de locale.
  const response = intlMiddleware(request);
  // 2. Supabase : rafraîchissement de session + protection des espaces privés.
  return updateSession(request, response);
}

export const config = {
  // Tout sauf les API, les assets Next et les fichiers statiques.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
