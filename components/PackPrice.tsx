"use client";

import { useCurrency } from "@/components/CurrencyProvider";

/** Affiche le prix d'un pack dans la devise sélectionnée dans l'en-tête. */
export function PackPrice({ valueChf }: { valueChf: number }) {
  const { currency, rateEur } = useCurrency();
  const amount = currency === "EUR" ? valueChf * rateEur : valueChf;
  const rounded = Math.round(amount * 100) / 100;

  return <>{currency} {Number.isInteger(rounded) ? `${rounded.toFixed(0)}.–` : rounded.toFixed(2)}</>;
}
