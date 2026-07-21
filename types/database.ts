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
  country: string;
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
  images: string[];
  view_count: number;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
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
  category: Category | null;
  practitioner: Pick<Practitioner, "id" | "name" | "slug"> | null;
  venue: Venue | null;
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
  category:categories(*),
  practitioner:practitioners(id, name, slug),
  venue:venues(*)`;
