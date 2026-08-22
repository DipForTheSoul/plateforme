import { getTranslations } from "next-intl/server";
import { getCurrentPractitioner } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";
import { createMissingPractitioner } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function PractitionerProfilePage() {
  const t = await getTranslations("practitioner");
  const practitioner = await getCurrentPractitioner();
  if (!practitioner) {
    return (
      <div className="text-sm text-soul-bronze">
        <p className="mb-4">{t("noProfile")}</p>
        <form action={createMissingPractitioner}>
          <button type="submit" className="btn-primary">
            {t("createProfile")}
          </button>
        </form>
      </div>
    );
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
