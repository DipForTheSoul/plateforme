import "server-only";

/**
 * Géocodage via Nominatim / OpenStreetMap — gratuit, sans clé.
 * Règle d'or n°3 : appelé À LA CRÉATION d'un lieu (sinon la recherche par
 * rayon ne fonctionne pas). Volume très faible (< 1 req/s exigé par Nominatim,
 * on est très en dessous). User-Agent identifiant requis par leur politique.
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
