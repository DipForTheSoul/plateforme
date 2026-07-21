import type { Event } from "@/types/database";

/**
 * Une expérience est « mise en avant » si l'admin l'a épinglée (is_top, manuel
 * et permanent) OU si une mise en avant payée est encore active (top_until).
 */
export function isFeatured(
  e: Pick<Event, "is_top" | "top_until">
): boolean {
  if (e.is_top) return true;
  return e.top_until != null && new Date(e.top_until) > new Date();
}

/** Demande de mise en avant en attente de validation par l'admin. */
export function hasPendingFeature(
  e: Pick<Event, "top_requested_at">
): boolean {
  return e.top_requested_at != null;
}
