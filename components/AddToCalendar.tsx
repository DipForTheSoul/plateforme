"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarPlus } from "lucide-react";
import { googleCalendarUrl } from "@/lib/calendar";

/**
 * « Ajouter à mon agenda » — menu déroulant : Google Agenda (lien) + .ics
 * universel (Apple / Outlook / autres) via la route serveur.
 */
export function AddToCalendar({
  slug,
  title,
  start,
  end,
  details,
  location,
}: {
  slug: string;
  title: string;
  start: string;
  end?: string | null;
  details?: string | null;
  location?: string | null;
}) {
  const t = useTranslations("event");
  const [open, setOpen] = useState(false);

  const google = googleCalendarUrl({ uid: slug, title, start, end, details, location });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="btn-secondary"
      >
        <CalendarPlus className="h-4 w-4" />
        {t("addToCalendar")}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute left-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-soul-bronze/20 bg-white p-1 shadow-lg">
            <a
              href={google}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-soul-brown hover:bg-soul-sand/50"
            >
              {t("calGoogle")}
            </a>
            <a
              href={`/api/events/${slug}/ics`}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-soul-brown hover:bg-soul-sand/50"
            >
              {t("calOther")}
            </a>
          </div>
        </>
      )}
    </div>
  );
}
