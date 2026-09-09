"use client";

import { useCurrency } from "@/components/CurrencyProvider";
import { useTranslations } from 'next-intl';
import { eventPriceMode, priceLabelKey, type PriceMode } from '@/lib/event-price';

/**
 * Affiche un prix dans la devise choisie par le visiteur (§4.4).
 * Les prix sont saisis en CHF ; conversion indicative en EUR au taux admin.
 */
export function Price({
  value,
  baseCurrency = "CHF",
  freeLabel,
  mode,
}: {
  value: number | null;
  baseCurrency?: string;
  freeLabel: string;
  mode?: PriceMode;
}) {
  const { currency, rateEur } = useCurrency();
  const t = useTranslations('common');

  const resolved = eventPriceMode(value, mode);
  if (resolved !== 'fixed') return <>{resolved === 'flexible' ? freeLabel : t(priceLabelKey(resolved))}</>;

  let amount = Number(value);
  let display = baseCurrency;
  if (currency === "EUR" && baseCurrency === "CHF") {
    amount = amount * rateEur;
    display = "EUR";
  }
  return (
    <>
      {display} {Number.isInteger(Math.round(amount * 100) / 100) ? `${amount.toFixed(0)}.–` : amount.toFixed(2)}
    </>
  );
}
