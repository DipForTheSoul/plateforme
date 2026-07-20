import { notFound, redirect } from "next/navigation";
import { EventForm } from "@/components/forms/EventForm";
import { getCurrentPractitioner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getVenues } from "@/lib/queries";
import type { Event } from "@/types/database";

export const dynamic = "force-dynamic";

/** Modification d'une expérience existante (repart en relecture). */
export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const practitioner = await getCurrentPractitioner();
  if (!practitioner) redirect("/espace-praticien");

  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("practitioner_id", practitioner.id)
    .maybeSingle();
  const event = data as Event | null;
  if (!event) notFound();

  const [categories, venues] = await Promise.all([getCategories(), getVenues()]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl text-soul-brown">Modifier « {event.title} »</h2>
      <EventForm
        categories={categories}
        venues={venues}
        defaultLanguages={practitioner.languages}
        event={event}
      />
    </div>
  );
}
