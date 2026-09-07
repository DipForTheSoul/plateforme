import { createClient } from "@/lib/supabase/server";
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

/** Lit un paramètre éditable en admin (table `settings`). */
export async function getSetting(key: string): Promise<string | null> {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if(error) throw new Error('Lecture indisponible.');
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
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("position");
    if(error) throw new Error('Lecture indisponible.');
    return (data as Category[]) ?? [];
  } catch {
    throw new Error("Les données sont momentanément indisponibles. Merci de réessayer.");
  }
}

export async function getApprovedEvents(
  filters: EventFilters = {}
): Promise<EventWithRelations[]> {
  const supabase = await createClient();
  try {

    // Auto-délistage : un événement reste listé jusqu'à N jours après sa date
    // (réglé par l'admin via `settings.event_delist_days`, défaut 15). Au-delà,
    // il n'apparaît plus dans le catalogue/la recherche — mais sa PAGE reste en
    // ligne (accessible par URL, pour le référencement).
    const { data: delistRow, error: delistError } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "event_delist_days")
      .maybeSingle();
    if(delistError) throw new Error('Paramètres de recherche indisponibles.');
    const delistDays = Number((delistRow as { value: string } | null)?.value);
    const floorDays = Number.isFinite(delistDays) && delistDays >= 0 ? delistDays : 15;
    const delistFloor = new Date(Date.now() - floorDays * 86_400_000).toISOString();

    // Rayon km : on résout d'abord les lieux dans le périmètre (PostGIS).
    let venueIds: string[] | null = null;
    if (
      filters.radiusKm &&
      filters.lat !== undefined &&
      filters.lng !== undefined
    ) {
      const { data: nearby, error: nearbyError } = await supabase.rpc("venues_within_radius", {
        center_lat: filters.lat,
        center_lng: filters.lng,
        radius_km: filters.radiusKm,
      });
      if(nearbyError) throw new Error('Recherche géographique indisponible.');
      venueIds = ((nearby as { venue_id: string }[]) ?? []).map(
        (v) => v.venue_id
      );
      if (venueIds.length === 0) return [];
    }

    let query = supabase
      .from("events")
      .select(EVENT_WITH_RELATIONS)
      .eq("status", "approved")
      .gte(
        "start_date",
        filters.dateFrom && filters.dateFrom > delistFloor
          ? filters.dateFrom
          : delistFloor
      )
      .order("is_top", { ascending: false })
      .order("start_date", { ascending: true })
      .order("id", { ascending: true });

    if (filters.dateTo) query = query.lte("start_date", filters.dateTo);
    if (filters.language) query = query.contains("languages", [filters.language]);
    if (filters.priceMax !== undefined) query = query.lte("price", filters.priceMax);
    if (filters.durationMax !== undefined)
      query = query.lte("duration_minutes", filters.durationMax);
    if (venueIds) query = query.in("venue_id", venueIds);
    if (filters.q) query = query.ilike("title", `%${filters.q}%`);

    const data = await readPages((from,to)=>query.range(from,to));
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
    throw new Error('Le catalogue est momentanément indisponible. Merci de réessayer.');
  }
}

export async function getTopEvents(limit = 3): Promise<EventWithRelations[]> {
  const supabase = await createClient();
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("events")
      .select(EVENT_WITH_RELATIONS)
      .eq("status", "approved")
      .eq("is_top", true)
      // §6.1 — mise en avant expirée à la lecture (featured_until dépassé).
      .or(`featured_until.is.null,featured_until.gt.${now}`)
      .gte("start_date", now)
      .order("start_date")
      .limit(limit);
    if(error) throw new Error('Lecture indisponible.');
    return ((data as unknown as EventRowRaw[]) ?? []).map(mapEventRow);
  } catch {
    throw new Error("Les données sont momentanément indisponibles. Merci de réessayer.");
  }
}

export async function getEventBySlug(
  slug: string
): Promise<EventWithRelations | null> {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("events")
      .select(EVENT_WITH_RELATIONS)
      .eq("slug", slug)
      .maybeSingle();
    if(error) throw new Error('Lecture indisponible.');
    return data ? mapEventRow(data as unknown as EventRowRaw) : null;
  } catch {
    throw new Error("La fiche est momentanément indisponible. Merci de réessayer.");
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
  const supabase = await createClient();
  try {
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
  const supabase = await createClient();
  try {
    const query = supabase
      .from("practitioners")
      .select("*")
      .eq("status", "approved")
      .order("name").order("id");
    const data = await readPages((from,to)=>query.range(from,to));
    return (data as Practitioner[]) ?? [];
  } catch {
    throw new Error("Les données sont momentanément indisponibles. Merci de réessayer.");
  }
}

export async function getPractitionerBySlug(
  slug: string
): Promise<Practitioner | null> {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("practitioners")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if(error) throw new Error('Lecture indisponible.');
    return (data as Practitioner) ?? null;
  } catch {
    throw new Error("La fiche est momentanément indisponible. Merci de réessayer.");
  }
}

export async function getVenueById(id: string): Promise<Venue | null> {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("venues")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if(error) throw new Error('Lecture indisponible.');
    return (data as Venue) ?? null;
  } catch {
    throw new Error("La fiche est momentanément indisponible. Merci de réessayer.");
  }
}

export async function getVenues(): Promise<Venue[]> {
  const supabase = await createClient();
  try {
    const query = supabase.from("venues").select("*").order("name").order("id");
    const data = await readPages((from,to)=>query.range(from,to));
    return (data as Venue[]) ?? [];
  } catch {
    throw new Error("Les données sont momentanément indisponibles. Merci de réessayer.");
  }
}

export async function getEventsByIds(
  ids: string[]
): Promise<EventWithRelations[]> {
  if (!ids.length) return [];
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("events")
      .select(EVENT_WITH_RELATIONS)
      .in("id", ids)
      .eq("status", "approved");
    if(error) throw new Error('Lecture indisponible.');
    return ((data as unknown as EventRowRaw[]) ?? []).map(mapEventRow);
  } catch {
    throw new Error("Les données sont momentanément indisponibles. Merci de réessayer.");
  }
}

export async function getPractitionersByIds(
  ids: string[]
): Promise<Practitioner[]> {
  if (!ids.length) return [];
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("practitioners")
      .select("*")
      .in("id", ids)
      .eq("status", "approved");
    if(error) throw new Error('Lecture indisponible.');
    return (data as Practitioner[]) ?? [];
  } catch {
    throw new Error("Les données sont momentanément indisponibles. Merci de réessayer.");
  }
}
