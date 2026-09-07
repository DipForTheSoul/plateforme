import "server-only";
import { isRateLimited } from '@/lib/rate-limit';

/**
 * Géocodage via Nominatim / OpenStreetMap — gratuit, sans clé.
 * Appelé à la création/changement d'adresse. Un créneau partagé assure au
 * maximum une requête par seconde, même entre plusieurs instances serveur.
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export async function geocodeAddress(
  address: string,
  country?: string
): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    q: address,
    format: "jsonv2",
    limit: "1",
    "accept-language": "fr",
  });
  if (country && country.length === 2) params.set("countrycodes", country.toLowerCase());

  try {
    let reserved=false;
    for(let attempt=0;attempt<3;attempt++){
      if(!await isRateLimited('geocode:global',1,1)){reserved=true;break;}
      if(attempt<2)await new Promise(resolve=>setTimeout(resolve,1100));
    }
    if(!reserved)return null;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          "User-Agent": "ForTheSoul/1.0 (welcome@forthesoul.ch)",
        },
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) return null;

    const results = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;
    if (!Array.isArray(results) || !results.length) return null;
    const lat = Number(results[0].lat), lng = Number(results[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

    return {
      lat,
      lng,
      displayName: results[0].display_name,
    };
  } catch {
    return null;
  }
}
