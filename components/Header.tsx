import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { LogoLink } from "@/components/LogoLink";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { MobileNav } from "@/components/MobileNav";
import { Heart } from "lucide-react";

export async function Header() {
  const t = await getTranslations("common");
  const profile = await getCurrentProfile();

  const links = [
    { href: "/experiences", label: t("nav.experiences") },
    { href: "/praticiens", label: t("nav.practitioners") },
    { href: "/lieux", label: t("nav.venues") },
    { href: "/a-propos", label: t("nav.about") },
  ];

  // Lien « compte » : réservé aux praticiens et à l'admin (pas de compte visiteur).
  const account = profile
    ? {
        href: profile.role === "admin" ? "/admin" : "/espace-praticien",
        label:
          profile.role === "admin"
            ? t("nav.admin")
            : t("nav.practitionerSpace"),
      }
    : { href: "/connexion", label: t("nav.login") };

  return (
    <header className="sticky top-0 z-40 border-b border-soul-bronze/15 bg-soul-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4">
        <LogoLink />

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base font-medium text-soul-brown transition hover:text-soul-violet"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/favoris"
            className="text-soul-brown transition hover:text-soul-violet"
            aria-label={t("nav.favorites")}
          >
            <Heart className="h-5 w-5" />
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <CurrencySwitcher />
          <LocaleSwitcher />
          <Link
            href={account.href}
            className={`${profile ? "btn-secondary" : "btn-primary"} !px-4 !py-2 text-sm`}
          >
            {account.label}
          </Link>
        </div>

        {/* Accès direct langue + devise sur mobile (hors menu) — version compacte. */}
        <div className="flex items-center gap-1 md:hidden">
          <CurrencySwitcher compact />
          <LocaleSwitcher compact />
          <MobileNav
            links={[...links, { href: "/favoris", label: t("nav.favorites") }]}
            authLink={account}
          />
        </div>
      </div>
    </header>
  );
}
