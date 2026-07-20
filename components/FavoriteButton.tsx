"use client";

import { useEffect, useState } from "react";
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
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isFavorite(kind, id));
    const sync = () => setActive(isFavorite(kind, id));
    window.addEventListener("fts:favorites-changed", sync);
    return () => window.removeEventListener("fts:favorites-changed", sync);
  }, [kind, id]);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        setActive(toggleFavorite(kind, id));
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
