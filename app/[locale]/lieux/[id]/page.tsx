import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EventCard } from "@/components/EventCard";
import { getVenueById } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { EVENT_WITH_RELATIONS, mapEventRow, type EventRowRaw } from "@/types/database";
import { formatVenueLocation } from "@/lib/utils";
import { Globe, MapPin, Navigation, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const venue = await getVenueById(id);
  return venue
    ? { title: venue.name, description: venue.description?.slice(0, 160) }
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
  if (!venue) notFound();

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
            {formatVenueLocation(venue.city, venue.country)}
            {venue.canton && <> · {venue.canton}</>}
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
          <a
            href={mapsDirections}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary !py-2.5 sm:ml-auto"
          >
            <Navigation className="h-4 w-4" /> {t("directions")}
          </a>
        </div>
      </header>


      {venue.lat !== null && venue.lng !== null && (
        <div className="mt-6">
          <div className="overflow-hidden rounded-2xl border border-soul-bronze/20 shadow-sm">
            <iframe
              title={`Carte — ${venue.name}`}
              className="h-72 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${venue.lng - 0.012}%2C${venue.lat - 0.007}%2C${venue.lng + 0.012}%2C${venue.lat + 0.007}&layer=mapnik&marker=${venue.lat}%2C${venue.lng}`}
            />
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
