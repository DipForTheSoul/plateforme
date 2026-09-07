"use client";

/**
 * Favoris liés à l'appareil (Phase 5) — sans compte participant obligatoire.
 * Source de vérité : localStorage (ou mémoire si le stockage est bloqué).
 * Aucun transfert analytique : les favoris restent privés sur cet appareil.
 */

const EVENTS_KEY = "fts.fav.events";
const PRACTITIONERS_KEY = "fts.fav.practitioners";
const memory = new Map<string, Set<string>>();
let temporary = false;
export function favoritesAreTemporary() { return temporary; }

function readSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    if (temporary && memory.has(key)) return new Set(memory.get(key));
    const value = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set(memory.get(key));
  }
}

function writeSet(key: string, set: Set<string>) {
  memory.set(key,new Set(set));
  try { window.localStorage.setItem(key, JSON.stringify([...set])); temporary=false; }
  catch { temporary=true; }
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
  return nowFavorite;
}
