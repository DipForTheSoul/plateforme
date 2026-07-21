"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CalendarPlus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { FavoriteButton } from "@/components/FavoriteButton";
import { createClient } from "@/lib/supabase/client";
import { getFavoriteEventIds, getFavoritePractitionerIds } from "@/lib/favorites";
import { categoryVisual } from "@/lib/gradients";
import { formatDate } from "@/lib/utils";
import type { Event, Practitioner } from "@/types/database";

type EventRow = Event & { category: { slug: string; name: string } | null };

export function FavoritesClient({
  labels,
}: {
  labels: { events: string; practitioners: string; empty: string };
}) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const eventIds = getFavoriteEventIds();
      const practitionerIds = getFavoritePractitionerIds();
      try {
        const supabase = createClient();
        const [eventsRes, practitionersRes] = await Promise.all([
          eventIds.length
            ? supabase
                .from("events")
                .select("*, category:categories(slug, name)")
                .in("id", eventIds)
                .eq("status", "approved")
            : Promise.resolve({ data: [] }),
          practitionerIds.length
            ? supabase
                .from("practitioners")
                .select("*")
                .in("id", practitionerIds)
                .eq("status", "approved")
            : Promise.resolve({ data: [] }),
        ]);
        setEvents((eventsRes.data as EventRow[]) ?? []);
        setPractitioners((practitionersRes.data as Practitioner[]) ?? []);
      } catch {
        // Supabase non configurée : listes vides.
      }
      setLoaded(true);
    }
    load();
    window.addEventListener("fts:favorites-changed", load);
    return () => window.removeEventListener("fts:favorites-changed", load);
  }, []);

  if (!loaded) return null;

  if (events.length === 0 && practitioners.length === 0) {
    return (
      <p className="mt-10 rounded-2xl bg-soul-sand/40 p-8 text-center text-soul-brown">
        {labels.empty}
      </p>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-12">
      {events.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl text-soul-brown">{labels.events}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const visual = categoryVisual(event.category?.slug);
              return (
                <article key={event.id} className="card group relative">
                  <Link href={`/experiences/${event.slug}`} className="absolute inset-0 z-10">
                    <span className="sr-only">{event.title}</span>
                  </Link>
                  <div className="relative h-40 w-full overflow-hidden">
                    {event.images[0] ? (
                      <Image src={event.images[0]} alt="" fill sizes="33vw" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl"
                        style={{ background: visual.gradient }}>
                        {visual.emoji}
                      </div>
                    )}
                    <div className="absolute right-3 top-3 z-20">
                      <FavoriteButton kind="event" id={event.id} />
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs uppercase text-soul-bronze">
                      {formatDate(event.start_date)}
                    </p>
                    <h3 className="font-serif text-lg text-soul-brown">{event.title}</h3>
                    <a
                      href={`/api/events/${event.slug}/ics`}
                      className="relative z-20 mt-2 inline-flex items-center gap-1 text-xs font-medium text-soul-terracotta hover:underline"
                    >
                      <CalendarPlus className="h-3.5 w-3.5" /> Ajouter à mon agenda
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {practitioners.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl text-soul-brown">{labels.practitioners}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {practitioners.map((p) => (
              <article key={p.id} className="card group relative flex items-center gap-4 p-4">
                <Link href={`/praticiens/${p.slug}`} className="absolute inset-0 z-10">
                  <span className="sr-only">{p.name}</span>
                </Link>
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
                  {p.photos[0] ? (
                    <Image src={p.photos[0]} alt="" fill sizes="64px" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-soul-brown to-soul-bronze font-serif text-2xl text-soul-cream">
                      {p.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-serif text-lg text-soul-brown">{p.name}</h3>
                  <p className="truncate text-sm text-soul-bronze">
                    {p.specialties.slice(0, 2).join(" · ")}
                  </p>
                </div>
                <div className="z-20">
                  <FavoriteButton kind="practitioner" id={p.id} />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
