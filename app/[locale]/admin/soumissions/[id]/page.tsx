import { notFound } from "next/navigation";
import { EventForm } from "@/components/forms/EventForm";
import { adminUpdateEvent } from "@/app/actions/events";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getVenues } from "@/lib/queries";
import type { Event } from "@/types/database";

export const dynamic = "force-dynamic";

/** Édition d'une expérience par l'admin (§3/§8) — Didier édite n'importe quelle fiche. */
export default async function AdminEditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin"]);
  const { id } = await params;

  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*, event_categories(category_id)")
    .eq("id", id)
    .maybeSingle();
  const event = data as (Event & { event_categories?: { category_id: string }[] }) | null;
  if (!event) notFound();

  const selectedCategoryIds = (event.event_categories ?? []).map((r) => r.category_id);
  if (!selectedCategoryIds.length && event.category_id) {
    selectedCategoryIds.push(event.category_id);
  }

  const [categories, venues] = await Promise.all([getCategories(), getVenues()]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl text-soul-brown">Modifier « {event.title} » (admin)</h2>
      <EventForm
        categories={categories}
        venues={venues}
        defaultLanguages={event.languages}
        event={event}
        selectedCategoryIds={selectedCategoryIds}
        action={adminUpdateEvent.bind(null, event.id)}
      />
    </div>
  );
}
