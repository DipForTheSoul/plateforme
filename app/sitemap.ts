import type { MetadataRoute } from "next";
import { getApprovedEvents, getApprovedPractitioners } from "@/lib/queries";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthesoul.ch";

/** URL localisée : FR sans préfixe, DE/EN préfixées (voir i18n/routing.ts). */
function localized(path: string) {
  return {
    fr: `${SITE_URL}${path}`,
    de: `${SITE_URL}/de${path}`,
    en: `${SITE_URL}/en${path}`,
  };
}

/**
 * Sitemap multilingue (Phases 8-9) : chaque URL expose ses alternates
 * hreflang FR/DE/EN. Généré dynamiquement depuis la base.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ["", "/experiences", "/praticiens", "/a-propos"];

  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${SITE_URL}${path || "/"}`,
    changeFrequency: path === "/experiences" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.8,
    alternates: { languages: localized(path) },
  }));

  const [events, practitioners] = await Promise.all([
    getApprovedEvents(),
    getApprovedPractitioners(),
  ]);

  for (const event of events) {
    entries.push({
      url: `${SITE_URL}/experiences/${event.slug}`,
      lastModified: event.updated_at,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: localized(`/experiences/${event.slug}`) },
    });
  }

  for (const practitioner of practitioners) {
    entries.push({
      url: `${SITE_URL}/praticiens/${practitioner.slug}`,
      lastModified: practitioner.updated_at,
      changeFrequency: "weekly",
      priority: 0.6,
      alternates: { languages: localized(`/praticiens/${practitioner.slug}`) },
    });
  }

  return entries;
}
