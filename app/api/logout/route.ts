import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Déconnexion fiable via simple URL (GET) — indépendante des "server actions",
 * donc insensible au cache d'un onglet périmé. Vide la session Supabase puis
 * renvoie à l'accueil. Pratique comme filet de sécurité en dev.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
