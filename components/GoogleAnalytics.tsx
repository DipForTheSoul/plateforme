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
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1.5 lg:grid-cols-[auto_1fr_auto] lg:gap-x-4">
          <p className="col-start-1 row-start-1 shrink-0 text-sm font-semibold text-soul-brown">{t.title}</p>
          <p className="col-span-2 row-start-2 min-w-0 whitespace-nowrap text-[clamp(0.62rem,2.7vw,0.75rem)] leading-relaxed text-soul-bronze lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:text-xs">{t.text}</p>
          <div className="col-start-2 row-start-1 flex justify-self-start gap-2 lg:col-start-3 lg:justify-self-end">
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
