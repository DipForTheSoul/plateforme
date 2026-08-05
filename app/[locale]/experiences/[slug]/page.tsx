import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AddToCalendar } from "@/components/AddToCalendar";
import { FavoriteButton } from "@/components/FavoriteButton";
import { StarRating } from "@/components/StarRating";
import { JsonLd } from "@/components/JsonLd";
import { createClient } from "@/lib/supabase/server";
import { categoryVisual } from "@/lib/gradients";
import { getEventBySlug, getAdjacentEvents } from "@/lib/queries";
import { eventJsonLd } from "@/lib/seo";
import {
  formatDateRange,
  formatDuration,
  formatTime,
  videoEmbedUrl,
  LANGUAGE_LABELS,
} from "@/lib/utils";
import { Price } from "@/components/Price";
import type { Event, Locale, Review } from "@/types/database";
import { ArrowLeft, ArrowRight, Backpack, Calendar, Clock, Globe, Info, MapPin, PackageCheck, User } from "lucide-react";

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
  const venueLocation = event.venue
    ? `${event.venue.name}, ${event.venue.address}`
    : null;
  // §8 — message de réservation pré-rempli (titre + date + lieu).
  const reservationDate = `${formatDateRange(event.start_date, event.end_date, currentLocale)}${
    event.end_date ? "" : ` à ${formatTime(event.start_date, currentLocale)}`
  }`;
  const mailtoBody =
    `Bonjour,\n\n` +
    `Je souhaite réserver ou avoir des informations sur « ${event.title} ».\n\n` +
    `• Date : ${reservationDate}\n` +
    (venueLocation ? `• Lieu : ${venueLocation}\n` : "") +
    `\nMerci !`;
  const mailtoHref = practitionerEmail
    ? `mailto:${practitionerEmail}?subject=${encodeURIComponent(
        `Réservation — ${event.title}`
      )}&body=${encodeURIComponent(mailtoBody)}`
    : null;

  // Avis de l'expérience.
  const { data: reviewsData } = await supabase
    .from("reviews")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false })
    .limit(20);
  const reviews = (reviewsData as Review[]) ?? [];

  const visual = categoryVisual(event.category?.slug);
  const videoEmbed = videoEmbedUrl(event.video_url);
  const { prev, next } = await getAdjacentEvents(event.start_date, event.id);

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

      {videoEmbed && (
        <div className="mt-6 overflow-hidden rounded-3xl bg-black shadow-sm">
          <div className="relative aspect-video">
            <iframe
              src={videoEmbed}
              title={event.title}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          {event.categories.length > 0 && (
            <span className="flex flex-wrap gap-1.5">
              {event.categories.map((c) => (
                <span key={c.id} className="badge">{c.name}</span>
              ))}
            </span>
          )}
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
          {event.rating_count > 0 && (
            <div className="mt-2">
              <StarRating avg={event.rating_avg} count={event.rating_count} size="lg" />
            </div>
          )}
        </div>
        <p className="font-serif text-2xl text-soul-brown">
          <Price value={event.price} baseCurrency={event.currency} freeLabel={tCommon("free")} />
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

      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-soul-bronze">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {t("reserveNote")}
      </p>

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

      {(event.included || event.to_bring) && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {event.included && (
            <div className="rounded-2xl border border-soul-bronze/15 bg-white p-6">
              <h2 className="mb-3 flex items-center gap-2 text-lg text-soul-brown">
                <PackageCheck className="h-5 w-5 text-soul-terracotta" /> {t("included")}
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-soul-ink/85">
                {event.included}
              </p>
            </div>
          )}
          {event.to_bring && (
            <div className="rounded-2xl border border-soul-bronze/15 bg-white p-6">
              <h2 className="mb-3 flex items-center gap-2 text-lg text-soul-brown">
                <Backpack className="h-5 w-5 text-soul-terracotta" /> {t("toBring")}
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-soul-ink/85">
                {event.to_bring}
              </p>
            </div>
          )}
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

      {event.venue && (
        <div className="mt-10 rounded-2xl bg-soul-sand/40 p-6">
          <h2 className="mb-2 flex items-center gap-2 text-xl text-soul-brown">
            <User className="h-5 w-5 text-soul-bronze" /> {t("aboutVenue")} — {event.venue.name}
          </h2>
          {event.venue.description && (
            <p className="text-sm text-soul-ink/80">{event.venue.description}</p>
          )}
          <p className="mt-2 text-xs text-soul-bronze">{event.venue.address}</p>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              `${event.venue.address}, ${event.venue.city ?? ""} ${event.venue.country}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-4 !py-2"
          >
            <MapPin className="h-4 w-4" /> Voir sur Google Maps
          </a>
        </div>
      )}

      {reviews.length > 0 && (
        <section className="mt-12">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl text-soul-brown">Avis</h2>
            <StarRating avg={event.rating_avg} count={event.rating_count} size="lg" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((r) => (
              <figure key={r.id} className="m-0 rounded-2xl border border-soul-bronze/15 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <figcaption className="font-medium text-soul-brown">
                    {r.author_name}
                  </figcaption>
                  <StarRating avg={r.rating} count={1} showMeta={false} />
                </div>
                {r.comment && (
                  <blockquote className="mt-2 text-sm leading-relaxed text-soul-ink/80">
                    {r.comment}
                  </blockquote>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Navigation expérience précédente / suivante (§8) */}
      {(prev || next) && (
        <nav className="mt-12 flex items-stretch justify-between gap-3 border-t border-soul-bronze/15 pt-6">
          {prev ? (
            <Link href={`/experiences/${prev.slug}`}
              className="group flex max-w-[48%] items-center gap-2 text-left text-sm text-soul-brown transition hover:text-soul-violet">
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="flex min-w-0 flex-col">
                <span className="text-xs uppercase tracking-wide text-soul-bronze">{t("previous")}</span>
                <span className="line-clamp-1 font-medium">{prev.title}</span>
              </span>
            </Link>
          ) : <span />}
          {next ? (
            <Link href={`/experiences/${next.slug}`}
              className="group flex max-w-[48%] items-center gap-2 text-right text-sm text-soul-brown transition hover:text-soul-violet">
              <span className="flex min-w-0 flex-col">
                <span className="text-xs uppercase tracking-wide text-soul-bronze">{t("next")}</span>
                <span className="line-clamp-1 font-medium">{next.title}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          ) : <span />}
        </nav>
      )}
    </article>
  );
}
