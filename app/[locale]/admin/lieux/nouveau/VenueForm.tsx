"use client";

import { useActionState } from "react";
import { useRouter } from "@/i18n/navigation";
import { createVenue } from "@/app/actions/venues";
import type { ActionState } from "@/app/actions/events";

export function VenueForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState & { venueId?: string }, formData: FormData) => {
      const result = await createVenue(prev, formData);
      if (result.venueId) router.push("/admin/lieux");
      return result;
    },
    {}
  );

  return (
    <form action={formAction} className="card flex flex-col gap-4 p-6">
      <div>
        <label className="label" htmlFor="name">Nom du lieu *</label>
        <input id="name" name="name" required className="field" />
      </div>
      <div>
        <label className="label" htmlFor="address">Adresse complète *</label>
        <input id="address" name="address" required className="field"
          placeholder="Rue, numéro, code postal, ville" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="canton">Canton</label>
          <input id="canton" name="canton" maxLength={2} placeholder="VD" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="country">Pays (code)</label>
          <input id="country" name="country" defaultValue="CH" maxLength={2} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="capacity">Capacité</label>
          <input id="capacity" name="capacity" type="number" min={1} className="field" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={4} className="field" />
      </div>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700">{state.success}</p>}
      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Géocodage en cours…" : "Créer et géocoder"}
      </button>
    </form>
  );
}
