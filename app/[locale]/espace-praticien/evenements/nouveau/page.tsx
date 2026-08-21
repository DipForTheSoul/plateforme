import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { EventForm } from "@/components/forms/EventForm";
import { getCurrentPractitioner } from "@/lib/auth";
import { getCategories, getVenues } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Dépôt d'événement — pré-rempli depuis le profil praticien (BUILD-BRIEF.md Phase 2). */
export default async function NewEventPage() {
  const t = await getTranslations("practitioner");
  const practitioner = await getCurrentPractitioner();
  if (!practitioner) redirect("/espace-praticien");
  if (practitioner.credits === 0) redirect("/espace-praticien/credits");

  const [categories, venues] = await Promise.all([getCategories(), getVenues()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl text-soul-brown">{t("submitExperience")}</h2>
        <p className="mt-1 text-sm text-soul-bronze">
          {t("newEventSubtitle", { count: practitioner.credits })}
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
