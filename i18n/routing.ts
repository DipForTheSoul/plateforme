import { defineRouting } from "next-intl/routing";

/**
 * FR est la langue par défaut, servie SANS préfixe (forthesoul.ch/...).
 * DE et EN sont servies sous /de et /en (hreflang + sitemaps par langue).
 */
export const routing = defineRouting({
  locales: ["fr", "de", "en"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
});

export type AppLocale = (typeof routing.locales)[number];
