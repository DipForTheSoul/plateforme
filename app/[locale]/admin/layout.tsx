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
    { href: "/admin/contact", label: t("nav.forthesoulContact") },
    { href: "/admin/demandes-contact", label: t("nav.practitionerContact") },
    { href: "/admin/parametres", label: t("nav.settings") },
  ];

  return (
    <div className="mx-auto min-w-0 max-w-6xl px-4 py-8 [overflow-wrap:anywhere]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl text-soul-brown">{t("title")}</h1>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/api/logout" className="text-sm text-soul-bronze underline">
          {t("logout")}
        </a>
      </div>
      <details className="group relative z-20 mb-6 md:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between rounded-2xl border border-soul-bronze/25 bg-white px-4 py-3 font-semibold text-soul-brown shadow-sm [&::-webkit-details-marker]:hidden">
          <span>{t("nav.menu")}</span>
          <span aria-hidden="true" className="text-lg transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <nav className="mt-2 grid overflow-hidden rounded-2xl border border-soul-bronze/20 bg-white p-2 shadow-lg">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-w-0 rounded-xl px-4 py-3 text-sm font-medium text-soul-brown hover:bg-soul-sand/50"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </details>
      <nav className="mb-8 hidden flex-wrap gap-2 pb-1 md:flex">
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
