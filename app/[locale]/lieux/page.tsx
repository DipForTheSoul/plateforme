import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getVenues } from "@/lib/queries";
import { formatVenueLocationFull } from "@/lib/utils";
import { MapPin, Search, Users, X } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "venues" });
  return { title: t("pageTitle"), description: t("pageSubtitle") };
}

/** Page publique des lieux (§3) + filtres recherche libre / canton (arbitrage Victor). */
export default async function VenuesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; canton?: string }>;
}) {
  const { locale } = await params;
  const { q = "", canton = "" } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("venues");
  const all = await getVenues();

  // Cantons disponibles (uniquement les lieux qui en ont un), triés.
  const cantons = Array.from(
    new Set(all.map((v) => v.canton).filter((c): c is string => Boolean(c)))
  ).sort();

  const query = q.trim().toLowerCase();
  const venues = all.filter((v) => {
    if (canton && v.canton !== canton) return false;
    if (query) {
      const haystack = `${v.name} ${v.city ?? ""} ${v.address ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const hasFilters = Boolean(query || canton);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl text-soul-brown sm:text-4xl">{t("pageTitle")}</h1>
      <p className="mt-2 max-w-2xl text-soul-bronze">{t("pageSubtitle")}</p>

      {/* Filtres : recherche libre + canton (formulaire GET, préserve la locale). */}
      <form method="get" className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-soul-bronze" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="field !rounded-full !py-2.5 !pl-11"
          />
        </div>
        <select
          name="canton"
          defaultValue={canton}
          aria-label={t("canton")}
          className="field !w-auto !rounded-full"
        >
          <option value="">{t("allCantons")}</option>
          {cantons.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary !rounded-full !py-2.5">
          <Search className="h-4 w-4" />
        </button>
        {hasFilters && (
          <Link
            href="/lieux"
            className="inline-flex items-center gap-1 text-sm text-soul-violet underline"
          >
            <X className="h-3.5 w-3.5" />
            {t("filtersReset")}
          </Link>
        )}
      </form>

      {venues.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-soul-sand/40 p-8 text-center text-soul-brown">
          {t("empty")}
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v) => (
            <Link
              key={v.id}
              href={`/lieux/${v.id}`}
              className="card group flex h-full flex-col p-6 transition hover:shadow-lg"
            >
              <h2 className="font-serif text-xl text-soul-brown">{v.name}</h2>
              <p className="mt-2.5 flex items-center gap-1.5 text-sm text-soul-bronze">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-soul-violet" />
                {formatVenueLocationFull(v.city, v.canton, v.country)}
              </p>
              {v.description && (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-soul-ink/70">
                  {v.description}
                </p>
              )}
              {v.capacity && (
                <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-soul-bronze">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  {t("capacity", { count: v.capacity })}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
