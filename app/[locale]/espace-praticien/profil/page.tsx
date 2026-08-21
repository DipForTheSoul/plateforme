import { getTranslations } from "next-intl/server";
import { getCurrentPractitioner } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function PractitionerProfilePage() {
  const t = await getTranslations("practitioner");
  const practitioner = await getCurrentPractitioner();
  if (!practitioner) {
    return <p className="text-sm text-soul-bronze">{t("noProfileShort")}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl text-soul-brown">{t("profileTitle")}</h2>
        <p className="mt-1 text-sm text-soul-bronze">{t("profileSubtitle")}</p>
      </div>
      <ProfileForm practitioner={practitioner} />
    </div>
  );
}
