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

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="featured_default_days" className="label">
            Durée par défaut d&apos;une mise en avant (jours)
          </label>
          <input
            id="featured_default_days"
            name="featured_default_days"
            type="number"
            min={1}
            defaultValue={values.featured_default_days ?? "30"}
            className="field !max-w-40"
          />
        </div>
        <div>
          <label htmlFor="pack_default_valid_days" className="label">
            Durée de validité par défaut d&apos;un pack (jours)
          </label>
          <input
            id="pack_default_valid_days"
            name="pack_default_valid_days"
            type="number"
            min={1}
            defaultValue={values.pack_default_valid_days ?? "365"}
            className="field !max-w-40"
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700">{state.success}</p>}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Enregistrement…" : "Enregistrer les paramètres"}
      </button>
    </form>
  );
}
