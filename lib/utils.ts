import type { Locale } from "@/types/database";

/** Concatène des classes conditionnelles. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const DATE_LOCALES: Record<Locale, string> = {
  fr: "fr-CH",
  de: "de-CH",
  en: "en-GB",
};

/** Noms de pays (FR) pour les codes ISO courants du catalogue (§5.1). */
const COUNTRY_NAMES: Record<string, string> = {
  CH: "Suisse",
  FR: "France",
  DE: "Allemagne",
  IT: "Italie",
  ES: "Espagne",
  PT: "Portugal",
  MA: "Maroc",
  CR: "Costa Rica",
  GR: "Grèce",
  IN: "Inde",
};

export function countryName(code: string | null | undefined): string {
  if (!code) return "";
  return COUNTRY_NAMES[code.toUpperCase()] ?? code;
}

/**
 * Localisation d'un lieu (§5.1) : « Ville, Pays » ; si la ville est absente
 * (retraite itinérante / à l'étranger), afficher seulement le pays.
 */
export function formatVenueLocation(
  city: string | null | undefined,
  country: string | null | undefined
): string {
  const pays = countryName(country);
  return city ? `${city}, ${pays}` : pays;
}

/**
 * Localisation détaillée : Ville · Canton · Pays (uniquement les parties
 * renseignées). Ex. « Lugano · TI · Suisse », ou « Suisse » si rien d'autre.
 */
export function formatVenueLocationFull(
  city: string | null | undefined,
  canton: string | null | undefined,
  country: string | null | undefined
): string {
  return [city, canton, countryName(country)].filter(Boolean).join(" · ");
}

/**
 * Convertit une URL YouTube/Vimeo en URL d'iframe intégrable (§4.1).
 * Renvoie null si l'URL n'est pas reconnue → aucun bloc vidéo affiché.
 */
export function videoEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    // YouTube : youtu.be/ID, youtube.com/watch?v=ID, /embed/ID, /shorts/ID
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host.endsWith("youtube.com")) {
      const id =
        u.searchParams.get("v") ??
        u.pathname.match(/\/(embed|shorts)\/([\w-]+)/)?.[2] ??
        null;
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    // Vimeo : vimeo.com/ID
    if (host.endsWith("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Format de date UNIQUE et uniforme partout (jour de la semaine + JJ.MM.AAAA) :
 *   fr → « Vendredi 05.02.2027 », de → « Freitag 05.02.2027 », en → « Friday 05.02.2027 ».
 * Séparateur par points (format suisse), jour de semaine avec majuscule initiale.
 */
export function formatDate(iso: string, locale: Locale = "fr"): string {
  const d = new Date(iso);
  const weekday = new Intl.DateTimeFormat(DATE_LOCALES[locale], {
    weekday: "long",
  }).format(d);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const cap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${cap} ${dd}.${mm}.${d.getFullYear()}`;
}

/** Heure au format 24h « 16:00 » (deux-points, uniforme partout). */
export function formatTime(iso: string, locale: Locale = "fr"): string {
  const d = new Date(iso);
  void locale;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatDateRange(
  startIso: string,
  endIso: string | null,
  locale: Locale = "fr"
): string {
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : null;
  const sameDay = end && start.toDateString() === end.toDateString();
  if (!end || sameDay) return formatDate(startIso, locale);
  return `${formatDate(startIso, locale)} → ${formatDate(endIso!, locale)}`;
}

export function formatPrice(
  price: number | null,
  currency = "CHF",
  freeLabel = "Prix libre"
): string {
  if (price === null || Number(price) === 0) return freeLabel;
  return `${currency} ${Number(price).toFixed(0)}.–`;
}

export function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

/** Slug URL-safe à partir d'un titre (accents français gérés). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Suffixe aléatoire court pour garantir l'unicité d'un slug. */
export function uniqueSlug(base: string): string {
  return `${slugify(base)}-${Math.random().toString(36).slice(2, 7)}`;
}

export const LANGUAGE_LABELS: Record<string, string> = {
  fr: "Français",
  de: "Deutsch",
  en: "English",
  es: "Español",
  it: "Italiano",
};
