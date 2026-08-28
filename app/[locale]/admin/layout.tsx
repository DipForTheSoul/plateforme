import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth";
import { Link } from "@/i18n/navigation";

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

  const t = await getTranslations("admin");

  const nav = [
    { href: "/admin", label: t("nav.dashboard") },
    { href: "/admin/soumissions", label: t("nav.submissions") },
    { href: "/admin/mises-en-avant", label: t("nav.featured") },
    { href: "/admin/praticiens", label: t("nav.practitioners") },
    { href: "/admin/lieux", label: t("nav.venues") },
    { href: "/admin/credits", label: t("nav.credits") },
    { href: "/admin/newsletter", label: t("nav.newsletter") },
    { href: "/admin/contact", label: t("nav.messages") },
    { href: "/admin/parametres", label: t("nav.settings") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl text-soul-brown">{t("title")}</h1>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/api/logout" className="text-sm text-soul-bronze underline">
          {t("logout")}
        </a>
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
