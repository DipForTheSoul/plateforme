import { Star } from "lucide-react";

/** Note en étoiles + moyenne + nombre d'avis. Ne rend rien sans avis. */
export function StarRating({
  avg,
  count,
  size = "sm",
  showMeta = true,
}: {
  avg: number;
  count: number;
  size?: "sm" | "lg";
  /** false = étoiles seules (utile pour un avis individuel). */
  showMeta?: boolean;
}) {
  if (!count || count <= 0) return null;
  const rounded = Math.round(avg);
  const star = size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";
  const text = size === "lg" ? "text-sm" : "text-xs";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`${star} ${
              i <= rounded
                ? "fill-soul-amber text-soul-amber"
                : "fill-soul-bronze/15 text-soul-bronze/25"
            }`}
          />
        ))}
      </div>
      {showMeta && (
        <>
          <span className={`${text} font-semibold text-soul-brown`}>
            {avg.toFixed(2)}
          </span>
          <span className={`${text} text-soul-bronze`}>({count} avis)</span>
        </>
      )}
    </div>
  );
}
