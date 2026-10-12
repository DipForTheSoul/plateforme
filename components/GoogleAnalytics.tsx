"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

/**
 * Google Analytics 4 (§7.2). Le tag ne se charge QUE si l'identifiant est
 * fourni via `NEXT_PUBLIC_GA_ID` (format G-XXXXXXXXXX). Sans ID → rien n'est
 * injecté. Quand un ID est présent, le tag ne se charge qu'après le choix
 * explicite de l'utilisateur dans le bandeau de consentement.
 */
const copy = {
  fr: { title: "Mesure d’audience", text: "Autorisez-vous Google Analytics pour améliorer la plateforme ?", accept: "Accepter", refuse: "Refuser" },
  en: { title: "Audience measurement", text: "Allow Google Analytics to help us improve the platform?", accept: "Accept", refuse: "Refuse" },
  de: { title: "Reichweitenmessung", text: "Google Analytics zur Verbesserung der Plattform erlauben?", accept: "Akzeptieren", refuse: "Ablehnen" },
} as const;

export function GoogleAnalytics({
  locale,
  initialConsent = null,
}: {
  locale: string;
  initialConsent?: "accepted" | "refused" | null;
}) {
  const t = copy[locale as keyof typeof copy] ?? copy.fr;
  const id = process.env.NEXT_PUBLIC_GA_ID;
  const [consent, setConsent] = useState<"accepted" | "refused" | null>(initialConsent);

  useEffect(() => {
    if (initialConsent) return;
    try {
      const saved = window.localStorage.getItem("fts-analytics-consent");
      if (saved === "accepted" || saved === "refused") {
        const timer = window.setTimeout(() => setConsent(saved), 0);
        return () => window.clearTimeout(timer);
      }
    } catch {
      // Sur certains réglages Safari/iPadOS, localStorage lève SecurityError.
      // Le bandeau doit rester utilisable même si le choix ne peut pas être
      // conservé entre deux visites.
    }
  }, [initialConsent]);

  if (!id) return null;
  if (consent !== "accepted") {
    if (consent === "refused") return null;
    const choose = (value: "accepted" | "refused") => {
      try {
        window.localStorage.setItem("fts-analytics-consent", value);
      } catch {
        // Le choix s'applique tout de même pour la visite courante.
      }
      setConsent(value);
    };
    return (
      <aside
        className="fixed inset-x-0 bottom-0 z-[80] border-t border-soul-bronze/20 bg-white/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-6px_20px_rgba(69,48,31,0.12)] backdrop-blur-sm sm:px-4 sm:py-3"
        aria-label={t.text}
      >
        <div className="mx-auto grid max-w-7xl gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
          <p className="min-w-0 text-xs leading-snug text-soul-bronze sm:text-sm">{t.text}</p>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
            <form className="min-w-0" action="/api/analytics-consent" method="post" onSubmit={(event) => { event.preventDefault(); choose("refused"); }}>
              <button type="submit" name="consent" value="refused" className="btn-secondary min-h-11 w-full whitespace-nowrap !px-3 !py-2 !text-xs sm:min-w-28">{t.refuse}</button>
            </form>
            <form className="min-w-0" action="/api/analytics-consent" method="post" onSubmit={(event) => { event.preventDefault(); choose("accepted"); }}>
              <button type="submit" name="consent" value="accepted" className="btn-primary min-h-11 w-full whitespace-nowrap !px-3 !py-2 !text-xs sm:min-w-28">{t.accept}</button>
            </form>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');`}
      </Script>
    </>
  );
}
