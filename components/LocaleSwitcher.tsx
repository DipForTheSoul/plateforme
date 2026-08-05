"use client";

import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";

/** Sélecteur FR / DE / EN — conserve la page courante en changeant de langue. */
export function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className={`flex items-center gap-0.5 rounded-full border border-soul-bronze/25 bg-white ${compact ? "p-0.5" : "p-1"}`}>
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => router.replace(pathname, { locale: l })}
          className={`rounded-full font-semibold uppercase transition ${
            compact ? "px-1.5 py-0.5 text-xs" : "px-3 py-1.5 text-sm"
          } ${
            l === locale
              ? "bg-soul-violet text-white"
              : "text-soul-bronze hover:text-soul-violet"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
