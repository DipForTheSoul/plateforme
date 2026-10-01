import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireRole, getCurrentPractitioner } from "@/lib/auth";
import { PractitionerNavigation } from "@/components/PractitionerNavigation";

export const dynamic = "force-dynamic";

/** Espace praticien — réservé aux rôles practitioner & admin (interface FR/DE/EN). */
export default async function PractitionerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireRole(["practitioner", "admin"]);
  const t = await getTranslations("practitioner");

  // §8 — intitulé personnalisé « Espace de [Prénom] ».
  const practitioner = await getCurrentPractitioner();
  const firstName = practitioner?.name?.trim().split(/\s+/)[0];
  const spaceTitle = firstName
    ? t("spaceTitle", { name: firstName })
    : t("spaceTitleGeneric");

  const profileNeedsAttention =
    practitioner?.status === "rejected" || practitioner?.status === "pending";

  const nav = [
    { href: "/espace-praticien", label: t("navDashboard") },
    { href: "/espace-praticien/evenements", label: t("navEvents") },
    { href: "/espace-praticien/profil", label: t("navProfile"), badge: profileNeedsAttention },
    { href: "/espace-praticien/credits", label: t("navCredits") },
  ];

  return (
    <div className="mx-auto min-w-0 max-w-6xl px-4 py-8 [overflow-wrap:anywhere]">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl text-soul-brown">{spaceTitle}</h1>
        {/* Lien direct (pas <Link>) : on veut atteindre la route serveur qui
            vide la session et redirige — insensible au cache d'un onglet périmé. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/api/logout" className="text-sm text-soul-bronze underline">
          {t("logout")}
        </a>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_minmax(0,1fr)]">
        <PractitionerNavigation items={nav} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
