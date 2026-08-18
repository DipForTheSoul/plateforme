"use client";

import { useActionState } from "react";
import { updateSettings } from "@/app/actions/settings";
import type { ActionState } from "@/app/actions/events";

export function SettingsForm({ values }: { values: Record<string, string> }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    updateSettings,
    {}
  );

  return (
    <form action={action} className="card flex flex-col gap-5 p-6">
      <div>
        <label htmlFor="exchange_rate_eur" className="label">
          Taux de change — 1 CHF = ? EUR (§4.4)
        </label>
        <input
          id="exchange_rate_eur"
          name="exchange_rate_eur"
          inputMode="decimal"
          defaultValue={values.exchange_rate_eur ?? "1.05"}
          className="field !max-w-40"
          placeholder="1.05"
        />
        <p className="mt-1 text-xs text-soul-bronze">
          Utilisé pour l&apos;affichage indicatif des prix en euros. Une mise à jour
          par semaine suffit (aucun paiement en EUR).
        </p>
      </div>

      <div>
        <label htmlFor="event_delist_days" className="label">
          Retrait auto des annonces (jours après l&apos;événement)
        </label>
        <input
          id="event_delist_days"
          name="event_delist_days"
          inputMode="numeric"
          defaultValue={values.event_delist_days ?? "15"}
          className="field !max-w-40"
          placeholder="15"
        />
        <p className="mt-1 text-xs text-soul-bronze">
          Une annonce disparaît de la recherche ce nombre de jours après la date de
          l&apos;événement. Sa page reste accessible (référencement). Par défaut&nbsp;: 15.
        </p>
      </div>

      <div className="rounded-xl border border-soul-bronze/15 p-4">
        <p className="label mb-3">Tarifs des packs (CHF)</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="price_pack_1" className="text-xs text-soul-bronze">1 publication</label>
            <input id="price_pack_1" name="price_pack_1" inputMode="decimal"
              defaultValue={values.price_pack_1 ?? "25"} className="field" placeholder="25" />
          </div>
          <div>
            <label htmlFor="price_pack_5" className="text-xs text-soul-bronze">Pack 5</label>
            <input id="price_pack_5" name="price_pack_5" inputMode="decimal"
              defaultValue={values.price_pack_5 ?? "100"} className="field" placeholder="100" />
          </div>
          <div>
            <label htmlFor="price_pack_10" className="text-xs text-soul-bronze">Pack 10</label>
            <input id="price_pack_10" name="price_pack_10" inputMode="decimal"
              defaultValue={values.price_pack_10 ?? "180"} className="field" placeholder="180" />
          </div>
        </div>
        <p className="mt-2 text-xs text-soul-bronze">
          Prix facturés aux praticien·nes. Modifiables ici uniquement — aucune action à
          faire sur Stripe.
        </p>
      </div>

      <div className="rounded-xl border border-soul-bronze/15 p-4">
        <p className="label mb-3">Promotion (optionnel)</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor="promo_label" className="text-xs text-soul-bronze">
              Étiquette (ex. « Spécial Noël 🎅 »)
            </label>
            <input id="promo_label" name="promo_label" maxLength={40}
              defaultValue={values.promo_label ?? ""} className="field"
              placeholder="Prix de lancement" />
          </div>
          <div>
            <label htmlFor="promo_discount_percent" className="text-xs text-soul-bronze">
              Remise %
            </label>
            <input id="promo_discount_percent" name="promo_discount_percent"
              inputMode="numeric" defaultValue={values.promo_discount_percent ?? ""}
              className="field !max-w-24" placeholder="—" />
          </div>
        </div>
        <p className="mt-2 text-xs text-soul-bronze">
          L&apos;étiquette s&apos;affiche sur les packs et au paiement. Avec une remise,
          le prix normal est barré et le prix réduit est facturé. Laissez l&apos;étiquette
          vide pour arrêter la promotion.
        </p>
      </div>

      <div>
        <label htmlFor="payment_beneficiary" className="label">
          Paiement — bénéficiaire (nom affiché)
        </label>
        <input
          id="payment_beneficiary"
          name="payment_beneficiary"
          defaultValue={values.payment_beneficiary ?? "ForTheSoul — Didier Picamoles"}
          className="field"
          placeholder="ForTheSoul — Didier Picamoles"
        />
      </div>

      <div>
        <label htmlFor="payment_iban" className="label">
          Paiement — IBAN (virement / Revolut)
        </label>
        <input
          id="payment_iban"
          name="payment_iban"
          defaultValue={values.payment_iban ?? ""}
          className="field"
          placeholder="CH00 0000 0000 0000 0000 0"
        />
        <p className="mt-1 text-xs text-soul-bronze">
          Affiché sur la page « Crédits » du praticien, à côté du QR Revolut. Laissez
          vide pour n&apos;afficher que le bouton/QR Revolut.
        </p>
      </div>

      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700">{state.success}</p>}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Enregistrement…" : "Enregistrer les paramètres"}
      </button>
    </form>
  );
}
