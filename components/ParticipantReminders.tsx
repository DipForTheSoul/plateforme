"use client";

import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { getFavoriteEventIds } from "@/lib/favorites";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/types/database";

/** Nombre de jours (calendaires) entre aujourd'hui et une date. */
function daysUntil(iso: string): number {
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return Math.round((startOfDay(new Date(iso)) - startOfDay(new Date())) / 86_400_000);
}

function countdownLabel(n: number): string {
  if (n <= 0) return "Aujourd'hui";
  if (n === 1) return "Demain";
  if (n < 7) return `Dans ${n} jours`;
  if (n < 14) return "Dans 1 semaine";
  return `Dans ${Math.round(n / 7)} semaines`;
}

/**
 * Rappel des expériences enregistrées (favoris localStorage) qui approchent —
 * affiché en tête de l'espace participant. Aucune donnée serveur : on relit les
 * favoris de l'appareil et on charge leurs dates.
 */
export function ParticipantReminders() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const ids = getFavoriteEventIds();
      if (ids.length === 0) {
        setEvents([]);
        setLoaded(true);
        return;
      }
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("events")
          .select("*")
          .in("id", ids)
          .eq("status", "approved")
          .gte("start_date", new Date().toISOString())
          .order("start_date")
          .limit(5);
        setEvents((data as Event[]) ?? []);
      } catch {
        // Supabase non configurée : rien à rappeler.
      }
      setLoaded(true);
    }
    load();
    window.addEventListener("fts:favorites-changed", load);
    return () => window.removeEventListener("fts:favorites-changed", load);
  }, []);

  if (!loaded || events.length === 0) return null;

  return (
    <section className="mb-8 rounded-2xl border border-soul-terracotta/25 bg-soul-ivory p-5">
      <h2 className="mb-1 flex items-center gap-2 text-lg text-soul-brown">
        <CalendarClock className="h-5 w-5 text-soul-terracotta" /> Vos prochains
        rendez-vous
      </h2>
      <p className="mb-4 text-sm text-soul-bronze">
        Un rappel de vos expériences enregistrées qui approchent.
      </p>
      <ul className="flex flex-col gap-2">
        {events.map((e) => {
          const n = daysUntil(e.start_date);
          return (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-soul-brown">{e.title}</p>
                <p className="text-xs text-soul-bronze">{formatDate(e.start_date)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-soul-terracotta/10 px-3 py-1 text-xs font-semibold text-soul-terracotta">
                  {countdownLabel(n)}
                </span>
                <a
                  href={`/api/events/${e.slug}/ics`}
                  className="text-xs font-medium text-soul-terracotta hover:underline"
                >
                  Agenda
                </a>
                <Link
                  href={`/experiences/${e.slug}`}
                  className="text-xs text-soul-brown underline"
                >
                  Voir
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
