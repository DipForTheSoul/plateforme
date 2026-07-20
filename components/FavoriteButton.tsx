"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Heart } from "lucide-react";
import { isFavorite, toggleFavorite } from "@/lib/favorites";

/** Cœur favoris (lié à l'appareil — aucun compte requis). */
export function FavoriteButton({
  kind,
  id,
}: {
  kind: "event" | "practitioner";
  id: string;
}) {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener("fts:favorites-changed", onChange);
    return () => window.removeEventListener("fts:favorites-changed", onChange);
  }, []);
  const active = useSyncExternalStore(
    subscribe,
    () => isFavorite(kind, id),
    () => false // rendu serveur : jamais actif
  );

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        toggleFavorite(kind, id); // déclenche fts:favorites-changed → re-rendu
      }}
      aria-pressed={active}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      className="rounded-full bg-white/90 p-2 shadow-sm transition hover:scale-110"
    >
      <Heart
        className={`h-4 w-4 ${
          active ? "fill-soul-terracotta text-soul-terracotta" : "text-soul-brown"
        }`}
      />
    </button>
  );
}
