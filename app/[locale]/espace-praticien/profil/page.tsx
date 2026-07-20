import { getCurrentPractitioner } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function PractitionerProfilePage() {
  const practitioner = await getCurrentPractitioner();
  if (!practitioner) {
    return <p className="text-sm text-soul-bronze">Aucune fiche praticien.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl text-soul-brown">Ma fiche praticien</h2>
        <p className="mt-1 text-sm text-soul-bronze">
          Ces informations alimentent votre fiche publique et pré-remplissent vos
          dépôts d&apos;expériences.
        </p>
      </div>
      <ProfileForm practitioner={practitioner} />
    </div>
  );
}
