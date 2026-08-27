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
      {practitioner.status === "rejected" && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-900">
          <strong>{t("rejectedTitle")}</strong>{" "}
          {t("rejectedProfileText")}
          {practitioner.admin_message && (
            <p className="mt-2 italic">{t("rejectedReason")} {practitioner.admin_message}</p>
          )}
        </div>
      )}
      {practitioner.status === "pending" && (
        <div className="rounded-2xl border border-soul-amber/40 bg-soul-ivory p-5 text-sm text-soul-brown">
          {t("pendingReview")}
        </div>
      )}
      <div>
        <h2 className="text-xl text-soul-brown">{t("profileTitle")}</h2>
        <p className="mt-1 text-sm text-soul-bronze">{t("profileSubtitle")}</p>
      </div>
      <ProfileForm practitioner={practitioner} />
    </div>
  );
}
