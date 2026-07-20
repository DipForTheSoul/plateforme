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

export function formatDate(iso: string, locale: Locale = "fr"): string {
  return new Intl.DateTimeFormat(DATE_LOCALES[locale], {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatTime(iso: string, locale: Locale = "fr"): string {
  return new Intl.DateTimeFormat(DATE_LOCALES[locale], {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
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
