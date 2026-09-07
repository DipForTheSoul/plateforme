"use client";

import { startTransition, useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { grantCreditsManually } from "@/app/actions/admin";
import type { ActionState } from "@/app/actions/events";

interface Practitioner {
  id: string;
  name: string;
  credits: number;
}

export function GrantCreditsForm({
  practitioners,
}: {
  practitioners: Practitioner[];
}) {
  const t = useTranslations("admin.credits");
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      try {
        const result = await grantCreditsManually(formData);
        if (result.success) setRequestId(crypto.randomUUID());
        return result;
      } catch { return {error: 'Réponse interrompue. Réessayez la même opération.'}; }
    },
    {}
  );

  return (
    <form action={action} onSubmit={e => {e.preventDefault(); const data = new FormData(e.currentTarget); startTransition(() => action(data));}} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="request_id" value={requestId} />
      <div className="min-w-48 flex-1">
        <label className="label" htmlFor="practitioner_id">{t("practitioner")}</label>
        <select id="practitioner_id" name="practitioner_id" required defaultValue="" className="field">
          <option value="" disabled>{t("choose")}</option>
          {practitioners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.credits} {t("creditsLabel").toLowerCase()}
            </option>
          ))}
        </select>
      </div>
      <div className="w-28">
        <label className="label" htmlFor="amount">{t("creditsLabel")}</label>
        <input id="amount" name="amount" type="number" min={1} defaultValue={5}
          required className="field" />
      </div>
      <div className="min-w-48 flex-1">
        <label className="label" htmlFor="note">{t("note")}</label>
        <input id="note" name="note" placeholder={t("notePlaceholder")} className="field" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "…" : t("grant")}
      </button>
      {state.error && <p role="alert" className="w-full text-xs text-red-700">{state.error}</p>}
      {state.success && <p className="w-full text-xs text-green-700">{state.success}</p>}
    </form>
  );
}
