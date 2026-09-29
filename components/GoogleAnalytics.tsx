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
    return <aside className="fixed inset-x-4 bottom-24 z-[80] mx-auto max-w-xl rounded-2xl border border-soul-bronze/20 bg-white p-4 shadow-xl" aria-label={t.title}><p className="font-semibold text-soul-brown">{t.title}</p><p className="mt-1 text-sm text-soul-bronze">{t.text}</p><div className="mt-3 flex gap-2"><button type="button" className="btn-primary !px-4 !py-2" onClick={() => choose("accepted")}>{t.accept}</button><button type="button" className="btn-secondary !px-4 !py-2" onClick={() => choose("refused")}>{t.refuse}</button></div></aside>;
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
