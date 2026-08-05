"use client";

import { useCurrency } from "@/components/CurrencyProvider";

/**
 * Affiche un prix dans la devise choisie par le visiteur (§4.4).
 * Les prix sont saisis en CHF ; conversion indicative en EUR au taux admin.
 */
export function Price({
  value,
  baseCurrency = "CHF",
  freeLabel,
}: {
  value: number | null;
  baseCurrency?: string;
  freeLabel: string;
}) {
  const { currency, rateEur } = useCurrency();

  if (value === null || Number(value) === 0) return <>{freeLabel}</>;

  let amount = Number(value);
  let display = baseCurrency;
  if (currency === "EUR" && baseCurrency === "CHF") {
    amount = amount * rateEur;
    display = "EUR";
  }
  return (
    <>
      {display} {amount.toFixed(0)}.–
    </>
  );
}
