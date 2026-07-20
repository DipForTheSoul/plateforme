import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { MobileNav } from "@/components/MobileNav";
import { Heart } from "lucide-react";

export async function Header() {
  const t = await getTranslations("common");
  const profile = await getCurrentProfile();

  const links = [
    { href: "/experiences", label: t("nav.experiences") },
    { href: "/praticiens", label: t("nav.practitioners") },
    { href: "/a-propos", label: t("nav.about") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-soul-bronze/15 bg-soul-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="ForTheSoul — accueil"
        >
          <Image
            src="/logo-icon.png"
            alt=""
            width={40}
            height={34}
            priority
            className="h-9 w-auto"
          />
          <span className="font-serif text-2xl leading-none text-soul-brown">
            For<span className="text-soul-bronze">The</span>Soul
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-soul-brown transition hover:text-soul-terracotta"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/favoris"
            className="text-soul-brown transition hover:text-soul-terracotta"
            aria-label={t("nav.favorites")}
          >
            <Heart className="h-5 w-5" />
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LocaleSwitcher />
          {profile ? (
            <Link
              href={profile.role === "admin" ? "/admin" : "/espace-praticien"}
              className="btn-secondary !px-4 !py-2"
            >
              {profile.role === "admin"
                ? t("nav.admin")
                : t("nav.practitionerSpace")}
            </Link>
          ) : (
            <Link href="/connexion" className="btn-primary !px-4 !py-2">
              {t("nav.login")}
            </Link>
          )}
        </div>

        <MobileNav
          links={[...links, { href: "/favoris", label: t("nav.favorites") }]}
          authLink={
            profile
              ? {
                  href: profile.role === "admin" ? "/admin" : "/espace-praticien",
                  label:
                    profile.role === "admin"
                      ? t("nav.admin")
                      : t("nav.practitionerSpace"),
                }
              : { href: "/connexion", label: t("nav.login") }
          }
        />
      </div>
    </header>
  );
}
