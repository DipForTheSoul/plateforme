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
  fr: { title: "Mesure d’audience", text: "Acceptez-vous l’utilisation de Google Analytics pour nous aider à améliorer la plateforme ?", accept: "Accepter", refuse: "Refuser" },
  en: { title: "Audience measurement", text: "Do you agree to Google Analytics being used to help us improve the platform?", accept: "Accept", refuse: "Refuse" },
  de: { title: "Reichweitenmessung", text: "Stimmst du der Nutzung von Google Analytics zu, damit wir die Plattform verbessern können?", accept: "Akzeptieren", refuse: "Ablehnen" },
} as const;

export function GoogleAnalytics({ locale }: { locale: string }) {
  const t = copy[locale as keyof typeof copy] ?? copy.fr;
  const id = process.env.NEXT_PUBLIC_GA_ID;
  const [consent, setConsent] = useState<"accepted" | "refused" | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("fts-analytics-consent");
    if (saved === "accepted" || saved === "refused") {
      const timer = window.setTimeout(() => setConsent(saved), 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  if (!id) return null;
  if (consent !== "accepted") {
    if (consent === "refused") return null;
    const choose = (value: "accepted" | "refused") => {
      window.localStorage.setItem("fts-analytics-consent", value);
      setConsent(value);
    };
    return (
      <aside
        className="fixed inset-x-0 bottom-0 z-[80] border-t border-soul-bronze/20 bg-white/95 px-4 py-2.5 shadow-[0_-6px_20px_rgba(69,48,31,0.12)] backdrop-blur-sm"
        aria-label={t.title}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 sm:flex-nowrap">
          <p className="shrink-0 text-xs font-semibold text-soul-brown sm:text-sm">{t.title}</p>
          <p className="min-w-0 flex-1 text-xs leading-relaxed text-soul-bronze">{t.text}</p>
          <div className="flex shrink-0 gap-2">
            <button type="button" className="btn-primary !px-3 !py-1.5 !text-xs" onClick={() => choose("accepted")}>{t.accept}</button>
            <button type="button" className="btn-secondary !px-3 !py-1.5 !text-xs" onClick={() => choose("refused")}>{t.refuse}</button>
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
