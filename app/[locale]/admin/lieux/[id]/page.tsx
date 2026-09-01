import { notFound, redirect } from "next/navigation";
import { VenueForm } from "../nouveau/VenueForm";
import { adminUpdateVenue, deleteVenue } from "@/app/actions/venues";
import { requireRole } from "@/lib/auth";
import { getVenueById } from "@/lib/queries";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AdminEditVenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin"]);
  const { id } = await params;
  const t = await getTranslations("admin.venues");

  const venue = await getVenueById(id);
  if (!venue) notFound();

  async function handleDelete(formData: FormData) {
    "use server";
    await deleteVenue(formData);
    redirect("/admin/lieux");
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl text-soul-brown">{t("editVenue", { name: venue.name })}</h2>
      <VenueForm venue={venue} action={adminUpdateVenue.bind(null, venue.id)} />
      <div className="border-t border-red-200 pt-6">
        <form action={handleDelete}>
          <input type="hidden" name="venue_id" value={venue.id} />
          <button
            type="submit"
            className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
          >
            {t("deleteVenue")}
          </button>
        </form>
      </div>
    </div>
  );
}
