import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FavoriteButton } from "@/components/FavoriteButton";
import { categoryVisual } from "@/lib/gradients";
import { formatDate, formatPrice, formatTime } from "@/lib/utils";
import type { EventWithRelations, Locale } from "@/types/database";
import { MapPin } from "lucide-react";

/** Carte d'expérience — vignette dégradée par catégorie si aucune photo. */
export async function EventCard({ event }: { event: EventWithRelations }) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("common");
  const tEvents = await getTranslations("events");
  const visual = categoryVisual(event.category?.slug);

  return (
    <article className="card group relative flex flex-col">
      <Link href={`/experiences/${event.slug}`} className="absolute inset-0 z-10">
        <span className="sr-only">{event.title}</span>
      </Link>

      <div className="relative h-44 w-full overflow-hidden">
        {event.images[0] ? (
          <Image
            src={event.images[0]}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-5xl"
            style={{ background: visual.gradient }}
            aria-hidden="true"
          >
            <span className="opacity-80">{visual.emoji}</span>
          </div>
        )}
        {event.is_top && (
          <span className="absolute left-3 top-3 rounded-full bg-soul-terracotta px-3 py-1 text-xs font-semibold text-white">
            ★ {tEvents("top")}
          </span>
        )}
        <div className="absolute right-3 top-3 z-20">
          <FavoriteButton kind="event" id={event.id} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-soul-bronze">
          {formatDate(event.start_date, locale)} · {formatTime(event.start_date, locale)}
        </p>
        <h3 className="font-serif text-lg leading-snug text-soul-brown">
          {event.title}
        </h3>
        <p className="text-sm text-soul-bronze">
          {event.practitioner?.name}
          {event.category && <> · {event.category.name}</>}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2 text-sm">
          <span className="flex items-center gap-1 text-soul-bronze">
            {event.venue && (
              <>
                <MapPin className="h-3.5 w-3.5" />
                {event.venue.canton ?? event.venue.country}
              </>
            )}
          </span>
          <span className="font-semibold text-soul-brown">
            {formatPrice(event.price, event.currency, t("free"))}
          </span>
        </div>
      </div>
    </article>
  );
}
