import type { Metadata } from "next";
import { parseSearchFilters } from "@/lib/search-filters";
import { toEventLocalInput } from "@/lib/event-time";
import { formatEventSchedule } from '@/lib/event-display';
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { EventCard } from "@/components/EventCard";
import { EventsMapExplorer, type MapItem } from "@/components/EventsMapExplorer";
import { ExplorerControls } from "@/components/ExplorerControls";
import { ViewToggle } from "@/components/ViewToggle";
import { ExplorerNavigation } from "@/components/ExplorerNavigation";
import { countryName, formatPrice } from "@/lib/utils";
import type { Locale } from "@/types/database";
import {
  getApprovedEvents,
  getApprovedPractitioners,
  getCategories,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "events" });
  return { title: t("title"), description: t("subtitle") };
}

interface SearchParams {
  q?: string;
  categorie?: string;
  langue?: string;
  praticien?: string;
  pays?: string;
  canton?: string;
  prix?: string;
  duree?: string;
  du?: string;
  au?: string;
  lat?: string;
  lng?: string;
  rayon?: string;
  vue?: string;
}

/** Catalogue + recherche (Phase 3) — état piloté par l'URL, rendu serveur. */
export default async function ExperiencesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("events");
  const tCommon = await getTranslations("common");
  const currentLocale = (await getLocale()) as Locale;

  const filters = parseSearchFilters({ ...sp });

  const [events, allEvents, categories, practitioners] = await Promise.all([
    getApprovedEvents(filters),
    getApprovedEvents(), // pour pastiller le calendrier + régions disponibles
    getCategories(),
    getApprovedPractitioners(),
  ]);

  const eventDays = [...new Set(allEvents.map((e) => toEventLocalInput(e.start_date).slice(0, 10)))];

  // §2.1 — Pays (tous) + Cantons (uniquement pour la Suisse).
  const countries = [
    ...new Map(
      allEvents
        .map((e) => e.venue?.country)
        .filter((c): c is string => Boolean(c))
        .map((code) => [code, countryName(code)] as const)
    ),
  ]
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const cantons = [
    ...new Set(
      allEvents
        .filter((e) => e.venue?.country === "CH")
        .map((e) => e.venue?.canton)
        .filter((c): c is string => Boolean(c))
    ),
  ].sort();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl text-soul-brown">{t("title")}</h1>
      <p className="mt-2 max-w-2xl text-soul-bronze">{t("subtitle")}</p>

      <ExplorerNavigation>
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside>
          <ExplorerControls
            categories={categories}
            practitioners={practitioners.map((p) => ({ slug: p.slug, name: p.name }))}
            countries={countries}
            cantons={cantons}
            eventDays={eventDays}
          />
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-soul-bronze">
              {t("resultCount", { count: events.length })}
            </p>
            <ViewToggle />
          </div>
          {events.length === 0 ? (
            <p className="rounded-2xl bg-soul-sand/40 p-8 text-center text-soul-brown">
              {t("empty")}
            </p>
          ) : sp.vue === "carte" ? (
            <EventsMapExplorer
              hrefPrefix={currentLocale === "fr" ? "" : `/${currentLocale}`}
              items={events.reduce<MapItem[]>((acc, e) => {
                if (e.venue?.lat != null && e.venue?.lng != null) {
                  acc.push({
                    id: e.id,
                    slug: e.slug,
                    title: e.title,
                    venueName: e.venue.name,
                    regionLabel: e.venue.canton ?? e.venue.country,
                    priceLabel: formatPrice(e.price, e.currency, tCommon("free")),
                    dateLabel: formatEventSchedule(e.start_date, e.end_date, currentLocale),
                    image: e.images[0],
                    featured: e.is_top,
                    lat: e.venue.lat,
                    lng: e.venue.lng,
                  });
                }
                return acc;
              }, [])}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </div>
      </ExplorerNavigation>
    </div>
  );
}
