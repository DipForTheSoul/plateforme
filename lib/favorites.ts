"use client";

/**
 * Favoris liés à l'appareil (Phase 5) — sans compte participant obligatoire.
 * Source de vérité : localStorage. Un miroir best-effort est envoyé à la table
 * `favorites` (insert-only, aucune lecture anonyme — voir 0003_rls.sql) pour
 * les statistiques et pour préparer la future migration vers des comptes.
 */

import { createClient } from "@/lib/supabase/client";

const DEVICE_KEY = "fts.device";
const EVENTS_KEY = "fts.fav.events";
const PRACTITIONERS_KEY = "fts.fav.practitioners";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

function readSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(window.localStorage.getItem(key) ?? "[]"));
  } catch {
    return new Set();
  }
}

function writeSet(key: string, set: Set<string>) {
  window.localStorage.setItem(key, JSON.stringify([...set]));
  // Notifie les composants montés (badge du header, page favoris…).
  window.dispatchEvent(new Event("fts:favorites-changed"));
}

export function getFavoriteEventIds(): string[] {
  return [...readSet(EVENTS_KEY)];
}

export function getFavoritePractitionerIds(): string[] {
  return [...readSet(PRACTITIONERS_KEY)];
}

export function isFavorite(kind: "event" | "practitioner", id: string): boolean {
  return readSet(kind === "event" ? EVENTS_KEY : PRACTITIONERS_KEY).has(id);
}

export function toggleFavorite(
  kind: "event" | "practitioner",
  id: string
): boolean {
  const key = kind === "event" ? EVENTS_KEY : PRACTITIONERS_KEY;
  const set = readSet(key);
  const nowFavorite = !set.has(id);
  if (nowFavorite) set.add(id);
  else set.delete(id);
  writeSet(key, set);
  mirrorToDatabase(kind, id, nowFavorite);
  return nowFavorite;
}

/** Miroir analytique best-effort — ne bloque jamais l'UX. */
function mirrorToDatabase(
  kind: "event" | "practitioner",
  id: string,
  added: boolean
) {
  try {
    const supabase = createClient();
    const visitorId = getDeviceId();
    const column = kind === "event" ? "event_id" : "practitioner_id";
    if (added) {
      void supabase
        .from("favorites")
        .insert({ visitor_id: visitorId, [column]: id })
        .then(() => undefined);
    } else {
      void supabase
        .from("favorites")
        .delete()
        .eq("visitor_id", visitorId)
        .eq(column, id)
        .then(() => undefined);
    }
  } catch {
    // Supabase non configuré : les favoris restent purement locaux.
  }
}
