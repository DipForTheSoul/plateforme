import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AddToCalendar } from "@/components/AddToCalendar";
import { FavoriteButton } from "@/components/FavoriteButton";
import { JsonLd } from "@/components/JsonLd";
import { createClient } from "@/lib/supabase/server";
import { categoryVisual } from "@/lib/gradients";
import { getEventBySlug } from "@/lib/queries";
import { eventJsonLd } from "@/lib/seo";
import {
  formatDateRange,
  formatDuration,
  formatPrice,
  formatTime,
  LANGUAGE_LABELS,
} from "@/lib/utils";
import type { Event, Locale } from "@/types/database";
import { Calendar, Clock, Globe, MapPin, User } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event || event.status !== "approved") return { title: "ForTheSoul" };
  return {
    title: event.title,
    description: event.description?.slice(0, 160),
    openGraph: {
      title: event.title,
      description: event.description?.slice(0, 160),
      images: event.images[0] ? [event.images[0]] : undefined,
      type: "article",
    },
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("event");
  const tCommon = await getTranslations("common");
  const currentLocale = (await getLocale()) as Locale;

  const event = await getEventBySlug(slug);
  if (!event || event.status !== "approved") notFound();

  const supabase = await createClient();
  // Compteur de vues (analytics sans cookies) — best-effort.
  await supabase.rpc("increment_event_view", { p_event_id: event.id });

  // Autres dates (occurrences liées, passées exclues).
  const parentId = event.parent_event_id ?? event.id;
  const { data: siblingsData } = await supabase
    .from("events")
    .select("id, slug, start_date")
    .or(`parent_event_id.eq.${parentId},id.eq.${parentId}`)
    .neq("id", event.id)
    .eq("status", "approved")
    .gte("start_date", new Date().toISOString())
    .order("start_date")
    .limit(8);
  const siblings = (siblingsData as Pick<Event, "id" | "slug" | "start_date">[]) ?? [];

  // E-mail du praticien pour le bouton « Réserver » (contact direct — pas de
  // système de paiement : la réservation se fait auprès du/de la praticien·ne).
  let practitionerEmail: string | undefined;
  if (event.practitioner) {
    const { data: pr } = await supabase
      .from("practitioners")
      .select("contact")
      .eq("id", event.practitioner.id)
      .maybeSingle();
    practitionerEmail = (pr?.contact as { email?: string } | null)?.email ?? undefined;
  }
  const mailtoHref = practitionerEmail
    ? `mailto:${practitionerEmail}?subject=${encodeURIComponent(`Réservation — ${event.title}`)}&body=${encodeURIComponent(`Bonjour,\n\nJe souhaite réserver ou avoir des informations sur « ${event.title} ».\n\nMerci !`)}`
    : null;
  const venueLocation = event.venue
    ? `${event.venue.name}, ${event.venue.address}`
    : null;

  const visual = categoryVisual(event.category?.slug);

  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={eventJsonLd(event)} />

      <div className="relative h-64 w-full overflow-hidden rounded-3xl sm:h-80">
        {event.images[0] ? (
          <Image src={event.images[0]} alt={event.title} fill priority
            sizes="(max-width: 896px) 100vw, 896px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-7xl"
            style={{ background: visual.gradient }} aria-hidden="true">
            <span className="opacity-80">{visual.emoji}</span>
          </div>
        )}
        <div className="absolute right-4 top-4">
          <FavoriteButton kind="event" id={event.id} />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          {event.category && <span className="badge">{event.category.name}</span>}
          <h1 className="mt-2 text-3xl text-soul-brown sm:text-4xl">{event.title}</h1>
          {event.practitioner && (
            <p className="mt-2 text-soul-bronze">
              {t("practitioner")}{" "}
              <Link href={`/praticiens/${event.practitioner.slug}`}
                className="font-medium text-soul-brown underline">
                {event.practitioner.name}
              </Link>{" "}
              · <span className="text-xs">✓ {tCommon("validatedByDidier")}</span>
            </p>
          )}
        </div>
        <p className="font-serif text-2xl text-soul-brown">
          {formatPrice(event.price, event.currency, tCommon("free"))}
        </p>
      </div>

      {/* Actions : réserver + ajouter à l'agenda */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {mailtoHref ? (
          <a href={mailtoHref} className="btn-accent">{t("reserve")}</a>
        ) : event.practitioner ? (
          <Link href={`/praticiens/${event.practitioner.slug}`} className="btn-accent">
            {t("reserve")}
          </Link>
        ) : null}
        <AddToCalendar
          slug={event.slug}
          title={event.title}
          start={event.start_date}
          end={event.end_date}
          details={event.description}
          location={venueLocation}
        />
      </div>

      <div className="mt-6 grid gap-4 rounded-2xl bg-white p-6 sm:grid-cols-2">
        <p className="flex items-center gap-3 text-sm text-soul-ink">
          <Calendar className="h-4 w-4 shrink-0 text-soul-bronze" />
          {formatDateRange(event.start_date, event.end_date, currentLocale)}
        </p>
        <p className="flex items-center gap-3 text-sm text-soul-ink">
          <Clock className="h-4 w-4 shrink-0 text-soul-bronze" />
          {formatTime(event.start_date, currentLocale)}
          {formatDuration(event.duration_minutes) && (
            <> · {formatDuration(event.duration_minutes)}</>
          )}
        </p>
        {event.venue && (
          <p className="flex items-center gap-3 text-sm text-soul-ink">
            <MapPin className="h-4 w-4 shrink-0 text-soul-bronze" />
            <Link href={`/lieux/${event.venue.id}`} className="underline">
              {event.venue.name}
            </Link>
            <span className="text-soul-bronze">
              — {event.venue.canton ?? event.venue.country}
            </span>
          </p>
        )}
        <p className="flex items-center gap-3 text-sm text-soul-ink">
          <Globe className="h-4 w-4 shrink-0 text-soul-bronze" />
          {event.languages.map((l) => LANGUAGE_LABELS[l] ?? l).join(", ")}
        </p>
      </div>

      {event.description && (
        <div className="prose mt-8 max-w-none whitespace-pre-line text-soul-ink/90">
          {event.description}
        </div>
      )}

      {siblings.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-2 text-xl text-soul-brown">{t("otherDates")}</h2>
          <p className="mb-4 text-sm text-soul-bronze">{t("recurrenceNote")}</p>
          <div className="flex flex-wrap gap-2">
            {siblings.map((s) => (
              <Link key={s.id} href={`/experiences/${s.slug}`} className="btn-secondary !py-2">
                {formatDateRange(s.start_date, null, currentLocale)}
              </Link>
            ))}
          </div>
        </div>
      )}

      {event.venue?.description && (
        <div className="mt-10 rounded-2xl bg-soul-sand/40 p-6">
          <h2 className="mb-2 flex items-center gap-2 text-xl text-soul-brown">
            <User className="h-5 w-5 text-soul-bronze" /> {t("aboutVenue")} — {event.venue.name}
          </h2>
          <p className="text-sm text-soul-ink/80">{event.venue.description}</p>
          <p className="mt-2 text-xs text-soul-bronze">{event.venue.address}</p>
        </div>
      )}
    </article>
  );
}
