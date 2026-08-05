"use client";

import { useActionState } from "react";
import { syncContactsToMailerLite } from "@/app/actions/contacts";
import type { ActionState } from "@/app/actions/events";

/** Bouton « Synchroniser vers MailerLite » (§7.1) — import des contacts existants. */
export function MailerLiteSync() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async () => syncContactsToMailerLite(),
    {}
  );

  return (
    <form action={action} className="mt-4 border-t border-soul-bronze/10 pt-4">
      <p className="mb-2 text-xs font-medium text-soul-brown">
        Ou synchroniser directement (API MailerLite) :
      </p>
      <button type="submit" disabled={pending} className="btn-secondary">
        {pending ? "Synchronisation…" : "⟳ Synchroniser vers MailerLite"}
      </button>
      {state.error && <p className="mt-2 text-xs text-red-700">{state.error}</p>}
      {state.success && <p className="mt-2 text-xs text-green-700">{state.success}</p>}
    </form>
  );
}
