import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthesoul.ch";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Espaces privés et API hors index.
        disallow: ["/admin", "/espace-praticien", "/api/", "/de/admin", "/en/admin"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
