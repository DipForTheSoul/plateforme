import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase avec la clé SERVICE ROLE — contourne la RLS.
 * ⚠️ Usage STRICTEMENT serveur et limité :
 *   · webhook Stripe (add_credits) ;
 *   · opérations admin qui l'exigent explicitement.
 * Ne JAMAIS importer dans du code client (le garde `server-only` l'empêche).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY manquante — voir .env.example (Rodrigue : à brancher)."
    );
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
