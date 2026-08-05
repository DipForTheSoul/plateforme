"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * Devise d'affichage (§4.4) — CHF par défaut, EUR indicatif (aucun paiement
 * dans cette devise). Le taux est saisi par l'admin (`settings.exchange_rate_eur`)
 * et transmis depuis le serveur. Le choix du visiteur persiste (localStorage).
 */
export type Currency = "CHF" | "EUR";

interface CurrencyContext {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rateEur: number;
}

const Ctx = createContext<CurrencyContext>({
  currency: "CHF",
  setCurrency: () => {},
  rateEur: 1.05,
});

export function CurrencyProvider({
  rateEur,
  children,
}: {
  rateEur: number;
  children: React.ReactNode;
}) {
  const [currency, setState] = useState<Currency>("CHF");

  useEffect(() => {
    // Hydratation depuis le choix persistant (localStorage indispo côté serveur).
    const saved = localStorage.getItem("fts-currency");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === "EUR" || saved === "CHF") setState(saved);
  }, []);

  const setCurrency = (c: Currency) => {
    setState(c);
    try {
      localStorage.setItem("fts-currency", c);
    } catch {
      /* stockage indisponible — sans gravité */
    }
  };

  return (
    <Ctx.Provider value={{ currency, setCurrency, rateEur }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCurrency = () => useContext(Ctx);
