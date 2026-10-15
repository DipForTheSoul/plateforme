"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useExplorerNavigation, useExplorerSearchParams } from "@/components/ExplorerNavigation";
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
  const searchParams = useExplorerSearchParams();
  const pathname = usePathname();
  const setParams = useExplorerNavigation();
  // Price filtering always uses and displays its source currency: CHF.
  const priceLabel = (chf: number) => `≤ CHF ${chf}.–`;

  const urlQ = searchParams.get("q") ?? "";
  const [draft, setDraft] = useState({source: urlQ, value: urlQ});
  const q = draft.source === urlQ ? draft.value : urlQ;
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  // Seule une saisie déclenche une recherche : une navigation / un retour
  // historique ne doit jamais être réécrit par un ancien brouillon.
  useEffect(() => () => { if (debounce.current) clearTimeout(debounce.current); }, [urlQ]);

  const radiusActive = Boolean(searchParams.get("rayon"));

  const filterKeys = ["categorie", "langue", "praticien", "pays", "canton", "prix", "duree", "rayon"];
  const activeCount = filterKeys.filter((k) => searchParams.get(k)).length;
  const hasAnyFilter =
    activeCount > 0 || q || searchParams.get("du") || searchParams.get("au");

  function resetAll() {
    if (debounce.current) clearTimeout(debounce.current);
    setDraft({source: "", value: ""});
    setParams({}, true);
  }

  function withoutFilters(keys: string[]) {
    const params = new URLSearchParams(searchParams);
    for (const key of keys) params.delete(key);
    return `${pathname}${params.size ? `?${params}` : ''}`;
  }

  // §8 — puces des filtres actifs (visibles + retirables) pour voir d'un coup d'œil
  // quels filtres sont appliqués.
  const durationLabels: Record<string, string> = {
    "90": t("filters.dur90"),
    "180": t("filters.dur180"),
    "480": t("filters.dur480"),
  };
  const activeChips: { key: string; label: string; remove: Record<string, undefined> }[] = [];
  const gp = (k: string) => searchParams.get(k);
  if (gp("categorie"))
    activeChips.push({
      key: "categorie",
      label: tCat.has(gp("categorie")! as never)
        ? tCat(gp("categorie")! as never)
        : (categories.find((c) => c.slug === gp("categorie"))?.name ?? gp("categorie")!),
      remove: { categorie: undefined },
    });
  if (gp("langue"))
    activeChips.push({
      key: "langue",
      label: LANGUAGE_LABELS[gp("langue")!] ?? gp("langue")!,
      remove: { langue: undefined },
    });
  if (gp("praticien"))
    activeChips.push({
      key: "praticien",
      label: practitioners.find((p) => p.slug === gp("praticien"))?.name ?? gp("praticien")!,
      remove: { praticien: undefined },
    });
  if (gp("pays"))
    activeChips.push({
      key: "pays",
      label: countries.find((c) => c.code === gp("pays"))?.name ?? gp("pays")!,
      // Retirer le pays retire aussi le canton (canton dépend du pays).
      remove: { pays: undefined, canton: undefined },
    });
  if (gp("canton"))
    activeChips.push({
      key: "canton",
      label: gp("canton")!,
      remove: { canton: undefined },
    });
  if (gp("prix"))
    activeChips.push({
      key: "prix",
      label: priceLabel(Number(gp("prix"))),
      remove: { prix: undefined },
    });
  if (gp("duree"))
    activeChips.push({
      key: "duree",
      label: durationLabels[gp("duree")!] ?? `≤ ${gp("duree")} min`,
      remove: { duree: undefined },
    });
  if (radiusActive)
    activeChips.push({
      key: "rayon",
      label: `${gp("rayon")} km`,
      remove: { rayon: undefined, lat: undefined, lng: undefined },
    });
  if (gp("du") || gp("au"))
    activeChips.push({
      key: "dates",
      label: `${gp("du") ?? "…"} → ${gp("au") ?? "…"}`,
      remove: { du: undefined, au: undefined },
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
    <form method="get" action={pathname} className="flex flex-col gap-4" onSubmit={(event) => {
      event.preventDefault();
      if (debounce.current) clearTimeout(debounce.current);
      const values = new FormData(event.currentTarget);
      const updates = Object.fromEntries(Array.from(values, ([key, value]) => [key, String(value) || undefined]));
      setParams(updates, true);
    }}>
      {["vue", "lat", "lng", "rayon"].filter(key => searchParams.has(key)).map(key =>
        <input key={key} type="hidden" name={key} value={searchParams.get(key)!} />)}
      {/* Recherche — toujours visible */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-soul-bronze" />
        <input
          type="search"
          name="q"
          value={q}
          onChange={(e) => {
            const value = e.target.value;
            setDraft({source: urlQ, value});
            if (debounce.current) clearTimeout(debounce.current);
            debounce.current = setTimeout(() => setParams({q: value || undefined}), 300);
          }}
          placeholder={t("searchPlaceholder")}
          className="field !rounded-full !py-3 !pl-11"
        />
      </div>

      {/* Dates — primordial, toujours visible (de / à).
          min-w-0 sur la cellule ET l'input : sans ça, les <input type="date">
          iOS gardent leur largeur native intrinsèque et débordent de la grille. */}
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="date-from" className="label">{t("filters.from")}</label>
          <input key={`from-${searchParams.get("du") ?? ""}`} id="date-from" name="du" type="date"
            defaultValue={searchParams.get("du") ?? ""}
            className="field min-h-11 min-w-0 max-w-full appearance-auto touch-manipulation" />
        </div>
        <div className="min-w-0">
          <label htmlFor="date-to" className="label">{t("filters.to")}</label>
          <input key={`to-${searchParams.get("au") ?? ""}`} id="date-to" name="au" type="date"
            defaultValue={searchParams.get("au") ?? ""}
            min={searchParams.get("du") ?? undefined}
            className="field min-h-11 min-w-0 max-w-full appearance-auto touch-manipulation" />
        </div>
        <button type="submit" className="btn-secondary min-[480px]:col-span-2 !py-2">
          {t("filters.apply")}
        </button>
      </div>

      {/* Bouton Filtres — sur mobile uniquement (desktop : filtres toujours ouverts) + réinitialiser */}
      <div className="flex items-center justify-between gap-3">
        {hasAnyFilter && (
          <a href={pathname} onClick={(event) => {event.preventDefault(); resetAll();}}
            className="inline-flex min-h-11 items-center text-sm text-soul-violet underline">
            {t("filters.reset")}
          </a>
        )}
      </div>

      {/* Puces des filtres actifs — cliquer pour retirer (§8). */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <a
              key={chip.key}
              href={withoutFilters(Object.keys(chip.remove))}
              onClick={(event) => {event.preventDefault(); setParams(chip.remove);}}
              className="inline-flex min-h-11 items-center gap-1 rounded-full bg-soul-violet/10 px-3 py-1 text-xs font-medium text-soul-violet transition hover:bg-soul-violet/20"
            >
              {chip.label}
              <X className="h-3 w-3" />
            </a>
          ))}
        </div>
      )}

      {/* Filtres : repliés par défaut sur mobile, toujours visibles sur desktop (§8) */}
      <details className="rounded-2xl border border-soul-bronze/15 bg-white p-4">
        <summary className="min-h-11 cursor-pointer text-soul-violet"><SlidersHorizontal className="mr-2 inline h-4 w-4" />{t("filters.title")}{activeCount > 0 ? ` (${activeCount})` : ""}</summary>
        <div className="flex flex-col gap-4">
          {/* Filtres empilés (1 colonne) : la colonne latérale est étroite,
              en 2 colonnes le texte des menus était tronqué. */}
          <div className="grid gap-3">
            <select name="categorie" value={searchParams.get("categorie") ?? ""}
              onChange={(e) => setParams({ categorie: e.target.value || undefined })}
              className="field" aria-label={t("filters.category")}>
              <option value="">{t("filters.allCategories")}</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{tCat.has(c.slug as never) ? tCat(c.slug as never) : c.name}</option>
              ))}
            </select>

            <select name="langue" value={searchParams.get("langue") ?? ""}
              onChange={(e) => setParams({ langue: e.target.value || undefined })}
              className="field" aria-label={t("filters.language")}>
              <option value="">{t("filters.allLanguages")}</option>
              {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>

            <select name="praticien" value={searchParams.get("praticien") ?? ""}
              onChange={(e) => setParams({ praticien: e.target.value || undefined })}
              className="field" aria-label={t("filters.practitioner")}>
              <option value="">{t("filters.allPractitioners")}</option>
              {practitioners.map((p) => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>

            <select name="pays" value={searchParams.get("pays") ?? ""}
              onChange={(e) => setParams({ pays: e.target.value || undefined, canton: undefined })}
              className="field" aria-label={t("filters.country")}>
              <option value="">{t("filters.allCountries")}</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>

            {/* Canton uniquement si la Suisse est sélectionnée (§2.1). */}
            {searchParams.get('pays') === 'CH' && cantons.length > 0 && (
              <select name="canton" value={searchParams.get("canton") ?? ""}
                onChange={(e) => setParams({ canton: e.target.value || undefined })}
                className="field" aria-label={t("filters.canton")}>
                <option value="">{t("filters.allCantons")}</option>
                {cantons.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            <select name="prix" value={searchParams.get("prix") ?? ""}
              onChange={(e) => setParams({ prix: e.target.value || undefined })}
              className="field min-w-0 w-full" aria-label={t("filters.priceMax", { currency: "CHF" })}>
              <option value="">{t("filters.priceMax", { currency: "CHF" })} : —</option>
              {[30, 50, 100, 300, 1000].map((p) => (
                <option key={p} value={p}>{priceLabel(p)}</option>
              ))}
            </select>

            <select name="duree" value={searchParams.get("duree") ?? ""}
              onChange={(e) => setParams({ duree: e.target.value || undefined })}
              className="field" aria-label={t("filters.durationMax")}>
              <option value="">{t("filters.anyDuration")}</option>
              <option value="90">{t("filters.dur90")}</option>
              <option value="180">{t("filters.dur180")}</option>
              <option value="480">{t("filters.dur480")}</option>
            </select>
          </div>
          <button type="submit" className="btn-secondary">{t("filters.apply")}</button>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={toggleRadius} disabled={locating}
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
            key={searchParams.get("calendrier") ?? searchParams.get("du") ?? "current"}
            eventDays={eventDays}
            from={searchParams.get("du") ?? undefined}
            to={searchParams.get("au") ?? undefined}
            onSelect={(from, to) => setParams({ du: from, au: to })}
          />
        </div>
      </details>
    </form>
  );
}
