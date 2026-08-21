"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

/**
 * Logo cliquable — ramène à l'accueil, et si on y est déjà, remonte en haut
 * de la page en douceur (remarque Didier : clic logo depuis le bas de la landing).
 */
export function LogoLink() {
  const pathname = usePathname();
  const t = useTranslations("common.tabbar");

  return (
    <Link
      href="/"
      onClick={() => {
        if (pathname === "/") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
      className="flex shrink-0 items-center gap-2.5"
      aria-label={`ForTheSoul — ${t("home")}`}
    >
      <Image
        src="/logo-icon.png"
        alt=""
        width={40}
        height={34}
        priority
        className="h-8 w-auto sm:h-11"
      />
      <span className="font-serif text-xl leading-none text-soul-brown sm:text-3xl">
        ForTheSoul
      </span>
    </Link>
  );
}
