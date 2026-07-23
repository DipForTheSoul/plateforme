import { redirect } from "next/navigation";
import { EventForm } from "@/components/forms/EventForm";
import { getCurrentPractitioner } from "@/lib/auth";
import { getCategories, getVenues } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Dépôt d'événement — pré-rempli depuis le profil praticien (BUILD-BRIEF.md Phase 2). */
export default async function NewEventPage() {
  const practitioner = await getCurrentPractitioner();
  if (!practitioner) redirect("/espace-praticien");
  if (practitioner.credits === 0) redirect("/espace-praticien/credits");

  const [categories, venues] = await Promise.all([getCategories(), getVenues()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl text-soul-brown">Déposer une expérience</h2>
        <p className="mt-1 text-sm text-soul-bronze">
          Solde : {practitioner.credits} publication{practitioner.credits > 1 ? "s" : ""}.
          L&apos;expérience sera relue par Didier avant mise en ligne.
        </p>
      </div>
      <EventForm
        categories={categories}
        venues={venues}
        defaultLanguages={practitioner.languages}
      />
    </div>
  );
}
