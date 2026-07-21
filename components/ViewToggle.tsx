"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { List, Map as MapIcon } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";

/** Bascule Liste / Carte du catalogue (via le paramètre d'URL `vue`). */
export function ViewToggle() {
  const t = useTranslations("events");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMap = searchParams.get("vue") === "carte";

  function setVue(value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("vue", value);
    else params.delete("vue");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const base = "flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium transition";
  const active = "bg-soul-brown text-soul-cream";
  const idle = "text-soul-brown hover:text-soul-terracotta";

  return (
    <div className="inline-flex rounded-full border border-soul-bronze/25 bg-white p-1 text-sm">
      <button type="button" onClick={() => setVue(undefined)}
        className={`${base} ${isMap ? idle : active}`}>
        <List className="h-4 w-4" /> {t("viewList")}
      </button>
      <button type="button" onClick={() => setVue("carte")}
        className={`${base} ${isMap ? active : idle}`}>
        <MapIcon className="h-4 w-4" /> {t("viewMap")}
      </button>
    </div>
  );
}
