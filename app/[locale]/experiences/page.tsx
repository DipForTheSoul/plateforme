import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EventCard } from "@/components/EventCard";
import { ExplorerControls } from "@/components/ExplorerControls";
import {
  getApprovedEvents,
  getApprovedPractitioners,
  getCategories,
  type EventFilters,
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
  region?: string;
  prix?: string;
  duree?: string;
  du?: string;
  au?: string;
  lat?: string;
  lng?: string;
  rayon?: string;
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

  const filters: EventFilters = {
    q: sp.q,
    category: sp.categorie,
    language: sp.langue,
    practitioner: sp.praticien,
    canton: sp.region && sp.region.length === 2 ? sp.region : undefined,
    country: sp.region && sp.region.length > 2 ? sp.region : undefined,
    priceMax: sp.prix ? Number(sp.prix) : undefined,
    durationMax: sp.duree ? Number(sp.duree) : undefined,
    dateFrom: sp.du ? new Date(`${sp.du}T00:00:00`).toISOString() : undefined,
    dateTo: sp.au
      ? new Date(`${sp.au}T23:59:59`).toISOString()
      : sp.du
        ? new Date(`${sp.du}T23:59:59`).toISOString()
        : undefined,
    lat: sp.lat ? Number(sp.lat) : undefined,
    lng: sp.lng ? Number(sp.lng) : undefined,
    radiusKm: sp.rayon ? Number(sp.rayon) : undefined,
  };

  const [events, allEvents, categories, practitioners] = await Promise.all([
    getApprovedEvents(filters),
    getApprovedEvents(), // pour pastiller le calendrier + régions disponibles
    getCategories(),
    getApprovedPractitioners(),
  ]);

  const eventDays = [...new Set(allEvents.map((e) => e.start_date.slice(0, 10)))];
  const regions = [
    ...new Set(
      allEvents
        .map((e) => e.venue?.canton ?? e.venue?.country)
        .filter((r): r is string => Boolean(r))
    ),
  ].sort();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl text-soul-brown">{t("title")}</h1>
      <p className="mt-2 max-w-2xl text-soul-bronze">{t("subtitle")}</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[320px_1fr]">
        <aside>
          <ExplorerControls
            categories={categories}
            practitioners={practitioners.map((p) => ({ slug: p.slug, name: p.name }))}
            regions={regions}
            eventDays={eventDays}
          />
        </aside>

        <section>
          <p className="mb-4 text-sm text-soul-bronze">
            {t("resultCount", { count: events.length })}
          </p>
          {events.length === 0 ? (
            <p className="rounded-2xl bg-soul-sand/40 p-8 text-center text-soul-brown">
              {t("empty")}
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
