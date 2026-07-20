import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { signOut } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

/** Espace admin (Didier) — réservé au rôle admin, pensé mobile + desktop. */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireRole(["admin"]);

  const nav = [
    { href: "/admin", label: "Tableau de bord" },
    { href: "/admin/soumissions", label: "Soumissions" },
    { href: "/admin/praticiens", label: "Praticien·nes" },
    { href: "/admin/lieux", label: "Lieux" },
    { href: "/admin/credits", label: "Crédits" },
    { href: "/admin/newsletter", label: "Newsletter" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl text-soul-brown">Administration</h1>
        <form action={signOut}>
          <button type="submit" className="text-sm text-soul-bronze underline">
            Se déconnecter
          </button>
        </form>
      </div>
      <nav className="mb-8 flex gap-2 overflow-x-auto pb-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-full border border-soul-bronze/25 bg-white px-4 py-2 text-sm font-medium text-soul-brown hover:bg-soul-sand/50"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
