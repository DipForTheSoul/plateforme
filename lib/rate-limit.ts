import "server-only";

/**
 * Anti-spam minimaliste en mémoire (Phase 10) pour les formulaires publics
 * (newsletter, inscription). Suffisant pour un déploiement Vercel serverless :
 * chaque instance garde sa fenêtre, ce qui limite déjà les rafales. Pour un
 * durcissement ultérieur : Upstash Ratelimit ou Vercel Firewall.
 */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

const hits = new Map<string, number[]>();

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const previous = (hits.get(key) ?? []).filter((t) => t > windowStart);
  previous.push(now);
  hits.set(key, previous);
  // Nettoyage opportuniste pour éviter la croissance mémoire.
  if (hits.size > 5_000) {
    for (const [k, v] of hits) {
      if (v.every((t) => t <= windowStart)) hits.delete(k);
    }
  }
  return previous.length > MAX_PER_WINDOW;
}
