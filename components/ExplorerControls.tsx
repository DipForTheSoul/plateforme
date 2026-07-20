"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { EventCalendar } from "@/components/EventCalendar";
import { LANGUAGE_LABELS } from "@/lib/utils";
import type { Category } from "@/types/database";
import { LocateFixed, Search } from "lucide-react";

interface Props {
  categories: Category[];
  practitioners: Array<{ slug: string; name: string }>;
  regions: string[];
  eventDays: string[];
}

/**
 * Contrôles de recherche (Phase 3) : recherche instantanée (debounce 300 ms),
 * filtres, calendrier et rayon km — tout est piloté par l'URL (partageable,
 * SSR, SEO-friendly).
 */
export function ExplorerControls({ categories, practitioners, regions, eventDays }: Props) {
  const t = useTranslations("events");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [locating, setLocating] = useState(false);

  const setParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  // Recherche instantanée (debounce).
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      if ((searchParams.get("q") ?? "") !== q) setParams({ q: q || undefined });
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [q, setParams, searchParams]);

  const radiusActive = Boolean(searchParams.get("rayon"));

  function toggleRadius() {
    if (radiusActive) {
      setParams({ rayon: undefined, lat: undefined, lng: undefined });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setParams({
          rayon: "50",
          lat: position.coords.latitude.toFixed(5),
          lng: position.coords.longitude.toFixed(5),
        });
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-soul-bronze" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="field !rounded-full !py-3 !pl-11"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <select value={searchParams.get("categorie") ?? ""}
          onChange={(e) => setParams({ categorie: e.target.value || undefined })}
          className="field" aria-label={t("filters.category")}>
          <option value="">{t("filters.allCategories")}</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>

        <select value={searchParams.get("langue") ?? ""}
          onChange={(e) => setParams({ langue: e.target.value || undefined })}
          className="field" aria-label={t("filters.language")}>
          <option value="">{t("filters.allLanguages")}</option>
          {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>

        <select value={searchParams.get("praticien") ?? ""}
          onChange={(e) => setParams({ praticien: e.target.value || undefined })}
          className="field" aria-label={t("filters.practitioner")}>
          <option value="">{t("filters.allPractitioners")}</option>
          {practitioners.map((p) => (
            <option key={p.slug} value={p.slug}>{p.name}</option>
          ))}
        </select>

        <select value={searchParams.get("region") ?? ""}
          onChange={(e) => setParams({ region: e.target.value || undefined })}
          className="field" aria-label={t("filters.region")}>
          <option value="">{t("filters.allRegions")}</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <select value={searchParams.get("prix") ?? ""}
          onChange={(e) => setParams({ prix: e.target.value || undefined })}
          className="field" aria-label={t("filters.priceMax")}>
          <option value="">{t("filters.priceMax")} : —</option>
          {[30, 50, 100, 300, 1000].map((p) => (
            <option key={p} value={p}>≤ CHF {p}.–</option>
          ))}
        </select>

        <select value={searchParams.get("duree") ?? ""}
          onChange={(e) => setParams({ duree: e.target.value || undefined })}
          className="field" aria-label={t("filters.durationMax")}>
          <option value="">{t("filters.anyDuration")}</option>
          <option value="90">≤ 1 h 30</option>
          <option value="180">≤ 3 h</option>
          <option value="480">≤ 1 jour</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={toggleRadius}
          className={radiusActive ? "btn-primary !py-2" : "btn-secondary !py-2"}>
          <LocateFixed className="h-4 w-4" />
          {locating
            ? "…"
            : radiusActive
              ? `${t("filters.radius")} : ${searchParams.get("rayon")} km`
              : t("filters.radius")}
        </button>
        {radiusActive && (
          <select value={searchParams.get("rayon") ?? "50"}
            onChange={(e) => setParams({ rayon: e.target.value })}
            className="field !w-32" aria-label={t("filters.radius")}>
            {[10, 25, 50, 100, 200].map((km) => (
              <option key={km} value={km}>{km} km</option>
            ))}
          </select>
        )}
        <span className="text-xs text-soul-bronze">{t("filters.radiusHelp")}</span>
        <button type="button"
          onClick={() => { setQ(""); router.replace(pathname, { scroll: false }); }}
          className="ml-auto text-sm text-soul-terracotta underline">
          {t("filters.reset")}
        </button>
      </div>

      <EventCalendar
        eventDays={eventDays}
        from={searchParams.get("du") ?? undefined}
        to={searchParams.get("au") ?? undefined}
        onSelect={(from, to) => setParams({ du: from, au: to })}
      />
    </div>
  );
}
