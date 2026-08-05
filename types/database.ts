/**
 * Types des tables Supabase (miroir de supabase/migrations/0002_schema.sql).
 * Rodrigue : une fois le vrai projet Supabase branché, tu peux les régénérer
 * avec `supabase gen types typescript` si tu préfères les types générés.
 */

export type Role = "participant" | "practitioner" | "admin";
export type ModerationStatus = "pending" | "approved" | "rejected";
export type Recurrence = "weekly" | "biweekly" | "monthly";
export type Locale = "fr" | "de" | "en";

export interface Profile {
  id: string;
  email: string;
  role: Role;
  preferred_lang: Locale;
  created_at: string;
}

export interface Practitioner {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  bio: string | null;
  photos: string[];
  contact: { email?: string; phone?: string; website?: string };
  specialties: string[];
  languages: string[];
  links: Record<string, string>;
  /** §4.2 — lien vers des avis externes (Google, Trustpilot…). */
  review_url: string | null;
  /** §4.3 — logo du praticien (URL image, même pipeline que les photos). */
  logo_url: string | null;
  credits: number;
  status: ModerationStatus;
  created_at: string;
  updated_at: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  canton: string | null;
  /** §5.1 — pays (obligatoire) et ville (optionnelle). */
  country: string;
  city: string | null;
  description: string | null;
  capacity: number | null;
  rooms: number | null;
  contact: { email?: string; phone?: string; website?: string };
  photos: string[];
  created_by: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  position: number;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  practitioner_id: string;
  venue_id: string | null;
  start_date: string;
  end_date: string | null;
  recurrence: Recurrence | null;
  recurrence_count: number | null;
  parent_event_id: string | null;
  duration_minutes: number | null;
  price: number | null;
  currency: string;
  languages: string[];
  status: ModerationStatus;
  admin_message: string | null;
  is_top: boolean;
  /** §4.1 — lien vidéo YouTube/Vimeo (lecteur intégré sur la fiche). */
  video_url: string | null;
  /** §6.1 — fin de mise en avant ; expiration appliquée à la lecture. */
  featured_until: string | null;
  /** Ce qui est inclus (prix, matériel, repas…). */
  included: string | null;
  /** Ce que le/la participant·e doit apporter. */
  to_bring: string | null;
  images: string[];
  view_count: number;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

export interface CreditPack {
  id: string;
  practitioner_id: string;
  credits_total: number;
  credits_remaining: number;
  expires_at: string | null;
  source: "purchase" | "manual";
  stripe_session_id: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  event_id: string;
  author_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

/** Événement avec ses relations chargées (select avec jointures). */
export interface EventWithRelations extends Event {
  /** Catégorie principale (dégradé/visuel, 1er badge). Vient de `category_id`. */
  category: Category | null;
  /** Tous les univers rattachés (multi-univers §2.1) — source de vérité filtres/badges. */
  categories: Category[];
  practitioner: Pick<Practitioner, "id" | "name" | "slug"> | null;
  venue: Venue | null;
}

/** Forme brute renvoyée par Supabase (table de liaison imbriquée). */
export interface EventRowRaw extends Event {
  category: Category | null;
  event_categories: { category: Category | null }[] | null;
  practitioner: Pick<Practitioner, "id" | "name" | "slug"> | null;
  venue: Venue | null;
}

/** Aplati la table de liaison en un tableau `categories` propre et dédupliqué. */
export function mapEventRow(row: EventRowRaw): EventWithRelations {
  const linked = (row.event_categories ?? [])
    .map((ec) => ec.category)
    .filter((c): c is Category => Boolean(c));
  // Catégorie principale d'abord si présente, puis les autres, sans doublon.
  const seen = new Set<string>();
  const categories: Category[] = [];
  for (const c of [row.category, ...linked].filter(
    (c): c is Category => Boolean(c)
  )) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      categories.push(c);
    }
  }
  const { event_categories: _ec, ...rest } = row;
  void _ec;
  return { ...rest, categories };
}

export interface Favorite {
  id: string;
  visitor_id: string;
  event_id: string | null;
  practitioner_id: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  interests: string[];
  consent: boolean;
  opt_in_at: string | null;
  source: string | null;
  exported_at: string | null;
  created_at: string;
}

export interface CreditTransaction {
  id: string;
  practitioner_id: string;
  amount: number;
  type: "purchase" | "manual" | "consumption";
  stripe_session_id: string | null;
  note: string | null;
  created_at: string;
}

/** Select standard d'un événement avec relations (réutilisé partout). */
export const EVENT_WITH_RELATIONS = `*,
  category:categories!events_category_id_fkey(*),
  event_categories(category:categories(*)),
  practitioner:practitioners(id, name, slug),
  venue:venues(*)`;
