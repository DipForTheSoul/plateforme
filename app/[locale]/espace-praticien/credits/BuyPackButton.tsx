"use client";

import { useState } from "react";

/** Rachat en 1 clic : crée la session Stripe Checkout et redirige. */
export function BuyPackButton({ packId }: { packId: string }) {
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
        setError(data.error ?? "Paiement indisponible pour le moment.");
        setBusy(false);
      }
    } catch {
      setError("Paiement indisponible pour le moment.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-auto pt-4">
      <button type="button" onClick={buy} disabled={busy} className="btn-primary w-full">
        {busy ? "Redirection…" : "Acheter"}
      </button>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
