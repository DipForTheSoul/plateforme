"use client";

import { useCurrency, type Currency } from "@/components/CurrencyProvider";

/** Bascule CHF / EUR (§4.4) — affichage uniquement, aucun paiement en EUR. */
export function CurrencySwitcher({ compact = false }: { compact?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  const options: { code: Currency; symbol: string }[] = [
    { code: "CHF", symbol: "CHF" },
    { code: "EUR", symbol: "€" },
  ];

  return (
    <div className={`inline-flex rounded-full border border-soul-bronze/30 bg-white font-semibold ${compact ? "p-0.5 text-xs" : "p-1 text-sm"}`}>
      {options.map(({ code, symbol }) => (
        <button
          key={code}
          type="button"
          onClick={() => setCurrency(code)}
          aria-pressed={currency === code}
          aria-label={code}
          title={code}
          className={`rounded-full transition ${compact ? "px-1.5 py-0.5" : "px-3 py-1.5"} ${
            currency === code
              ? "bg-soul-violet text-white"
              : "text-soul-brown hover:text-soul-violet"
          }`}
        >
          {symbol}
        </button>
      ))}
    </div>
  );
}
