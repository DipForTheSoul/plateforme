"use client";

import { useActionState } from "react";
import { requestFeature, type ActionState } from "@/app/actions/events";

/**
 * Bouton « Mettre en avant » (praticien) — consomme 1 crédit et crée une
 * demande soumise à la validation de Didier. Retour inline (succès / erreur).
 */
export function FeatureButton({ eventId }: { eventId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    requestFeature,
    {}
  );

  if (state.success) {
    return <span className="text-xs text-green-700">{state.success}</span>;
  }

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="event_id" value={eventId} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-medium text-soul-terracotta underline disabled:opacity-50"
        title="Votre expérience apparaît en tête des listes pendant 7 jours, après validation de Didier."
      >
        {pending ? "Envoi…" : "★ Mettre en avant · 1 crédit"}
      </button>
      {state.error && <span className="text-xs text-red-700">{state.error}</span>}
    </form>
  );
}
