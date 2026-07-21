/**
 * Ajout à l'agenda — fonctions pures (utilisables client & serveur).
 * Fichier .ics universel (Apple, Outlook, Google via import) + lien Google Agenda.
 */

/** ISO → format calendrier UTC compact (ex. "20261105T170000Z"). */
export function toCalDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Fin par défaut : +2 h si non fournie. */
export function resolveEnd(start: string, end?: string | null): string {
  if (end) return end;
  return new Date(new Date(start).getTime() + 2 * 60 * 60 * 1000).toISOString();
}

export interface CalEvent {
  uid: string;
  title: string;
  start: string;
  end?: string | null;
  details?: string | null;
  location?: string | null;
  url?: string | null;
}

/** Lien « Ajouter à Google Agenda ». */
export function googleCalendarUrl(e: CalEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${toCalDate(e.start)}/${toCalDate(resolveEnd(e.start, e.end))}`,
    details: e.details ?? "",
    location: e.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Contenu d'un fichier .ics (une VEVENT). */
export function buildICS(e: CalEvent): string {
  const esc = (s?: string | null) =>
    (s ?? "").replace(/([,;\\])/g, "\\$1").replace(/\r?\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ForTheSoul//Agenda//FR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${toCalDate(new Date().toISOString())}`,
    `DTSTART:${toCalDate(e.start)}`,
    `DTEND:${toCalDate(resolveEnd(e.start, e.end))}`,
    `SUMMARY:${esc(e.title)}`,
    e.details ? `DESCRIPTION:${esc(e.details)}` : "",
    e.location ? `LOCATION:${esc(e.location)}` : "",
    e.url ? `URL:${e.url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
