import type { EventWithRelations, Practitioner } from "@/types/database";

/** Builders JSON-LD Schema.org (Phase 9). */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthesoul.ch";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ForTheSoul",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.svg`,
    description:
      "Plateforme suisse curée d'expériences conscientes : danse libre, méditation, yoga, voyages sonores et retraites, validées par Didier.",
    founder: { "@type": "Person", name: "Didier Picamoles" },
    areaServed: "CH",
  };
}

export function eventJsonLd(event: EventWithRelations) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description ?? undefined,
    startDate: event.start_date,
    endDate: event.end_date ?? undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `${SITE_URL}/experiences/${event.slug}`,
    image: event.images[0] ?? undefined,
    inLanguage: event.languages,
    location: event.venue
      ? {
          "@type": "Place",
          name: event.venue.name,
          address: event.venue.address,
          geo:
            event.venue.lat !== null && event.venue.lng !== null
              ? {
                  "@type": "GeoCoordinates",
                  latitude: event.venue.lat,
                  longitude: event.venue.lng,
                }
              : undefined,
        }
      : undefined,
    organizer: event.practitioner
      ? {
          "@type": "Person",
          name: event.practitioner.name,
          url: `${SITE_URL}/praticiens/${event.practitioner.slug}`,
        }
      : undefined,
    offers:
      event.price !== null
        ? {
            "@type": "Offer",
            price: Number(event.price),
            priceCurrency: event.currency,
            url: `${SITE_URL}/experiences/${event.slug}`,
            availability: "https://schema.org/InStock",
          }
        : undefined,
  };
}

export function practitionerJsonLd(practitioner: Practitioner) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: practitioner.name,
    description: practitioner.bio ?? undefined,
    url: `${SITE_URL}/praticiens/${practitioner.slug}`,
    image: practitioner.photos[0] ?? undefined,
    knowsLanguage: practitioner.languages,
    jobTitle: practitioner.specialties.join(" · ") || undefined,
  };
}
