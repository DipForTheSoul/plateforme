"use client";

import { useActionState } from "react";
import { importContacts } from "@/app/actions/contacts";
import type { ActionState } from "@/app/actions/events";

export function ImportForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    importContacts,
    {}
  );

  return (
    <section className="card p-6">
      <h2 className="mb-1 font-serif text-lg text-soul-brown">Import de contacts (Wix)</h2>
      <p className="mb-4 text-sm text-soul-bronze">
        Une ligne par contact : <code>email, prénom, nom, tag1|tag2</code> (prénom,
        nom et tags optionnels). Les doublons sont ignorés.
      </p>
      <form action={formAction} className="flex flex-col gap-3">
        <textarea name="csv" rows={6} required className="field font-mono text-xs"
          placeholder={"marie@example.com, Marie, Dupont, danse-mouvement|meditation\njean@example.com"} />
        {state.error && <p className="text-sm text-red-700">{state.error}</p>}
        {state.success && <p className="text-sm text-green-700">{state.success}</p>}
        <button type="submit" disabled={pending} className="btn-primary self-start">
          {pending ? "Import…" : "Importer"}
        </button>
      </form>
    </section>
  );
}
