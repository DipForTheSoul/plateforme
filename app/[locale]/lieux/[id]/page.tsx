import type { Metadata } from "next";
import { pageAlternates } from '@/lib/metadata';
import { isVenuePublished } from '@/lib/venue-publication';
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EventCard } from "@/components/EventCard";
import { VenueMap } from "@/components/VenueMap";
import { getVenueById } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { EVENT_WITH_RELATIONS, mapEventRow, type EventRowRaw } from "@/types/database";
import { formatVenueLocationFull } from "@/lib/utils";
import { ArrowLeft, Globe, MapPin, Navigation, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const venue = await getVenueById(id);
  return venue && isVenuePublished(venue)
    ? { title: venue.name, description: venue.description?.slice(0, 160), alternates: pageAlternates(`/lieux/${venue.id}`, locale) }
    : { title: "ForTheSoul" };
}

/** Fiche lieu publique (Phase 4) + expériences programmées. */
export default async function VenuePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("venues");

  const venue = await getVenueById(id);
  if (!venue || !isVenuePublished(venue)) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(EVENT_WITH_RELATIONS)
    .eq("venue_id", venue.id)
    .eq("status", "approved")
    .gte("start_date", new Date().toISOString())
    .order("start_date");
  const events = ((data as unknown as EventRowRaw[]) ?? []).map(mapEventRow);
  const mapsDirections = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${venue.address}, ${venue.city ?? ""} ${venue.country}`
  )}`;
  const rawWebsite = venue.contact?.website?.trim();
  const websiteUrl = rawWebsite
    ? /^https?:\/\//i.test(rawWebsite)
      ? rawWebsite
      : `https://${rawWebsite}`
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/lieux" className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-soul-violet underline underline-offset-4">
        <ArrowLeft aria-hidden className="h-4 w-4" />{t("backToVenues")}
      </Link>
      <header className="max-w-3xl">
        <h1 className="text-3xl text-soul-brown sm:text-4xl">{venue.name}</h1>

        {venue.description && (
          <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-soul-ink/85">
            {venue.description}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2 text-soul-bronze">
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-soul-violet" />
            {venue.address}
          </p>
          <p className="flex items-center gap-2 text-sm text-soul-bronze/80">
            <span className="inline-block w-4 shrink-0" aria-hidden />
            {formatVenueLocationFull(venue.city, venue.canton, venue.country)}
          </p>
          {venue.capacity && (
            <p className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 shrink-0 text-soul-violet" />
              {t("capacity", { count: venue.capacity })}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-soul-violet underline underline-offset-2 hover:text-soul-violet-dark"
            >
              <Globe className="h-4 w-4" /> {t("website")}
            </a>
          )}
        </div>
      </header>


      {venue.lat !== null && venue.lng !== null && (
        <div className="mt-6">
          <div className="overflow-hidden rounded-2xl border border-soul-bronze/20 shadow-sm">
            <VenueMap lat={venue.lat} lng={venue.lng} label={venue.name} />
          </div>
          <a
            href={`https://www.openstreetmap.org/?mlat=${venue.lat}&mlon=${venue.lng}#map=16/${venue.lat}/${venue.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm text-soul-terracotta underline"
          >
            {t("openInOsm")} ↗
          </a>
        </div>
      )}

      <div className="mt-4 flex justify-start">
        <a
          href={mapsDirections}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary min-h-11 max-w-full !py-2.5"
        >
          <Navigation aria-hidden className="h-4 w-4 shrink-0" /> {t("directions")}
        </a>
      </div>

      <section className="mt-12">
        <h2 className="mb-6 text-2xl text-soul-brown">{t("upcoming")}</h2>
        {events.length === 0 ? (
          <p className="text-soul-bronze">—</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
