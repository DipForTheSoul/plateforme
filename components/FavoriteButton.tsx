"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Heart } from "lucide-react";
import { isFavorite, toggleFavorite, favoritesAreTemporary } from "@/lib/favorites";
import {useLocale} from 'next-intl';

/** Cœur favoris (lié à l'appareil — aucun compte requis). */
export function FavoriteButton({
  kind,
  id,
}: {
  kind: "event" | "practitioner";
  id: string;
}) {
  const locale=useLocale();
  const labels=locale==='de'?{add:'Zu Favoriten hinzufügen',remove:'Aus Favoriten entfernen',temporary:'Speicherung blockiert: Favoriten bleiben nur bis zum Neuladen erhalten.'}:locale==='en'?{add:'Add to favourites',remove:'Remove from favourites',temporary:'Storage blocked: favourites last only until the page is reloaded.'}:{add:'Ajouter aux favoris',remove:'Retirer des favoris',temporary:'Stockage bloqué : favoris conservés uniquement jusqu’au rechargement.'};
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener("fts:favorites-changed", onChange);
    window.addEventListener('storage',onChange);
    return () => {window.removeEventListener("fts:favorites-changed", onChange);window.removeEventListener('storage',onChange);};
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
      aria-label={active ? labels.remove : labels.add}
      title={favoritesAreTemporary() ? labels.temporary : undefined}
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
