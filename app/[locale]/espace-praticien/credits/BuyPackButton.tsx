"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/** Rachat en 1 clic : crée la session Stripe Checkout et redirige. */
export function BuyPackButton({ packId }: { packId: string }) {
  const t = useTranslations("practitioner");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? t("creditsPaymentUnavailable"));
        setBusy(false);
      }
    } catch {
      setError(t("creditsPaymentUnavailable"));
      setBusy(false);
    }
  }

  return (
    <div className="mt-auto pt-4">
      <button type="button" onClick={buy} disabled={busy} className="btn-primary w-full">
        {busy ? t("creditsRedirecting") : t("creditsBuy")}
      </button>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
