"use client";

import { useState } from "react";

export function PreviousFeaturedOfferPreview() {
  const [open, setOpen] = useState(true);

  return (
    <section className="rounded-2xl border border-soul-bronze/20 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-green-700">En ligne</p>
          <h2 className="mt-1 font-serif text-xl text-soul-brown">Méditation guidée en pleine nature</h2>
          <p className="mt-1 text-sm text-soul-bronze">Prochaine date : 24 octobre 2026</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="btn-secondary shrink-0 !py-2.5">Mettre en avant</button>
      </div>

      {open && (
        <div className="mt-5 border-t border-soul-bronze/15 pt-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.1em] text-soul-violet">Option visibilité</p>
              <h3 className="mt-2 font-serif text-2xl text-soul-brown">Mettre cette offre en avant</h3>
              <p className="mt-2 text-sm text-soul-ink/75">Mettez votre offre en avant sur ForTheSoul pendant <strong>30 jours</strong>.</p>
            </div>
            <div className="shrink-0 sm:text-right">
              <p className="font-serif text-3xl text-soul-brown">CHF 20.–</p>
              <button type="button" className="btn-primary mt-3 !py-2.5">Payer avec Stripe</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
