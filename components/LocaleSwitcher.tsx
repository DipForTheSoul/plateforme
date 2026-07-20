"use client";

import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";

/** Sélecteur FR / DE / EN — conserve la page courante en changeant de langue. */
export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-soul-bronze/25 bg-white p-0.5">
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => router.replace(pathname, { locale: l })}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase transition ${
            l === locale
              ? "bg-soul-brown text-soul-cream"
              : "text-soul-bronze hover:text-soul-brown"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
