import { notFound } from "next/navigation";
import { ProfileForm } from "../../../espace-praticien/profil/ProfileForm";
import { adminUpdatePractitioner } from "@/app/actions/practitioner";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import type { Practitioner } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminEditPractitionerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin"]);
  const { id } = await params;
  const t = await getTranslations("admin.practitioners");

  const supabase = await createClient();
  const { data } = await supabase
    .from("practitioners")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const practitioner = data as Practitioner | null;
  if (!practitioner) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl text-soul-brown">{t("editPractitioner", { name: practitioner.name })}</h2>
      <ProfileForm
        practitioner={practitioner}
        action={adminUpdatePractitioner.bind(null, practitioner.id)}
      />
    </div>
  );
}
