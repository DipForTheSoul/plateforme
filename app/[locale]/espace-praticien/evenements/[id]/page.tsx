import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations("practitioner");
  const practitioner = await getCurrentPractitioner();
  if (!practitioner) redirect("/espace-praticien");

  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*, event_categories(category_id)")
    .eq("id", id)
    .eq("practitioner_id", practitioner.id)
    .maybeSingle();
  const event = data as (Event & { event_categories?: { category_id: string }[] }) | null;
  if (!event) notFound();

  // Univers rattachés (multi-univers §2.1) ; repli sur la catégorie principale.
  const selectedCategoryIds = (event.event_categories ?? []).map((r) => r.category_id);
  if (!selectedCategoryIds.length && event.category_id) {
    selectedCategoryIds.push(event.category_id);
  }

  const [categories, venues] = await Promise.all([getCategories(), getVenues()]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl text-soul-brown">{t("editEventTitle", { title: event.title })}</h2>
      <EventForm
        categories={categories}
        venues={venues}
        defaultLanguages={practitioner.languages}
        event={event}
        selectedCategoryIds={selectedCategoryIds}
      />
    </div>
  );
}
