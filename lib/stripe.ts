import "server-only";

import Stripe from "stripe";

/**
 * Client Stripe serveur. Rodrigue : brancher les clés de test dans .env.local
 * (voir .env.example) — tout le flux fonctionne en mode test.
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("PLACEHOLDER")) {
    throw new Error(
      "STRIPE_SECRET_KEY manquante — voir .env.example (Rodrigue : à brancher)."
    );
  }
  return new Stripe(key);
}

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return Boolean(key && !key.includes("PLACEHOLDER"));
}
