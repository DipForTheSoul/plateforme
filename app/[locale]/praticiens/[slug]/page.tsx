import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EventCard } from "@/components/EventCard";
import { FavoriteButton } from "@/components/FavoriteButton";
import { JsonLd } from "@/components/JsonLd";
import { getApprovedEvents, getPractitionerBySlug } from "@/lib/queries";
import { practitionerJsonLd } from "@/lib/seo";
import { LANGUAGE_LABELS } from "@/lib/utils";
import { Globe, Link as LinkIcon, Mail, Star } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const practitioner = await getPractitionerBySlug(slug);
  if (!practitioner || practitioner.status !== "approved") {
    return { title: "ForTheSoul" };
  }
  return {
    title: practitioner.name,
    description: practitioner.bio?.slice(0, 160),
    openGraph: {
      title: practitioner.name,
      images: practitioner.photos[0] ? [practitioner.photos[0]] : undefined,
    },
  };
}

/** Fiche praticien publique (Phase 4) + prochaines expériences. */
export default async function PractitionerPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("practitioners");
  const tCommon = await getTranslations("common");

  const practitioner = await getPractitionerBySlug(slug);
  if (!practitioner || practitioner.status !== "approved") notFound();

  const events = await getApprovedEvents({ practitioner: slug });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <JsonLd data={practitionerJsonLd(practitioner)} />

      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        <div>
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl">
            {practitioner.photos[0] ? (
              <Image src={practitioner.photos[0]} alt={practitioner.name} fill priority
                sizes="280px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-soul-brown to-soul-bronze font-serif text-7xl text-soul-cream"
                aria-hidden="true">
                {/* PLACEHOLDER — vraie photo à ajouter via la fiche praticien */}
                {practitioner.name.charAt(0)}
              </div>
            )}
            <div className="absolute right-3 top-3">
              <FavoriteButton kind="practitioner" id={practitioner.id} />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-sm">
            {practitioner.contact.email && (
              <a href={`mailto:${practitioner.contact.email}`}
                className="flex items-center gap-2 text-soul-brown hover:underline">
                <Mail className="h-4 w-4 text-soul-bronze" /> {practitioner.contact.email}
              </a>
            )}
            {practitioner.contact.website && (
              <a href={practitioner.contact.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-soul-brown hover:underline">
                <Globe className="h-4 w-4 text-soul-bronze" /> Site web
              </a>
            )}
            {Object.entries(practitioner.links)
              .filter(([name]) => !name.startsWith("google"))
              .map(([name, url]) => (
                <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 capitalize text-soul-brown hover:underline">
                  <LinkIcon className="h-4 w-4 text-soul-bronze" /> {name}
                </a>
              ))}
          </div>
        </div>

        <div>
          <span className="badge">✓ {tCommon("validatedByDidier")}</span>
          <h1 className="mt-2 text-3xl text-soul-brown sm:text-4xl">{practitioner.name}</h1>

          {practitioner.specialties.length > 0 && (
            <p className="mt-2 text-soul-bronze">
              {practitioner.specialties.join(" · ")}
            </p>
          )}
          <p className="mt-1 text-sm text-soul-bronze/80">
            {t("languages")} :{" "}
            {practitioner.languages.map((l) => LANGUAGE_LABELS[l] ?? l).join(", ")}
          </p>

          {practitioner.links.googleUrl && (
            <a
              href={practitioner.links.googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-soul-bronze/25 bg-white px-4 py-2 text-sm shadow-sm transition hover:border-soul-bronze"
            >
              <span className="font-semibold text-soul-brown">Avis Google</span>
              {practitioner.links.googleRating && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-soul-amber text-soul-amber" />
                  <span className="font-semibold text-soul-brown">
                    {practitioner.links.googleRating}
                  </span>
                </span>
              )}
              {practitioner.links.googleCount && (
                <span className="text-soul-bronze">
                  · {practitioner.links.googleCount} avis
                </span>
              )}
              <span className="text-soul-terracotta">Voir sur Google ↗</span>
            </a>
          )}

          {practitioner.bio && (
            <p className="mt-6 whitespace-pre-line text-soul-ink/85">{practitioner.bio}</p>
          )}
        </div>
      </div>

      <section className="mt-14">
        <h2 className="mb-6 text-2xl text-soul-brown">{t("upcoming")}</h2>
        {events.length === 0 ? (
          <p className="text-soul-bronze">{t("noUpcoming")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
