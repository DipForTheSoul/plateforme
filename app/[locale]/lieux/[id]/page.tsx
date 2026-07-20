import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EventCard } from "@/components/EventCard";
import { getVenueById } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { EVENT_WITH_RELATIONS, type EventWithRelations } from "@/types/database";
import { MapPin, Users } from "lucide-react";

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
  const events = ((data as unknown as EventWithRelations[]) ?? []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl text-soul-brown sm:text-4xl">{venue.name}</h1>
      <p className="mt-2 flex items-center gap-2 text-soul-bronze">
        <MapPin className="h-4 w-4" /> {venue.address}
        {venue.canton && <> — {venue.canton}</>}
      </p>
      {venue.capacity && (
        <p className="mt-1 flex items-center gap-2 text-sm text-soul-bronze">
          <Users className="h-4 w-4" /> {t("capacity", { count: venue.capacity })}
        </p>
      )}

      {venue.description && (
        <p className="mt-6 max-w-3xl whitespace-pre-line text-soul-ink/85">
          {venue.description}
        </p>
      )}

      {venue.lat !== null && venue.lng !== null && (
        <a
          href={`https://www.openstreetmap.org/?mlat=${venue.lat}&mlon=${venue.lng}#map=15/${venue.lat}/${venue.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary mt-4"
        >
          Voir sur la carte
        </a>
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
