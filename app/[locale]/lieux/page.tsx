import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getVenues } from "@/lib/queries";
import { VenueFilters } from "@/components/VenueFilters";
import { isVenuePublished } from '@/lib/venue-publication';
import { formatVenueLocationFull } from "@/lib/utils";
import { ArrowRight, MapPin, Plus, Users, X } from "lucide-react";

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
  searchParams: Promise<{ q?: string; pays?: string; canton?: string }>;
}) {
  const { locale } = await params;
  const { q = "", pays = "", canton = "" } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("venues");
  const proposalMailto = `mailto:welcome@forthesoul.ch?subject=${encodeURIComponent(t("proposal.emailSubject"))}&body=${encodeURIComponent(t("proposal.emailBody"))}`;
  const all = (await getVenues()).filter(isVenuePublished);

  // Cantons disponibles (uniquement les lieux qui en ont un), triés.
  const cantons = Array.from(
    new Set(all.filter(v=>v.country==="CH").map((v) => v.canton).filter((c): c is string => Boolean(c)))
  ).sort();
  const countries=Array.from(new Set(all.map(v=>v.country).filter(Boolean))).sort();

  const query = q.trim().toLowerCase();
  const venues = all.filter((v) => {
    if (pays && v.country !== pays) return false;
    if (pays === "CH" && canton && v.canton !== canton) return false;
    if (query) {
      const haystack = `${v.name} ${v.city ?? ""} ${v.description ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const hasFilters = Boolean(query || pays || canton);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl text-soul-brown sm:text-4xl">{t("pageTitle")}</h1>
      <p className="mt-2 max-w-2xl text-soul-bronze">{t("pageSubtitle")}</p>

      {/* Filtres : recherche libre + canton (formulaire GET, préserve la locale). */}
      <VenueFilters key={`${locale}:${q}:${pays}:${canton}`} country={pays} canton={canton} countries={countries} cantons={cantons}
        countryNames={Object.fromEntries(countries.map(code => [code, new Intl.DisplayNames([locale], {type:"region"}).of(code) ?? code]))}
        labels={{filters:t("filterPanel.title"),search:t("searchAction"),country:t("country"),canton:t("canton"),allCountries:t("allCountries"),allCantons:t("allCantons"),reset:t("filtersReset"),apply:t("filterPanel.apply"),close:t("filterPanel.close"),empty:t("filterPanel.empty")}}
        search={{initialValue:q, suggestions:[
            ...Array.from(new Set(all.filter(v => !pays || v.country === pays).map(v => v.city?.trim()).filter((city): city is string => Boolean(city)))).sort().map(value => ({ value, kind: "city" as const })),
            ...all.filter(v => !pays || v.country === pays).map(v => ({ value: v.name, kind: "venue" as const })),
          ], labels:{ placeholder: t("searchPlaceholder"), suggestions: t("suggestions"), city: t("suggestionCity"), venue: t("suggestionVenue") }}} />
        {hasFilters && (
          <Link
            href="/lieux"
            className="mt-3 inline-flex items-center gap-1 text-sm text-soul-violet underline"
          >
            <X className="h-3.5 w-3.5" />
            {t("filtersReset")}
          </Link>
        )}

      <section id="proposer-un-lieu" aria-labelledby="propose-venue-title" className="relative mt-6 scroll-mt-24 overflow-hidden rounded-2xl border border-soul-bronze/10 bg-gradient-to-br from-soul-sand/60 via-soul-cream to-white p-4 sm:p-6">
        <div aria-hidden className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-soul-amber/10 blur-3xl" />
        <div className="relative grid items-center gap-4 md:grid-cols-[1.4fr_1fr] md:gap-6">
          <div className="min-w-0">
            <h2 id="propose-venue-title" className="scroll-mt-24 font-serif text-xl leading-tight text-soul-brown sm:text-2xl">{t("proposal.title")}</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-soul-bronze">{t("proposal.description")}</p>
          </div>
          <div className="flex min-w-0 flex-col items-center justify-self-center md:justify-self-end">
            <p className="whitespace-nowrap font-serif text-base leading-tight text-soul-brown md:text-lg">{t("proposal.price")}</p>
            <a href={proposalMailto} className="btn-primary mt-3 inline-flex min-h-11 max-w-full items-center justify-center gap-2 whitespace-nowrap !px-3 !text-sm sm:!px-5">{t("proposal.button")}<ArrowRight aria-hidden className="h-4 w-4 shrink-0" /></a>
          </div>
        </div>
        <details className="group relative mt-4 border-t border-soul-bronze/15">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 pt-3 font-serif text-base text-soul-brown marker:content-none [&::-webkit-details-marker]:hidden">{t("proposal.question")}<Plus aria-hidden className="h-5 w-5 shrink-0 text-soul-bronze transition-transform duration-200 group-open:rotate-45" /></summary>
          <p className="max-w-3xl pt-3 whitespace-pre-line text-sm leading-relaxed text-soul-ink/75">{t("proposal.answer")}</p>
        </details>
      </section>

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
