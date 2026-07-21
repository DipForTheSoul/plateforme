import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/queries";
import { buildICS } from "@/lib/calendar";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

/** Fichier .ics d'un événement — « Ajouter à mon agenda » (universel). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event || event.status !== "approved") {
    return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });
  }

  const location = event.venue
    ? `${event.venue.name}, ${event.venue.address}`
    : undefined;

  const ics = buildICS({
    uid: `${event.id}@forthesoul.ch`,
    title: event.title,
    start: event.start_date,
    end: event.end_date,
    details: event.description,
    location,
    url: `${SITE_URL}/experiences/${event.slug}`,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
    },
  });
}
