import { createClient } from "@/lib/supabase/server";
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
 * Toutes tolèrent une Supabase non configurée (placeholders .env) : elles
 * renvoient alors des listes vides — le site affiche des états vides propres
 * au lieu de crasher, et Rodrigue voit immédiatement où brancher les clés.
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

/** Lit un paramètre éditable en admin (table `settings`). */
export async function getSetting(key: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    return (data as { value: string } | null)?.value ?? null;
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
    const supabase = await createClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("position");
    return (data as Category[]) ?? [];
  } catch {
    return [];
  }
}

export async function getApprovedEvents(
  filters: EventFilters = {}
): Promise<EventWithRelations[]> {
  try {
    const supabase = await createClient();

    // Rayon km : on résout d'abord les lieux dans le périmètre (PostGIS).
    let venueIds: string[] | null = null;
    if (
      filters.radiusKm &&
      filters.lat !== undefined &&
      filters.lng !== undefined
    ) {
      const { data: nearby } = await supabase.rpc("venues_within_radius", {
        center_lat: filters.lat,
        center_lng: filters.lng,
        radius_km: filters.radiusKm,
      });
      venueIds = ((nearby as { venue_id: string }[]) ?? []).map(
        (v) => v.venue_id
      );
      if (venueIds.length === 0) return [];
    }

    let query = supabase
      .from("events")
      .select(EVENT_WITH_RELATIONS)
      .eq("status", "approved")
      .gte("start_date", filters.dateFrom ?? new Date().toISOString())
      .order("is_top", { ascending: false })
      .order("start_date", { ascending: true })
      .limit(100);

    if (filters.dateTo) query = query.lte("start_date", filters.dateTo);
    if (filters.language) query = query.contains("languages", [filters.language]);
    if (filters.priceMax !== undefined) query = query.lte("price", filters.priceMax);
    if (filters.durationMax !== undefined)
      query = query.lte("duration_minutes", filters.durationMax);
    if (venueIds) query = query.in("venue_id", venueIds);
    if (filters.q) query = query.ilike("title", `%${filters.q}%`);

    const { data } = await query;
    let events = ((data as unknown as EventRowRaw[]) ?? []).map(mapEventRow);

    // Filtres sur les relations (appliqués après jointure).
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
  } catch {
    return [];
  }
}

export async function getTopEvents(limit = 3): Promise<EventWithRelations[]> {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("events")
      .select(EVENT_WITH_RELATIONS)
      .eq("status", "approved")
      .eq("is_top", true)
      // §6.1 — mise en avant expirée à la lecture (featured_until dépassé).
      .or(`featured_until.is.null,featured_until.gt.${now}`)
      .gte("start_date", now)
      .order("start_date")
      .limit(limit);
    return ((data as unknown as EventRowRaw[]) ?? []).map(mapEventRow);
  } catch {
    return [];
  }
}

export async function getEventBySlug(
  slug: string
): Promise<EventWithRelations | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("events")
      .select(EVENT_WITH_RELATIONS)
      .eq("slug", slug)
      .maybeSingle();
    return data ? mapEventRow(data as unknown as EventRowRaw) : null;
  } catch {
    return null;
  }
}

/**
 * Expériences précédente / suivante (§8) — navigation sur la fiche détail.
 * Ordre chronologique (start_date) parmi les événements approuvés à venir.
 */
export async function getAdjacentEvents(
  currentStartDate: string,
  currentId: string
): Promise<{ prev: { slug: string; title: string } | null; next: { slug: string; title: string } | null }> {
  try {
    const supabase = await createClient();
    const [{ data: prev }, { data: next }] = await Promise.all([
      supabase
        .from("events")
        .select("slug, title")
        .eq("status", "approved")
        .lt("start_date", currentStartDate)
        .neq("id", currentId)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("events")
        .select("slug, title")
        .eq("status", "approved")
        .gt("start_date", currentStartDate)
        .neq("id", currentId)
        .order("start_date", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);
    return {
      prev: (prev as { slug: string; title: string } | null) ?? null,
      next: (next as { slug: string; title: string } | null) ?? null,
    };
  } catch {
    return { prev: null, next: null };
  }
}

export async function getApprovedPractitioners(): Promise<Practitioner[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("practitioners")
      .select("*")
      .eq("status", "approved")
      .order("name");
    return (data as Practitioner[]) ?? [];
  } catch {
    return [];
  }
}

export async function getPractitionerBySlug(
  slug: string
): Promise<Practitioner | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("practitioners")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    return (data as Practitioner) ?? null;
  } catch {
    return null;
  }
}

export async function getVenueById(id: string): Promise<Venue | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("venues")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return (data as Venue) ?? null;
  } catch {
    return null;
  }
}

export async function getVenues(): Promise<Venue[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("venues").select("*").order("name");
    return (data as Venue[]) ?? [];
  } catch {
    return [];
  }
}

export async function getEventsByIds(
  ids: string[]
): Promise<EventWithRelations[]> {
  if (!ids.length) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("events")
      .select(EVENT_WITH_RELATIONS)
      .in("id", ids)
      .eq("status", "approved");
    return ((data as unknown as EventRowRaw[]) ?? []).map(mapEventRow);
  } catch {
    return [];
  }
}

export async function getPractitionersByIds(
  ids: string[]
): Promise<Practitioner[]> {
  if (!ids.length) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("practitioners")
      .select("*")
      .in("id", ids)
      .eq("status", "approved");
    return (data as Practitioner[]) ?? [];
  } catch {
    return [];
  }
}
