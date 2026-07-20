"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  /** Jours (format YYYY-MM-DD) ayant au moins un événement. */
  eventDays: string[];
  /** Sélection courante (YYYY-MM-DD) — pilotée par l'URL. */
  from?: string;
  to?: string;
  onSelect: (from?: string, to?: string) => void;
}

function toKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Calendrier interactif (Phase 3) : les jours avec événements sont pastillés ;
 * un clic filtre sur le jour, deux clics définissent une période.
 */
export function EventCalendar({ eventDays, from, to, onSelect }: Props) {
  const t = useTranslations("events.calendar");
  const locale = useLocale();
  const [month, setMonth] = useState(() => {
    const d = from ? new Date(from) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const daysWithEvents = useMemo(() => new Set(eventDays), [eventDays]);

  const weeks = useMemo(() => {
    const first = new Date(month);
    // Lundi comme premier jour de semaine.
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - offset);
    return Array.from({ length: 6 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const day = new Date(start);
        day.setDate(start.getDate() + w * 7 + d);
        return day;
      })
    );
  }, [month]);

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(month);

  const weekdays = useMemo(() => {
    const base = new Date(2024, 0, 1); // un lundi
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(d);
    });
  }, [locale]);

  function handleDayClick(key: string) {
    if (from && !to && key > from) {
      onSelect(from, key); // deuxième clic → période
    } else if (from === key && !to) {
      onSelect(undefined, undefined); // re-clic → efface
    } else {
      onSelect(key, undefined); // premier clic → jour seul
    }
  }

  const todayKey = toKey(new Date());

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold capitalize text-soul-brown">{monthLabel}</p>
        <div className="flex gap-1">
          <button type="button" aria-label="Mois précédent"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="rounded-lg p-1 text-soul-bronze hover:bg-soul-sand/50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Mois suivant"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="rounded-lg p-1 text-soul-bronze hover:bg-soul-sand/50">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-soul-bronze">
        {weekdays.map((d, i) => (
          <span key={i} className="py-1 font-medium">{d}</span>
        ))}
        {weeks.flat().map((day) => {
          const key = toKey(day);
          const inMonth = day.getMonth() === month.getMonth();
          const hasEvents = daysWithEvents.has(key);
          const selected =
            (from && !to && key === from) ||
            (from && to && key >= from && key <= to);
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleDayClick(key)}
              className={[
                "relative rounded-lg py-1.5 transition",
                inMonth ? "text-soul-ink" : "text-soul-bronze/40",
                selected ? "bg-soul-brown font-semibold !text-soul-cream" : "hover:bg-soul-sand/60",
                key === todayKey && !selected ? "ring-1 ring-soul-bronze/50" : "",
              ].join(" ")}
            >
              {day.getDate()}
              {hasEvents && (
                <span className={`absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                  selected ? "bg-soul-amber" : "bg-soul-terracotta"
                }`} />
              )}
            </button>
          );
        })}
      </div>

      {(from || to) && (
        <button type="button" onClick={() => onSelect(undefined, undefined)}
          className="mt-2 text-xs text-soul-terracotta underline">
          {t("clear")}
        </button>
      )}
      <p className="mt-2 text-xs text-soul-bronze">{t("help")}</p>
    </div>
  );
}
