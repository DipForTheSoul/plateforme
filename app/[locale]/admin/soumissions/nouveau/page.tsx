import { EventForm } from "@/components/forms/EventForm";
import { adminCreateEvent } from "@/app/actions/events";
import { requireRole } from "@/lib/auth";
import { getApprovedPractitioners, getCategories, getVenues } from "@/lib/queries";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AdminNewEventPage() {
  await requireRole(["admin"]);
  const t = await getTranslations("admin.submissions");

  const [categories, venues, practitioners] = await Promise.all([
    getCategories(),
    getVenues(),
    getApprovedPractitioners(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl text-soul-brown">{t("createEventTitle")}</h2>
      <EventForm
        categories={categories}
        venues={venues}
        defaultLanguages={["fr"]}
        action={adminCreateEvent}
        practitioners={practitioners.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
