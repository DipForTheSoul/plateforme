import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Client anonyme réservé aux lectures publiques. Il ne transporte jamais les
 * cookies d'un visiteur : les politiques RLS `anon` restent donc la frontière
 * de sécurité, tandis que les résultats peuvent être mis en cache côté serveur.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: { headers: { "x-client-info": "forthesoul-public-cache" } },
    },
  );
}
