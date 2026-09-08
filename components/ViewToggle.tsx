"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { List, Map as MapIcon } from "lucide-react";
import { useExplorerNavigation } from "@/components/ExplorerNavigation";

/** Bascule Liste / Carte du catalogue (via le paramètre d'URL `vue`). */
export function ViewToggle() {
  const t = useTranslations("events");
  const setParams = useExplorerNavigation();
  const searchParams = useSearchParams();
  const isMap = searchParams.get("vue") === "carte";

  function setVue(value?: string) {
    setParams({ vue: value });
  }

  const base = "flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium transition";
  const active = "bg-soul-violet text-white";
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
