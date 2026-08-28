import { notFound } from "next/navigation";
import { VenueForm } from "../nouveau/VenueForm";
import { adminUpdateVenue } from "@/app/actions/venues";
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

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl text-soul-brown">{t("editVenue", { name: venue.name })}</h2>
      <VenueForm venue={venue} action={adminUpdateVenue.bind(null, venue.id)} />
    </div>
  );
}
