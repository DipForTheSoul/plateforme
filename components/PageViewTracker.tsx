"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

/**
 * Analytics interne SANS cookies (Phase 9) : simple ping du chemin visité.
 * Aucune donnée personnelle, aucun identifiant → pas de bannière nécessaire.
 * Un connecteur Google Analytics (mode cookieless) peut s'ajouter ici plus tard.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, locale }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => undefined);
    return () => controller.abort();
  }, [pathname, locale]);

  return null;
}
