"use client";

import Image from "next/image";
import { Link, usePathname } from "@/i18n/navigation";

/**
 * Logo cliquable — ramène à l'accueil, et si on y est déjà, remonte en haut
 * de la page en douceur (remarque Didier : clic logo depuis le bas de la landing).
 */
export function LogoLink() {
  const pathname = usePathname();

  return (
    <Link
      href="/"
      onClick={() => {
        if (pathname === "/") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
      className="flex shrink-0 items-center gap-2.5"
      aria-label="ForTheSoul — accueil"
    >
      <Image
        src="/logo-icon.png"
        alt=""
        width={40}
        height={34}
        priority
        className="h-7 w-auto sm:h-9"
      />
      <span className="font-serif text-lg leading-none text-soul-brown sm:text-2xl">
        ForTheSoul
      </span>
    </Link>
  );
}
