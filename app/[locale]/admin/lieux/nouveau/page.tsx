import { VenueForm } from "./VenueForm";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function NewVenuePage() {
  const t = await getTranslations("admin.venues");

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-2 text-xl text-soul-brown">{t("newVenue")}</h2>
      <p className="mb-6 text-sm text-soul-bronze">
        {t("newVenueHint")}
      </p>
      <VenueForm />
    </div>
  );
}
