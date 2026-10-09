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

export function GoogleAnalytics({ locale }: { locale: string }) {
  const t = copy[locale as keyof typeof copy] ?? copy.fr;
  const id = process.env.NEXT_PUBLIC_GA_ID;
  const [consent, setConsent] = useState<"accepted" | "refused" | null>(null);

  useEffect(() => {
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
  }, []);

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
        className="fixed inset-x-0 bottom-0 z-[80] border-t border-soul-bronze/20 bg-white/95 px-4 py-2.5 shadow-[0_-6px_20px_rgba(69,48,31,0.12)] backdrop-blur-sm"
        aria-label={t.text}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
          <p className="min-w-0 text-xs leading-snug text-soul-bronze sm:whitespace-nowrap sm:text-sm">{t.text}</p>
          <div className="flex shrink-0 gap-1.5 sm:gap-2">
            <button type="button" className="btn-primary !px-2 !py-1.5 !text-[0.625rem] sm:!px-3 sm:!text-xs" onClick={() => choose("accepted")}>{t.accept}</button>
            <button type="button" className="btn-secondary !px-2 !py-1.5 !text-[0.625rem] sm:!px-3 sm:!text-xs" onClick={() => choose("refused")}>{t.refuse}</button>
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
