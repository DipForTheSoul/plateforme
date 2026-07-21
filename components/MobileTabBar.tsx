"use client";

import { useTranslations } from "next-intl";
import { Compass, Heart, Home, User, Users } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";

/**
 * Barre d'onglets fixe en bas — expérience « appli mobile » (masquée en ≥ md).
 * L'onglet central « Explorer » est mis en avant (bouton rond surélevé).
 */
export function MobileTabBar({ accountHref }: { accountHref: string }) {
  const pathname = usePathname();
  const t = useTranslations("common.tabbar");

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const side = [
    { href: "/", label: t("home"), icon: Home },
    { href: "/favoris", label: t("favorites"), icon: Heart },
    { href: "/praticiens", label: t("practitioners"), icon: Users },
    { href: accountHref, label: t("account"), icon: User },
  ];

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-soul-bronze/15 bg-soul-cream/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 items-end px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1.5">
        <Tab item={side[0]} active={isActive(side[0].href)} />
        <Tab item={side[1]} active={isActive(side[1].href)} />

        {/* Onglet central mis en avant : Explorer */}
        <li className="flex justify-center">
          <Link
            href="/experiences"
            aria-label={t("explore")}
            className="-mt-6 flex flex-col items-center"
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg ring-4 ring-soul-cream transition ${
                isActive("/experiences")
                  ? "bg-soul-brown text-soul-cream"
                  : "bg-soul-terracotta text-white"
              }`}
            >
              <Compass className="h-6 w-6" />
            </span>
            <span className="mt-0.5 text-[10px] font-semibold text-soul-brown">
              {t("explore")}
            </span>
          </Link>
        </li>

        <Tab item={side[2]} active={isActive(side[2].href)} />
        <Tab item={side[3]} active={isActive(side[3].href)} />
      </ul>
    </nav>
  );
}

function Tab({
  item,
  active,
}: {
  item: { href: string; label: string; icon: typeof Home };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        className={`flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition ${
          active ? "text-soul-terracotta" : "text-soul-brown/70"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
        <span className="truncate">{item.label}</span>
      </Link>
    </li>
  );
}
