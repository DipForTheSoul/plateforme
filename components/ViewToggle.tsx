"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { List, Map as MapIcon } from "lucide-react";

/** Bascule Liste / Carte du catalogue (via le paramètre d'URL `vue`). */
export function ViewToggle() {
  const t = useTranslations("events");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMap = searchParams.get("vue") === "carte";

  function href(value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("vue", value); else params.delete("vue");
    const query = params.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }

  const base = "flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium transition";
  const active = "bg-soul-violet text-white";
  const idle = "text-soul-brown hover:text-soul-terracotta";

  return (
    <div className="inline-flex rounded-full border border-soul-bronze/25 bg-white p-1 text-sm">
      <Link href={href()} aria-current={!isMap ? "page" : undefined}
        className={`${base} touch-manipulation ${isMap ? idle : active}`}>
        <List className="h-4 w-4" /> {t("viewList")}
      </Link>
      <Link href={href("carte")} aria-current={isMap ? "page" : undefined}
        className={`${base} touch-manipulation ${isMap ? active : idle}`}>
        <MapIcon className="h-4 w-4" /> {t("viewMap")}
      </Link>
    </div>
  );
}
