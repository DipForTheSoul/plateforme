"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { EventCalendar } from "@/components/EventCalendar";
import { LANGUAGE_LABELS } from "@/lib/utils";
import type { Category } from "@/types/database";
import { LocateFixed, Search, SlidersHorizontal, X } from "lucide-react";

interface Props {
  categories: Category[];
  practitioners: Array<{ slug: string; name: string }>;
  countries: Array<{ code: string; name: string }>;
  cantons: string[];
  eventDays: string[];
}

/**
 * Contrôles de recherche (Phase 3) : recherche instantanée (debounce 300 ms),
 * filtres, calendrier et rayon km — tout est piloté par l'URL (partageable,
 * SSR, SEO-friendly).
 */
export function ExplorerControls({ categories, practitioners, countries, cantons, eventDays }: Props) {
  const t = useTranslations("events");
  const tCat = useTranslations("categories");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

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
  const [showFilters, setShowFilters] = useState(false);

  const filterKeys = ["categorie", "langue", "praticien", "pays", "canton", "prix", "duree", "rayon"];
  const isSwitzerland = searchParams.get("pays") === "CH";
  const activeCount = filterKeys.filter((k) => searchParams.get(k)).length;
  const hasAnyFilter =
    activeCount > 0 || q || searchParams.get("du") || searchParams.get("au");

  function resetAll() {
    setQ("");
    router.replace(pathname, { scroll: false });
  }

  // §8 — puces des filtres actifs (visibles + retirables) pour voir d'un coup d'œil
  // quels filtres sont appliqués.
  const durationLabels: Record<string, string> = {
    "90": t("filters.dur90"),
    "180": t("filters.dur180"),
    "480": t("filters.dur480"),
  };
  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  const gp = (k: string) => searchParams.get(k);
  if (gp("categorie"))
    activeChips.push({
      key: "categorie",
      label: tCat.has(gp("categorie")! as never)
        ? tCat(gp("categorie")! as never)
        : (categories.find((c) => c.slug === gp("categorie"))?.name ?? gp("categorie")!),
      clear: () => setParams({ categorie: undefined }),
    });
  if (gp("langue"))
    activeChips.push({
      key: "langue",
      label: LANGUAGE_LABELS[gp("langue")!] ?? gp("langue")!,
      clear: () => setParams({ langue: undefined }),
    });
  if (gp("praticien"))
    activeChips.push({
      key: "praticien",
      label: practitioners.find((p) => p.slug === gp("praticien"))?.name ?? gp("praticien")!,
      clear: () => setParams({ praticien: undefined }),
    });
  if (gp("pays"))
    activeChips.push({
      key: "pays",
      label: countries.find((c) => c.code === gp("pays"))?.name ?? gp("pays")!,
      // Retirer le pays retire aussi le canton (canton dépend du pays).
      clear: () => setParams({ pays: undefined, canton: undefined }),
    });
  if (gp("canton"))
    activeChips.push({
      key: "canton",
      label: gp("canton")!,
      clear: () => setParams({ canton: undefined }),
    });
  if (gp("prix"))
    activeChips.push({
      key: "prix",
      label: `≤ CHF ${gp("prix")}`,
      clear: () => setParams({ prix: undefined }),
    });
  if (gp("duree"))
    activeChips.push({
      key: "duree",
      label: durationLabels[gp("duree")!] ?? `≤ ${gp("duree")} min`,
      clear: () => setParams({ duree: undefined }),
    });
  if (radiusActive)
    activeChips.push({
      key: "rayon",
      label: `${gp("rayon")} km`,
      clear: () => setParams({ rayon: undefined, lat: undefined, lng: undefined }),
    });
  if (gp("du") || gp("au"))
    activeChips.push({
      key: "dates",
      label: `${gp("du") ?? "…"} → ${gp("au") ?? "…"}`,
      clear: () => setParams({ du: undefined, au: undefined }),
    });

  function toggleRadius() {
    if (radiusActive) {
      setParams({ rayon: undefined, lat: undefined, lng: undefined });
      return;
    }
    setGeoError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError(t("filters.geoUnsupported"));
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
      (error) => {
        setLocating(false);
        setGeoError(
          error.code === error.PERMISSION_DENIED
            ? t("filters.geoDenied")
            : t("filters.geoUnavailable")
        );
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Recherche — toujours visible */}
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

      {/* Dates — primordial, toujours visible (de / à).
          min-w-0 sur la cellule ET l'input : sans ça, les <input type="date">
          iOS gardent leur largeur native intrinsèque et débordent de la grille. */}
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <label htmlFor="date-from" className="label">{t("filters.from")}</label>
          <input id="date-from" type="date"
            value={searchParams.get("du") ?? ""}
            onChange={(e) => setParams({ du: e.target.value || undefined })}
            className="field min-w-0 max-w-full appearance-none" />
        </div>
        <div className="min-w-0">
          <label htmlFor="date-to" className="label">{t("filters.to")}</label>
          <input id="date-to" type="date"
            value={searchParams.get("au") ?? ""}
            min={searchParams.get("du") ?? undefined}
            onChange={(e) => setParams({ au: e.target.value || undefined })}
            className="field min-w-0 max-w-full appearance-none" />
        </div>
      </div>

      {/* Bouton Filtres — sur mobile uniquement (desktop : filtres toujours ouverts) + réinitialiser */}
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          className={`md:hidden ${showFilters ? "btn-primary !py-2" : "btn-secondary !py-2"}`}>
          <SlidersHorizontal className="h-4 w-4" />
          {t("filters.title")}{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>
        {hasAnyFilter && (
          <button type="button" onClick={resetAll}
            className="text-sm text-soul-violet underline">
            {t("filters.reset")}
          </button>
        )}
      </div>

      {/* Puces des filtres actifs — cliquer pour retirer (§8). */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.clear}
              className="inline-flex items-center gap-1 rounded-full bg-soul-violet/10 px-3 py-1 text-xs font-medium text-soul-violet transition hover:bg-soul-violet/20"
            >
              {chip.label}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      {/* Filtres : repliés par défaut sur mobile, toujours visibles sur desktop (§8) */}
      <div className={`${showFilters ? "flex" : "hidden"} flex-col gap-4 rounded-2xl border border-soul-bronze/15 bg-white p-4 md:flex`}>
          {/* Filtres empilés (1 colonne) : la colonne latérale est étroite,
              en 2 colonnes le texte des menus était tronqué. */}
          <div className="grid gap-3">
            <select value={searchParams.get("categorie") ?? ""}
              onChange={(e) => setParams({ categorie: e.target.value || undefined })}
              className="field" aria-label={t("filters.category")}>
              <option value="">{t("filters.allCategories")}</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{tCat.has(c.slug as never) ? tCat(c.slug as never) : c.name}</option>
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

            <select value={searchParams.get("pays") ?? ""}
              onChange={(e) => setParams({ pays: e.target.value || undefined, canton: undefined })}
              className="field" aria-label={t("filters.country")}>
              <option value="">{t("filters.allCountries")}</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>

            {/* Canton uniquement si la Suisse est sélectionnée (§2.1). */}
            {isSwitzerland && cantons.length > 0 && (
              <select value={searchParams.get("canton") ?? ""}
                onChange={(e) => setParams({ canton: e.target.value || undefined })}
                className="field" aria-label={t("filters.canton")}>
                <option value="">{t("filters.allCantons")}</option>
                {cantons.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

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
              <option value="90">{t("filters.dur90")}</option>
              <option value="180">{t("filters.dur180")}</option>
              <option value="480">{t("filters.dur480")}</option>
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
          </div>

          {geoError && (
            <p className="rounded-lg bg-soul-sand/60 px-3 py-2 text-xs text-soul-brown">
              {geoError}
            </p>
          )}

          <EventCalendar
            eventDays={eventDays}
            from={searchParams.get("du") ?? undefined}
            to={searchParams.get("au") ?? undefined}
            onSelect={(from, to) => setParams({ du: from, au: to })}
          />
        </div>
    </div>
  );
}
