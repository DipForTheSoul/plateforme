/**
 * Vignettes en dégradé élégantes par catégorie (CLAUDE.md §2.2) : utilisées
 * tant qu'aucune vraie photo n'est fournie — jamais d'image cassée.
 * Palette dérivée de forthesoul.ch (bruns, bronze, terracotta, crème).
 */

export interface CategoryVisual {
  gradient: string;
  emoji: string;
}

const VISUALS: Record<string, CategoryVisual> = {
  "danse-mouvement": {
    gradient: "linear-gradient(135deg, #ff8044 0%, #f9ad4d 55%, #fdead2 100%)",
    emoji: "💃",
  },
  meditation: {
    gradient: "linear-gradient(135deg, #5e4d9e 0%, #9e7c52 70%, #fef3e5 100%)",
    emoji: "🧘",
  },
  "yoga-somatique": {
    gradient: "linear-gradient(135deg, #9e7c52 0%, #c9a97a 55%, #fffeed 100%)",
    emoji: "🌿",
  },
  "voyages-spirituels": {
    gradient: "linear-gradient(135deg, #171200 0%, #443420 45%, #9e7c52 100%)",
    emoji: "🌍",
  },
  "son-vibration": {
    gradient: "linear-gradient(135deg, #443420 0%, #fe9361 60%, #fabd71 100%)",
    emoji: "🔔",
  },
};

const FALLBACK: CategoryVisual = {
  gradient: "linear-gradient(135deg, #443420 0%, #9e7c52 60%, #fef6ed 100%)",
  emoji: "✨",
};

export function categoryVisual(slug: string | null | undefined): CategoryVisual {
  return (slug && VISUALS[slug]) || FALLBACK;
}
