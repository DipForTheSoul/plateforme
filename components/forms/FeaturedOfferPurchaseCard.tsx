"use client";

import { useState } from "react";

const offers = [
  { id: "selva", title: "SELVA – Vision Quest & Jungle Immersion", date: "Mercredi 13.01.2027" },
  { id: "danser", title: "Danser le Vivant au salon Bien être & être bien", date: "Dimanche 22.11.2026" },
];

export function FeaturedOfferPurchaseCard() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <section className="overflow-hidden rounded-2xl border border-soul-bronze/20 bg-white">
      <p className="border-b border-soul-bronze/15 px-4 py-4 text-sm font-semibold text-soul-brown sm:px-5">Dernières expériences</p>

      {offers.map((offer) => {
        const selected = selectedId === offer.id;
        return (
          <div key={offer.id} className="border-b border-soul-bronze/15 last:border-b-0">
            <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-soul-brown">{offer.title}</h2>
                <p className="mt-1 text-sm text-soul-bronze">{offer.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">En ligne</span>
                <button type="button" aria-expanded={selected} onClick={() => setSelectedId(selected ? null : offer.id)} className="btn-secondary shrink-0 !px-4 !py-2 text-sm">
                  Mettre en avant
                </button>
              </div>
            </div>

            {selected && (
              <div className="border-t-2 border-soul-violet bg-soul-sand/35 px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.1em] text-soul-violet">Option visibilité</p>
                    <p className="mt-2 whitespace-nowrap text-[13px] tracking-[-0.01em] text-soul-brown sm:text-base">Mettre cette offre en avant pendant <strong>30 jours</strong>.</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 sm:text-right">
                    <p className="font-serif text-2xl text-soul-brown">CHF 20.–</p>
                    <button type="button" className="btn-primary !px-4 !py-2.5 text-sm">Payer avec Stripe</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
