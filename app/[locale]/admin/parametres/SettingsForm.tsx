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
