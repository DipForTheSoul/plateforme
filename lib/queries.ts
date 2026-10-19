import { createPublicClient } from "@/lib/supabase/public";
import { publicCache } from "@/lib/public-cache";
import { readPages } from "@/lib/read-pages";
import {
  EVENT_WITH_RELATIONS,
  mapEventRow,
  type Category,
  type EventRowRaw,
  type EventWithRelations,
  type Practitioner,
  type Venue,
} from "@/types/database";

/**
 * Requêtes de lecture publiques (Server Components).
 * Les lectures critiques signalent les pannes au lieu de produire de fausses
 * listes vides. Les erreurs internes de Next traversent la création du client.
 * Seuls les réglages cosmétiques conservent leur valeur de repli documentée.
 */

export interface EventFilters {
  q?: string;
  category?: string;       // slug
  language?: string;       // code (fr, de, en…)
  practitioner?: string;   // slug
  canton?: string;
  country?: string;
  priceMax?: number;
  durationMax?: number;    // minutes
  dateFrom?: string;       // ISO
  dateTo?: string;         // ISO
  /** Recherche par rayon (Phase 4) — nécessite lat/lng. */
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

const cachedSettings = publicCache(async () => {
  const { data, error } = await createPublicClient().from("settings").select("key,value");
  if (error) throw new Error("Lecture des réglages indisponible.");
  return Object.fromEntries(((data ?? []) as { key: string; value: string }[]).map((row) => [row.key, row.value]));
}, ["public-settings-v1"], ["public-settings"]);

const cachedCategories = publicCache(async () => {
  const { data, error } = await createPublicClient().from("categories").select("*").order("position");
  if (error) throw new Error("Lecture des univers indisponible.");
  return (data as Category[]) ?? [];
}, ["public-categories-v1"], ["public-categories"]);

const cachedEvents = publicCache(async () => {
  const query = createPublicClient().from("events").select(EVENT_WITH_RELATIONS)
    .eq("status", "approved")
    .order("is_top", { ascending: false })
    .order("start_date", { ascending: true })
    .order("id", { ascending: true });
  const data = await readPages((from, to) => query.range(from, to));
  return ((data as unknown as EventRowRaw[]) ?? []).map(mapEventRow);
}, ["public-approved-events-v1"], ["public-events"]);

const cachedPractitioners = publicCache(async () => {
  const query = createPublicClient().from("practitioners").select("*")
    .eq("status", "approved").order("name").order("id");
  const data = await readPages((from, to) => query.range(from, to));
  return ((data as Practitioner[]) ?? []).filter((p) => p.name.trim().toLowerCase() !== "praticien test");
}, ["public-practitioners-v1"], ["public-practitioners"]);

const cachedVenues = publicCache(async () => {
  const query = createPublicClient().from("venues").select("*").order("name").order("id");
  const data = await readPages((from, to) => query.range(from, to));
  return (data as Venue[]) ?? [];
}, ["public-venues-v1"], ["public-venues"]);

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Lit un paramètre éditable en admin (table `settings`). */
export async function getSetting(key: string): Promise<string | null> {
  try {
    return (await cachedSettings())[key] ?? null;
  } catch {
    return null;
  }
}

/** Taux 1 CHF = X EUR (§4.4), saisi par l'admin ; repli 1.05. */
export async function getExchangeRateEur(): Promise<number> {
  const raw = await getSetting("exchange_rate_eur");
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 1.05;
}

export async function getCategories(): Promise<Category[]> {
  try {
    const categories = await cachedCategories();
    // Visual review only: do not mutate production reference data for a preview.
    if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === "codex/univers-lieux-preview") {
      const proposed: Category[] = [
        { id: "preview-cercles", name: "Cercles, rituels & cérémonies", slug: "cercles-rituels-ceremonies", position: 7 },
        { id: "preview-tantra", name: "Tantra & Intimité consciente", slug: "tantra-intimite-consciente", position: 8 },
      ];
      return [...categories, ...proposed.filter(item => !categories.some(existing => existing.slug === item.slug))].sort((a, b) => a.position - b.position);
    }
    return categories;
  } catch (error) {
    console.error("[queries/getCategories]", error instanceof Error ? error.message : "read failed");
    throw new Error("Les données sont momentanément indisponibles. Merci de réessayer.");
  }
}

export async function getApprovedEvents(
  filters: EventFilters = {}
): Promise<EventWithRelations[]> {
  try {
    // Auto-délistage : un événement reste listé jusqu'à N jours après sa fin
    // (réglé par l'admin via `settings.event_delist_days`, défaut 15). Au-delà,
    // il n'apparaît plus dans le catalogue/la recherche — mais sa PAGE reste en
    // ligne (accessible par URL, pour le référencement).
    const delistDays = Number((await cachedSettings()).event_delist_days ?? 15);
    const floorDays = Number.isFinite(delistDays) && delistDays >= 0 ? delistDays : 15;
    const delistFloor = new Date(Date.now() - floorDays * 86_400_000).toISOString();

    let events = (await cachedEvents()).filter((event) =>
      (event.end_date ?? event.start_date) >= delistFloor || event.start_date >= delistFloor
    );

    if (filters.dateFrom) events = events.filter((event) => event.start_date >= filters.dateFrom!);
    if (filters.dateTo) events = events.filter((event) => event.start_date <= filters.dateTo!);
    if (filters.language) events = events.filter((event) => event.languages.includes(filters.language!));
    if (filters.priceMax !== undefined) events = events.filter((event) => event.price !== null && event.price <= filters.priceMax!);
    if (filters.durationMax !== undefined) events = events.filter((event) => event.duration_minutes !== null && event.duration_minutes <= filters.durationMax!);
    if (filters.radiusKm && filters.lat !== undefined && filters.lng !== undefined) {
      events = events.filter((event) => event.venue?.lat != null && event.venue.lng != null
        && distanceKm(filters.lat!, filters.lng!, event.venue.lat, event.venue.lng) <= filters.radiusKm!);
    }

    // Filtres sur les relations (appliqués après jointure).
    // La recherche libre couvre l'expérience et son praticien. Elle est faite
    // après la jointure afin d'éviter une requête PostgREST ambiguë entre les
    // deux tables et de conserver la pagination exhaustive du catalogue.
    if (filters.q) {
      const needle = filters.q.trim().toLocaleLowerCase();
      if (needle) {
        events = events.filter((event) =>
          event.title.toLocaleLowerCase().includes(needle)
          || event.practitioner?.name.toLocaleLowerCase().includes(needle)
        );
      }
    }
    if (filters.category)
      events = events.filter((e) =>
        e.categories.some((c) => c.slug === filters.category)
      );
    if (filters.practitioner)
      events = events.filter((e) => e.practitioner?.slug === filters.practitioner);
    if (filters.canton)
      events = events.filter((e) => e.venue?.canton === filters.canton);
    if (filters.country)
      events = events.filter((e) => e.venue?.country === filters.country);

    return events;
  } catch (error) {
    console.error("[queries/getApprovedEvents]", error instanceof Error ? error.message : "read failed");
    throw new Error('Le catalogue est momentanément indisponible. Merci de réessayer.');
  }
}

export async function getTopEvents(limit = 3): Promise<EventWithRelations[]> {
  try {
    const now = new Date().toISOString();
    return (await cachedEvents()).filter((event) => event.is_top
      && (!event.featured_until || event.featured_until > now)
      && event.start_date >= now).slice(0, limit);
  } catch (error) {
    console.error("[queries/getTopEvents]", error instanceof Error ? error.message : "read failed");
    throw new Error("Les données sont momentanément indisponibles. Merci de réessayer.");
  }
}

export async function getEventBySlug(
  slug: string
): Promise<EventWithRelations | null> {
  try {
    return (await cachedEvents()).find((event) => event.slug === slug) ?? null;
  } catch {
    throw new Error("La fiche est momentanément indisponible. Merci de réessayer.");
  }
}

/**
 * Expériences précédente / suivante (§8) — navigation sur la fiche détail.
 * Ordre chronologique stable (start_date, id) parmi les événements approuvés.
 */
export async function getAdjacentEvents(
  currentStartDate: string,
  currentId: string
): Promise<{ prev: { slug: string; title: string } | null; next: { slug: string; title: string } | null }> {
  try {
    const events = [...await cachedEvents()].sort((a, b) => a.start_date.localeCompare(b.start_date) || a.id.localeCompare(b.id));
    const index = events.findIndex((event) => event.start_date === currentStartDate && event.id === currentId);
    const prev = index > 0 ? events[index - 1] : null;
    const next = index >= 0 && index < events.length - 1 ? events[index + 1] : null;
    return {
      prev: prev ? { slug: prev.slug, title: prev.title } : null,
      next: next ? { slug: next.slug, title: next.title } : null,
    };
  } catch {
    throw new Error('La navigation entre les expériences est momentanément indisponible. Réessayez.');
  }
}

export async function getApprovedPractitioners(): Promise<Practitioner[]> {
  try {
    return await cachedPractitioners();
  } catch {
    throw new Error("Les données sont momentanément indisponibles. Merci de réessayer.");
  }
}

export async function getPractitionerBySlug(
  slug: string
): Promise<Practitioner | null> {
  try {
    return (await cachedPractitioners()).find((practitioner) => practitioner.slug === slug) ?? null;
  } catch {
    throw new Error("La fiche est momentanément indisponible. Merci de réessayer.");
  }
}

export async function getVenueById(id: string): Promise<Venue | null> {
  try {
    return (await cachedVenues()).find((venue) => venue.id === id) ?? null;
  } catch {
    throw new Error("La fiche est momentanément indisponible. Merci de réessayer.");
  }
}

export async function getVenues(): Promise<Venue[]> {
  try {
    return await cachedVenues();
  } catch {
    throw new Error("Les données sont momentanément indisponibles. Merci de réessayer.");
  }
}

export async function getEventsByIds(
  ids: string[]
): Promise<EventWithRelations[]> {
  if (!ids.length) return [];
  try {
    const requested = new Set(ids);
    return (await cachedEvents()).filter((event) => requested.has(event.id));
  } catch {
    throw new Error("Les données sont momentanément indisponibles. Merci de réessayer.");
  }
}

export async function getPractitionersByIds(
  ids: string[]
): Promise<Practitioner[]> {
  if (!ids.length) return [];
  try {
    const requested = new Set(ids);
    return (await cachedPractitioners()).filter((practitioner) => requested.has(practitioner.id));
  } catch {
    throw new Error("Les données sont momentanément indisponibles. Merci de réessayer.");
  }
}
