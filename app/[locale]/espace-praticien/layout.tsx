import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { signOut } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

/**
 * Espace praticien — réservé aux rôles practitioner & admin.
 * (Interface en français : les praticiens de la V1 sont francophones ;
 * les clés DE/EN pourront être ajoutées dans messages/*.json.)
 */
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

  const nav = [
    { href: "/espace-praticien", label: "Tableau de bord" },
    { href: "/espace-praticien/evenements", label: "Mes expériences" },
    { href: "/espace-praticien/profil", label: "Ma fiche" },
    { href: "/espace-praticien/credits", label: "Mes crédits" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl text-soul-brown">Espace praticien</h1>
        <form action={signOut}>
          <button type="submit" className="text-sm text-soul-bronze underline">
            Se déconnecter
          </button>
        </form>
      </div>
      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <nav className="flex flex-row gap-2 overflow-x-auto md:flex-col">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium text-soul-brown hover:bg-soul-sand/50"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
