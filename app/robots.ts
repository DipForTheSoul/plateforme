import type { MetadataRoute } from "next";
import { SITE_URL } from '@/lib/metadata';


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
