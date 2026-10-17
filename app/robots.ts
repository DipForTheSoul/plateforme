import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthesoul.ch";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Espaces privés et API hors index.
        disallow: ["/admin", "/espace-praticien", "/api/", "/de/admin", "/en/admin",
          // Calendar combinations are navigation controls, not indexable pages.
          "/*?*du=", "/*?*au=", "/*?*calendrier=", "/*?*vue="],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
